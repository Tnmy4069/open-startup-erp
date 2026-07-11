import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/session';

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const meetings = await prisma.meetingNote.findMany({
      orderBy: { date: 'desc' },
    });
    return NextResponse.json(meetings);
  } catch (error) {
    const err = error as Error;
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const data = await request.json();
    const { date, agenda, notes, refLink } = data;

    if (!agenda || !notes) {
      return NextResponse.json({ error: 'Agenda and notes are required.' }, { status: 400 });
    }

    const meeting = await prisma.meetingNote.create({
      data: {
        date: date ? new Date(date) : new Date(),
        agenda,
        notes,
        refLink: refLink || null,
        createdBy: session.username || 'System',
      },
    });

    // Create Audit Activity Log
    await prisma.activityLog.create({
      data: {
        action: 'Created',
        user: session.username || 'System',
        role: session.role || 'Member',
        details: `Logged meeting note: "${agenda}"`,
      },
    });

    return NextResponse.json(meeting);
  } catch (error) {
    const err = error as Error;
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
