import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { guardUsers } from '@/lib/permissions';

// PUT /api/users/[id] — update role and/or password
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const forbidden = await guardUsers();
  if (forbidden) return forbidden;

  const { id } = await params;

  try {
    const { username, role, password } = await request.json();

    const validRoles = ['Finance Head', 'Treasurer', 'Committee Member', 'Read Only'];
    if (role && !validRoles.includes(role)) {
      return NextResponse.json({ error: 'Invalid role.' }, { status: 400 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: Record<string, any> = {};
    if (username) updateData.username = username;
    if (role) updateData.role = role;
    if (password) updateData.password = await bcrypt.hash(password, 12);

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      select: { id: true, username: true, role: true, updatedAt: true },
    });

    return NextResponse.json(user);
  } catch (error: unknown) {
    if (
      error &&
      typeof error === 'object' &&
      'code' in error &&
      (error as { code: string }).code === 'P2002'
    ) {
      return NextResponse.json({ error: 'Username already exists.' }, { status: 409 });
    }
    console.error('PUT /api/users/[id] error:', error);
    return NextResponse.json({ error: 'Failed to update user.' }, { status: 500 });
  }
}

// DELETE /api/users/[id] — remove a user account
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const forbidden = await guardUsers();
  if (forbidden) return forbidden;

  const { id } = await params;

  try {
    await prisma.user.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('DELETE /api/users/[id] error:', error);
    return NextResponse.json({ error: 'Failed to delete user.' }, { status: 500 });
  }
}
