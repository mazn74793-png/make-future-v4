'use client';
import { useEffect, useState } from 'react';
import { FiClock, FiPhone, FiLogOut, FiCheckCircle } from 'react-icons/fi';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function PendingPage() {
  const [userName, setUserName] = useState('');
  const router = useRouter();

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }
      
      // جلب الاسم من جدول الطلاب
      const { data: student } = await supabase
        .from('students')
        .select('name')
        .eq('user_id', user.id)
        .single();
      
      if (student) setUserName(student.name);
    };
    fetchUser();
  }, [router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/login';
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden bg-[#09090b]" dir="rtl">
      
      {/* Aurora Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-purple-600/10 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-600/10 blur-[120px] rounded-full animate-pulse" />
      </div>

      <div className="relative z-10 glass rounded-[3rem] p-10 md:p-14 text-center max-w-lg border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.3)] backdrop-blur-2xl animate-fade-in">
        
        {/* Animated Clock Container */}
        <div className="relative w-28 h-28 mx-auto mb-10">
          <div className="absolute inset-0 bg-purple-500/20 rounded-full animate-ping opacity-30" />
          <div className="relative w-full h-full gradient-primary rounded-[2rem] flex items-center justify-center shadow-2xl shadow-purple-500/20 rotate-6 hover:rotate-0 transition-transform duration-500">
            <FiClock className="text-5xl text-white animate-[pulse_2s_infinite]" />
          </div>
        </div>

        <div className="mb-8">
          <h1 className="text-3xl font-black text-white mb-3 tracking-tight leading-tight">
            صبراً يا {userName ? userName.split(' ')[0] : 'بطل'}.. <br />
            <span className="text-purple-400">طلبك قيد المراجعة</span>
          </h1>
          <div className="h-1.5 w-20 bg-gradient-to-r from-purple-500 to-pink-500 mx-auto rounded-full mb-6" />
        </div>

        <p className="text-gray-400 mb-10 leading-relaxed font-medium text-lg">
          أهلاً بك في منصتنا! الأدمن يقوم الآن بمراجعة بياناتك بدقة للتأكد من صحتها. 
          <span className="block mt-3 text-sm text-purple-300 font-bold bg-purple-500/10 py-3 rounded-2xl border border-purple-500/10">
             🚀 سيتم تفعيل حسابك خلال أقل من 24 ساعة.
          </span>
        </p>

        <div className="grid grid-cols-1 gap-4">
          {/* WhatsApp Action */}
          <a 
            href="https://wa.me/2010XXXXXXXX" // استبدل بـ رقم سكرتارية المدرس
            target="_blank"
            className="group flex items-center justify-center gap-3 bg-[#25D366] text-[#052d16] py-4.5 rounded-2xl font-black text-lg hover:shadow-[0_0_20px_rgba(37,211,102,0.3)] transition-all active:scale-95"
          >
            <FiPhone className="text-xl group-hover:shake" /> تواصل مع السكرتارية
          </a>

          {/* Logout Button */}
          <button 
            onClick={handleLogout}
            className="flex items-center justify-center gap-3 bg-white/5 text-gray-500 py-4 rounded-2xl font-bold hover:bg-white/10 hover:text-white transition-all active:scale-95 text-sm"
          >
            <FiLogOut /> تسجيل الخروج والعودة لاحقاً
          </button>
        </div>

        <div className="mt-12 pt-8 border-t border-white/5 flex flex-col items-center gap-2">
           <div className="flex items-center gap-2 text-gray-500 text-[10px] font-black uppercase tracking-widest">
              <FiCheckCircle className="text-purple-500" /> جاري معالجة بياناتك الآن
           </div>
        </div>
      </div>
    </div>
  );
}
