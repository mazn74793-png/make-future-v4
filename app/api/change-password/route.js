import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

export async function POST(req) {
  try {
    const { studentId, email, newPassword } = await req.json();
    if (!newPassword || newPassword.length < 6) return NextResponse.json({ error: 'كلمة المرور أقل من 6 أحرف' });

    // جيب الطالب من DB
    const { data: student } = await supabaseAdmin
      .from('students').select('user_id, email').eq('id', studentId).single();

    let userId = student?.user_id;

    // لو مفيش user_id — الطالب مش مسجل في auth لسه
    if (!userId) {
      // ابحث بالإيميل في auth
      const { data: { users } } = await supabaseAdmin.auth.admin.listUsers();
      const authUser = users?.find(u => u.email === (email || student?.email));

      if (authUser) {
        userId = authUser.id;
        // ربط الـ user_id بالطالب
        await supabaseAdmin.from('students').update({ user_id: userId }).eq('id', studentId);
      } else {
        // إنشاء حساب جديد للطالب
        const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
          email: email || student?.email,
          password: newPassword,
          email_confirm: true,
        });
        if (createError) return NextResponse.json({ error: createError.message });
        userId = newUser.user.id;
        await supabaseAdmin.from('students').update({ user_id: userId }).eq('id', studentId);
        return NextResponse.json({ success: true });
      }
    }

    const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, { password: newPassword });
    if (error) return NextResponse.json({ error: error.message });
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: e.message });
  }
}
