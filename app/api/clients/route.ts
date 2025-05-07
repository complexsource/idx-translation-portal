import { NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';
import crypto from 'crypto';

// Generate API key
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
    const { name, email, domain, translationType, planType, tokenLimit } = await request.json();

    // Validate required fields
    if (!name || !email || !domain || !translationType || !planType) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate translation type
    if (!['basic', 'advanced', 'expert'].includes(translationType)) {
      return NextResponse.json(
        { error: 'Invalid translation type' },
        { status: 400 }
      );
    }

    // Validate plan type
    if (!['limited', 'unlimited'].includes(planType)) {
      return NextResponse.json(
        { error: 'Invalid plan type' },
        { status: 400 }
      );
    }

    // Validate token limit for limited plan
    if (planType === 'limited' && (!tokenLimit || tokenLimit <= 0)) {
      return NextResponse.json(
        { error: 'Token limit is required for limited plan' },
        { status: 400 }
      );
    }

    const db = await getDb();

    // Check if client with same name, email or domain exists
    const existingClient = await db.collection('clients').findOne({
      $or: [{ name }, { email }, { domain }]
    });

    if (existingClient) {
      return NextResponse.json(
        { error: 'Client with same name, email or domain already exists' },
        { status: 409 }
      );
    }

    // Create client with generated API key
    const apiKey = generateApiKey();
    const result = await db.collection('clients').insertOne({
      name,
      email,
      domain,
      translationType,
      planType,
      tokenLimit: planType === 'limited' ? tokenLimit : null,
      apiKey,
      createdAt: new Date(),
      updatedAt: new Date(),
      usage: {
        tokens: 0,
        cost: 0,
        lastUsed: null
      }
    });

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