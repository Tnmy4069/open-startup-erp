import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { guardEdit, guardDelete } from '@/lib/permissions';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const denied = await guardEdit();
  if (denied) return denied;

  try {
    const id = (await params).id;
    const data = await request.json();
    const { name, phone, email, role, user, userRole } = data;

    const original = await prisma.person.findUnique({
      where: { id },
    });

    if (!original) {
      return NextResponse.json({ error: 'Person profile not found' }, { status: 404 });
    }

    const updated = await prisma.person.update({
      where: { id },
      data: {
        name,
        phone,
        email,
        role,
      },
    });

    await prisma.activityLog.create({
      data: {
        action: 'Updated',
        user: user || 'System',
        role: userRole || 'Treasurer',
        details: `Updated person profile: ${name} (${role})`,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    const err = error as Error;
    console.error('Error updating person:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const denied = await guardDelete();
  if (denied) return denied;

  try {
    const id = (await params).id;
    const { searchParams } = new URL(request.url);
    const user = searchParams.get('user') || 'System';
    const role = searchParams.get('role') || 'Super Admin';

    const original = await prisma.person.findUnique({
      where: { id },
    });

    if (!original) {
      return NextResponse.json({ error: 'Person profile not found' }, { status: 404 });
    }

    await prisma.person.delete({
      where: { id },
    });

    await prisma.activityLog.create({
      data: {
        action: 'Deleted',
        user,
        role,
        details: `Deleted person profile: ${original.name} (${original.role})`,
      },
    });

    return NextResponse.json({ success: true, message: 'Person profile deleted successfully' });
  } catch (error) {
    const err = error as Error;
    console.error('Error deleting person:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
