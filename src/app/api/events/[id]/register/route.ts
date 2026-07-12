import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/session';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  try {
    const id = (await params).id;
    const data = await request.json();
    const { memberId, name, email } = data;

    const event = await prisma.event.findUnique({
      where: { id },
      include: { registrations: true },
    });

    if (!event) {
      return NextResponse.json({ error: 'Event not found.' }, { status: 404 });
    }

    if (event.registrations.length >= event.capacity) {
      return NextResponse.json({ error: 'Event has reached capacity.' }, { status: 400 });
    }

    let attendeeName = name || '';
    let attendeeEmail = email || '';

    if (memberId) {
      const member = await prisma.member.findUnique({ where: { id: memberId } });
      if (!member) {
        return NextResponse.json({ error: 'Member not found.' }, { status: 404 });
      }
      attendeeName = member.name;
      attendeeEmail = member.email;

      // Avoid double registrations
      const doubleCheck = await prisma.eventRegistration.findFirst({
        where: { eventId: id, memberId },
      });
      if (doubleCheck) {
        return NextResponse.json({ error: 'Member is already registered for this event.' }, { status: 400 });
      }
    } else {
      if (!attendeeName || !attendeeEmail) {
        return NextResponse.json({ error: 'Name and email are required for external registrations.' }, { status: 400 });
      }
      const doubleCheck = await prisma.eventRegistration.findFirst({
        where: { eventId: id, email: attendeeEmail },
      });
      if (doubleCheck) {
        return NextResponse.json({ error: 'Email is already registered for this event.' }, { status: 400 });
      }
    }

    // Generate simple QR mock string
    const qrCode = `CYBERX-EVT-${event.slug}-${Date.now().toString(36)}`;

    const registration = await prisma.eventRegistration.create({
      data: {
        eventId: id,
        memberId: memberId || null,
        name: attendeeName,
        email: attendeeEmail,
        status: 'Registered',
        qrCode,
      },
    });

    if (memberId) {
      await prisma.memberActivity.create({
        data: {
          memberId,
          action: `Registered for event: ${event.title}`,
        },
      });
    }

    return NextResponse.json(registration, { status: 201 });
  } catch (error: any) {
    console.error('POST /api/events/[id]/register error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
