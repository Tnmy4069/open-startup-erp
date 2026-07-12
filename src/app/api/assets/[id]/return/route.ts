import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/session';

export async function POST(
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
    const { condition, notes } = data;

    const asset = await prisma.asset.findUnique({ where: { id }, include: { holder: true } });
    if (!asset) {
      return NextResponse.json({ error: 'Asset not found.' }, { status: 404 });
    }

    if (asset.status !== 'Issued') {
      return NextResponse.json({ error: 'Asset is not currently checked out.' }, { status: 400 });
    }

    const previousHolderName = asset.holder ? asset.holder.name : 'Unknown';
    const previousHolderId = asset.holderId;

    const updated = await prisma.asset.update({
      where: { id },
      data: {
        status: 'Available',
        holderId: null,
        condition: condition || asset.condition,
      },
    });

    await prisma.assetHistory.create({
      data: {
        assetId: id,
        action: 'Returned',
        holder: previousHolderName,
        notes: notes || `Returned by ${previousHolderName}. Condition: ${condition || asset.condition}`,
      },
    });

    if (previousHolderId) {
      await prisma.memberActivity.create({
        data: {
          memberId: previousHolderId,
          action: `Returned asset: ${asset.name} (${asset.assetId})`,
        },
      });
    }

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('POST /api/assets/[id]/return error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
