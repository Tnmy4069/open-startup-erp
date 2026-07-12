import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/session';

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const category = searchParams.get('category') || '';
    const condition = searchParams.get('condition') || '';
    const status = searchParams.get('status') || '';

    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { assetId: { contains: search, mode: 'insensitive' } },
        { vendor: { contains: search, mode: 'insensitive' } },
        { location: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (category) where.category = category;
    if (condition) where.condition = condition;
    if (status) where.status = status;

    const assets = await prisma.asset.findMany({
      where,
      include: {
        holder: true,
      },
      orderBy: { assetId: 'asc' },
    });

    return NextResponse.json(assets);
  } catch (error: any) {
    console.error('GET /api/assets error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  try {
    const data = await request.json();
    const {
      assetId,
      name,
      category,
      purchaseDate,
      purchaseCost,
      vendor,
      warranty,
      condition,
      location,
    } = data;

    if (!assetId || !name) {
      return NextResponse.json({ error: 'Asset ID and Name are required.' }, { status: 400 });
    }

    const qrCode = `CYBERX-AST-${assetId}`;

    const asset = await prisma.asset.create({
      data: {
        assetId,
        name,
        category: category || 'General',
        purchaseDate: purchaseDate ? new Date(purchaseDate) : new Date(),
        purchaseCost: parseFloat(purchaseCost || '0'),
        vendor: vendor || 'Unknown',
        warranty,
        condition: condition || 'Excellent',
        status: 'Available',
        location: location || 'Headquarters',
        qrCode,
      },
    });

    await prisma.activityLog.create({
      data: {
        action: 'Created',
        user: session.username,
        role: session.role,
        details: `Registered system asset: ${name} (${assetId})`,
      },
    });

    // Add first history record
    await prisma.assetHistory.create({
      data: {
        assetId: asset.id,
        action: 'Registered',
        notes: `Asset initialized in database with condition ${asset.condition}`,
      },
    });

    return NextResponse.json(asset, { status: 201 });
  } catch (error: any) {
    console.error('POST /api/assets error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
