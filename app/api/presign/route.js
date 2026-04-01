import { getPresignedUploadUrl } from '@/lib/cloudflare-r2';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { fileName, contentType, title, courseId, isFree, fileSize } = await request.json();

    const key = `videos/${Date.now()}-${fileName.replace(/\s/g, '-')}`;
    const uploadUrl = await getPresignedUploadUrl(key, contentType);
    const videoUrl = `${process.env.R2_PUBLIC_URL}/${key}`;

    // سجّل الفيديو في Supabase
    const { data, error } = await supabaseAdmin
      .from('videos')
      .insert({ title, course_id: courseId, video_url: videoUrl, r2_file_key: key, file_size: fileSize, is_free: isFree })
      .select().single();

    if (error) throw error;

    return NextResponse.json({ uploadUrl, videoUrl, data });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
