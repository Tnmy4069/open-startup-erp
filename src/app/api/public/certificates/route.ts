import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email')?.trim().toLowerCase();
    const query = searchParams.get('q')?.trim().toLowerCase() || email;

    if (!query) {
      return NextResponse.json({ error: 'Email or query parameter is required.' }, { status: 400 });
    }

    const isObjectId = /^[0-9a-fA-F]{24}$/.test(query);

    // Build safe OR conditions without triggering Malformed ObjectID error
    const orConditions: any[] = [
      { email: { contains: query, mode: 'insensitive' } },
      { name: { contains: query, mode: 'insensitive' } },
      { qrCode: { contains: query, mode: 'insensitive' } },
    ];

    if (isObjectId) {
      orConditions.push({ id: query });
    }

    // Fetch matching registrations strictly from Database
    const registrations = await prisma.eventRegistration.findMany({
      where: {
        OR: orConditions,
      },
      orderBy: { createdAt: 'desc' },
      include: {
        event: true,
      },
    });

    // Fetch DB branding settings
    const dbSetting = await prisma.setting.findUnique({ where: { id: 'global_config' } }).catch(() => null);
    const logoUrl = (dbSetting?.logoUrl && dbSetting.logoUrl.trim() !== '')
      ? dbSetting.logoUrl.trim()
      : (process.env.NEXT_PUBLIC_APP_LOGO_URL || '/cyberx-logo.webp');

    // Format list of real certificates
    const certificates = registrations.map((reg) => {
      const event = reg.event;
      const certNo = `CX-${reg.id.slice(-5).toUpperCase()}`;
      const formattedDate = new Date(event?.startDate || reg.createdAt).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });

      return {
        id: reg.id,
        certificateNo: certNo,
        candidateName: reg.name,
        candidateEmail: reg.email,
        eventTitle: event?.title || 'CyberX Event Workshop',
        eventCategory: event?.category || 'OSINT',
        eventDate: formattedDate,
        descriptionTopic: event?.title || 'Cybersecurity & Digital Footprints',
        status: reg.status,
        logoUrl: logoUrl,
      };
    });

    return NextResponse.json({
      success: true,
      count: certificates.length,
      certificates: certificates,
    });
  } catch (error: any) {
    console.error('GET /api/public/certificates error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
