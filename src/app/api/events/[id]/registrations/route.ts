import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/session';

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
      });
    } catch {
      event = null;
    }
  }

  if (!event) {
    event = await prisma.event.findUnique({
      where: { slug: idOrSlug },
    });
  }
  return event;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized. Login required.' }, { status: 401 });
  }

  try {
    const idOrSlug = (await params).id;
    const event = await findEvent(idOrSlug);

    if (!event) {
      return NextResponse.json({ error: 'Event not found.' }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';

    const whereCondition: any = {
      eventId: event.id,
    };

    if (status) {
      whereCondition.status = status;
    }

    if (search) {
      whereCondition.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [registrations, totalCount, attendedCount, registeredCount, noShowCount] = await Promise.all([
      prisma.eventRegistration.findMany({
        where: whereCondition,
        include: { member: true },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.eventRegistration.count({ where: { eventId: event.id } }),
      prisma.eventRegistration.count({ where: { eventId: event.id, status: 'Attended' } }),
      prisma.eventRegistration.count({ where: { eventId: event.id, status: 'Registered' } }),
      prisma.eventRegistration.count({ where: { eventId: event.id, status: 'No-Show' } }),
    ]);

    return NextResponse.json({
      event: {
        id: event.id,
        title: event.title,
        slug: event.slug,
        capacity: event.capacity,
        startDate: event.startDate,
        endDate: event.endDate,
        venue: event.venue,
        status: event.status,
      },
      stats: {
        total: totalCount,
        attended: attendedCount,
        registered: registeredCount,
        noShow: noShowCount,
        capacity: event.capacity,
        spotsRemaining: Math.max(0, event.capacity - totalCount),
      },
      registrations,
    });
  } catch (error: any) {
    console.error('GET /api/events/[id]/registrations error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized. Login required.' }, { status: 401 });
  }

  try {
    const idOrSlug = (await params).id;
    const event = await findEvent(idOrSlug);

    if (!event) {
      return NextResponse.json({ error: 'Event not found.' }, { status: 404 });
    }

    const body = await request.json();
    const { name, email, phone, status, memberId } = body;

    if (!name || !email) {
      return NextResponse.json({ error: 'Name and email are required.' }, { status: 400 });
    }

    // Check capacity
    const currentCount = await prisma.eventRegistration.count({
      where: { eventId: event.id },
    });

    if (currentCount >= event.capacity) {
      return NextResponse.json({ error: 'Event registration has reached maximum capacity.' }, { status: 400 });
    }

    // Check existing registration
    const existing = await prisma.eventRegistration.findFirst({
      where: {
        eventId: event.id,
        email: { equals: email.trim(), mode: 'insensitive' },
      },
    });

    if (existing) {
      return NextResponse.json({
        error: 'Registration with this email already exists for this event.',
        registration: existing,
      }, { status: 409 });
    }

    // Generate unique QR code
    const timestamp = Date.now().toString(36).toUpperCase();
    const randomHex = Math.random().toString(36).substring(2, 6).toUpperCase();
    const qrCode = `CYBERX-PASS-${event.slug.toUpperCase()}-${timestamp}-${randomHex}`;

    const registration = await prisma.eventRegistration.create({
      data: {
        eventId: event.id,
        memberId: (memberId && isValidObjectId(memberId)) ? memberId : undefined,
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone ? String(phone).trim() : null,
        status: status || 'Registered',
        qrCode,
      },
      include: {
        member: true,
      },
    });

    if (memberId) {
      try {
        await prisma.memberActivity.create({
          data: {
            memberId,
            action: `Registered for event: ${event.title}`,
          },
        });
      } catch (e) {
        console.error('Member activity log error:', e);
      }
    }

    await prisma.activityLog.create({
      data: {
        action: 'Created',
        user: session.username,
        role: session.role,
        details: `Manually added RSVP for ${registration.name} (${registration.email}) to event: ${event.title}`,
      },
    });

    return NextResponse.json(registration, { status: 201 });
  } catch (error: any) {
    console.error('POST /api/events/[id]/registrations error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
