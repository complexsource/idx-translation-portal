import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verify } from 'jsonwebtoken';
import { getDb } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get('auth-token')?.value;

    if (!token) {
      return NextResponse.json({ user: null });
    }

    // Verify token
    const decoded = verify(
      token,
      process.env.JWT_SECRET || 'fallback-secret-key-change-in-production'
    ) as {
      id: string;
      email: string;
      role: string;
    };

    // Get user from database
    const db = await getDb();
    const user = await db.collection('users').findOne({ 
      _id: new ObjectId(decoded.id) 
    });

    if (!user) {
      return NextResponse.json({ user: null });
    }

    // Return user data (excluding password)
    const { password, ...userData } = user;
    
    return NextResponse.json({ user: userData });
  } catch (error) {
    console.error('Session error:', error);
    return NextResponse.json({ user: null });
  }
}