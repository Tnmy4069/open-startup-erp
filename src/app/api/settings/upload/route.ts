import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized: Please log in to upload files.' }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const type = (formData.get('type') as string) || 'logo'; // logo | icon | favicon | attachment

    if (!file) {
      return NextResponse.json({ error: 'No image file uploaded.' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    let fileUrl = '';

    const timestamp = Date.now();
    const cleanFileName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, '_');
    const savedName = `branding-${type}-${timestamp}-${cleanFileName}`;

    // Try saving to public/uploads directory (local development)
    try {
      const uploadDir = join(process.cwd(), 'public', 'uploads');
      await mkdir(uploadDir, { recursive: true });
      const filePath = join(uploadDir, savedName);
      await writeFile(filePath, buffer);
      fileUrl = `/uploads/${savedName}`;
    } catch {
      // Fallback for production serverless / read-only filesystems (e.g. Vercel, Netlify, AWS Lambda):
      // Convert file buffer to a Base64 Data URI
      const mime = file.type || (
        file.name.endsWith('.svg') ? 'image/svg+xml' :
        file.name.endsWith('.ico') ? 'image/x-icon' :
        file.name.endsWith('.webp') ? 'image/webp' :
        file.name.endsWith('.png') ? 'image/png' : 'image/jpeg'
      );
      fileUrl = `data:${mime};base64,${buffer.toString('base64')}`;
    }

    return NextResponse.json({
      success: true,
      fileUrl,
      fileName: file.name,
      mimeType: file.type || 'image/png',
      type,
    });
  } catch (error: any) {
    console.error('POST /api/settings/upload error:', error);
    return NextResponse.json({ error: error.message || 'Failed to upload image.' }, { status: 500 });
  }
}
