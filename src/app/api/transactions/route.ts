import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { guardCreate, guardEdit, guardDelete } from '@/lib/permissions';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Pagination parameters
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    // Filters parameters
    const search = searchParams.get('search') || '';
    const type = searchParams.get('type') || '';
    const status = searchParams.get('status') || '';
    const purpose = searchParams.get('purpose') || '';
    const paymentMethod = searchParams.get('paymentMethod') || '';
    const party = searchParams.get('party') || '';
    
    // Range filters
    const dateFrom = searchParams.get('dateFrom') || '';
    const dateTo = searchParams.get('dateTo') || '';
    const amountMin = parseFloat(searchParams.get('amountMin') || '0');
    const amountMax = parseFloat(searchParams.get('amountMax') || '99999999');

    // Sorting parameters
    const sortBy = searchParams.get('sortBy') || 'date';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {};

    // Apply filters
    if (type) where.type = type;
    if (status) where.status = status;
    if (purpose) where.purpose = purpose;
    if (paymentMethod) where.paymentMethod = paymentMethod;
    if (party) where.party = { contains: party };

    // Amount Range
    where.amount = {
      gte: amountMin,
      lte: amountMax,
    };

    // Date Range
    if (dateFrom || dateTo) {
      where.date = {};
      if (dateFrom) where.date.gte = new Date(dateFrom);
      if (dateTo) where.date.lte = new Date(dateTo);
    }

    // Global Search (transaction ID, person, organization, notes, purpose, amount)
    if (search) {
      const isSearchNumber = !isNaN(parseFloat(search));
      where.OR = [
        { id: { contains: search } },
        { party: { contains: search } },
        { transactionBy: { contains: search } },
        { approvedBy: { contains: search } },
        { notes: { contains: search } },
        { purpose: { contains: search } },
      ];
      if (isSearchNumber) {
        where.OR.push({ amount: { equals: parseFloat(search) } });
      }
    }

    // Execute queries
    const total = await prisma.transaction.count({ where });
    const transactions = await prisma.transaction.findMany({
      where,
      orderBy: { [sortBy]: sortOrder },
      skip,
      take: limit,
    });

    return NextResponse.json({
      transactions,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    const err = error as Error;
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const denied = await guardCreate();
  if (denied) return denied;

  try {
    const data = await request.json();
    const {
      type,
      purpose,
      party,
      amount,
      status,
      paymentMethod,
      transactionBy,
      notes,
      referenceNumber,
      utr,
      paymentLink,
      upiId,
      bankDetails,
      attachments,
      userRole, // Used to create activity logs
    } = data;

    // Create transaction in database
    const transaction = await prisma.transaction.create({
      data: {
        type,
        purpose,
        party,
        amount: parseFloat(amount),
        status: status || 'Pending',
        paymentMethod,
        transactionBy,
        notes,
        referenceNumber,
        utr,
        paymentLink,
        upiId,
        bankDetails,
        attachments: attachments || '[]',
        approvedBy: status === 'Completed' ? transactionBy : null,
      },
    });

    // Create Audit Activity Log
    await prisma.activityLog.create({
      data: {
        action: 'Created',
        user: transactionBy,
        role: userRole || 'Founder',
        details: `Created ${type} transaction for ${party}: INR ${amount} (Status: ${status || 'Pending'})`,
      },
    });

    // Create Notification if approval is required (status pending)
    if (status === 'Pending') {
      await prisma.notification.create({
        data: {
          message: `Approval required for new ${type} transaction of INR ${amount} by ${transactionBy}`,
          type: 'Approval required',
          status: 'Unread',
        },
      });

      // Create a pending payment reminder
      await prisma.reminder.create({
        data: {
          title: `Approve transaction: ${type} to/from ${party}`,
          dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // Due in 2 days
          amount: parseFloat(amount),
          type: type === 'Expense' ? 'Pending Reimbursement' : 'Pending Payment',
          status: 'Active',
        },
      });
    } else if (status === 'Completed') {
      await prisma.notification.create({
        data: {
          message: `Payment completed: ${type} of INR ${amount} for ${party} logged by ${transactionBy}`,
          type: 'Payment completed',
          status: 'Unread',
        },
      });
    }

    // Update Person totals
    const person = await prisma.person.findUnique({ where: { name: party } });
    if (person) {
      const isIncome = type === 'Income' || type === 'Refund';
      await prisma.person.update({
        where: { name: party },
        data: {
          totalReceived: isIncome ? { increment: parseFloat(amount) } : undefined,
          totalPaid: !isIncome ? { increment: parseFloat(amount) } : undefined,
        },
      });
    }

    // Update Organization outstanding payments
    const org = await prisma.organization.findUnique({ where: { name: party } });
    if (org) {
      const isIncome = type === 'Income';
      // Income reduces outstanding payments from clients, Expense increases outstanding payments to vendors
      // Let's implement custom logic
      let diff = 0;
      if (status === 'Pending') {
        diff = isIncome ? -parseFloat(amount) : parseFloat(amount);
      }
      if (diff !== 0) {
        await prisma.organization.update({
          where: { name: party },
          data: { outstandingPayments: { increment: diff } },
        });
      }
    }

    return NextResponse.json(transaction);
  } catch (error) {
    const err = error as Error;
    console.error('Error creating transaction:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// Bulk update endpoint (PUT)
export async function PUT(request: NextRequest) {
  try {
    const { ids, action, status, user, role } = await request.json();

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: 'No transaction IDs specified' }, { status: 400 });
    }

    if (action === 'delete') {
      const denied = await guardDelete();
      if (denied) return denied;
      // Bulk delete
      await prisma.transaction.deleteMany({
        where: { id: { in: ids } },
      });

      await prisma.activityLog.create({
        data: {
          action: 'Deleted',
          user: user || 'System',
          role: role || 'Super Admin',
          details: `Bulk deleted ${ids.length} transactions.`,
        },
      });

      return NextResponse.json({ success: true, message: `Deleted ${ids.length} transactions` });
    }

    if (action === 'change_status' && status) {
      const denied = await guardEdit();
      if (denied) return denied;
      // Bulk status change
      await prisma.transaction.updateMany({
        where: { id: { in: ids } },
        data: {
          status,
          approvedBy: status === 'Completed' ? user : null,
        },
      });

      await prisma.activityLog.create({
        data: {
          action: 'Approved',
          user: user || 'System',
          role: role || 'Finance Head',
          details: `Bulk changed status of ${ids.length} transactions to ${status}.`,
        },
      });

      // If marked completed, trigger notifications
      if (status === 'Completed') {
        await prisma.notification.create({
          data: {
            message: `Bulk approved and completed ${ids.length} pending transactions.`,
            type: 'Payment completed',
            status: 'Unread',
          },
        });
      }

      return NextResponse.json({ success: true, message: `Updated status of ${ids.length} transactions to ${status}` });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    const err = error as Error;
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
