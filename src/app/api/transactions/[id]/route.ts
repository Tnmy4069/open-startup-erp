import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { guardEdit, guardDelete } from '@/lib/permissions';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const id = (await params).id;
    const transaction = await prisma.transaction.findUnique({
      where: { id },
    });

    if (!transaction) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
    }

    return NextResponse.json(transaction);
  } catch (error) {
    const err = error as Error;
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const denied = await guardEdit();
  if (denied) return denied;

  try {
    const id = (await params).id;
    const data = await request.json();
    const {
      type,
      purpose,
      party,
      amount,
      status,
      paymentMethod,
      transactionBy,
      approvedBy,
      notes,
      referenceNumber,
      utr,
      paymentLink,
      upiId,
      bankDetails,
      attachments,
      user, // Editor user name
      role, // Editor user role
    } = data;

    // Get current transaction state
    const original = await prisma.transaction.findUnique({
      where: { id },
    });

    if (!original) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
    }

    // Update fields
    const updated = await prisma.transaction.update({
      where: { id },
      data: {
        type,
        purpose,
        party,
        amount: amount !== undefined ? parseFloat(amount) : undefined,
        status,
        paymentMethod,
        transactionBy,
        approvedBy: status === 'Completed' ? (approvedBy || user || 'Finance Officer') : null,
        notes,
        referenceNumber,
        utr,
        paymentLink,
        upiId,
        bankDetails,
        attachments: attachments !== undefined ? attachments : undefined,
      },
    });

    // Activity logging
    const statusChanged = original.status !== status;
    const actionText = statusChanged ? 'Approved' : 'Updated';
    await prisma.activityLog.create({
      data: {
        action: actionText,
        user: user || transactionBy || 'System',
        role: role || 'Treasurer',
        details: `${actionText} transaction ${id} for ${party}: changed amount to INR ${amount} (Status: ${status})`,
      },
    });

    // Create notifications for approvals
    if (statusChanged && status === 'Completed') {
      await prisma.notification.create({
        data: {
          message: `Transaction to ${party} of INR ${amount} approved & completed by ${user}`,
          type: 'Payment completed',
          status: 'Unread',
        },
      });
    }

    return NextResponse.json(updated);
  } catch (error) {
    const err = error as Error;
    console.error('Error updating transaction:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const denied = await guardDelete();
  if (denied) return denied;

  try {
    const id = (await params).id;
    const { searchParams } = new URL(request.url);
    const user = searchParams.get('user') || 'System';
    const role = searchParams.get('role') || 'Super Admin';

    const original = await prisma.transaction.findUnique({
      where: { id },
    });

    if (!original) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
    }

    await prisma.transaction.delete({
      where: { id },
    });

    // Audit logs
    await prisma.activityLog.create({
      data: {
        action: 'Deleted',
        user,
        role,
        details: `Deleted ${original.type} transaction ${id} for ${original.party} of INR ${original.amount}`,
      },
    });

    return NextResponse.json({ success: true, message: 'Transaction deleted successfully' });
  } catch (error) {
    const err = error as Error;
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
