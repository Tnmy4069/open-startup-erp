import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/session';

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
    const { registrationId, qrCode, status, feedback, rating } = data;

    let registration = null;

    if (qrCode) {
      // QR Code check-in
      registration = await prisma.eventRegistration.findFirst({
        where: { eventId: id, qrCode },
        include: { event: true }
      });
      if (!registration) {
        return NextResponse.json({ error: 'Invalid QR code.' }, { status: 404 });
      }

      registration = await prisma.eventRegistration.update({
        where: { id: registration.id },
        data: { status: 'Attended' },
        include: { event: true }
      });
    } else if (registrationId) {
      // Toggle manually by registration id
      registration = await prisma.eventRegistration.findUnique({
        where: { id: registrationId },
        include: { event: true }
      });
      if (!registration || registration.eventId !== id) {
        return NextResponse.json({ error: 'Registration record not found.' }, { status: 404 });
      }

      registration = await prisma.eventRegistration.update({
        where: { id: registrationId },
        data: {
          status: status || 'Attended',
          feedback: feedback !== undefined ? feedback : registration.feedback,
          rating: rating !== undefined ? parseInt(rating, 10) : registration.rating,
        },
        include: { event: true }
      });
    } else {
      return NextResponse.json({ error: 'Either registrationId or qrCode must be provided.' }, { status: 400 });
    }

    // Add activity history for member if this is a registered member check-in
    if (registration.memberId && registration.status === 'Attended') {
      // Update member attendance %
      const member = await prisma.member.findUnique({
        where: { id: registration.memberId },
        include: { registrations: true }
      });
      if (member) {
        const totalEvents = member.registrations.length;
        const attendedEvents = member.registrations.filter((r) => r.status === 'Attended').length;
        const attendance = totalEvents > 0 ? (attendedEvents / totalEvents) * 100 : 100.0;

        await prisma.member.update({
          where: { id: registration.memberId },
          data: { attendance }
        });

        await prisma.memberActivity.create({
          data: {
            memberId: registration.memberId,
            action: `Attended event: ${registration.event.title}`,
          }
        });
      }
    }

    return NextResponse.json(registration);
  } catch (error: any) {
    console.error('PUT /api/events/[id]/attendance error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
