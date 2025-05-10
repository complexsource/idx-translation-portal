// app/api/clients/route.ts
import { NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';
import crypto from 'crypto';

function generateApiKey() {
  return crypto.randomBytes(32).toString('hex');
}

// GET all clients
export async function GET(request: Request) {
  try {
    const db = await getDb();
    const clients = await db.collection('clients').find({}).toArray();

    return NextResponse.json(clients);
  } catch (error) {
    console.error('Error fetching clients:', error);
    return NextResponse.json(
      { error: 'Error fetching clients' },
      { status: 500 }
    );
  }
}

// CREATE new client
export async function POST(request: Request) {
  try {
    const {
      name,
      email,
      domain,
      planType,
      tokenLimit,
      aiModel,
      idxAiType,
      translationType,
      idxdb, // NEW FIELD
    } = await request.json();

    // Required field checks
    if (!name || !email || !domain || !planType || !idxAiType) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    if (translationType === 'Translate AI' && !aiModel) {
      return NextResponse.json(
        { error: 'AI Model is required' },
        { status: 400 }
      );
    }    

    if (!['limited', 'unlimited'].includes(planType)) {
      return NextResponse.json(
        { error: 'Invalid plan type' },
        { status: 400 }
      );
    }

    if (planType === 'limited' && (!tokenLimit || tokenLimit <= 0)) {
      return NextResponse.json(
        { error: 'Token limit is required for limited plan' },
        { status: 400 }
      );
    }

    if (!['Search AI', 'Prompt AI', 'Translate AI'].includes(idxAiType)) {
      return NextResponse.json(
        { error: 'Invalid IDX AI Type' },
        { status: 400 }
      );
    }

    if (idxAiType === 'Translate AI') {
      if (!translationType || !['basic', 'advanced', 'expert'].includes(translationType)) {
        return NextResponse.json(
          { error: 'Invalid or missing translation type for Translate AI' },
          { status: 400 }
        );
      }
    }

    if (idxAiType === 'Search AI') {
      const validDbTypes = ['MongoDB', 'MySQL', 'MSSQL', 'PostgreSQL'];
      if (!idxdb || !validDbTypes.includes(idxdb)) {
        return NextResponse.json(
          { error: 'Invalid or missing database type for Search AI' },
          { status: 400 }
        );
      }
    }

    const db = await getDb();

    const existingClient = await db.collection('clients').findOne({
      $or: [{ name }, { email }, { domain }]
    });

    if (existingClient) {
      return NextResponse.json(
        { error: 'Client with same name, email or domain already exists' },
        { status: 409 }
      );
    }

    const apiKey = generateApiKey();

    const clientData = {
      name,
      email,
      domain,
      planType,
      tokenLimit: planType === 'limited' ? tokenLimit : null,
      aiModel,
      idxAiType,
      translationType: idxAiType === 'Translate AI' ? translationType : null,
      idxdb: idxAiType === 'Search AI' ? idxdb : null, // ADD THIS LINE
      apiKey,
      createdAt: new Date(),
      updatedAt: new Date(),
      usage: {
        tokens: 0,
        cost: 0,
        lastUsed: null,
      }
    };

    const result = await db.collection('clients').insertOne(clientData);

    return NextResponse.json(
      {
        message: 'Client created successfully',
        clientId: result.insertedId,
        apiKey
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating client:', error);
    return NextResponse.json(
      { error: 'Error creating client' },
      { status: 500 }
    );
  }
}