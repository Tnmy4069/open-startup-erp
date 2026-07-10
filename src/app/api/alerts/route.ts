import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const notifications = await prisma.notification.findMany({
      orderBy: { timestamp: 'desc' },
      take: 20,
    });
    const reminders = await prisma.reminder.findMany({
      orderBy: { dueDate: 'asc' },
      where: { status: 'Active' },
    });
    return NextResponse.json({ notifications, reminders });
  } catch (error) {
    const err = error as Error;
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { message, type } = await request.json();
    const newNotification = await prisma.notification.create({
      data: {
        message,
        type,
        status: 'Unread',
      },
    });
    return NextResponse.json(newNotification);
  } catch (error) {
    const err = error as Error;
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
