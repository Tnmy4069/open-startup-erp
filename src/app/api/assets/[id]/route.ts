import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/session';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  try {
    const id = (await params).id;
    const asset = await prisma.asset.findUnique({
      where: { id },
      include: {
        holder: true,
        history: {
          orderBy: { date: 'desc' },
        },
        maintenances: {
          orderBy: { startDate: 'desc' },
        },
      },
    });

    if (!asset) {
      return NextResponse.json({ error: 'Asset not found.' }, { status: 404 });
    }

    return NextResponse.json(asset);
  } catch (error: any) {
    console.error('GET /api/assets/[id] error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  try {
    const id = (await params).id;
    const data = await request.json();

    const original = await prisma.asset.findUnique({ where: { id } });
    if (!original) {
      return NextResponse.json({ error: 'Asset not found.' }, { status: 404 });
    }

    const {
      name,
      category,
      purchaseDate,
      purchaseCost,
      vendor,
      warranty,
      condition,
      status,
      location,
    } = data;

    const updated = await prisma.asset.update({
      where: { id },
      data: {
        name: name !== undefined ? name : original.name,
        category: category !== undefined ? category : original.category,
        purchaseDate: purchaseDate !== undefined ? new Date(purchaseDate) : original.purchaseDate,
        purchaseCost: purchaseCost !== undefined ? parseFloat(purchaseCost) : original.purchaseCost,
        vendor: vendor !== undefined ? vendor : original.vendor,
        warranty: warranty !== undefined ? warranty : original.warranty,
        condition: condition !== undefined ? condition : original.condition,
        status: status !== undefined ? status : original.status,
        location: location !== undefined ? location : original.location,
      },
    });

    // Logging if condition or status changes
    if (condition && condition !== original.condition) {
      await prisma.assetHistory.create({
        data: {
          assetId: id,
          action: 'Updated Condition',
          notes: `Condition changed from ${original.condition} to ${condition}`,
        },
      });
    }

    await prisma.activityLog.create({
      data: {
        action: 'Updated',
        user: session.username,
        role: session.role,
        details: `Updated asset details: ${updated.name} (${updated.assetId})`,
      },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('PUT /api/assets/[id] error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  // Restrict to Super Admin / Co-Founder
  if (session.role !== 'Super Admin' && session.role !== 'Co-Founder') {
    return NextResponse.json({ error: 'Forbidden: only Super Admin and Co-Founder can delete assets.' }, { status: 403 });
  }

  try {
    const id = (await params).id;
    const asset = await prisma.asset.findUnique({ where: { id } });
    if (!asset) {
      return NextResponse.json({ error: 'Asset not found.' }, { status: 404 });
    }

    await prisma.asset.delete({ where: { id } });

    await prisma.activityLog.create({
      data: {
        action: 'Deleted',
        user: session.username,
        role: session.role,
        details: `Deleted asset record: ${asset.name}`,
      },
    });

    return NextResponse.json({ success: true, message: 'Asset deleted successfully.' });
  } catch (error: any) {
    console.error('DELETE /api/assets/[id] error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
