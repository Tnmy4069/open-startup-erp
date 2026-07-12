import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { guardUsers } from '@/lib/permissions';

// GET /api/users — list all DB users (Super Admin only)
export async function GET() {
  const forbidden = await guardUsers();
  if (forbidden) return forbidden;

  try {
    const users = await prisma.user.findMany({
      select: { id: true, username: true, role: true, createdAt: true, updatedAt: true },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(users);
  } catch (error) {
    console.error('GET /api/users error:', error);
    return NextResponse.json({ error: 'Failed to fetch users.' }, { status: 500 });
  }
}

// POST /api/users — create a new user (Super Admin only)
export async function POST(request: Request) {
  const forbidden = await guardUsers();
  if (forbidden) return forbidden;

  try {
    const { username, password, role } = await request.json();

    if (!username || !password || !role) {
      return NextResponse.json({ error: 'username, password, and role are required.' }, { status: 400 });
    }

    const validRoles = ['Co-Founder', 'Founder', 'Committee Member', 'Read Only'];
    if (!validRoles.includes(role)) {
      return NextResponse.json({ error: 'Invalid role.' }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: { username, password: hashedPassword, role },
      select: { id: true, username: true, role: true, createdAt: true },
    });

    return NextResponse.json(user, { status: 201 });
  } catch (error: unknown) {
    if (
      error &&
      typeof error === 'object' &&
      'code' in error &&
      (error as { code: string }).code === 'P2002'
    ) {
      return NextResponse.json({ error: 'Username already exists.' }, { status: 409 });
    }
    console.error('POST /api/users error:', error);
    return NextResponse.json({ error: 'Failed to create user.' }, { status: 500 });
  }
}
