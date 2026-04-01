import { uploadToR2 } from '@/lib/cloudflare-r2';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get('video');
    const title = formData.get('title');
    const courseId = formData.get('courseId');
    const isFree = formData.get('isFree') === 'true';

    if (!file || !title || !courseId) {
      return NextResponse.json({ error: 'كل البيانات مطلوبة' }, { status: 400 });
    }

    const fileName = `videos/${Date.now()}-${file.name.replace(/\s/g, '-')}`;
    const buffer = Buffer.from(await file.arrayBuffer());
    const videoUrl = await uploadToR2(buffer, fileName, file.type);

    const { data, error } = await supabaseAdmin
      .from('videos')
      .insert({ title, course_id: courseId, video_url: videoUrl, r2_file_key: fileName, file_size: file.size, is_free: isFree })
      .select().single();

    if (error) throw error;
    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json({ error: 'حصل مشكلة', details: error.message }, { status: 500 });
  }
}
