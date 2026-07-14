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
    const member = await prisma.member.findUnique({
      where: { id },
      include: {
        registrations: {
          include: {
            event: true
          }
        },
        activityHistory: {
          orderBy: { date: 'desc' }
        },
        tasksAssigned: true,
        assetsHeld: true
      }
    });

    if (!member) {
      return NextResponse.json({ error: 'Member not found.' }, { status: 404 });
    }

    // Enrich statistics
    const eventsAttended = member.registrations.filter((r) => r.status === 'Attended').length;
    const tasksCompleted = member.tasksAssigned.filter((t) => t.status === 'Completed').length;

    return NextResponse.json({
      ...member,
      stats: {
        eventsAttended,
        tasksCompleted,
        totalTasks: member.tasksAssigned.length,
        totalAssets: member.assetsHeld.length
      }
    });
  } catch (error: any) {
    console.error('GET /api/members/[id] error:', error);
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

    const original = await prisma.member.findUnique({ where: { id } });
    if (!original) {
      return NextResponse.json({ error: 'Member not found.' }, { status: 404 });
    }

    const {
      userId,
      name,
      photo,
      email,
      phone,
      college,
      department,
      year,
      orgName,
      designation,
      skills,
      domains,
      position,
      role,
      status,
      availability,
      bio,
      linkedin,
      github,
      portfolio,
      emergencyContact,
      notes,
      badges,
      certificates,
      attendance
    } = data;

    // Role safety logic: only Super Admin and Co-Founder can assign/change userId fields
    let memberUserId = original.userId;
    if (userId !== undefined) {
      if (session.role === 'Super Admin' || session.role === 'Co-Founder') {
        memberUserId = userId || null;
      }
    }

    const updated = await prisma.member.update({
      where: { id },
      data: {
        userId: memberUserId,
        name: name !== undefined ? name : original.name,
        photo: photo !== undefined ? photo : original.photo,
        email: email !== undefined ? email : original.email,
        phone: phone !== undefined ? phone : original.phone,
        college: college !== undefined ? college : original.college,
        department: department !== undefined ? department : original.department,
        year: year !== undefined ? year : original.year,
        orgName: orgName !== undefined ? orgName : original.orgName,
        designation: designation !== undefined ? designation : original.designation,
        skills: skills !== undefined ? skills : original.skills,
        domains: domains !== undefined ? domains : original.domains,
        position: position !== undefined ? position : original.position,
        role: role !== undefined ? role : original.role,
        status: status !== undefined ? status : original.status,
        availability: availability !== undefined ? availability : original.availability,
        bio: bio !== undefined ? bio : original.bio,
        linkedin: linkedin !== undefined ? linkedin : original.linkedin,
        github: github !== undefined ? github : original.github,
        portfolio: portfolio !== undefined ? portfolio : original.portfolio,
        emergencyContact: emergencyContact !== undefined ? emergencyContact : original.emergencyContact,
        notes: notes !== undefined ? notes : original.notes,
        badges: badges !== undefined ? badges : original.badges,
        certificates: certificates !== undefined ? certificates : original.certificates,
        attendance: attendance !== undefined ? parseFloat(attendance) : original.attendance,
      }
    });

    // Activity log entry
    await prisma.activityLog.create({
      data: {
        action: 'Updated',
        user: session.username,
        role: session.role,
        details: `Updated member profile: ${updated.name}`,
      }
    });

    // Add member-specific activity log
    await prisma.memberActivity.create({
      data: {
        memberId: updated.id,
        action: `Profile fields modified by ${session.username}`,
      }
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('PUT /api/members/[id] error:', error);
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
    return NextResponse.json({ error: 'Forbidden: only Super Admin and Co-Founder can delete profiles.' }, { status: 403 });
  }

  try {
    const id = (await params).id;
    const member = await prisma.member.findUnique({ where: { id } });
    if (!member) {
      return NextResponse.json({ error: 'Member not found.' }, { status: 404 });
    }

    await prisma.member.delete({ where: { id } });

    await prisma.activityLog.create({
      data: {
        action: 'Deleted',
        user: session.username,
        role: session.role,
        details: `Deleted member profile: ${member.name}`,
      }
    });

    return NextResponse.json({ success: true, message: 'Member profile deleted successfully.' });
  } catch (error: any) {
    console.error('DELETE /api/members/[id] error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
