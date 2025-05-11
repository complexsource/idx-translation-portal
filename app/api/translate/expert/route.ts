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

    if (client.planType === 'limited') {
      const usedTokens = client.usage?.tokens || 0;
      const limit = client.tokenLimit || 0;
    
      if (usedTokens >= limit) {
        return NextResponse.json(
          { error: 'Your token limit has been exceeded. Please upgrade your plan.' },
          { status: 403 }
        );
      }
    }

    // Restrict access strictly to 'expert' only
    if (client.translationType !== 'expert') {
      return NextResponse.json({ error: 'Client does not have access to this API' }, { status: 403 });
    }

    const { text, baseLanguage, targetLanguage } = await request.json();
    if (!text || !baseLanguage || !targetLanguage) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const prompt =
`You are a highly experienced native-speaking professional translator.

Translate the following content from '${baseLanguage}' to '${targetLanguage}' with perfect fluency, clarity, and cultural appropriateness.

Instructions:
- Ensure the translation reads as if originally written by a native ${targetLanguage} speaker.
- Improve fluency and word choice; avoid literal or awkward translations.
- Adapt idioms, expressions, and tone to match cultural norms.
- Use precise, expert-level vocabulary and grammar — suitable for UI labels, section titles, websites, and digital interfaces.
- If the content includes HTML, preserve the structure and all tags exactly as provided.
- Do not include explanations, markdown syntax, comments, or formatting hints.
- Return only the translated content — nothing else.

Content to translate:
${text}`;

    const requestBody = {
      messages: [
        {
          role: 'system',
          content: 'You are a strict, accurate, and professional translation engine. Do not explain or reformat. Only return the translated content exactly.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.2,
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
      return NextResponse.json({ error: 'Translation service failed' }, { status: 502 });
    }

    const data = await response.json();
    const translatedText = data.choices[0]?.message?.content?.trim() || '';

    const promptTokenCount = countTokens(prompt, 'gpt-4o');
    const outputTokenCount = countTokens(translatedText, 'gpt-4o');
    const totalTokens = promptTokenCount + outputTokenCount;

    // Pricing: Input = $1.10 per 1M, Output = $4.40 per 1M
    const inputCost = (promptTokenCount / 1_000_000) * 1.10;
    const outputCost = (outputTokenCount / 1_000_000) * 4.40;
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
      idxAiType: 'Translate AI',
      translationType: 'expert',
      tokens: totalTokens,
      cost: totalCost,
      ip,
      location: geoLocation,
      baseLanguage,
      targetLanguage,
      timestamp: new Date()
    });

    return NextResponse.json({
      translatedText,
      tokens: totalTokens,
      inputTokens: promptTokenCount,
      outputTokens: outputTokenCount,
      cost: totalCost
    });
  } catch (error) {
    console.error('Translation error:', error);
    return NextResponse.json({ error: 'Translation failed' }, { status: 500 });
  }
}