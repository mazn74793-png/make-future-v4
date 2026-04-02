'use client';
import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function AuthCallback() {
  useEffect(() => {
    const handle = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { window.location.href = '/login'; return; }

      // هل أدمن؟
      const { data: admin } = await supabase.from('admins').select('id').eq('email', user.email).single();
      if (admin) { window.location.href = '/dashboard'; return; }

      // هل عنده profile؟
      const { data: student } = await supabase.from('students').select('*').eq('user_id', user.id).single();

      if (!student) {
        // أول مرة — ابعته يكمل بياناته
        window.location.href = '/complete-profile';
        return;
      }

      if (!student.profile_complete) {
        window.location.href = '/complete-profile';
        return;
      }

      if (student.status === 'approved') { window.location.href = '/student'; return; }
      if (student.status === 'pending') { window.location.href = '/pending'; return; }
      if (student.status === 'rejected') {
        await supabase.auth.signOut();
        window.location.href = '/login?rejected=1';
        return;
      }

      window.location.href = '/';
    };
    handle();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center gradient-dark">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-400">جاري التحقق...</p>
      </div>
    </div>
  );
}
