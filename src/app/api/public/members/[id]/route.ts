import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const isObjectId = /^[0-9a-fA-F]{24}$/.test(id);

    const member = await prisma.member.findFirst({
      where: {
        OR: [
          isObjectId ? { id } : undefined,
          { slug: id }
        ].filter(Boolean) as any
      },
      select: {
        id: true,
        slug: true,
        name: true,
        photo: true,
        college: true,
        department: true,
        year: true,
        orgName: true,
        designation: true,
        skills: true,
        domains: true,
        position: true,
        role: true,
        status: true,
        availability: true,
        bio: true,
        linkedin: true,
        github: true,
        portfolio: true,
        joinedDate: true,
        badges: true,
        certificates: true,
        registrations: {
          select: {
            id: true,
            status: true
          }
        },
        tasksAssigned: {
          select: {
            id: true,
            title: true,
            status: true,
            priority: true
          }
        }
      }
    });

    if (!member) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    // Profiles are public by default unless the member status is Inactive
    if (member.status === 'Inactive') {
      return NextResponse.json({ error: 'This profile is currently set to private or inactive.' }, { status: 403 });
    }

    return NextResponse.json(member);
  } catch (error) {
    const err = error as Error;
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
