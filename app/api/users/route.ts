import { NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';
import bcrypt from 'bcryptjs';
import { verify } from 'jsonwebtoken';
import { ObjectId } from 'mongodb';

// Utility to extract JWT from cookie
function getUserFromRequest(request: Request) {
  const cookieHeader = request.headers.get('cookie') || '';
  const token = cookieHeader
    .split(';')
    .find((c) => c.trim().startsWith('auth-token='))
    ?.split('=')[1];

  if (!token) return null;

  try {
    return verify(
      token,
      process.env.JWT_SECRET || 'fallback-secret-key-change-in-production'
    ) as { id: string; role: string };
  } catch {
    return null;
  }
}

// GET all users (admin only)
export async function GET(request: Request) {
  try {
    const user = getUserFromRequest(request);
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const db = await getDb();
    const users = await db.collection('users').find({}, {
      projection: { password: 0 }
    }).toArray();

    return NextResponse.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Error fetching users' },
      { status: 500 }
    );
  }
}

// Create a new user (admin only)
export async function POST(request: Request) {
  try {
    const user = getUserFromRequest(request);
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { name, email, password, role, clientId } = await request.json();

    if (!name || !email || !password || !role) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (!['admin', 'viewer', 'client'].includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }
    
    if (role === 'client' && !clientId) {
      return NextResponse.json({ error: 'Client ID is required for client role' }, { status: 400 });
    }
    
    const db = await getDb();
    const existingUser = await db.collection('users').findOne({ email });
    if (existingUser) {
      return NextResponse.json({ error: 'User already exists' }, { status: 409 });
    }
    
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await db.collection('users').insertOne({
      name,
      email,
      password: hashedPassword,
      role,
      clientId: role === 'client' ? clientId : null,
      createdAt: new Date(),
    });

    return NextResponse.json(
      { message: 'User created successfully', userId: result.insertedId },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      { error: 'Error creating user' },
      { status: 500 }
    );
  }
}