import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/session';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const setting = await prisma.setting.findUnique({
      where: { id: 'global_config' },
    });

    return NextResponse.json({
      enableEventPass: setting?.enableEventPass ?? true,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized. Login required to toggle Event Pass.' }, { status: 401 });
  }

  try {
    const { enableEventPass } = await request.json();

    const updated = await prisma.setting.upsert({
      where: { id: 'global_config' },
      update: {
        enableEventPass: Boolean(enableEventPass),
      },
      create: {
        id: 'global_config',
        communityName: 'CyberX',
        enableEventPass: Boolean(enableEventPass),
      },
    });

    await prisma.activityLog.create({
      data: {
        action: 'Updated',
        user: session.username,
        role: session.role,
        details: `Toggled Event Pass feature ${enableEventPass ? 'ON' : 'OFF'} from member settings.`,
      },
    });

    return NextResponse.json({
      success: true,
      enableEventPass: updated.enableEventPass,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
