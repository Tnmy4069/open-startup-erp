import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const file = await prisma.docFile.findUnique({
      where: { id },
      include: {
        versions: {
          orderBy: { version: 'desc' },
        },
      },
    });

    if (!file) {
      return NextResponse.json({ error: 'Document file not found' }, { status: 404 });
    }

    if (!file.isPublic) {
      return NextResponse.json({ error: 'Unauthorized. Document is not public.' }, { status: 401 });
    }

    return NextResponse.json(file);
  } catch (error) {
    const err = error as Error;
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
