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
    const folderId = searchParams.get('folderId') || '';
    const isPinned = searchParams.get('isPinned') === 'true';
    const isFavorite = searchParams.get('isFavorite') === 'true';
    const recent = searchParams.get('recent') === 'true';

    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { content: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (folderId) where.folderId = folderId;
    if (isPinned) where.isPinned = true;
    if (isFavorite) where.isFavorite = true;

    const files = await prisma.docFile.findMany({
      where,
      orderBy: recent ? { updatedAt: 'desc' } : { name: 'asc' },
      take: recent ? 10 : undefined,
    });

    return NextResponse.json(files);
  } catch (error: any) {
    console.error('GET /api/documents/files error:', error);
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
    const { name, folderId, content, tags } = data;

    if (!name || !folderId) {
      return NextResponse.json({ error: 'File name and Folder ID are required.' }, { status: 400 });
    }

    const folder = await prisma.docFolder.findUnique({ where: { id: folderId } });
    if (!folder) {
      return NextResponse.json({ error: 'Folder not found.' }, { status: 404 });
    }

    const file = await prisma.docFile.create({
      data: {
        name,
        folderId,
        content: content || '',
        tags: tags || [],
        isPinned: false,
        isFavorite: false,
      },
    });

    // Create initial version record
    await prisma.docVersion.create({
      data: {
        fileId: file.id,
        version: 1,
        content: content || '',
        updatedBy: session.username,
      },
    });

    await prisma.activityLog.create({
      data: {
        action: 'Created',
        user: session.username,
        role: session.role,
        details: `Created document: ${name} inside folder ${folder.name}`,
      },
    });

    return NextResponse.json(file, { status: 201 });
  } catch (error: any) {
    console.error('POST /api/documents/files error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
