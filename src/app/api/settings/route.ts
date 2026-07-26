import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { guardSettings } from '@/lib/permissions';

export const dynamic = 'force-dynamic';

let settingsCache: { data: any; timestamp: number } | null = null;
const CACHE_TTL_MS = 60000; // 1 minute in-memory cache

export async function GET() {
  try {
    const now = Date.now();
    if (settingsCache && now - settingsCache.timestamp < CACHE_TTL_MS) {
      return NextResponse.json(settingsCache.data, {
        headers: { 'Cache-Control': 'public, max-age=60, s-maxage=60' }
      });
    }

    let setting: any = await prisma.setting.findUnique({
      where: { id: 'global_config' },
    });

    if (!setting) {
      setting = await prisma.setting.create({
        data: {
          id: 'global_config',
          communityName: 'CyberX',
          bankName: 'HDFC Bank',
          bankAccount: '50200012345678',
          bankIfsc: 'HDFC0000123',
          upiId: 'cyberx@hdfcbank',
          defaultCurrency: 'INR',
          financialYear: '2026-2027',
          categories: 'Campus Session,Workshop,Sponsorship,Merchandise,Travel,Food,Equipment,Software,Marketing,Reimbursement,Miscellaneous',
          paymentMethods: 'Cash,UPI,Bank,Card,Cheque'
        },
      });
    }

    const defaultLogoUrl = process.env.NEXT_PUBLIC_APP_LOGO_URL || '/cyberx-logo.webp';
    const defaultIconUrl = process.env.NEXT_PUBLIC_APP_ICON_URL || '/icon-192.png';
    const defaultFaviconUrl = process.env.NEXT_PUBLIC_FAVICON_URL || '/favicon.ico';

    const settingObj = setting.toObject ? setting.toObject() : { ...setting };

    const responsePayload = {
      ...settingObj,
      dbLogoUrl: settingObj.logoUrl || null,
      dbIconUrl: settingObj.iconUrl || null,
      dbFaviconUrl: settingObj.faviconUrl || null,
      logoUrl: (settingObj.logoUrl && settingObj.logoUrl.trim() !== '') ? settingObj.logoUrl : defaultLogoUrl,
      iconUrl: (settingObj.iconUrl && settingObj.iconUrl.trim() !== '') ? settingObj.iconUrl : defaultIconUrl,
      faviconUrl: (settingObj.faviconUrl && settingObj.faviconUrl.trim() !== '') ? settingObj.faviconUrl : defaultFaviconUrl,
      envLogoUrl: defaultLogoUrl,
      envIconUrl: defaultIconUrl,
      envFaviconUrl: defaultFaviconUrl,
    };

    settingsCache = { data: responsePayload, timestamp: Date.now() };

    return NextResponse.json(responsePayload, {
      headers: { 'Cache-Control': 'public, max-age=60, s-maxage=60' }
    });
  } catch (error) {
    const err = error as Error;
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const denied = await guardSettings();
  if (denied) return denied;

  try {
    const data = await request.json();
    const {
      communityName,
      bankName,
      bankAccount,
      bankIfsc,
      upiId,
      defaultCurrency,
      financialYear,
      categories,
      paymentMethods,
      enableEventPass,
      logoUrl,
      iconUrl,
      faviconUrl,
      user,
      role,
    } = data;

    const updateFields: any = {
      communityName,
      bankName,
      bankAccount,
      bankIfsc,
      upiId,
      defaultCurrency,
      financialYear,
      categories,
      paymentMethods,
      ...(enableEventPass !== undefined && { enableEventPass: Boolean(enableEventPass) }),
    };

    if (logoUrl !== undefined) updateFields.logoUrl = logoUrl ? logoUrl.trim() : null;
    if (iconUrl !== undefined) updateFields.iconUrl = iconUrl ? iconUrl.trim() : null;
    if (faviconUrl !== undefined) updateFields.faviconUrl = faviconUrl ? faviconUrl.trim() : null;

    const updated: any = await prisma.setting.upsert({
      where: { id: 'global_config' },
      update: updateFields,
      create: {
        id: 'global_config',
        communityName,
        bankName,
        bankAccount,
        bankIfsc,
        upiId,
        defaultCurrency,
        financialYear,
        categories,
        paymentMethods,
        enableEventPass: enableEventPass !== undefined ? Boolean(enableEventPass) : true,
        logoUrl: logoUrl ? logoUrl.trim() : null,
        iconUrl: iconUrl ? iconUrl.trim() : null,
        faviconUrl: faviconUrl ? faviconUrl.trim() : null,
      },
    });

    await prisma.activityLog.create({
      data: {
        action: 'Updated',
        user: user || 'System',
        role: role || 'Member',
        details: 'Updated global system and community settings (including branding).',
      },
    });

    const defaultLogoUrl = process.env.NEXT_PUBLIC_APP_LOGO_URL || '/cyberx-logo.webp';
    const defaultIconUrl = process.env.NEXT_PUBLIC_APP_ICON_URL || '/icon-192.png';
    const defaultFaviconUrl = process.env.NEXT_PUBLIC_FAVICON_URL || '/favicon.ico';

    const updatedObj = updated.toObject ? updated.toObject() : { ...updated };

    const updatedPayload = {
      ...updatedObj,
      dbLogoUrl: updatedObj.logoUrl || null,
      dbIconUrl: updatedObj.iconUrl || null,
      dbFaviconUrl: updatedObj.faviconUrl || null,
      logoUrl: (updatedObj.logoUrl && updatedObj.logoUrl.trim() !== '') ? updatedObj.logoUrl : defaultLogoUrl,
      iconUrl: (updatedObj.iconUrl && updatedObj.iconUrl.trim() !== '') ? updatedObj.iconUrl : defaultIconUrl,
      faviconUrl: (updatedObj.faviconUrl && updatedObj.faviconUrl.trim() !== '') ? updatedObj.faviconUrl : defaultFaviconUrl,
      envLogoUrl: defaultLogoUrl,
      envIconUrl: defaultIconUrl,
      envFaviconUrl: defaultFaviconUrl,
    };

    settingsCache = { data: updatedPayload, timestamp: Date.now() };

    return NextResponse.json(updatedPayload);
  } catch (error) {
    const err = error as Error;
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
