import { NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';

export async function POST(request: Request) {
  try {
    // Get API key from header
    const apiKey = request.headers.get('x-api-key');
    
    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key is required' },
        { status: 401 }
      );
    }
    
    const db = await getDb();
    
    // Validate API key and check client
    const client = await db.collection('clients').findOne({ apiKey });
    
    if (!client) {
      return NextResponse.json(
        { error: 'Invalid API key' },
        { status: 401 }
      );
    }
    
    // Parse request body
    const { text, baseLanguage, targetLanguage } = await request.json();
    
    if (!text || !baseLanguage || !targetLanguage) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Calculate tokens (simple estimation)
    const tokenCount = Math.ceil(text.length / 4);
    
    // Calculate cost (example rate: $0.001 per token)
    const cost = tokenCount * 0.001;
    
    // Update client usage statistics
    await db.collection('clients').updateOne(
      { apiKey },
      { 
        $inc: { 
          'usage.tokens': tokenCount,
          'usage.cost': cost
        },
        $set: { 'usage.lastUsed': new Date() }
      }
    );
    
    // Store usage record
    await db.collection('usageRecords').insertOne({
      clientId: client._id,
      clientName: client.name,
      translationType: 'basic',
      tokens: tokenCount,
      cost,
      baseLanguage,
      targetLanguage,
      timestamp: new Date()
    });
    
    // Perform basic translation (mock)
    // In real implementation, integrate with Azure OpenAI here
    const translatedText = `[Basic Translation] ${text}`;
    
    return NextResponse.json({
      translatedText,
      tokens: tokenCount,
      cost
    });
  } catch (error) {
    console.error('Translation error:', error);
    return NextResponse.json(
      { error: 'Translation failed' },
      { status: 500 }
    );
  }
}