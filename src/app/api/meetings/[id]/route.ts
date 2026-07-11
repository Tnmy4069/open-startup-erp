import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/session';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  try {
    const data = await request.json();
    const { date, agenda, notes, refLink } = data;

    if (!agenda || !notes) {
      return NextResponse.json({ error: 'Agenda and notes are required.' }, { status: 400 });
    }

    const original = await prisma.meetingNote.findUnique({
      where: { id },
    });

    if (!original) {
      return NextResponse.json({ error: 'Meeting note not found' }, { status: 404 });
    }

    const updated = await prisma.meetingNote.update({
      where: { id },
      data: {
        date: date ? new Date(date) : undefined,
        agenda,
        notes,
        refLink: refLink || null,
      },
    });

    // Create Audit Activity Log
    await prisma.activityLog.create({
      data: {
        action: 'Updated',
        user: session.username || 'System',
        role: session.role || 'Member',
        details: `Updated meeting note: "${agenda}"`,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    const err = error as Error;
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  try {
    const original = await prisma.meetingNote.findUnique({
      where: { id },
    });

    if (!original) {
      return NextResponse.json({ error: 'Meeting note not found' }, { status: 404 });
    }

    await prisma.meetingNote.delete({
      where: { id },
    });

    // Create Audit Activity Log
    await prisma.activityLog.create({
      data: {
        action: 'Deleted',
        user: session.username || 'System',
        role: session.role || 'Member',
        details: `Deleted meeting note: "${original.agenda}"`,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    const err = error as Error;
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
