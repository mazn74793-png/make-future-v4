import { deleteFromR2 } from '@/lib/cloudflare-r2';
import { supabaseAdmin } from '@/lib/supabase';
import { NextResponse } from 'next/server';

export async function DELETE(request, { params }) {
  try {
    const { id } = params;
    const { data: video } = await supabaseAdmin.from('videos').select('*').eq('id', id).single();
    if (!video) return NextResponse.json({ error: 'مش موجود' }, { status: 404 });

    try { await deleteFromR2(video.r2_file_key); } catch (e) { console.log('R2 delete error:', e); }
    await supabaseAdmin.from('videos').delete().eq('id', id);

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
