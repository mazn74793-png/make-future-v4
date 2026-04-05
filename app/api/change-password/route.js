import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

export async function POST(req) {
  try {
    // 1. التأكد من صلاحية الأدمن (Security Layer)
    const { data: { user: adminUser } } = await supabaseAdmin.auth.getUser(req.headers.get('Authorization')?.split(' ')[1] || '');
    
    const { data: isAdmin } = await supabaseAdmin
      .from('admins')
      .select('id')
      .eq('email', adminUser?.email)
      .single();

    if (!isAdmin) {
      return NextResponse.json({ error: 'غير مسموح لك بالقيام بهذا الإجراء' }, { status: 403 });
    }

    const { studentId, email, newPassword } = await req.json();
    if (!newPassword || newPassword.length < 6) {
      return NextResponse.json({ error: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل' });
    }

    // 2. جلب بيانات الطالب من القاعدة
    const { data: student, error: studentError } = await supabaseAdmin
      .from('students')
      .select('user_id, email')
      .eq('id', studentId)
      .single();

    if (studentError || !student) return NextResponse.json({ error: 'الطالب غير موجود' });

    let userId = student.user_id;
    const targetEmail = email || student.email;

    // 3. لو الطالب مش مربوط بـ Auth
    if (!userId) {
      // بحث سريع عن طريق الإيميل بدلاً من listUsers الشاملة
      const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers();
      const authUser = users?.find(u => u.email === targetEmail);

      if (authUser) {
        userId = authUser.id;
        await supabaseAdmin.from('students').update({ user_id: userId }).eq('id', studentId);
      } else {
        // إنشاء حساب جديد فوراً وتأكيده
        const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
          email: targetEmail,
          password: newPassword,
          email_confirm: true, // تأكيد الإيميل تلقائياً
          user_metadata: { role: 'student' } // إضافة رول الطالب في الميتاداتا
        });

        if (createError) return NextResponse.json({ error: createError.message });
        
        userId = newUser.user.id;
        await supabaseAdmin.from('students').update({ user_id: userId }).eq('id', studentId);
        return NextResponse.json({ success: true, message: 'تم إنشاء حساب جديد للطالب' });
      }
    }

    // 4. تحديث الباسورد للحساب الموجود فعلياً
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(userId, { 
      password: newPassword,
      email: targetEmail // تحديث الإيميل أيضاً لو الأدمن غيره
    });

    if (updateError) return NextResponse.json({ error: updateError.message });

    return NextResponse.json({ success: true, message: 'تم تحديث البيانات بنجاح' });

  } catch (e) {
    return NextResponse.json({ error: 'حدث خطأ داخلي في الخادم' }, { status: 500 });
  }
}
