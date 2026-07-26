import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/session';
import { guardSettings } from '@/lib/permissions';

export const dynamic = 'force-dynamic';

export const DEFAULT_MODULE_PERMISSIONS: Record<string, string[]> = {
  'Super Admin': ['dashboard', 'meetings', 'tasks', 'events', 'members', 'assets', 'documents', 'messages', 'ledger', 'people', 'organizations', 'reports', 'users', 'logs', 'settings'],
  'Co-Founder': ['dashboard', 'meetings', 'tasks', 'events', 'members', 'assets', 'documents', 'messages', 'ledger', 'people', 'organizations', 'reports', 'logs', 'settings'],
  'Founder': ['dashboard', 'meetings', 'tasks', 'events', 'members', 'assets', 'documents', 'messages', 'ledger', 'people', 'organizations', 'reports', 'logs'],
  'Committee Member': ['dashboard', 'meetings', 'tasks', 'events', 'members', 'assets', 'documents', 'messages', 'ledger'],
  'Read Only': ['dashboard', 'meetings', 'tasks', 'events', 'members', 'documents', 'messages'],
};

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const setting = await prisma.setting.findUnique({
      where: { id: 'global_config' },
    });

    let permissions = DEFAULT_MODULE_PERMISSIONS;
    if (setting?.modulePermissions) {
      try {
        permissions = { ...DEFAULT_MODULE_PERMISSIONS, ...JSON.parse(setting.modulePermissions) };
      } catch {
        // Fallback to default
      }
    }

    return NextResponse.json({ permissions, defaultPermissions: DEFAULT_MODULE_PERMISSIONS });
  } catch (error) {
    const err = error as Error;
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== 'Super Admin') {
    return NextResponse.json({ error: 'Access denied: Super Admin only.' }, { status: 403 });
  }

  try {
    const { permissions } = await request.json();

    if (!permissions || typeof permissions !== 'object') {
      return NextResponse.json({ error: 'Invalid permissions payload.' }, { status: 400 });
    }

    const updated = await prisma.setting.upsert({
      where: { id: 'global_config' },
      update: {
        modulePermissions: JSON.stringify(permissions),
      },
      create: {
        id: 'global_config',
        modulePermissions: JSON.stringify(permissions),
      },
    });

    await prisma.activityLog.create({
      data: {
        action: 'Updated',
        user: session.username,
        role: session.role,
        details: 'Updated role sidebar module permissions matrix.',
      },
    });

    return NextResponse.json({
      success: true,
      permissions,
    });
  } catch (error) {
    const err = error as Error;
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
