import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

function isValidObjectId(id: string) {
  return typeof id === 'string' && /^[0-9a-fA-F]{24}$/.test(id);
}

async function findEvent(idOrSlug: string) {
  let event = null;
  if (isValidObjectId(idOrSlug)) {
    try {
      event = await prisma.event.findUnique({
        where: { id: idOrSlug },
        include: { registrations: true },
      });
    } catch {
      event = null;
    }
  }

  if (!event) {
    event = await prisma.event.findUnique({
      where: { slug: idOrSlug },
      include: { registrations: true },
    });
  }
  return event;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const idOrSlug = (await params).id;
    const event = await findEvent(idOrSlug);

    if (!event) {
      return NextResponse.json({ error: 'Event not found.' }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');
    const qrCode = searchParams.get('qrCode');

    if (!email && !qrCode) {
      return NextResponse.json({
        event: {
          id: event.id,
          title: event.title,
          slug: event.slug,
          status: event.status,
          capacity: event.capacity,
          registeredCount: event.registrations.length,
          isFull: event.registrations.length >= event.capacity,
        },
      });
    }

    const whereCondition: any = { eventId: event.id };
    if (email) {
      whereCondition.email = { equals: email.trim(), mode: 'insensitive' };
    } else if (qrCode) {
      whereCondition.qrCode = qrCode.trim();
    }

    const registration = await prisma.eventRegistration.findFirst({
      where: whereCondition,
    });

    if (!registration) {
      return NextResponse.json({ error: 'RSVP not found for given details.' }, { status: 404 });
    }

    const setting = await prisma.setting.findUnique({ where: { id: 'global_config' } });
    const enableEventPass = setting?.enableEventPass ?? true;

    return NextResponse.json({
      found: true,
      registration,
      eventTitle: event.title,
      enableEventPass,
    });
  } catch (error: any) {
    console.error('GET /api/public/events/[id]/rsvp error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const idOrSlug = (await params).id;
    const body = await request.json();
    const { name, email, college, phone, memberId } = body;

    if (!name || !email) {
      return NextResponse.json({ error: 'Name and email are required for RSVP.' }, { status: 400 });
    }

    // Find event by id or slug
    const event = await findEvent(idOrSlug);

    if (!event) {
      return NextResponse.json({ error: 'Event not found.' }, { status: 404 });
    }

    if (event.status === 'Cancelled') {
      return NextResponse.json({ error: 'This event has been cancelled.' }, { status: 400 });
    }

    if (event.registrations.length >= event.capacity) {
      return NextResponse.json({ error: 'Sorry! Event registration has reached full capacity.' }, { status: 400 });
    }

    // Check duplicate RSVP
    const existingReg = await prisma.eventRegistration.findFirst({
      where: {
        eventId: event.id,
        email: { equals: email.trim(), mode: 'insensitive' },
      },
    });

    if (existingReg) {
      // Check global settings for event pass
      const setting = await prisma.setting.findUnique({ where: { id: 'global_config' } });
      const enableEventPass = setting?.enableEventPass ?? true;

      return NextResponse.json({
        message: 'You are already RSVPed for this event!',
        registration: existingReg,
        eventTitle: event.title,
        enableEventPass,
      }, { status: 200 });
    }

    // Generate unique QR code & Ticket reference code
    const timestamp = Date.now().toString(36).toUpperCase();
    const randomHex = Math.random().toString(36).substring(2, 6).toUpperCase();
    const qrCode = `CYBERX-PASS-${event.slug.toUpperCase()}-${timestamp}-${randomHex}`;

    // Create registration
    const registration = await prisma.eventRegistration.create({
      data: {
        eventId: event.id,
        memberId: (memberId && isValidObjectId(memberId)) ? memberId : undefined,
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone ? String(phone).trim() : null,
        status: 'Registered',
        qrCode,
      },
    });

    // Check setting for event pass feature
    const setting = await prisma.setting.findUnique({ where: { id: 'global_config' } });
    const enableEventPass = setting?.enableEventPass ?? true;

    return NextResponse.json({
      success: true,
      message: 'RSVP confirmed successfully!',
      registration,
      eventTitle: event.title,
      enableEventPass,
    }, { status: 201 });
  } catch (error: any) {
    console.error('POST /api/public/events/[id]/rsvp error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
