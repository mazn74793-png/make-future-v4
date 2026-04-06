import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

export async function POST(req) {
  try {
    const body = await req.json();
    const { studentId, email, newPassword, userId } = body;

    if (!newPassword || newPassword.length < 6)
      return NextResponse.json({ error: 'كلمة المرور أقل من 6 أحرف' });

    // جيب بيانات الطالب من DB
    let query = supabaseAdmin.from('students').select('id, user_id, email');
    if (studentId) query = query.eq('id', studentId);
    else if (userId) query = query.eq('user_id', userId);
    const { data: student, error: fetchErr } = await query.single();

    if (fetchErr || !student)
      return NextResponse.json({ error: 'الطالب مش موجود' });

    const studentEmail = email || student.email;
    let targetUserId = student.user_id || userId;

    // لو مفيش user_id — دور في auth بالإيميل
    if (!targetUserId && studentEmail) {
      const { data: { users } } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 });
      const authUser = users?.find(u => u.email?.toLowerCase() === studentEmail.toLowerCase());

      if (authUser) {
        targetUserId = authUser.id;
        // ربط user_id بالطالب تلقائياً
        await supabaseAdmin.from('students').update({ user_id: targetUserId }).eq('id', student.id);
      } else {
        // إنشاء حساب جديد للطالب في auth
        const { data: newUser, error: createErr } = await supabaseAdmin.auth.admin.createUser({
          email: studentEmail,
          password: newPassword,
          email_confirm: true,
        });
        if (createErr) return NextResponse.json({ error: createErr.message });
        await supabaseAdmin.from('students').update({ user_id: newUser.user.id }).eq('id', student.id);
        return NextResponse.json({ success: true, created: true });
      }
    }

    if (!targetUserId)
      return NextResponse.json({ error: 'مش قادر يحدد المستخدم' });

    const { error } = await supabaseAdmin.auth.admin.updateUserById(targetUserId, { password: newPassword });
    if (error) return NextResponse.json({ error: error.message });

    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: e.message });
  }
}
