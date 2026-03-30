import { deleteFromR2 } from '@/lib/cloudflare-r2';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { keys } = await request.json();
    await Promise.all(keys.map(key => deleteFromR2(key).catch(() => {})));
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
