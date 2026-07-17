import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const meeting = await prisma.meetingNote.findUnique({
      where: { id },
    });

    if (!meeting) {
      return NextResponse.json({ error: 'Meeting note not found' }, { status: 404 });
    }

    if (!meeting.isPublic) {
      return NextResponse.json({ error: 'Unauthorized. Meeting is not public.' }, { status: 401 });
    }

    return NextResponse.json(meeting);
  } catch (error) {
    const err = error as Error;
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
