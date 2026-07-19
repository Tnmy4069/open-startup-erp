import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/session';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized. Please log in to mark event attendance.' }, { status: 401 });
  }

  try {
    const { qrCode } = await request.json();

    if (!qrCode || typeof qrCode !== 'string') {
      return NextResponse.json({ error: 'Valid QR code string is required.' }, { status: 400 });
    }

    const cleanQr = qrCode.trim();

    // Find registration record by QR Code across all events
    let registration = await prisma.eventRegistration.findFirst({
      where: { qrCode: cleanQr },
      include: {
        event: true,
        member: true,
      },
    });

    if (!registration) {
      return NextResponse.json({ error: 'Invalid QR code. No matching event registration found.' }, { status: 404 });
    }

    const wasAlreadyAttended = registration.status === 'Attended';

    // Update status to Attended
    const updatedReg = await prisma.eventRegistration.update({
      where: { id: registration.id },
      data: { status: 'Attended' },
      include: {
        event: true,
        member: true,
      },
    });

    // Create member activity log if member profile is linked
    if (updatedReg.memberId && !wasAlreadyAttended) {
      try {
        await prisma.memberActivity.create({
          data: {
            memberId: updatedReg.memberId,
            action: `Attended event: ${updatedReg.event.title}`,
          },
        });
      } catch (err) {
        console.error('Failed to create member activity:', err);
      }
    }

    // Create system activity log
    await prisma.activityLog.create({
      data: {
        action: 'Updated',
        user: session.username,
        role: session.role,
        details: `Checked-in attendee ${updatedReg.name} (${updatedReg.email}) for event: ${updatedReg.event.title}`,
      },
    });

    return NextResponse.json({
      success: true,
      alreadyAttended: wasAlreadyAttended,
      message: wasAlreadyAttended
        ? `Attendee ${updatedReg.name} was already marked as Attended.`
        : `Check-in Successful! Marked ${updatedReg.name} as Attended.`,
      registration: updatedReg,
    });
  } catch (error: any) {
    console.error('POST /api/events/scan error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
