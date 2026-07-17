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
    const file = await prisma.docFile.findUnique({
      where: { id },
      include: {
        versions: {
          orderBy: { version: 'desc' },
        },
      },
    });

    if (!file) {
      return NextResponse.json({ error: 'File not found.' }, { status: 404 });
    }

    return NextResponse.json(file);
  } catch (error: any) {
    console.error('GET /api/documents/files/[id] error:', error);
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
    const { name, content, tags, isPinned, isFavorite, rollbackVersion, type, fileUrl, fileSize, mimeType, isPublic } = data;

    const original = await prisma.docFile.findUnique({
      where: { id },
      include: { versions: true },
    });

    if (!original) {
      return NextResponse.json({ error: 'File not found.' }, { status: 404 });
    }

    let finalContent = original.content;
    let createNewVersion = false;

    if (rollbackVersion) {
      // Rollback to a specific version
      const targetVersion = await prisma.docVersion.findFirst({
        where: { fileId: id, version: parseInt(rollbackVersion, 10) },
      });
      if (!targetVersion) {
        return NextResponse.json({ error: 'Target version not found.' }, { status: 404 });
      }
      finalContent = targetVersion.content;
      createNewVersion = true;
    } else if (content !== undefined && content !== original.content) {
      finalContent = content;
      createNewVersion = true;
    }

    const updated = await prisma.docFile.update({
      where: { id },
      data: {
        name: name !== undefined ? name : original.name,
        content: finalContent,
        type: type !== undefined ? type : original.type,
        fileUrl: fileUrl !== undefined ? fileUrl : original.fileUrl,
        fileSize: fileSize !== undefined ? fileSize : original.fileSize,
        mimeType: mimeType !== undefined ? mimeType : original.mimeType,
        tags: tags !== undefined ? tags : original.tags,
        isPinned: isPinned !== undefined ? !!isPinned : original.isPinned,
        isFavorite: isFavorite !== undefined ? !!isFavorite : original.isFavorite,
        isPublic: isPublic !== undefined ? !!isPublic : original.isPublic,
      },
    });

    if (createNewVersion) {
      // Find latest version number
      const nextVersionNum = original.versions.length > 0 
        ? Math.max(...original.versions.map((v) => v.version)) + 1 
        : 1;

      await prisma.docVersion.create({
        data: {
          fileId: id,
          version: nextVersionNum,
          content: finalContent,
          updatedBy: session.username,
        },
      });
    }

    await prisma.activityLog.create({
      data: {
        action: 'Updated',
        user: session.username,
        role: session.role,
        details: `Updated document: ${updated.name}`,
      },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('PUT /api/documents/files/[id] error:', error);
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

  try {
    const id = (await params).id;
    const file = await prisma.docFile.findUnique({ where: { id } });
    if (!file) {
      return NextResponse.json({ error: 'File not found.' }, { status: 404 });
    }

    await prisma.docFile.delete({ where: { id } });

    await prisma.activityLog.create({
      data: {
        action: 'Deleted',
        user: session.username,
        role: session.role,
        details: `Deleted document: ${file.name}`,
      },
    });

    return NextResponse.json({ success: true, message: 'Document file deleted successfully.' });
  } catch (error: any) {
    console.error('DELETE /api/documents/files/[id] error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
