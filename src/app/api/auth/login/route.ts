import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { createSession } from '@/lib/session';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json({ error: 'Username and password are required.' }, { status: 400 });
    }

    // ── Check Super Admin credentials from .env ──────────────────────────
    const saUsername = process.env.SUPER_ADMIN_USERNAME || 'admin';
    const saPassword = process.env.SUPER_ADMIN_PASSWORD || 'cyberx2024';

    if (saUsername && username === saUsername) {
      if (password !== saPassword) {
        return NextResponse.json({ error: 'Invalid credentials.' }, { status: 401 });
      }
      await createSession('superadmin', saUsername, 'Super Admin');
      return NextResponse.json({ ok: true, username: saUsername, role: 'Super Admin' });
    }

    // ── Check DB users ────────────────────────────────────────────────────
    const user = await prisma.user.findUnique({ where: { username } });
    if (!user) {
      return NextResponse.json({ error: 'Invalid credentials.' }, { status: 401 });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return NextResponse.json({ error: 'Invalid credentials.' }, { status: 401 });
    }

    // Block deactivated accounts
    if (user.isActive === false) {
      return NextResponse.json({ error: 'This account has been deactivated. Contact your Super Admin.' }, { status: 403 });
    }

    await createSession(user.id, user.username, user.role);
    return NextResponse.json({ ok: true, username: user.username, role: user.role });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'An unexpected error occurred.' }, { status: 500 });
  }
}
