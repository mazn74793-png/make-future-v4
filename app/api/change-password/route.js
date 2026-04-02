import { supabaseAdmin } from '@/lib/supabase-admin';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { userId, newPassword } = await request.json();
    if (!userId || !newPassword) return NextResponse.json({ error: 'بيانات ناقصة' }, { status: 400 });
    if (newPassword.length < 6) return NextResponse.json({ error: 'الباسورد لازم 6 أحرف على الأقل' }, { status: 400 });

    const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, { password: newPassword });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
