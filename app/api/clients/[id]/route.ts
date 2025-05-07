import { NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import crypto from 'crypto';

// GET client by ID
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    
    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid client ID' },
        { status: 400 }
      );
    }
    
    const db = await getDb();
    const client = await db.collection('clients').findOne({
      _id: new ObjectId(id)
    });
    
    if (!client) {
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(client);
  } catch (error) {
    console.error('Error fetching client:', error);
    return NextResponse.json(
      { error: 'Error fetching client' },
      { status: 500 }
    );
  }
}

// UPDATE client
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    
    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid client ID' },
        { status: 400 }
      );
    }
    
    const { name, email, domain, translationType, planType, tokenLimit, regenerateApiKey } = await request.json();
    
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
    
    // Check if client exists
    const existingClient = await db.collection('clients').findOne({
      _id: new ObjectId(id)
    });
    
    if (!existingClient) {
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      );
    }

    // Check if email or domain is already taken by another client
    const duplicateCheck = await db.collection('clients').findOne({
      _id: { $ne: new ObjectId(id) },
      $or: [{ email }, { domain }]
    });

    if (duplicateCheck) {
      return NextResponse.json(
        { error: 'Email or domain is already in use by another client' },
        { status: 409 }
      );
    }
    
    // Update data
    const updateData: any = {
      name,
      email,
      domain,
      translationType,
      planType,
      tokenLimit: planType === 'limited' ? tokenLimit : null,
      updatedAt: new Date()
    };
    
    // Regenerate API key if requested
    if (regenerateApiKey) {
      updateData.apiKey = crypto.randomBytes(32).toString('hex');
    }
    
    // Update client
    const result = await db.collection('clients').updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );
    
    if (result.modifiedCount === 0) {
      return NextResponse.json(
        { error: 'Client not updated' },
        { status: 400 }
      );
    }
    
    const updatedClient = await db.collection('clients').findOne({
      _id: new ObjectId(id)
    });
    
    return NextResponse.json({
      message: 'Client updated successfully',
      client: updatedClient
    });
  } catch (error) {
    console.error('Error updating client:', error);
    return NextResponse.json(
      { error: 'Error updating client' },
      { status: 500 }
    );
  }
}

// DELETE client
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    
    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid client ID' },
        { status: 400 }
      );
    }
    
    const db = await getDb();
    
    // Check if client exists
    const existingClient = await db.collection('clients').findOne({
      _id: new ObjectId(id)
    });
    
    if (!existingClient) {
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      );
    }
    
    // Delete client
    const result = await db.collection('clients').deleteOne({
      _id: new ObjectId(id)
    });
    
    if (result.deletedCount === 0) {
      return NextResponse.json(
        { error: 'Client not deleted' },
        { status: 400 }
      );
    }
    
    return NextResponse.json({
      message: 'Client deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting client:', error);
    return NextResponse.json(
      { error: 'Error deleting client' },
      { status: 500 }
    );
  }
}