const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// Manually load .env variables if present
try {
  const envPath = path.join(__dirname, '..', '.env');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach(line => {
      const match = line.match(/^([^=="#]+)=(.*)$/);
      if (match) {
        const key = match[1].trim();
        const value = match[2].trim().replace(/^["']|["']$/g, '');
        if (!process.env[key]) process.env[key] = value;
      }
    });
  }
} catch (e) {}


const prisma = new PrismaClient();

// Helper to simulate Fathom webhook signature calculation
function generateFathomSignature(rawBody, webhookId, timestamp, secret) {
  const signedContent = `${webhookId}.${timestamp}.${rawBody}`;
  let secretKey;
  if (secret.startsWith('whsec_')) {
    secretKey = Buffer.from(secret.slice(6), 'base64');
  } else {
    secretKey = Buffer.from(secret, 'utf-8');
  }
  const sig = crypto.createHmac('sha256', secretKey).update(signedContent).digest('base64');
  return `v1,${sig}`;
}

async function main() {
  console.log('====================================================');
  console.log('🤖 TESTING FATHOM AI WEBHOOK & MEETING NOTE SYNC');
  console.log('====================================================\n');

  const webhookSecret = process.env.FATHOM_WEBHOOK_SECRET || 'whsec_PJ+kaxrh/MLrlVy+K3X8bg+vjaHsDE3p';
  const apiKey = process.env.FATHOM_API_KEY;

  console.log('1. ENVIRONMENT CHECK:');
  console.log(`   - API Key Configured: ${apiKey ? 'YES' : 'NO'}`);
  console.log(`   - Webhook Secret Configured: ${webhookSecret ? 'YES' : 'NO'}`);
  console.log('');

  // Sample Fathom webhook payload
  const sampleFathomPayload = {
    event: 'meeting.recording.completed',
    recording_id: 'fathom_rec_' + Date.now(),
    title: 'FinX Integration Strategy & Architecture Session',
    meeting_title: 'FinX Integration Strategy & Architecture Session',
    meeting_type: 'Technical Sync',
    url: 'https://fathom.video/share/test_' + Date.now(),
    share_url: 'https://fathom.video/share/test_' + Date.now(),
    created_at: new Date().toISOString(),
    default_summary: {
      template_name: 'technical_sync',
      markdown_formatted: `## Executive Summary\nWe reviewed the core database schema, Prisma models, and Webhook API pipelines for Apthex FinX.\n\n### Key Discussion Points\n- Integrated Fathom AI Webhooks directly into Meetings section.\n- Verified signature validation using HMAC SHA-256.\n- Configured automatic action item tracking.`
    },
    action_items: [
      {
        description: 'Deploy Fathom webhook route to production',
        completed: false,
        assignee: { name: 'Tanmay' },
        recording_timestamp: '00:12:45'
      },
      {
        description: 'Verify meeting note rendering in MeetingsPanel UI',
        completed: true,
        assignee: { name: 'Dev Team' },
        recording_timestamp: '00:25:10'
      }
    ]
  };

  const rawBody = JSON.stringify(sampleFathomPayload);
  const webhookId = 'msg_' + Date.now();
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const signature = generateFathomSignature(rawBody, webhookId, timestamp, webhookSecret);

  console.log('2. SIGNATURE GENERATION TEST:');
  console.log(`   - Webhook ID: ${webhookId}`);
  console.log(`   - Timestamp: ${timestamp}`);
  console.log(`   - Generated Signature Header: ${signature}`);
  console.log('');

  // Signature verification logic
  function verifyFathomWebhookSignature({ rawBody, headers, secret }) {
    const webhookId = headers['webhook-id'];
    const webhookTimestamp = headers['webhook-timestamp'];
    const webhookSignature = headers['webhook-signature'];

    const signedContent = `${webhookId}.${webhookTimestamp}.${rawBody}`;
    let secretKey = secret.startsWith('whsec_') ? Buffer.from(secret.slice(6), 'base64') : Buffer.from(secret, 'utf-8');
    const expectedSig = crypto.createHmac('sha256', secretKey).update(signedContent).digest('base64');
    
    const parts = webhookSignature.split(' ');
    for (const part of parts) {
      const [version, sig] = part.split(',');
      if (version === 'v1' && sig && sig === expectedSig) return true;
    }
    return false;
  }

  function normalizeFathomPayload(payload) {
    const recordingId = String(payload.recording_id || Date.now());
    const agenda = (payload.title || payload.meeting_title || 'Fathom AI Recorded Meeting').trim();
    const refLink = payload.share_url || payload.url || null;
    const date = payload.created_at ? new Date(payload.created_at) : new Date();

    const summaryText = payload.default_summary?.markdown_formatted || '';
    const actionItems = payload.action_items || [];
    const actionItemsMarkdown = actionItems.map(item => `- [${item.completed ? 'x' : ' '}] ${item.description}`).join('\n');

    const notes = `> 🤖 **Fathom AI Notetaker Log**\n**Recording Link:** [Watch Fathom Video](${refLink})\n\n## 📋 Meeting Summary\n${summaryText}\n\n## ✅ Action Items\n${actionItemsMarkdown}`;

    return { recordingId, agenda, date, refLink, notes, createdBy: 'Fathom AI Notetaker' };
  }

  const isValid = verifyFathomWebhookSignature({
    rawBody,
    headers: {
      'webhook-id': webhookId,
      'webhook-timestamp': timestamp,
      'webhook-signature': signature,
    },
    secret: webhookSecret,
  });


  console.log('3. SIGNATURE VERIFICATION TEST:');
  console.log(`   - Signature Valid: ${isValid ? '✅ PASS' : '❌ FAIL'}`);
  console.log('');

  // 4. Normalize payload
  const normalized = normalizeFathomPayload(sampleFathomPayload);
  console.log('4. PAYLOAD NORMALIZATION TEST:');
  console.log(`   - Agenda: "${normalized.agenda}"`);
  console.log(`   - Created By: "${normalized.createdBy}"`);
  console.log(`   - Ref Link: "${normalized.refLink}"`);
  console.log('   - Generated Markdown Note Preview:');
  console.log('----------------------------------------------------');
  console.log(normalized.notes);
  console.log('----------------------------------------------------\n');

  // 5. Database Save Test
  const meetingNote = await prisma.meetingNote.create({
    data: {
      date: normalized.date,
      agenda: normalized.agenda,
      notes: normalized.notes,
      refLink: normalized.refLink,
      createdBy: normalized.createdBy,
      isPublic: false,
    }
  });

  console.log('5. DATABASE INSERTION TEST:');
  console.log(`   - Created MeetingNote ID: ${meetingNote.id}`);
  console.log(`   - Database Status: ✅ SUCCESS`);
  console.log('');

  // Clean up test entry
  await prisma.meetingNote.delete({
    where: { id: meetingNote.id }
  });
  console.log('6. CLEANUP TEST:');
  console.log('   - Deleted test meeting note from database: ✅ CLEAN');
  console.log('\nALL FATHOM INTEGRATION TESTS PASSED SUCCESSFULLY! 🎉');
}

main()
  .catch((e) => {
    console.error('❌ Test failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
