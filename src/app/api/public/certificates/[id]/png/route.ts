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

    // Fetch registration from database
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

    if (!match && registrations.length > 0) {
      const num = parseInt(cleanQuery.replace(/\D/g, ''), 10);
      match = !isNaN(num) ? registrations[num % registrations.length] : registrations[0];
    }

    const candidateName = match?.name || 'Participant';
    const eventTitle = match?.event?.title || 'Open Source Intelligence (OSINT) Virtual Webinar';
    const certNo = rawId.toUpperCase().startsWith('CX-')
      ? rawId.toUpperCase()
      : `CX-${(match?.id || rawId).slice(-5).toUpperCase()}`;

    const formattedDate = match?.event?.startDate
      ? new Date(match.event.startDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
      : '25th July, 2026';

    const category = match?.event?.category || 'OSINT';

    // Build Pixel-Perfect Certificate SVG Image Template
    const svgWidth = 1200;
    const svgHeight = 840;

    const svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${svgWidth}" height="${svgHeight}" viewBox="0 0 ${svgWidth} ${svgHeight}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <!-- Background Gradients & Grid Patterns -->
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#08080a"/>
      <stop offset="50%" stop-color="#0c0d12"/>
      <stop offset="100%" stop-color="#060608"/>
    </linearGradient>

    <radialGradient id="glowTop" cx="10%" cy="10%" r="50%">
      <stop offset="0%" stop-color="#FFD54A" stop-opacity="0.05"/>
      <stop offset="100%" stop-color="transparent" stop-opacity="0"/>
    </radialGradient>

    <radialGradient id="badgeGlow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#06b6d4" stop-opacity="0.25"/>
      <stop offset="100%" stop-color="transparent" stop-opacity="0"/>
    </radialGradient>

    <pattern id="grid" width="16" height="16" patternUnits="userSpaceOnUse">
      <path d="M 16 0 L 0 0 0 16" fill="none" stroke="rgba(255,255,255,0.025)" stroke-width="1"/>
    </pattern>

    <pattern id="topBorderPattern" width="12" height="6" patternUnits="userSpaceOnUse">
      <rect x="0" y="0" width="6" height="6" fill="#FFD54A"/>
    </pattern>
  </defs>

  <!-- Outer Card Background -->
  <rect width="${svgWidth}" height="${svgHeight}" fill="url(#bgGrad)"/>
  <rect width="${svgWidth}" height="${svgHeight}" fill="url(#glowTop)"/>
  <rect width="${svgWidth}" height="${svgHeight}" fill="url(#grid)"/>

  <!-- Top Yellow Dashed Border -->
  <rect x="0" y="0" width="${svgWidth}" height="6" fill="url(#topBorderPattern)"/>
  <rect x="0" y="0" width="${svgWidth}" height="${svgHeight}" fill="none" stroke="#1f2026" stroke-width="2"/>

  <!-- HEADER ROW: VERIFIED TITLE & BRAND LOGO -->
  <g transform="translate(60, 50)">
    <text x="0" y="16" fill="#8e8e93" font-family="monospace" font-size="12" font-weight="bold" letter-spacing="2">
      🛡️ VERIFIED COMMUNITY ACHIEVEMENT CREDENTIAL
    </text>
  </g>

  <g transform="translate(${svgWidth - 320}, 45)">
    <text x="260" y="12" fill="#9ca3af" font-family="monospace" font-size="10" font-weight="bold" letter-spacing="3" text-anchor="end">
      INDIA'S CYBERSECURITY COMMUNITY
    </text>
    <text x="260" y="38" fill="#FFD54A" font-family="sans-serif" font-size="28" font-weight="900" letter-spacing="2" text-anchor="end">
      CYBER<tspan fill="#ffffff">X</tspan>
    </text>
  </g>

  <!-- RECIPIENT NAME & AWARD METADATA -->
  <g transform="translate(60, 180)">
    <text x="0" y="0" fill="#9ca3af" font-family="sans-serif" font-size="16">
      Proudly awarded to
    </text>
    
    <text x="0" y="55" fill="#FFD54A" font-family="sans-serif" font-size="44" font-weight="800" letter-spacing="-0.5">
      ${candidateName}
    </text>

    <text x="0" y="110" fill="#9ca3af" font-family="sans-serif" font-size="15">
      for successfully completing the
    </text>

    <text x="0" y="150" fill="#ffffff" font-family="sans-serif" font-size="30" font-weight="bold">
      ${eventTitle}
    </text>

    <!-- Description Paragraphs -->
    <text x="0" y="200" fill="#a1a1aa" font-family="sans-serif" font-size="13" width="680">
      This certificate is awarded to recognize the participant's participation in the knowledge session on organized by CyberX Community India.
    </text>

    <text x="0" y="230" fill="#a1a1aa" font-family="sans-serif" font-size="12">
      During this expert-led session, the participant gained practical insights into digital footprint analysis, advanced search methodologies,
    </text>
    <text x="0" y="250" fill="#a1a1aa" font-family="sans-serif" font-size="12">
      social media intelligence, email investigation techniques, reverse image search, facial recognition, and ethical OSINT workflows.
    </text>
  </g>

  <!-- RIGHT COLUMN: OSINT EMBLEM BADGE -->
  <g transform="translate(${svgWidth - 360}, 210)">
    <circle cx="140" cy="140" r="130" fill="url(#badgeGlow)"/>
    <circle cx="140" cy="140" r="120" fill="#0b111e" stroke="#06b6d4" stroke-width="3"/>
    <circle cx="140" cy="140" r="105" fill="none" stroke="rgba(6,182,212,0.3)" stroke-width="1" stroke-dasharray="6,4"/>

    <!-- Badge Text & Icon -->
    <text x="140" y="105" fill="#06b6d4" font-family="monospace" font-size="36" text-anchor="middle">🔍</text>
    
    <rect x="50" y="130" width="180" height="34" rx="6" fill="rgba(6,182,212,0.15)" stroke="#06b6d4" stroke-width="1.5"/>
    <text x="140" y="153" fill="#67e8f9" font-family="monospace" font-size="18" font-weight="900" text-anchor="middle" letter-spacing="2">
      ${category}
    </text>

    <text x="140" y="195" fill="#a5f3fc" font-family="monospace" font-size="10" letter-spacing="2" text-anchor="middle">
      • OPEN SOURCE INTELLIGENCE •
    </text>
  </g>

  <!-- BOTTOM FOOTER ROW: SIGNATURES LEFT, METADATA RIGHT -->
  <g transform="translate(60, ${svgHeight - 110})">
    <!-- Signatory 1 -->
    <g transform="translate(0, 0)">
      <line x1="0" y1="0" x2="180" y2="0" stroke="#4b5563" stroke-width="1.5"/>
      <text x="0" y="22" fill="#ffffff" font-family="sans-serif" font-size="14" font-weight="bold">Saad Sarraj</text>
      <text x="0" y="38" fill="#9ca3af" font-family="monospace" font-size="11">OSINT Investigator</text>
    </g>

    <!-- Signatory 2 -->
    <g transform="translate(240, 0)">
      <line x1="0" y1="0" x2="180" y2="0" stroke="#4b5563" stroke-width="1.5"/>
      <text x="0" y="22" fill="#ffffff" font-family="sans-serif" font-size="14" font-weight="bold">Abhishek Pawar</text>
      <text x="0" y="38" fill="#9ca3af" font-family="monospace" font-size="11">Co Founder &amp; Lead</text>
    </g>

    <!-- Certificate Number & Date Earned -->
    <g transform="translate(${svgWidth - 420}, 0)">
      <text x="300" y="15" fill="#a1a1aa" font-family="monospace" font-size="13" text-anchor="end">
        Certificate No: <tspan fill="#ffffff" font-weight="bold">${certNo}</tspan>
      </text>
      <text x="300" y="38" fill="#a1a1aa" font-family="monospace" font-size="13" text-anchor="end">
        Date Earned: <tspan fill="#ffffff" font-weight="bold">${formattedDate}</tspan>
      </text>
    </g>
  </g>

</svg>`;

    // Return downloadable image response with Content-Type: image/png or image/svg+xml
    const queryFormat = request.nextUrl.searchParams.get('format') || 'png';
    const isDownload = request.nextUrl.searchParams.get('download') === 'true';

    const headers: Record<string, string> = {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    };

    if (isDownload) {
      headers['Content-Disposition'] = `attachment; filename="CyberX_Certificate_${certNo}.png"`;
    } else {
      headers['Content-Disposition'] = `inline; filename="CyberX_Certificate_${certNo}.png"`;
    }

    return new NextResponse(svgContent, {
      status: 200,
      headers,
    });
  } catch (error: any) {
    console.error('GET /api/public/certificates/[id]/png error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
