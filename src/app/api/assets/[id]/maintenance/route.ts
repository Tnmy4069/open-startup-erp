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
    const { action, issue, cost, resolution, maintenanceId } = data; // action: 'Start' | 'Resolve' | 'Lost'

    const asset = await prisma.asset.findUnique({ where: { id } });
    if (!asset) {
      return NextResponse.json({ error: 'Asset not found.' }, { status: 404 });
    }

    let updatedAsset = null;

    if (action === 'Start') {
      if (!issue) {
        return NextResponse.json({ error: 'Maintenance issue description is required.' }, { status: 400 });
      }
      // Put asset to maintenance status
      updatedAsset = await prisma.asset.update({
        where: { id },
        data: { status: 'Maintenance' },
      });

      await prisma.assetMaintenance.create({
        data: {
          assetId: id,
          startDate: new Date(),
          issue,
          status: 'Pending',
        },
      });

      await prisma.assetHistory.create({
        data: {
          assetId: id,
          action: 'Sent to Maintenance',
          notes: `Issue: ${issue}`,
        },
      });
    } else if (action === 'Resolve') {
      if (!maintenanceId) {
        return NextResponse.json({ error: 'Maintenance log ID is required to resolve.' }, { status: 400 });
      }

      const maintenance = await prisma.assetMaintenance.findUnique({ where: { id: maintenanceId } });
      if (!maintenance || maintenance.assetId !== id) {
        return NextResponse.json({ error: 'Maintenance record not found.' }, { status: 404 });
      }

      await prisma.assetMaintenance.update({
        where: { id: maintenanceId },
        data: {
          endDate: new Date(),
          cost: parseFloat(cost || '0'),
          resolution: resolution || 'Resolved',
          status: 'Completed',
        },
      });

      updatedAsset = await prisma.asset.update({
        where: { id },
        data: { status: 'Available' },
      });

      await prisma.assetHistory.create({
        data: {
          assetId: id,
          action: 'Resolved Maintenance',
          notes: `Resolution: ${resolution || 'Completed'}. Cost: INR ${cost || '0'}`,
        },
      });
    } else if (action === 'Lost') {
      updatedAsset = await prisma.asset.update({
        where: { id },
        data: {
          status: 'Lost',
          condition: 'Lost',
        },
      });

      await prisma.assetHistory.create({
        data: {
          assetId: id,
          action: 'Marked as Lost',
          notes: `Marked as lost by ${session.username}`,
        },
      });
    } else {
      return NextResponse.json({ error: 'Invalid action parameter.' }, { status: 400 });
    }

    return NextResponse.json(updatedAsset || asset);
  } catch (error: any) {
    console.error('POST /api/assets/[id]/maintenance error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
