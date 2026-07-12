import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/session';
import { canCreate } from '@/lib/permissions';

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session || !canCreate(session.role)) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  try {
    const data = await request.json();
    const { members } = data;

    if (!Array.isArray(members)) {
      return NextResponse.json({ error: 'Invalid payload: members must be an array.' }, { status: 400 });
    }

    let importedCount = 0;
    let skippedCount = 0;
    const errors: string[] = [];

    for (const m of members) {
      if (!m.name || !m.email) {
        skippedCount++;
        errors.push(`Row missing name or email: ${JSON.stringify(m)}`);
        continue;
      }

      // Check if email or name already exists in the database
      const existing = await prisma.member.findFirst({
        where: {
          OR: [
            { email: m.email },
            { name: m.name }
          ]
        }
      });

      if (existing) {
        skippedCount++;
        errors.push(`Member "${m.name}" (${m.email}) already exists.`);
        continue;
      }

      try {
        const created = await prisma.member.create({
          data: {
            name: m.name.trim(),
            email: m.email.trim(),
            phone: m.phone ? m.phone.toString().trim() : '',
            college: m.college ? m.college.trim() : '',
            department: m.department ? m.department.trim() : '',
            year: m.year ? m.year.trim() : '1st Year',
            orgName: m.orgName ? m.orgName.trim() : '',
            designation: m.designation ? m.designation.trim() : '',
            skills: Array.isArray(m.skills) ? m.skills : [],
            domains: Array.isArray(m.domains) ? m.domains : [],
            position: m.position ? m.position.trim() : 'Volunteer',
            role: m.role ? m.role.trim() : 'Volunteer',
            status: m.status ? m.status.trim() : 'Active',
            availability: m.availability ? m.availability.trim() : 'High',
            bio: m.bio || '',
            linkedin: m.linkedin || '',
            github: m.github || '',
            portfolio: m.portfolio || '',
            emergencyContact: m.emergencyContact || '',
            notes: m.notes || '',
            attendance: 100.0,
            badges: [],
            certificates: [],
          }
        });

        // Add activity history for member
        await prisma.memberActivity.create({
          data: {
            memberId: created.id,
            action: 'Profile registered via CSV import',
          },
        });

        importedCount++;
      } catch (err: any) {
        skippedCount++;
        errors.push(`Error inserting member "${m.name}": ${err.message}`);
      }
    }

    // Create system activity log if we imported any members
    if (importedCount > 0) {
      await prisma.activityLog.create({
        data: {
          action: 'Created',
          user: session.username,
          role: session.role,
          details: `Imported ${importedCount} community members from CSV.`,
        },
      });
    }

    return NextResponse.json({
      success: true,
      importedCount,
      skippedCount,
      errors
    }, { status: 201 });
  } catch (error: any) {
    console.error('POST /api/members/import error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
