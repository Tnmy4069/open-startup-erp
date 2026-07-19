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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  try {
    const id = (await params).id;
    const event = await prisma.event.findUnique({
      where: { id },
      include: {
        registrations: {
          include: {
            member: true,
          },
        },
      },
    });

    if (!event) {
      return NextResponse.json({ error: 'Event not found.' }, { status: 404 });
    }

    return NextResponse.json(parseEventWithMetadata(event));
  } catch (error: any) {
    console.error('GET /api/events/[id] error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(
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

    const original = await prisma.event.findUnique({ where: { id } });
    if (!original) {
      return NextResponse.json({ error: 'Event not found.' }, { status: 404 });
    }

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

    // Build formatted venue string containing eventType metadata without unknown Prisma schema fields
    let finalVenue = original.venue;
    if (venue !== undefined || eventType !== undefined) {
      const rawVenue = venue !== undefined ? venue : original.venue;
      const rawType = eventType !== undefined ? eventType : 'Offline';
      const cleanVenue = (rawVenue || '').replace(/^\[(Online|Offline|Hybrid)\]\s*/i, '');
      finalVenue = `[${rawType}] ${cleanVenue}`;
    }

    const updated = await prisma.event.update({
      where: { id },
      data: {
        title: title !== undefined ? title : original.title,
        slug: slug !== undefined ? slug : original.slug,
        banner: banner !== undefined ? banner : original.banner,
        description: description !== undefined ? description : original.description,
        category: category !== undefined ? category : original.category,
        venue: finalVenue,
        startDate: startDate !== undefined ? new Date(startDate) : original.startDate,
        endDate: endDate !== undefined ? new Date(endDate) : original.endDate,
        registrationDeadline: registrationDeadline !== undefined ? new Date(registrationDeadline) : original.registrationDeadline,
        capacity: capacity !== undefined ? parseInt(capacity, 10) : original.capacity,
        status: status !== undefined ? status : original.status,
        visibility: visibility !== undefined ? visibility : original.visibility,
        budget: budget !== undefined ? parseFloat(budget) : original.budget,
        expectedRevenue: expectedRevenue !== undefined ? parseFloat(expectedRevenue) : original.expectedRevenue,
        sponsors: sponsors !== undefined ? sponsors : original.sponsors,
        speakers: speakers !== undefined ? speakers : original.speakers,
        volunteers: volunteers !== undefined ? volunteers : original.volunteers,
        organizers: organizers !== undefined ? organizers : original.organizers,
        agenda: agenda !== undefined ? agenda : original.agenda,
        resources: resources !== undefined ? resources : original.resources,
      },
    });

    await prisma.activityLog.create({
      data: {
        action: 'Updated',
        user: session.username,
        role: session.role,
        details: `Updated event parameters: ${updated.title}`,
      },
    });

    return NextResponse.json(parseEventWithMetadata(updated));
  } catch (error: any) {
    console.error('PUT /api/events/[id] error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  if (session.role !== 'Super Admin' && session.role !== 'Co-Founder') {
    return NextResponse.json({ error: 'Forbidden: only Super Admin and Co-Founder can delete events.' }, { status: 403 });
  }

  try {
    const id = (await params).id;
    const event = await prisma.event.findUnique({ where: { id } });
    if (!event) {
      return NextResponse.json({ error: 'Event not found.' }, { status: 404 });
    }

    await prisma.event.delete({ where: { id } });

    await prisma.activityLog.create({
      data: {
        action: 'Deleted',
        user: session.username,
        role: session.role,
        details: `Deleted event: ${event.title}`,
      },
    });

    return NextResponse.json({ success: true, message: 'Event deleted successfully.' });
  } catch (error: any) {
    console.error('DELETE /api/events/[id] error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
