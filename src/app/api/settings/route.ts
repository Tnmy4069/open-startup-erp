import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { guardSettings } from '@/lib/permissions';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    let setting = await prisma.setting.findUnique({
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

    return NextResponse.json(setting);
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
      user,
      role,
    } = data;

    const updated = await prisma.setting.upsert({
      where: { id: 'global_config' },
      update: {
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
      },
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
      },
    });

    await prisma.activityLog.create({
      data: {
        action: 'Updated',
        user: user || 'System',
        role: role || 'Member',
        details: 'Updated global system and community settings.',
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    const err = error as Error;
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
