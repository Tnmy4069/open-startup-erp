import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import {
  verifyFathomWebhookSignature,
  normalizeFathomPayload,
  FathomWebhookPayload,
} from '@/lib/fathom';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const rawBody = await request.text();
    if (!rawBody) {
      return NextResponse.json({ error: 'Empty request body' }, { status: 400 });
    }

    // Extract request headers
    const headersMap: Record<string, string> = {};
    request.headers.forEach((val, key) => {
      headersMap[key.toLowerCase()] = val;
    });

    const secret = process.env.FATHOM_WEBHOOK_SECRET || '';

    // Verify webhook signature if headers & secret are present
    const hasSigHeaders =
      headersMap['webhook-signature'] ||
      headersMap['x-webhook-signature'] ||
      headersMap['webhook-id'];

    if (secret && hasSigHeaders) {
      const isValid = verifyFathomWebhookSignature({
        rawBody,
        headers: headersMap,
        secret,
      });

      if (!isValid) {
        console.error('[Fathom Webhook] Unauthorized - Invalid signature header');
        return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 401 });
      }
    }

    // Parse JSON payload
    let rawPayload: FathomWebhookPayload;
    try {
      rawPayload = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
    }

    // Normalize Fathom payload into standard Meeting Note structure
    const meetingData = normalizeFathomPayload(rawPayload);

    // Check for existing meeting note to prevent duplicate creation
    let existingMeeting = null;
    if (meetingData.refLink) {
      existingMeeting = await prisma.meetingNote.findFirst({
        where: { refLink: meetingData.refLink },
      });
    }

    if (!existingMeeting) {
      // Fallback check by exact agenda title created on the same day
      const startOfDay = new Date(meetingData.date);
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = new Date(meetingData.date);
      endOfDay.setHours(23, 59, 59, 999);

      existingMeeting = await prisma.meetingNote.findFirst({
        where: {
          agenda: meetingData.agenda,
          createdBy: 'Fathom AI Notetaker',
          date: {
            gte: startOfDay,
            lte: endOfDay,
          },
        },
      });
    }

    let meeting;
    if (existingMeeting) {
      // Update existing meeting note with latest summary & links
      meeting = await prisma.meetingNote.update({
        where: { id: existingMeeting.id },
        data: {
          notes: meetingData.notes,
          refLink: meetingData.refLink || existingMeeting.refLink,
          date: meetingData.date,
          updatedAt: new Date(),
        },
      });

      await prisma.activityLog.create({
        data: {
          action: 'Updated',
          user: 'Fathom AI Notetaker',
          role: 'System Bot',
          details: `Updated Fathom meeting note: "${meetingData.agenda}"`,
        },
      });
    } else {
      // Create new meeting note entry
      meeting = await prisma.meetingNote.create({
        data: {
          date: meetingData.date,
          agenda: meetingData.agenda,
          notes: meetingData.notes,
          refLink: meetingData.refLink,
          createdBy: meetingData.createdBy,
          isPublic: false,
        },
      });

      // Audit activity log
      await prisma.activityLog.create({
        data: {
          action: 'Created',
          user: 'Fathom AI Notetaker',
          role: 'System Bot',
          details: `Automatically logged meeting note from Fathom: "${meetingData.agenda}"`,
        },
      });

      // System notification
      await prisma.notification.create({
        data: {
          message: `🎙️ New Fathom AI meeting note logged: "${meetingData.agenda}"`,
          type: 'New transaction',
          status: 'Unread',
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: existingMeeting ? 'Meeting note updated' : 'Meeting note created',
      meetingId: meeting.id,
      agenda: meeting.agenda,
    });
  } catch (error) {
    const err = error as Error;
    console.error('[Fathom Webhook Error]', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}

export async function GET() {
  const isConfigured = !!(process.env.FATHOM_API_KEY && process.env.FATHOM_WEBHOOK_SECRET);
  return NextResponse.json({
    status: 'active',
    service: 'Fathom AI Webhook Endpoint',
    configured: isConfigured,
    timestamp: new Date().toISOString(),
    webhookUrl: '/api/webhooks/fathom',
  });
}
