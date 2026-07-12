import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/session';

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  try {
    const folders = await prisma.docFolder.findMany({
      include: {
        files: true,
      },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json(folders);
  } catch (error: any) {
    console.error('GET /api/documents/folders error:', error);
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
    const { name, parentId } = data;

    if (!name) {
      return NextResponse.json({ error: 'Folder name is required.' }, { status: 400 });
    }

    const folder = await prisma.docFolder.create({
      data: {
        name,
        parentId: parentId || null,
      },
    });

    await prisma.activityLog.create({
      data: {
        action: 'Created',
        user: session.username,
        role: session.role,
        details: `Created document folder: ${name}`,
      },
    });

    return NextResponse.json(folder, { status: 201 });
  } catch (error: any) {
    console.error('POST /api/documents/folders error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
export async function PUT(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }
  try {
    const data = await request.json();
    const { folderId, name } = data;
    if (!folderId || !name) {
      return NextResponse.json({ error: 'folderId and name are required.' }, { status: 400 });
    }
    const updated = await prisma.docFolder.update({
      where: { id: folderId },
      data: { name }
    });
    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
export async function DELETE(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'Folder ID is required.' }, { status: 400 });
    }
    await prisma.docFolder.delete({
      where: { id }
    });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
