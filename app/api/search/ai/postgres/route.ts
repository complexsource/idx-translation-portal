import { NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';
import { executePostgresQuery, getPostgresFields } from '@/lib/db/postgres';
import { encoding_for_model, TiktokenModel } from 'tiktoken';

const AZURE_ENDPOINT = process.env.AZURE_ENDPOINT || '';
const DEPLOYMENT_ID = process.env.AZURE_DEPLOYMENT_ID || '';
const API_VERSION = process.env.AZURE_API_VERSION || '2023-05-15';
const AZURE_API_KEY = process.env.AZURE_API_KEY || '';

function countTokens(text: string, model: TiktokenModel = 'gpt-4o') {
  const encoder = encoding_for_model(model);
  const tokens = encoder.encode(text);
  encoder.free();
  return tokens.length;
}

async function generatePromptWithFields(
  table: string,
  userPrompt: string,
  connection: any
): Promise<{ system: string; user: string }> {
  let fields: string[] = [];
  try {
    fields = await getPostgresFields(connection, table);
  } catch (err) {
    console.warn('Unable to fetch PostgreSQL fields:', err);
  }

  const fieldInfo = fields.length ? `Available fields in this table are: ${fields.join(', ')}` : '';

  return {
    system: `
You are an expert AI trained to convert natural language prompts — even with typos or poor grammar — into accurate, secure PostgreSQL SELECT queries.

1. Always use the table \"${table}\".

2. Support all user intents:
   - Aggregates like SUM, AVG, COUNT for cost, tokens, etc.
   - Filters using WHERE
   - Sorting via ORDER BY
   - LIMIT only when user asks for a specific number (e.g., top 10)
   - Otherwise, return all matching data with no LIMIT

3. Formatting Rules:
   - Output ONLY a raw SQL SELECT query (no markdown, JSON, or code blocks)
   - Never include explanations or comments
   - Use double quotes " for column names if needed
   - Use aliases like SUM(cost) AS total_cost for aggregates

4. Auto-correct grammar, structure, or spelling mistakes

${fieldInfo}

Output a valid SELECT query ready for execution in PostgreSQL.
`.trim(),
    user: userPrompt,
  };
}

export async function POST(req: Request) {
  try {
    const apiKey = req.headers.get('x-api-key');
    if (!apiKey) return NextResponse.json({ error: 'API key is required' }, { status: 401 });

    const systemDb = await getDb();
    const client = await systemDb.collection('clients').findOne({ apiKey });
    if (!client) return NextResponse.json({ error: 'Invalid API key' }, { status: 401 });
    if (client.idxAiType !== 'Search AI') {
      return NextResponse.json(
        { error: 'Client not authorized for Search AI' },
        { status: 403 }
      );
    }

    if (client.idxdb !== 'PostgreSQL') {
      return NextResponse.json(
        { error: 'Client is not allowed to access Postgre databases' },
        { status: 403 }
      );
    }

    const { prompt, connection, table } = await req.json();
    if (!prompt || !connection || !table) return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });

    const { system, user } = await generatePromptWithFields(table, prompt, connection);

    const aiResponse = await fetch(`${AZURE_ENDPOINT}openai/deployments/${DEPLOYMENT_ID}/chat/completions?api-version=${API_VERSION}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': AZURE_API_KEY,
      },
      body: JSON.stringify({
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user }
        ],
        temperature: 0.2,
        max_tokens: 1000,
      }),
    });

    const aiData = await aiResponse.json();
    const generatedQuery = aiData.choices?.[0]?.message?.content?.trim();

    if (generatedQuery?.includes('your_table_name')) {
      return NextResponse.json({ error: 'AI returned placeholder table name. Try a clearer prompt.' }, { status: 400 });
    }

    if (!generatedQuery || !generatedQuery.toLowerCase().startsWith('select')) {
      return NextResponse.json({ error: 'Invalid SQL response', raw: generatedQuery }, { status: 400 });
    }

    console.log('🧠 Generated Query:', generatedQuery);
    console.log('⏳ Executing query...');

    const result = await Promise.race([
      executePostgresQuery(connection, generatedQuery),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Query timeout after 10s')), 10000))
    ]);

    const inputTokens = countTokens(prompt);
    const outputTokens = countTokens(generatedQuery);
    const totalTokens = inputTokens + outputTokens;
    const totalCost = parseFloat((((inputTokens / 1_000_000) * 1.1 + (outputTokens / 1_000_000) * 4.4)).toFixed(6));

    await systemDb.collection('clients').updateOne(
      { apiKey },
      {
        $inc: { 'usage.tokens': totalTokens, 'usage.cost': totalCost },
        $set: { 'usage.lastUsed': new Date() },
      }
    );

    let ip =
      req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
      req.headers.get('x-real-ip') ||
      req.headers.get('host') ||
      'Unknown';

    // Fallback for local dev or undefined IPs
    if (
      ip === '127.0.0.1' ||
      ip === '::1' ||
      ip === 'localhost' ||
      ip.startsWith('localhost') ||
      ip === 'Unknown'
    ) {
      try {
        const res = await fetch('https://api.ipify.org?format=json');
        const data = await res.json();
        if (data?.ip) ip = data.ip;
      } catch (err) {
        console.warn('Could not fetch public IP fallback:', err);
      }
    }

    let geoLocation = {};
    try {
      const geoRes = await fetch(`http://ip-api.com/json/${ip}`);
      const geo = await geoRes.json();
      if (geo && geo.status === 'success') {
        geoLocation = {
          lat: geo.lat,
          lon: geo.lon,
          city: geo.city,
          region: geo.regionName,
          country: geo.country,
          countryCode: geo.countryCode,
        };
      }
    } catch (err) {
      console.warn('Failed to fetch geo info:', err);
    }

    await systemDb.collection('usageRecords').insertOne({
      clientId: client._id,
      clientName: client.name,
      idxAiType: client.idxAiType,
      idxdb: client.idxdb,
      tokens: totalTokens,
      cost: totalCost,
      ip,
      location: geoLocation,
      prompt,
      generatedQuery,
      table,
      timestamp: new Date(),
    });

    return NextResponse.json({
      query: generatedQuery,
      result,
      tokens: totalTokens,
      inputTokens,
      outputTokens,
      cost: totalCost,
    });
  } catch (err: any) {
    console.error('Universal Search API Error (PostgreSQL):', err);
    return NextResponse.json({ error: 'Unexpected server error', detail: err.message }, { status: 500 });
  }
}