import { NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';
import { getMongoDb } from '@/lib/db/mongodb';
import { encoding_for_model, TiktokenModel } from 'tiktoken';
import type { Db } from 'mongodb';

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

function extractFields(obj: any, prefix = ''): string[] {
  return Object.entries(obj).flatMap(([key, value]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    return typeof value === 'object' && value !== null && !Array.isArray(value)
      ? extractFields(value, path)
      : [path];
  });
}

async function generatePromptWithFields(
  db: Db,
  table: string,
  userPrompt: string
): Promise<{ system: string, user: string }> {
  let fields: string[] = [];
  try {
    const sampleDoc = await db.collection(table).findOne({});
    fields = sampleDoc ? extractFields(sampleDoc) : [];
  } catch (err) {
    console.warn('Unable to extract fields:', err);
  }

  const fieldInfo = fields.length ? `Available fields in this collection are: ${fields.join(', ')}` : '';

  return {
    system: `
You are an expert AI trained to convert any natural language prompt — even with spelling or grammar mistakes — into a valid, optimized MongoDB query or aggregation pipeline.

Your responsibilities:

1. Understand the intent:
   - If the prompt suggests a single result (e.g., "the client", "most used", "top 1", "highest") → return one document
   - If the prompt suggests multiple or a list (e.g., "clients", "top 10", "all", "list") → return many documents
   - If the prompt includes words like "total", "sum", "average", "only cost", "total tokens" → return a single-value result using aggregation with $sum, $avg, or similar

2. Determine the appropriate operation:
   - For basic filtering/sorting → use:
     {
       "filter": { ... },
       "projection": { ... },
       "sort": { ... },
       "limit": N
     }
   - For analytics, grouping, totals, or transformations → use:
     {
       "aggregate": [ ... ]
     }

3. Strict formatting rules:
   - ALWAYS return a single, valid JSON object
   - NEVER include db.collection, markdown, shell syntax, or comments
   - Use "$regex" with "$options": "i" for case-insensitive string matches
   - Use dot notation for nested fields (e.g., "usage.tokens")
   - Auto-correct spelling and grammar issues
   - If unsure between query vs. aggregation, prefer aggregation for safety

4. Output must be:
   - Executable directly in MongoDB Node.js driver
   - Accurate even with ambiguous or poorly worded input

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

    if (client.idxdb !== 'MongoDB') {
      return NextResponse.json(
        { error: 'Client is not allowed to access Mongo DB databases' },
        { status: 403 }
      );
    }

    const { prompt, connection, table } = await req.json();
    if (!prompt || !connection || !table) return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });

    const db = await getMongoDb(connection);
    const { system, user } = await generatePromptWithFields(db, table, prompt);

    const aiResponse = await fetch(
      `${AZURE_ENDPOINT}openai/deployments/${DEPLOYMENT_ID}/chat/completions?api-version=${API_VERSION}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-key': AZURE_API_KEY,
        },
        body: JSON.stringify({
          messages: [ { role: 'system', content: system }, { role: 'user', content: user } ],
          temperature: 0.2,
          max_tokens: 1000,
        })
      }
    );

    const aiData = await aiResponse.json();
    const generatedQuery = aiData.choices?.[0]?.message?.content?.trim();
    if (!generatedQuery) return NextResponse.json({ error: 'AI did not return a query' }, { status: 500 });

    let result;
    const cleanQuery = generatedQuery.replace(/```(json)?/g, '').trim();

    let parsed: any;
    try {
      parsed = JSON.parse(cleanQuery);
    } catch (err) {
      return NextResponse.json({ error: 'Failed to parse generated MongoDB query', raw: cleanQuery }, { status: 400 });
    }

    const wantsLimitedFields = /only|just|specific fields|select/i.test(prompt);

    if (parsed.aggregate && Array.isArray(parsed.aggregate)) {
      result = await db.collection(table).aggregate(parsed.aggregate).toArray();
    } else {
      result = await db.collection(table)
        .find(parsed.filter || {}, wantsLimitedFields && parsed.projection ? { projection: parsed.projection } : {})
        .sort(parsed.sort || {})
        .limit(parsed.limit || 100)
        .toArray();
    }

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