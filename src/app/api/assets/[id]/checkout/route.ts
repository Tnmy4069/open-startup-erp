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
    const { holderId, notes } = data;

    if (!holderId) {
      return NextResponse.json({ error: 'Holder ID is required.' }, { status: 400 });
    }

    const asset = await prisma.asset.findUnique({ where: { id } });
    if (!asset) {
      return NextResponse.json({ error: 'Asset not found.' }, { status: 404 });
    }

    if (asset.status !== 'Available') {
      return NextResponse.json({ error: 'Asset is not available for checkout.' }, { status: 400 });
    }

    const member = await prisma.member.findUnique({ where: { id: holderId } });
    if (!member) {
      return NextResponse.json({ error: 'Member not found.' }, { status: 404 });
    }

    const updated = await prisma.asset.update({
      where: { id },
      data: {
        status: 'Issued',
        holderId,
      },
    });

    await prisma.assetHistory.create({
      data: {
        assetId: id,
        action: 'Issued',
        holder: member.name,
        notes: notes || `Issued to ${member.name} by ${session.username}`,
      },
    });

    await prisma.memberActivity.create({
      data: {
        memberId: holderId,
        action: `Checked out asset: ${asset.name} (${asset.assetId})`,
      },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('POST /api/assets/[id]/checkout error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
