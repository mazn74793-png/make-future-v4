'use client';
import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    const handle = async () => {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error || !user) { router.push('/login'); return; }

      // شيك لو أدمن
      const { data: admin } = await supabase
        .from('admins').select('id').eq('email', user.email).single();
      if (admin) { router.push('/dashboard'); return; }

      // دور على طالب بنفس الإيميل
      const { data: studentByEmail } = await supabase
        .from('students').select('*').eq('email', user.email).single();

      if (studentByEmail) {
        // لو الطالب موجود بالإيميل — ربطه بالـ user_id الجديد لو مش مربوط
        if (!studentByEmail.user_id || studentByEmail.user_id !== user.id) {
          await supabase.from('students')
            .update({ user_id: user.id })
            .eq('email', user.email);
        }

        // توجيه حسب الحالة
        if (!studentByEmail.profile_complete) {
          router.push('/complete-profile'); return;
        }
        if (studentByEmail.status === 'approved') {
          router.push('/student'); return;
        }
        if (studentByEmail.status === 'pending') {
          router.push('/pending'); return;
        }
        router.push('/pending'); return;
      }

      // دور بالـ user_id
      const { data: studentByUserId } = await supabase
        .from('students').select('*').eq('user_id', user.id).single();

      if (studentByUserId) {
        if (!studentByUserId.profile_complete) { router.push('/complete-profile'); return; }
        if (studentByUserId.status === 'approved') { router.push('/student'); return; }
        router.push('/pending'); return;
      }

      // طالب جديد خالص — اكمل البيانات
      router.push('/complete-profile');
    };

    handle();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg)' }}>
      <div className="text-center">
        <div className="w-14 h-14 rounded-full border-4 border-t-transparent animate-spin mx-auto mb-4"
          style={{ borderColor: 'rgba(99,102,241,0.3)', borderTopColor: '#6366f1' }} />
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>جاري التحقق من حسابك...</p>
      </div>
    </div>
  );
}
