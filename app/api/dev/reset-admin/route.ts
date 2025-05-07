import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getDb } from '@/lib/mongodb';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const db = await getDb();

    const newPassword = 'Lihkin@3289';
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    const result = await db.collection('users').updateOne(
      { email: 'nikhil.vadhawana@idx.inc' },
      { $set: { password: hashedPassword } }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ message: 'Admin user not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Admin password reset to "password"' });
  } catch (error) {
    console.error('Reset error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}