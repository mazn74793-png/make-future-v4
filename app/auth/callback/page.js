'use client';
import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';

export default function AuthCallback() {
  const router = useRouter();
  const called = useRef(false); // لمنع التكرار في الـ Development mode

  useEffect(() => {
    if (called.current) return;
    called.current = true;

    const handleAuth = async () => {
      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        
        if (authError || !user) {
          router.replace('/login');
          return;
        }

        // 1. هل المستخدم أدمن؟
        const { data: admin } = await supabase
          .from('admins')
          .select('id')
          .eq('email', user.email)
          .single();

        if (admin) {
          router.replace('/dashboard');
          return;
        }

        // 2. التحقق من بيانات الطالب
        const { data: student, error: studentError } = await supabase
          .from('students')
          .select('*')
          .eq('user_id', user.id)
          .single();

        // لو ملوش سجل خالص أو بياناته ناقصة
        if (studentError || !student || !student.profile_complete) {
          router.replace('/complete-profile');
          return;
        }

        // 3. التحقق من حالة القبول
        switch (student.status) {
          case 'approved':
            router.replace('/student');
            break;
          case 'pending':
            router.replace('/pending');
            break;
          case 'rejected':
            toast.error('عذراً، تم رفض طلب انضمامك للمنصة');
            await supabase.auth.signOut();
            router.replace('/login?rejected=1');
            break;
          default:
            router.replace('/');
        }

      } catch (err) {
        console.error('Auth Callback Error:', err);
        toast.error('حدث خطأ أثناء التحقق من الحساب');
        router.replace('/login');
      }
    };

    handleAuth();
  }, [router]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#09090b] relative overflow-hidden">
      {/* استدعاء الـ Orbs اللي عملناها قبل كدة عشان المنظر يفضل متناسق */}
      <div className="aurora-orb aurora-orb-1 opacity-20" />
      <div className="aurora-orb aurora-orb-2 opacity-20" />
      
      <div className="relative z-10 text-center space-y-6">
        <div className="relative">
           {/* Spinner بشكل أنظف ومتماشي مع الـ Primary Color */}
          <div className="w-20 h-20 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
          </div>
        </div>
        
        <div className="space-y-2">
          <h2 className="text-xl font-black text-white tracking-tight">جاري التحقق من الهوية</h2>
          <p className="text-gray-500 text-sm animate-pulse">لحظات ونجهز لك مقعدك في الفصل... 🎓</p>
        </div>
      </div>
    </div>
  );
}
