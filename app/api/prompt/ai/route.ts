import { NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';
import { encoding_for_model, TiktokenModel } from 'tiktoken';

const AZURE_ENDPOINT = process.env.AZURE_ENDPOINT || 'https://gpt4o-mini.openai.azure.com/';
const DEPLOYMENT_ID = process.env.AZURE_DEPLOYMENT_ID || 'gpt-4o-mini';
const API_VERSION = process.env.AZURE_API_VERSION || '2023-05-15';
const AZURE_API_KEY = process.env.AZURE_API_KEY;

function countTokens(text: string, model: TiktokenModel = 'gpt-4o') {
  const encoder = encoding_for_model(model);
  const tokens = encoder.encode(text);
  encoder.free();
  return tokens.length;
}

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

    if (client.idxAiType !== 'Prompt AI') {
      return NextResponse.json({ error: 'Client does not have access to this API' }, { status: 403 });
    }

    const { prompt } = await request.json();
    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json({ error: 'Missing or invalid prompt' }, { status: 400 });
    }

    const requestBody = {
      messages: [
        {
          role: 'system',
          content: 'You are a helpful, professional AI assistant. Respond clearly and concisely.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      top_p: 1,
      frequency_penalty: 0,
      presence_penalty: 0
    };

    const headers = new Headers();
    headers.set('Content-Type', 'application/json');
    headers.set('api-key', AZURE_API_KEY || '');

    const response = await fetch(
      `${AZURE_ENDPOINT}openai/deployments/${DEPLOYMENT_ID}/chat/completions?api-version=${API_VERSION}`,
      {
        method: 'POST',
        headers,
        body: JSON.stringify(requestBody)
      }
    );

    if (!response.ok) {
      const err = await response.json();
      console.error('Azure API Error:', err);
      return NextResponse.json({ error: 'Prompt generation failed' }, { status: 502 });
    }

    const data = await response.json();
    const reply = data.choices[0]?.message?.content?.trim() || '';

    const inputTokens = countTokens(prompt);
    const outputTokens = countTokens(reply);
    const totalTokens = inputTokens + outputTokens;

    const inputCost = (inputTokens / 1_000_000) * 1.10;
    const outputCost = (outputTokens / 1_000_000) * 4.40;
    const totalCost = parseFloat((inputCost + outputCost).toFixed(6));

    await db.collection('clients').updateOne(
      { apiKey },
      {
        $inc: {
          'usage.tokens': totalTokens,
          'usage.cost': totalCost
        },
        $set: { 'usage.lastUsed': new Date() }
      }
    );

    let ip =
      request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
      request.headers.get('x-real-ip') ||
      request.headers.get('host') ||
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

    await db.collection('usageRecords').insertOne({
      clientId: client._id,
      clientName: client.name,
      idxAiType: 'Prompt AI',
      tokens: totalTokens,
      cost: totalCost,
      prompt,
      ip,
      location: geoLocation,
      timestamp: new Date()
    });

    return NextResponse.json({
      reply,
      tokens: totalTokens,
      inputTokens,
      outputTokens,
      cost: totalCost
    });
  } catch (error) {
    console.error('Prompt AI error:', error);
    return NextResponse.json({ error: 'Prompt processing failed' }, { status: 500 });
  }
}