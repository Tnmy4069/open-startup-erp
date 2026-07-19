import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/session';

function parseEventWithMetadata(event: any) {
  if (!event) return event;
  let eventType = event.eventType || 'Offline';
  let venue = event.venue || '';

  const match = venue.match(/^\[(Online|Offline|Hybrid)\]\s*(.*)$/i);
  if (match) {
    eventType = match[1].charAt(0).toUpperCase() + match[1].slice(1).toLowerCase();
    venue = match[2];
  }

  return {
    ...event,
    eventType,
    venue: venue || event.venue || 'TBA',
  };
}

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const category = searchParams.get('category') || '';
    const status = searchParams.get('status') || ''; // Draft, Upcoming, Past, Cancelled
    const visibility = searchParams.get('visibility') || '';

    const where: any = {};

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { venue: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (category) where.category = category;
    if (status) where.status = status;
    if (visibility) where.visibility = visibility;

    const events = await prisma.event.findMany({
      where,
      orderBy: { startDate: 'asc' },
      include: {
        registrations: true,
      },
    });

    const parsedEvents = events.map((e) => parseEventWithMetadata(e));

    return NextResponse.json(parsedEvents);
  } catch (error: any) {
    console.error('GET /api/events error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  try {
    const data = await request.json();
    const {
      title,
      slug,
      banner,
      description,
      category,
      eventType,
      venue,
      startDate,
      endDate,
      registrationDeadline,
      capacity,
      status,
      visibility,
      budget,
      expectedRevenue,
      sponsors,
      speakers,
      volunteers,
      organizers,
      agenda,
      resources,
    } = data;

    if (!title || !slug) {
      return NextResponse.json({ error: 'Title and slug are required.' }, { status: 400 });
    }

    const targetType = eventType || 'Offline';
    const cleanVenue = (venue || 'TBA').replace(/^\[(Online|Offline|Hybrid)\]\s*/i, '');
    const formattedVenue = `[${targetType}] ${cleanVenue}`;

    const event = await prisma.event.create({
      data: {
        title,
        slug,
        banner: banner || '',
        description: description || '',
        category: category || 'Technical',
        venue: formattedVenue,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        registrationDeadline: new Date(registrationDeadline),
        capacity: parseInt(capacity || '50', 10),
        status: status || 'Draft',
        visibility: visibility || 'Public',
        budget: parseFloat(budget || '0'),
        expectedRevenue: parseFloat(expectedRevenue || '0'),
        sponsors: sponsors || [],
        speakers: speakers || [],
        volunteers: volunteers || [],
        organizers: organizers || [],
        agenda: agenda || '',
        resources: resources || '',
      },
    });

    await prisma.activityLog.create({
      data: {
        action: 'Created',
        user: session.username,
        role: session.role,
        details: `Created new event draft: ${title}`,
      },
    });

    return NextResponse.json(parseEventWithMetadata(event), { status: 201 });
  } catch (error: any) {
    console.error('POST /api/events error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
