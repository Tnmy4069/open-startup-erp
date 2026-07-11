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
    const { name, contactPerson, phone, email, address, user, role } = data;

    const original = await prisma.organization.findUnique({
      where: { id },
    });

    if (!original) {
      return NextResponse.json({ error: 'Organization profile not found' }, { status: 404 });
    }

    const updated = await prisma.organization.update({
      where: { id },
      data: {
        name,
        contactPerson,
        phone,
        email,
        address,
      },
    });

    await prisma.activityLog.create({
      data: {
        action: 'Updated',
        user: user || 'System',
        role: role || 'Treasurer',
        details: `Updated organization profile: "${name}"`,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    const err = error as Error;
    console.error('Error updating organization:', err);
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

    const original = await prisma.organization.findUnique({
      where: { id },
    });

    if (!original) {
      return NextResponse.json({ error: 'Organization profile not found' }, { status: 404 });
    }

    await prisma.organization.delete({
      where: { id },
    });

    await prisma.activityLog.create({
      data: {
        action: 'Deleted',
        user,
        role,
        details: `Deleted organization profile: "${original.name}"`,
      },
    });

    return NextResponse.json({ success: true, message: 'Organization profile deleted successfully' });
  } catch (error) {
    const err = error as Error;
    console.error('Error deleting organization:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
