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
    const roleFilter = searchParams.get('role') || '';
    const statusFilter = searchParams.get('status') || '';
    const availabilityFilter = searchParams.get('availability') || '';
    const domainFilter = searchParams.get('domain') || '';
    const sortBy = searchParams.get('sortBy') || 'name';
    const sortOrder = searchParams.get('sortOrder') || 'asc';
    
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const skip = (page - 1) * limit;

    // Filter clauses
    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
        { college: { contains: search, mode: 'insensitive' } },
        { department: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (roleFilter) where.role = roleFilter;
    if (statusFilter) where.status = statusFilter;
    if (availabilityFilter) where.availability = availabilityFilter;
    if (domainFilter) {
      where.domains = { has: domainFilter };
    }

    const total = await prisma.member.count({ where });
    const members = await prisma.member.findMany({
      where,
      orderBy: { [sortBy]: sortOrder },
      skip,
      take: limit,
    });

    return NextResponse.json({ members, total, page, limit });
  } catch (error: any) {
    console.error('GET /api/members error:', error);
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
    } = data;

    if (!name || !email) {
      return NextResponse.json({ error: 'Name and email are required.' }, { status: 400 });
    }

    // Role safety logic: force userId if not Super Admin or Co-Founder
    let memberUserId = userId;
    if (session.role !== 'Super Admin' && session.role !== 'Co-Founder') {
      memberUserId = session.userId;
    }

    // Check for duplicate user accounts linking to members
    if (memberUserId && memberUserId !== 'superadmin') {
      const existing = await prisma.member.findUnique({
        where: { userId: memberUserId }
      });
      if (existing) {
        return NextResponse.json({ error: 'A member profile is already associated with this user account.' }, { status: 400 });
      }
    }

    const member = await prisma.member.create({
      data: {
        userId: memberUserId || null,
        name,
        photo,
        email,
        phone: phone || '',
        college: college || '',
        department: department || '',
        year: year || '',
        orgName: orgName || '',
        designation: designation || '',
        skills: skills || [],
        domains: domains || [],
        position: position || 'Volunteer',
        role: role || 'Volunteer',
        status: status || 'Active',
        availability: availability || 'High',
        bio,
        linkedin,
        github,
        portfolio,
        emergencyContact,
        notes,
        attendance: 100.0,
        badges: [],
        certificates: [],
      },
    });

    // Create activity logs
    await prisma.activityLog.create({
      data: {
        action: 'Created',
        user: session.username,
        role: session.role,
        details: `Registered community member: ${name} (${role})`,
      },
    });

    // Add activity history for member
    await prisma.memberActivity.create({
      data: {
        memberId: member.id,
        action: 'Profile registered in system',
      },
    });

    return NextResponse.json(member, { status: 201 });
  } catch (error: any) {
    console.error('POST /api/members error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
