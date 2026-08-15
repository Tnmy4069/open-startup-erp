import crypto from 'crypto';

export interface FathomActionItem {
  description?: string;
  text?: string;
  completed?: boolean;
  assignee?: { name?: string; email?: string } | string;
  recording_timestamp?: string;
}

export interface FathomTranscriptItem {
  speaker?: { display_name?: string; name?: string } | string;
  text?: string;
  timestamp?: string;
}

export interface FathomWebhookPayload {
  event?: string;
  recording_id?: string | number;
  id?: string | number;
  title?: string;
  meeting_title?: string;
  meeting_type?: string;
  url?: string;
  meeting_url?: string;
  share_url?: string;
  created_at?: string;
  scheduled_start_time?: string;
  recording_start_time?: string;
  default_summary?: {
    template_name?: string;
    markdown_formatted?: string;
  };
  summary?: string | { markdown_formatted?: string };
  action_items?: FathomActionItem[];
  transcript?: FathomTranscriptItem[];
  meeting?: FathomWebhookPayload;
  data?: FathomWebhookPayload;
}

export interface NormalizedFathomMeeting {
  recordingId: string;
  agenda: string;
  date: Date;
  refLink: string | null;
  notes: string;
  createdBy: string;
}

/**
 * Verify Fathom Webhook HMAC Signature (Svix-compatible header format).
 * Header components:
 * - webhook-id: unique identifier
 * - webhook-timestamp: unix timestamp (seconds)
 * - webhook-signature: space separated signatures (e.g. "v1,g0hM9SsE...")
 */
export function verifyFathomWebhookSignature({
  rawBody,
  headers,
  secret,
}: {
  rawBody: string;
  headers: Record<string, string | undefined | null>;
  secret: string;
}): boolean {
  if (!secret) return true; // If secret not set in environment, allow for dev testing

  const webhookId = headers['webhook-id'] || headers['x-webhook-id'];
  const webhookTimestamp = headers['webhook-timestamp'] || headers['x-webhook-timestamp'];
  const webhookSignature = headers['webhook-signature'] || headers['x-webhook-signature'];

  if (!webhookId || !webhookTimestamp || !webhookSignature) {
    console.warn('[Fathom Webhook] Missing signature headers');
    return false;
  }

  // Check timestamp freshness (within 5 minutes = 300 seconds)
  const nowInSec = Math.floor(Date.now() / 1000);
  const tsNum = parseInt(webhookTimestamp, 10);
  if (isNaN(tsNum) || Math.abs(nowInSec - tsNum) > 300) {
    console.warn('[Fathom Webhook] Timestamp outside 5-minute window');
    return false;
  }

  // Construct signed payload string
  const signedContent = `${webhookId}.${webhookTimestamp}.${rawBody}`;

  // Decode secret (Svix secrets usually start with "whsec_")
  let secretKey: Buffer;
  if (secret.startsWith('whsec_')) {
    secretKey = Buffer.from(secret.slice(6), 'base64');
  } else {
    secretKey = Buffer.from(secret, 'utf-8');
  }

  // Compute expected HMAC SHA-256 signature
  const expectedSig = crypto
    .createHmac('sha256', secretKey)
    .update(signedContent)
    .digest('base64');

  // Signature header may contain multiple signatures separated by space, e.g.: "v1,sig1 v1,sig2"
  const passedSignatures = webhookSignature.split(' ');
  for (const part of passedSignatures) {
    const [version, sig] = part.split(',');
    if (version === 'v1' && sig) {
      if (crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expectedSig))) {
        return true;
      }
    }
  }

  console.warn('[Fathom Webhook] Signature verification failed');
  return false;
}

/**
 * Normalizes nested or flat Fathom webhook JSON payload into a structured meeting note.
 */
export function normalizeFathomPayload(rawPayload: FathomWebhookPayload): NormalizedFathomMeeting {
  // Unwrap nested formats if wrapped in `data` or `meeting`
  const payload: FathomWebhookPayload = rawPayload.meeting || rawPayload.data || rawPayload;

  const recordingId = String(payload.recording_id || payload.id || Date.now());
  const agenda = (payload.title || payload.meeting_title || payload.meeting_type || 'Fathom AI Recorded Meeting').trim();
  const refLink = payload.share_url || payload.url || payload.meeting_url || null;

  const dateStr = payload.created_at || payload.recording_start_time || payload.scheduled_start_time;
  const date = dateStr ? new Date(dateStr) : new Date();

  // Extract Summary
  let summaryText = '';
  if (payload.default_summary?.markdown_formatted) {
    summaryText = payload.default_summary.markdown_formatted.trim();
  } else if (typeof payload.summary === 'string') {
    summaryText = payload.summary.trim();
  } else if (payload.summary?.markdown_formatted) {
    summaryText = payload.summary.markdown_formatted.trim();
  }

  // Extract Action Items
  const actionItems = payload.action_items || [];
  let actionItemsMarkdown = '';
  if (actionItems.length > 0) {
    actionItemsMarkdown = actionItems
      .map((item) => {
        const desc = item.description || item.text || 'Action item';
        let assigneeStr = '';
        if (item.assignee) {
          const name = typeof item.assignee === 'string' ? item.assignee : item.assignee.name || item.assignee.email;
          if (name) assigneeStr = ` (@${name})`;
        }
        const timeStr = item.recording_timestamp ? ` _[${item.recording_timestamp}]_` : '';
        const checked = item.completed ? '[x]' : '[ ]';
        return `- ${checked} ${desc}${assigneeStr}${timeStr}`;
      })
      .join('\n');
  }

  // Build full Markdown document
  const mdParts: string[] = [];

  mdParts.push(`> 🤖 **Fathom AI Notetaker Log**`);
  if (payload.meeting_type) {
    mdParts.push(`**Type:** ${payload.meeting_type}`);
  }
  if (refLink) {
    mdParts.push(`**Recording Link:** [Watch Fathom Video](${refLink})`);
  }
  mdParts.push('');

  if (summaryText) {
    mdParts.push(`## 📋 Meeting Summary`);
    mdParts.push(summaryText);
    mdParts.push('');
  }

  if (actionItemsMarkdown) {
    mdParts.push(`## ✅ Action Items`);
    mdParts.push(actionItemsMarkdown);
    mdParts.push('');
  }

  if (!summaryText && !actionItemsMarkdown) {
    mdParts.push(`*Meeting recorded via Fathom AI.*`);
    if (refLink) {
      mdParts.push(`Visit [Fathom Recording](${refLink}) for full details and transcript.`);
    }
  }

  const notes = mdParts.join('\n');

  return {
    recordingId,
    agenda,
    date: isNaN(date.getTime()) ? new Date() : date,
    refLink,
    notes,
    createdBy: 'Fathom AI Notetaker',
  };
}
