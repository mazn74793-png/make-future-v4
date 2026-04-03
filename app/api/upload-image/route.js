import { getPresignedUploadUrl } from '@/lib/cloudflare-r2';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { fileName, contentType } = await request.json();
    const key = `images/${Date.now()}-${fileName.replace(/\s/g, '-')}`;
    const uploadUrl = await getPresignedUploadUrl(key, contentType);
    const imageUrl = `${process.env.R2_PUBLIC_URL}/${key}`;
    return NextResponse.json({ uploadUrl, imageUrl });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
