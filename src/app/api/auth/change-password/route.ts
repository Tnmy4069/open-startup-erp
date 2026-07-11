import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/session';
import bcrypt from 'bcryptjs';

export async function PUT(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const { currentPassword, newPassword } = await request.json();

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: 'Both current and new password are required.' }, { status: 400 });
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ error: 'New password must be at least 6 characters.' }, { status: 400 });
    }

    // ── Super Admin: password lives in .env, cannot be changed from here ──
    if (session.userId === 'superadmin') {
      return NextResponse.json(
        { error: 'Super Admin password is managed via environment variables and cannot be changed here.' },
        { status: 403 }
      );
    }

    // ── Regular DB user ───────────────────────────────────────────────────
    const user = await prisma.user.findUnique({ where: { id: session.userId } });
    if (!user) {
      return NextResponse.json({ error: 'User not found.' }, { status: 404 });
    }

    const passwordMatch = await bcrypt.compare(currentPassword, user.password);
    if (!passwordMatch) {
      return NextResponse.json({ error: 'Current password is incorrect.' }, { status: 401 });
    }

    if (currentPassword === newPassword) {
      return NextResponse.json({ error: 'New password must be different from current password.' }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({
      where: { id: session.userId },
      data: { password: hashedPassword },
    });

    return NextResponse.json({ ok: true, message: 'Password updated successfully.' });
  } catch (error) {
    console.error('Change password error:', error);
    return NextResponse.json({ error: 'An unexpected error occurred.' }, { status: 500 });
  }
}
