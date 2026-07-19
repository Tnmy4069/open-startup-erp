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
      event = await prisma.event.findUnique({ where: { id: idOrSlug } });
    } catch {
      event = null;
    }
  }
  if (!event) {
    event = await prisma.event.findUnique({ where: { slug: idOrSlug } });
  }
  return event;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; registrationId: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized. Login required.' }, { status: 401 });
  }

  try {
    const { id: idOrSlug, registrationId } = await params;
    const event = await findEvent(idOrSlug);

    if (!event) {
      return NextResponse.json({ error: 'Event not found.' }, { status: 404 });
    }

    const registration = await prisma.eventRegistration.findUnique({
      where: { id: registrationId },
      include: {
        event: true,
        member: true,
      },
    });

    if (!registration || registration.eventId !== event.id) {
      return NextResponse.json({ error: 'RSVP record not found.' }, { status: 404 });
    }

    return NextResponse.json(registration);
  } catch (error: any) {
    console.error('GET /api/events/[id]/registrations/[registrationId] error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; registrationId: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized. Login required.' }, { status: 401 });
  }

  try {
    const { id: idOrSlug, registrationId } = await params;
    const event = await findEvent(idOrSlug);

    if (!event) {
      return NextResponse.json({ error: 'Event not found.' }, { status: 404 });
    }

    const existing = await prisma.eventRegistration.findUnique({
      where: { id: registrationId },
    });

    if (!existing || existing.eventId !== event.id) {
      return NextResponse.json({ error: 'RSVP record not found.' }, { status: 404 });
    }

    const body = await request.json();
    const { name, email, phone, status, feedback, rating, memberId } = body;

    const wasAlreadyAttended = existing.status === 'Attended';

    const updated = await prisma.eventRegistration.update({
      where: { id: registrationId },
      data: {
        name: name !== undefined ? name.trim() : existing.name,
        email: email !== undefined ? email.trim().toLowerCase() : existing.email,
        phone: phone !== undefined ? (phone ? String(phone).trim() : null) : existing.phone,
        status: status !== undefined ? status : existing.status,
        feedback: feedback !== undefined ? feedback : existing.feedback,
        rating: rating !== undefined ? (rating ? parseInt(rating, 10) : null) : existing.rating,
        memberId: memberId !== undefined ? memberId : existing.memberId,
      },
      include: {
        event: true,
        member: true,
      },
    });

    // If status became Attended for a member
    if (updated.memberId && updated.status === 'Attended' && !wasAlreadyAttended) {
      try {
        await prisma.memberActivity.create({
          data: {
            memberId: updated.memberId,
            action: `Attended event: ${event.title}`,
          },
        });
      } catch (e) {
        console.error('Member activity log error:', e);
      }
    }

    await prisma.activityLog.create({
      data: {
        action: 'Updated',
        user: session.username,
        role: session.role,
        details: `Updated RSVP record for ${updated.name} (${updated.email}) - Status: ${updated.status}`,
      },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('PUT /api/events/[id]/registrations/[registrationId] error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; registrationId: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized. Login required.' }, { status: 401 });
  }

  try {
    const { id: idOrSlug, registrationId } = await params;
    const event = await findEvent(idOrSlug);

    if (!event) {
      return NextResponse.json({ error: 'Event not found.' }, { status: 404 });
    }

    const existing = await prisma.eventRegistration.findUnique({
      where: { id: registrationId },
    });

    if (!existing || existing.eventId !== event.id) {
      return NextResponse.json({ error: 'RSVP record not found.' }, { status: 404 });
    }

    await prisma.eventRegistration.delete({
      where: { id: registrationId },
    });

    await prisma.activityLog.create({
      data: {
        action: 'Deleted',
        user: session.username,
        role: session.role,
        details: `Deleted RSVP record for ${existing.name} (${existing.email}) from event: ${event.title}`,
      },
    });

    return NextResponse.json({
      success: true,
      message: `RSVP for ${existing.name} has been successfully deleted.`,
    });
  } catch (error: any) {
    console.error('DELETE /api/events/[id]/registrations/[registrationId] error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
