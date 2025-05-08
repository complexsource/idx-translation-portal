import { NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';

const TRANSLATOR_API_KEY = process.env.AZURE_TRANSLATOR_API_KEY;
const TRANSLATOR_REGION = process.env.AZURE_TRANSLATOR_REGION;
const TRANSLATOR_ENDPOINT = process.env.AZURE_TRANSLATOR_ENDPOINT;

export async function POST(request: Request) {
  try {
    const apiKey = request.headers.get('x-api-key');
    if (!apiKey) {
      return NextResponse.json({ error: 'API key is required' }, { status: 401 });
    }

    const db = await getDb();
    const client = await db.collection('clients').findOne({ apiKey });
    if (!client) {
      return NextResponse.json({ error: 'Invalid API key' }, { status: 401 });
    }

    // Only allow clients with 'basic' translation type
    if (client.translationType !== 'basic') {
      return NextResponse.json({ error: 'Client does not have access to this API' }, { status: 403 });
    }

    const { text, baseLanguage, targetLanguage } = await request.json();
    if (!text || !baseLanguage || !targetLanguage) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Count characters and treat as tokens
    const tokenCount = text.length;
    const cost = parseFloat(((tokenCount / 1_000_000) * 10).toFixed(6)); // $10 per 1M characters

    // Check token limit if plan is limited
    if (client.planType === 'limited') {
      const usedTokens = client.usage?.tokens || 0;
      const tokenLimit = client.tokenLimit || 0;
      if (usedTokens + tokenCount > tokenLimit) {
        return NextResponse.json({
          error: 'Your token limit has been exceeded. Please upgrade your plan.'
        }, { status: 403 });
      }
    }

    // Call Azure Translator API
    const payload = [{ Text: text }];
    const response = await fetch(`${TRANSLATOR_ENDPOINT}&from=${baseLanguage}&to=${targetLanguage}`, {
      method: 'POST',
      headers: {
        'Ocp-Apim-Subscription-Key': TRANSLATOR_API_KEY || '',
        'Ocp-Apim-Subscription-Region': TRANSLATOR_REGION || '',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const err = await response.json();
      console.error('Azure Translator Error:', err);
      return NextResponse.json({ error: 'Translation service failed' }, { status: 502 });
    }

    const data = await response.json();
    const translatedText = data[0]?.translations[0]?.text || '';

    // Update client usage
    await db.collection('clients').updateOne(
      { apiKey },
      {
        $inc: {
          'usage.tokens': tokenCount,
          'usage.cost': cost,
          'usage.totalRequests': 1
        },
        $set: { 'usage.lastUsed': new Date() }
      }
    );

    // Add to usage records
    await db.collection('usageRecords').insertOne({
      clientId: client._id,
      clientName: client.name,
      idxAiType: 'Translate AI',
      translationType: 'basic',
      tokens: tokenCount,
      cost,
      baseLanguage,
      targetLanguage,
      timestamp: new Date()
    });

    // Return response
    return NextResponse.json({
      translatedText,
      tokens: tokenCount,
      cost
    });

  } catch (error) {
    console.error('Azure Translate Error:', error);
    return NextResponse.json({ error: 'Translation failed' }, { status: 500 });
  }
}