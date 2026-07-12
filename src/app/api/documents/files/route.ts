import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { decrypt, getSession } from '@/lib/session';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

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
  try {
    const contentType = request.headers.get('content-type') || '';

    if (contentType.includes('multipart/form-data')) {
      // ── Handle File Upload ──────────────────────────────────────────────────
      let role = '';
      const cookieHeader = request.headers.get('cookie') || '';
      const match = cookieHeader.match(/cyberx_session=([^;]+)/);
      const token = match ? decodeURIComponent(match[1]) : null;
      
      if (token) {
        const session = await decrypt(token);
        role = session?.role || '';
      }
      
      if (!role) {
        const session = await getSession();
        role = session?.role || '';
      }

      if (!role) {
        return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
      }

      const formData = await request.formData();
      const file = formData.get('file') as File | null;

      if (!file) {
        return NextResponse.json({ error: 'No file uploaded.' }, { status: 400 });
      }

      const buffer = Buffer.from(await file.arrayBuffer());
      
      // Create unique filename to prevent overrides
      const uniqueId = crypto.randomUUID();
      const cleanFileName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, '_');
      const savedName = `${uniqueId}-${cleanFileName}`;
      
      // Path inside public/uploads
      const uploadDir = join(process.cwd(), 'public', 'uploads');
      
      // Ensure upload directory exists
      await mkdir(uploadDir, { recursive: true });
      
      const filePath = join(uploadDir, savedName);
      await writeFile(filePath, buffer);
      
      return NextResponse.json({
        success: true,
        fileUrl: `/uploads/${savedName}`,
        fileSize: file.size,
        mimeType: file.type,
        fileName: file.name
      });
    }

    // ── Handle JSON Record Creation (Existing Logic) ──────────────────────────
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const data = await request.json();
    const { name, folderId, content, tags, type, fileUrl, fileSize, mimeType } = data;

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
        type: type || 'markdown',
        fileUrl: fileUrl || null,
        fileSize: fileSize || null,
        mimeType: mimeType || null,
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
        content: content || fileUrl || '',
        updatedBy: session.username,
      },
    });

    await prisma.activityLog.create({
      data: {
        action: 'Created',
        user: session.username,
        role: session.role,
        details: `Created document: ${name} (type: ${type || 'markdown'}) inside folder ${folder.name}`,
      },
    });

    return NextResponse.json(file, { status: 201 });
  } catch (error: any) {
    console.error('POST /api/documents/files error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
