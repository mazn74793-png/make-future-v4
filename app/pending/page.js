'use client';
import { FiClock, FiPhone, FiLogOut } from 'react-icons/fi';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

export default function PendingPage() {
  
  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/login';
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden" dir="rtl">
      {/* Background Effects */}
      <div className="site-bg">
        <div className="aurora-orb aurora-orb-1" />
        <div className="aurora-orb aurora-orb-4" />
      </div>

      <div className="relative z-10 glass rounded-[2.5rem] p-10 text-center max-w-md border border-white/10 shadow-2xl animate-fade-in">
        {/* Animated Icon Container */}
        <div className="relative w-24 h-24 mx-auto mb-8">
          <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping opacity-20" />
          <div className="relative w-full h-full gradient-primary rounded-3xl flex items-center justify-center shadow-lg shadow-primary/20 rotate-3">
            <FiClock className="text-4xl text-white animate-pulse" />
          </div>
        </div>

        <h1 className="text-3xl font-black text-white mb-4 tracking-tight">طلبك قيد المراجعة</h1>
        
        <p className="text-gray-400 mb-8 leading-relaxed font-medium">
          أهلاً بك! الأدمن يقوم حالياً بمراجعة بياناتك للتأكد من صحتها. 
          <span className="block mt-2 text-sm text-primary-light italic">سيتم تفعيل حسابك خلال 24 ساعة كحد أقصى.</span>
        </p>

        <div className="space-y-4">
          {/* WhatsApp Contact (Optional but recommended) */}
          <a 
            href="https://wa.me/201000000000" // حط رقم واتساب السكرتارية هنا
            target="_blank"
            className="w-full flex items-center justify-center gap-3 bg-[#25D366]/10 text-[#25D366] py-4 rounded-2xl font-bold border border-[#25D366]/20 hover:bg-[#25D366]/20 transition-all active:scale-95"
          >
            <FiPhone /> تواصل مع السكرتارية (واتساب)
          </a>

          {/* Logout Button */}
          <button 
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-3 bg-white/5 text-gray-400 py-4 rounded-2xl font-bold hover:bg-white/10 hover:text-white transition-all active:scale-95"
          >
            <FiLogOut /> تسجيل الخروج
          </button>
        </div>

        <div className="mt-10 pt-6 border-t border-white/5">
          <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">شكراً لصبرك يا بطل</p>
        </div>
      </div>
    </div>
  );
}
