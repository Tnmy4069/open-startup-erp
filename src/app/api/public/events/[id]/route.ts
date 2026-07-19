import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

function isValidObjectId(id: string) {
  return typeof id === 'string' && /^[0-9a-fA-F]{24}$/.test(id);
}

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
  try {
    const idOrSlug = (await params).id;
    let event = null;

    const includeOptions = {
      registrations: {
        select: {
          id: true,
          status: true,
          createdAt: true,
        },
      },
    };

    // If idOrSlug is a valid 24-character hex MongoDB ObjectId, try querying by id
    if (isValidObjectId(idOrSlug)) {
      try {
        event = await prisma.event.findUnique({
          where: { id: idOrSlug },
          include: includeOptions,
        });
      } catch (err) {
        event = null;
      }
    }

    // If not found by ID or not a valid ObjectId, search by slug
    if (!event) {
      event = await prisma.event.findUnique({
        where: { slug: idOrSlug },
        include: includeOptions,
      });
    }

    if (!event) {
      return NextResponse.json({ error: 'Event not found.' }, { status: 404 });
    }

    // Check setting for event pass feature
    const setting = await prisma.setting.findUnique({
      where: { id: 'global_config' },
    });

    const enableEventPass = setting?.enableEventPass ?? true;

    return NextResponse.json({
      ...parseEventWithMetadata(event),
      enableEventPass,
    });
  } catch (error: any) {
    console.error('GET /api/public/events/[id] error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
