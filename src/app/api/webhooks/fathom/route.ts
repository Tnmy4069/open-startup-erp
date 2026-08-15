import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import {
  verifyFathomWebhookSignature,
  normalizeFathomPayload,
  FathomWebhookPayload,
} from '@/lib/fathom';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const reqId = Math.random().toString(36).slice(2, 8).toUpperCase();
  console.log(`[Fathom:${reqId}] ▶ Webhook received`);

  try {
    const rawBody = await request.text();
    if (!rawBody) {
      console.warn(`[Fathom:${reqId}] ✗ Empty request body`);
      return NextResponse.json({ error: 'Empty request body' }, { status: 400 });
    }
    console.log(`[Fathom:${reqId}] Body length: ${rawBody.length} chars`);

    // Extract request headers
    const headersMap: Record<string, string> = {};
    request.headers.forEach((val, key) => {
      headersMap[key.toLowerCase()] = val;
    });

    // Log relevant headers for debugging
    const debugHeaders = {
      'webhook-id': headersMap['webhook-id'] || '—',
      'webhook-timestamp': headersMap['webhook-timestamp'] || '—',
      'webhook-signature': headersMap['webhook-signature'] ? headersMap['webhook-signature'].slice(0, 20) + '...' : '—',
      'content-type': headersMap['content-type'] || '—',
      'user-agent': headersMap['user-agent'] || '—',
    };
    console.log(`[Fathom:${reqId}] Headers:`, JSON.stringify(debugHeaders));

    const secret = process.env.FATHOM_WEBHOOK_SECRET || '';
    if (!secret) console.warn(`[Fathom:${reqId}] ⚠ FATHOM_WEBHOOK_SECRET not set — skipping signature check`);

    // Verify webhook signature if headers & secret are present
    const hasSigHeaders =
      headersMap['webhook-signature'] ||
      headersMap['x-webhook-signature'] ||
      headersMap['webhook-id'];

    if (secret && hasSigHeaders) {
      console.log(`[Fathom:${reqId}] Verifying signature...`);
      const isValid = verifyFathomWebhookSignature({
        rawBody,
        headers: headersMap,
        secret,
      });

      if (!isValid) {
        console.error(`[Fathom:${reqId}] ✗ Signature INVALID — rejecting`);
        return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 401 });
      }
      console.log(`[Fathom:${reqId}] ✓ Signature valid`);
    } else {
      console.log(`[Fathom:${reqId}] ℹ No sig headers or secret — skipping verification (dev/test mode)`);
    }

    // Parse JSON payload
    let rawPayload: FathomWebhookPayload;
    try {
      rawPayload = JSON.parse(rawBody);
    } catch {
      console.error(`[Fathom:${reqId}] ✗ Invalid JSON`);
      return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
    }

    // Log full raw payload structure (truncated for readability)
    const payloadPreview = JSON.stringify(rawPayload).slice(0, 500);
    console.log(`[Fathom:${reqId}] Raw payload preview: ${payloadPreview}`);
    console.log(`[Fathom:${reqId}] Event type: "${rawPayload.event || '(none)'}"`);

    // Normalize Fathom payload into standard Meeting Note structure
    const meetingData = normalizeFathomPayload(rawPayload);
    console.log(`[Fathom:${reqId}] Normalized — agenda: "${meetingData.agenda}", refLink: "${meetingData.refLink}", date: ${meetingData.date.toISOString()}`);
    console.log(`[Fathom:${reqId}] Notes length: ${meetingData.notes.length} chars`);

    // Check for existing meeting note to prevent duplicate creation
    let existingMeeting = null;
    if (meetingData.refLink) {
      existingMeeting = await prisma.meetingNote.findFirst({
        where: { refLink: meetingData.refLink },
      });
      if (existingMeeting) console.log(`[Fathom:${reqId}] Found existing meeting by refLink: ${existingMeeting.id}`);
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
          date: { gte: startOfDay, lte: endOfDay },
        },
      });
      if (existingMeeting) console.log(`[Fathom:${reqId}] Found existing meeting by agenda+date: ${existingMeeting.id}`);
    }

    let meeting;
    if (existingMeeting) {
      console.log(`[Fathom:${reqId}] Updating existing meeting: ${existingMeeting.id}`);
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
      console.log(`[Fathom:${reqId}] ✓ Meeting UPDATED: ${meeting.id}`);
    } else {
      console.log(`[Fathom:${reqId}] Creating new meeting note...`);
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
      console.log(`[Fathom:${reqId}] ✓ Meeting CREATED: ${meeting.id} — "${meeting.agenda}"`);

      await prisma.activityLog.create({
        data: {
          action: 'Created',
          user: 'Fathom AI Notetaker',
          role: 'System Bot',
          details: `Automatically logged meeting note from Fathom: "${meetingData.agenda}"`,
        },
      });

      await prisma.notification.create({
        data: {
          message: `🎙️ New Fathom AI meeting note logged: "${meetingData.agenda}"`,
          type: 'New transaction',
          status: 'Unread',
        },
      });
    }

    console.log(`[Fathom:${reqId}] ✅ Done — returning success`);
    return NextResponse.json({
      success: true,
      message: existingMeeting ? 'Meeting note updated' : 'Meeting note created',
      meetingId: meeting.id,
      agenda: meeting.agenda,
      debug: { reqId },
    });
  } catch (error) {
    const err = error as Error;
    console.error(`[Fathom:${reqId}] ✗ UNHANDLED ERROR:`, err.message);
    console.error(`[Fathom:${reqId}] Stack:`, err.stack);
    return NextResponse.json({ error: err.message || 'Internal server error', debug: { reqId } }, { status: 500 });
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
