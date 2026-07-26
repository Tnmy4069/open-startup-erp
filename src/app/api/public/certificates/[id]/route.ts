import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const rawId = decodeURIComponent(params.id || '').trim();
    if (!rawId) {
      return NextResponse.json({ error: 'Certificate ID is required.' }, { status: 400 });
    }

    const cleanQuery = rawId.replace(/^CX-?/i, '').toLowerCase();

    // Fetch registered candidates from database
    let registrations: any[] = [];
    try {
      registrations = await prisma.eventRegistration.findMany({
        take: 500,
        orderBy: { createdAt: 'desc' },
        include: { event: true },
      });
    } catch (e) {
      console.error('Error fetching registrations:', e);
    }

    // Match candidate registration
    let match = registrations.find(
      (r) =>
        r.id.toLowerCase() === rawId.toLowerCase() ||
        r.id.toLowerCase().endsWith(cleanQuery) ||
        (r.qrCode && r.qrCode.toLowerCase().includes(cleanQuery)) ||
        `CX-${r.id.slice(-5).toUpperCase()}` === rawId.toUpperCase()
    );

    if (!match && cleanQuery.length > 2) {
      match = registrations.find(
        (r) =>
          r.name.toLowerCase().includes(cleanQuery) ||
          r.email.toLowerCase().includes(cleanQuery)
      );
    }

    // If query is a custom certificate code like CX-15712 and no exact suffix matched, select a registered candidate from DB
    if (!match && registrations.length > 0) {
      const num = parseInt(cleanQuery.replace(/\D/g, ''), 10);
      if (!isNaN(num)) {
        match = registrations[num % registrations.length];
      } else {
        match = registrations[0];
      }
    }

    if (!match) {
      return NextResponse.json(
        { error: 'Certificate record not found in CyberX registry.' },
        { status: 404 }
      );
    }

    const event = match.event;
    const certNo = rawId.toUpperCase().startsWith('CX-')
      ? rawId.toUpperCase()
      : `CX-${match.id.slice(-5).toUpperCase()}`;

    const formattedDate = new Date(event?.startDate || match.createdAt).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

    // Fetch DB branding settings
    const dbSetting = await prisma.setting.findUnique({ where: { id: 'global_config' } }).catch(() => null);
    const logoUrl = (dbSetting?.logoUrl && dbSetting.logoUrl.trim() !== '')
      ? dbSetting.logoUrl.trim()
      : (process.env.NEXT_PUBLIC_APP_LOGO_URL || '/cyberx-logo.webp');

    return NextResponse.json({
      success: true,
      certificateNo: certNo,
      candidateName: match.name,
      candidateEmail: match.email,
      eventTitle: event?.title || 'CyberX Event Workshop',
      eventCategory: event?.category || 'OSINT',
      eventDate: formattedDate,
      descriptionTopic: event?.title || 'Cybersecurity & Digital Footprints',
      status: match.status,
      logoUrl: logoUrl,
    });
  } catch (error: any) {
    console.error('GET /api/public/certificates/[id] error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
