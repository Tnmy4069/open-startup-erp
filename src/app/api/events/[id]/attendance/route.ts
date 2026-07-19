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

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  try {
    const idOrSlug = (await params).id;
    const event = await findEvent(idOrSlug);

    if (!event) {
      return NextResponse.json({ error: 'Event not found.' }, { status: 404 });
    }

    const data = await request.json();
    const { registrationId, qrCode, status, feedback, rating } = data;

    let registration = null;

    if (qrCode) {
      // QR Code check-in
      registration = await prisma.eventRegistration.findFirst({
        where: { eventId: event.id, qrCode: qrCode.trim() },
        include: { event: true },
      });
      if (!registration) {
        return NextResponse.json({ error: 'Invalid QR code for this event.' }, { status: 404 });
      }

      const wasAlreadyAttended = registration.status === 'Attended';

      registration = await prisma.eventRegistration.update({
        where: { id: registration.id },
        data: { status: status || 'Attended' },
        include: { event: true, member: true },
      });

      if (registration.memberId && registration.status === 'Attended' && !wasAlreadyAttended) {
        try {
          await prisma.memberActivity.create({
            data: {
              memberId: registration.memberId,
              action: `Attended event: ${event.title}`,
            },
          });
        } catch (e) {
          console.error('Member activity error:', e);
        }
      }
    } else if (registrationId) {
      // Toggle manually by registration id
      registration = await prisma.eventRegistration.findUnique({
        where: { id: registrationId },
        include: { event: true, member: true },
      });
      if (!registration || registration.eventId !== event.id) {
        return NextResponse.json({ error: 'Registration record not found for this event.' }, { status: 404 });
      }

      const wasAlreadyAttended = registration.status === 'Attended';

      registration = await prisma.eventRegistration.update({
        where: { id: registrationId },
        data: {
          status: status || 'Attended',
          feedback: feedback !== undefined ? feedback : registration.feedback,
          rating: rating !== undefined ? parseInt(rating, 10) : registration.rating,
        },
        include: { event: true, member: true },
      });

      if (registration.memberId && registration.status === 'Attended' && !wasAlreadyAttended) {
        try {
          await prisma.memberActivity.create({
            data: {
              memberId: registration.memberId,
              action: `Attended event: ${event.title}`,
            },
          });
        } catch (e) {
          console.error('Member activity error:', e);
        }
      }
    } else {
      return NextResponse.json({ error: 'Either registrationId or qrCode must be provided.' }, { status: 400 });
    }

    await prisma.activityLog.create({
      data: {
        action: 'Updated',
        user: session.username,
        role: session.role,
        details: `Updated attendance for ${registration.name} (${registration.email}) - Status: ${registration.status}`,
      },
    });

    return NextResponse.json(registration);
  } catch (error: any) {
    console.error('PUT /api/events/[id]/attendance error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
