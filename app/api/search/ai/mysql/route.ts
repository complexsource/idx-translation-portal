import { NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';
import { getMySQLFields, executeMySQLQuery } from '@/lib/db/mysql';
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
): Promise<{ system: string, user: string }> {
  let fields: string[] = [];
  try {
    fields = await getMySQLFields(connection, table);
  } catch (err) {
    console.warn('Unable to fetch MySQL fields:', err);
  }

  const fieldInfo = fields.length ? `Available fields in this table are: ${fields.join(', ')}` : '';

  return {
    system: `
You are an expert AI trained to convert any natural language prompt — even with spelling or grammar mistakes — into a valid, optimized MySQL SELECT query.

Your responsibilities:

1. Always use the table named \`${table}\`.

2. Understand the user's intent:
   - For summaries like "total cost" or "average age", use aggregate functions (SUM, AVG, COUNT).
   - For filters, use WHERE clauses.
   - For sorting, use ORDER BY.
   - For limiting records, use LIMIT.
   - If the user asks for one item, use LIMIT 1.
   - If user says "only", return specific columns (e.g., SELECT name, email).

3. Query format rules:
   - Output ONLY a raw SQL query string (no JSON, markdown, or code blocks).
   - NEVER include explanations, comments, or schema definitions.
   - Always escape field names properly (e.g., \`question_id\`, \`locale\`).
   - Use aliases if calculations are used (e.g., SUM(cost) AS total_cost).

4. Auto-correction:
   - Fix any spelling or grammar mistakes.
   - Be smart about ambiguous or incomplete prompts — make your best guess.

Your query must be a valid SELECT query using table \`${table}\`.

${fieldInfo}
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

    if (client.idxdb !== 'MySQL') {
      return NextResponse.json(
        { error: 'Client is not allowed to access MySQL databases' },
        { status: 403 }
      );
    }

    const { prompt, connection, table } = await req.json();
    if (!prompt || !connection || !table) return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });

    const { system, user } = await generatePromptWithFields(table, prompt, connection);

    const aiResponse = await fetch(
      `${AZURE_ENDPOINT}openai/deployments/${DEPLOYMENT_ID}/chat/completions?api-version=${API_VERSION}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-key': AZURE_API_KEY,
        },
        body: JSON.stringify({
          messages: [
            { role: 'system', content: system },
            { role: 'user', content: user },
          ],
          temperature: 0.2,
          max_tokens: 1000,
        }),
      }
    );

    const aiData = await aiResponse.json();
    const generatedQuery = aiData.choices?.[0]?.message?.content?.trim();
    if (!generatedQuery) return NextResponse.json({ error: 'AI did not return a query' }, { status: 500 });

    if (!generatedQuery.toLowerCase().startsWith('select')) {
      return NextResponse.json({ error: 'Only SELECT queries allowed' }, { status: 400 });
    }

    const result = await executeMySQLQuery(connection, generatedQuery);

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

    await systemDb.collection('usageRecords').insertOne({
      clientId: client._id,
      clientName: client.name,
      idxAiType: client.idxAiType,
      idxdb: client.idxdb,
      tokens: totalTokens,
      cost: totalCost,
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
    console.error('Universal Search API Error:', err);
    return NextResponse.json({ error: 'Unexpected server error' }, { status: 500 });
  }
}