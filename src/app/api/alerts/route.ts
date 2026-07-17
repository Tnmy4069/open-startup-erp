import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import webpush from 'web-push';

// Initialize web-push details
if (process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    'mailto:admin@cyberx.org.in',
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
}

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const notifications = await prisma.notification.findMany({
      orderBy: { timestamp: 'desc' },
      take: 20,
    });
    const reminders = await prisma.reminder.findMany({
      orderBy: { dueDate: 'asc' },
      where: { status: 'Active' },
    });
    return NextResponse.json({ notifications, reminders });
  } catch (error) {
    const err = error as Error;
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const bodyData = await request.json();
    const { action } = bodyData;

    const userRole = request.headers.get('x-user-role') || '';
    const userId = request.headers.get('x-user-id') || '';
    const username = request.headers.get('x-username') || 'System';
    // Safely normalize userId - must be a 24-char hex ObjectId or null
    const safeUserId = userId && /^[a-f\d]{24}$/i.test(userId) ? userId : null;

    if (action === 'subscribe') {
      // ── Handle Push Subscription Registration ──────────────────────────────────────
      const { subscription } = bodyData;
      if (!subscription || !subscription.endpoint || !subscription.keys) {
        return NextResponse.json({ error: 'Invalid subscription payload.' }, { status: 400 });
      }

      const { endpoint, keys } = subscription;
      const { p256dh, auth } = keys;

      if (!p256dh || !auth) {
        return NextResponse.json({ error: 'Keys p256dh and auth are required.' }, { status: 400 });
      }

      console.log('[push-subscribe] Saving subscription for endpoint:', endpoint.slice(0, 60));
      const upserted = await prisma.pushSubscription.upsert({
        where: { endpoint },
        update: {
          p256dh,
          auth,
          userId: safeUserId,
        },
        create: {
          endpoint,
          p256dh,
          auth,
          userId: safeUserId,
        },
      });
      console.log('[push-subscribe] Saved. ID:', upserted.id);

      return NextResponse.json({ success: true, id: upserted.id });
    }

    if (action === 'broadcast') {
      const { title, body, url } = bodyData;
      if (!title || !body) {
        return NextResponse.json({ error: 'Title and body are required.' }, { status: 400 });
      }

      const subscriptions = await prisma.pushSubscription.findMany();
      if (subscriptions.length === 0) {
        return NextResponse.json({ success: true, sentCount: 0, message: 'No push subscriptions found.' });
      }

      const payload = JSON.stringify({
        title,
        body,
        icon: '/icon-192.png',
        badge: '/icon-192.png',
        data: {
          url: url || '/dashboard',
        },
      });

      const results = await Promise.allSettled(
        subscriptions.map(async (sub) => {
          try {
            await webpush.sendNotification(
              {
                endpoint: sub.endpoint,
                keys: {
                  p256dh: sub.p256dh,
                  auth: sub.auth,
                },
              },
              payload,
              {
                headers: {
                  'Urgency': 'high',
                },
                TTL: 86400, // 24 hours
              }
            );
            return { success: true, endpoint: sub.endpoint };
          } catch (error: any) {
            // Delete expired/invalid subscriptions
            if (error.statusCode === 410 || error.statusCode === 404) {
              await prisma.pushSubscription.delete({ where: { id: sub.id } }).catch(() => {});
            }
            throw error;
          }
        })
      );

      const successCount = results.filter((r) => r.status === 'fulfilled').length;
      const failCount = results.filter((r) => r.status === 'rejected').length;

      // Log the activity
      await prisma.activityLog.create({
        data: {
          action: 'Broadcast Alert',
          user: username,
          role: userRole,
          details: `Sent push broadcast "${title}" to ${successCount} active subscriptions.`,
        },
      });

      // Also create a dashboard notification so they see it there
      await prisma.notification.create({
        data: {
          message: `Broadcast Alert: ${title} - ${body}`,
          type: 'Alert',
          status: 'Unread',
        },
      });

      return NextResponse.json({
        success: true,
        sentCount: successCount,
        failedCount: failCount,
      });
    }

    // ── Existing Notification creation fallback ─────────────────────────────────────
    const { message, type } = bodyData;
    const newNotification = await prisma.notification.create({
      data: {
        message,
        type: type || 'Alert',
        status: 'Unread',
      },
    });

    // Also send as a push notification to all subscribed devices
    const subscriptions = await prisma.pushSubscription.findMany();
    if (subscriptions.length > 0) {
      const payload = JSON.stringify({
        title: `System: ${type || 'Alert'}`,
        body: message,
        icon: '/icon-192.png',
        badge: '/icon-192.png',
        data: { url: '/dashboard' },
      });

      await Promise.allSettled(
        subscriptions.map(async (sub) => {
          try {
            await webpush.sendNotification(
              {
                endpoint: sub.endpoint,
                keys: { p256dh: sub.p256dh, auth: sub.auth },
              },
              payload,
              { headers: { 'Urgency': 'normal' }, TTL: 86400 }
            );
          } catch (error: any) {
            if (error.statusCode === 410 || error.statusCode === 404) {
              await prisma.pushSubscription.delete({ where: { id: sub.id } }).catch(() => {});
            }
          }
        })
      );
    }

    return NextResponse.json(newNotification);
  } catch (error) {
    const err = error as Error;
    console.error('POST /api/alerts error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// DELETE /api/alerts — remove a push subscription by endpoint
export async function DELETE(request: Request) {
  try {
    const { endpoint } = await request.json();
    if (!endpoint) {
      return NextResponse.json({ error: 'endpoint is required.' }, { status: 400 });
    }
    await prisma.pushSubscription.deleteMany({ where: { endpoint } });
    return NextResponse.json({ success: true });
  } catch (error) {
    const err = error as Error;
    console.error('DELETE /api/alerts error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
