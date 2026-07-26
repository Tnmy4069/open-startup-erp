import { NextRequest, NextResponse } from 'next/server';
import { guardSettings } from '@/lib/permissions';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const denied = await guardSettings();
  if (denied) return denied;

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const type = (formData.get('type') as string) || 'logo'; // logo | icon | favicon

    if (!file) {
      return NextResponse.json({ error: 'No image file uploaded.' }, { status: 400 });
    }

    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/svg+xml', 'image/x-icon', 'image/vnd.microsoft.icon', 'image/gif'];
    if (file.type && !validTypes.includes(file.type.toLowerCase())) {
      // Allow icon types as well
      const isIco = file.name.endsWith('.ico') || file.name.endsWith('.png') || file.name.endsWith('.webp') || file.name.endsWith('.svg') || file.name.endsWith('.jpg') || file.name.endsWith('.jpeg');
      if (!isIco) {
        return NextResponse.json({ error: 'Invalid file type. Please upload PNG, JPG, WEBP, SVG, or ICO.' }, { status: 400 });
      }
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    
    // Clean filename with timestamp to avoid cache conflicts
    const timestamp = Date.now();
    const cleanFileName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, '_');
    const savedName = `branding-${type}-${timestamp}-${cleanFileName}`;
    
    const uploadDir = join(process.cwd(), 'public', 'uploads');
    await mkdir(uploadDir, { recursive: true });
    
    const filePath = join(uploadDir, savedName);
    await writeFile(filePath, buffer);
    
    const fileUrl = `/uploads/${savedName}`;

    return NextResponse.json({
      success: true,
      fileUrl,
      fileName: file.name,
      mimeType: file.type,
      type
    });
  } catch (error: any) {
    console.error('POST /api/settings/upload error:', error);
    return NextResponse.json({ error: error.message || 'Failed to upload image.' }, { status: 500 });
  }
}
