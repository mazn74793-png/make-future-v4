'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';
import { FiMail, FiLock, FiLogIn, FiArrowRight } from 'react-icons/fi';
import Link from 'next/link';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      // التحقق هل هو أدمن؟
      const { data: admin } = await supabase.from('admins').select('id').eq('email', user.email).single();
      if (admin) { window.location.href = '/dashboard'; return; }

      // التحقق من حالة الطالب
      const { data: student } = await supabase.from('students').select('status, profile_complete').eq('user_id', user.id).single();
      
      if (!student || !student.profile_complete) { window.location.href = '/complete-profile'; return; }
      if (student.status === 'approved') { window.location.href = '/student'; return; }
      if (student.status === 'pending') { window.location.href = '/pending'; return; }
      
      setLoading(false);
    };
    checkUser();
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setAuthLoading(true);
    
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    
    if (error) { 
      toast.error('❌ البريد أو كلمة المرور غير صحيحة'); 
      setAuthLoading(false); 
      return; 
    }

    const user = data.user;
    const { data: admin } = await supabase.from('admins').select('id').eq('email', user.email).single();
    
    if (admin) { window.location.href = '/dashboard'; return; }

    const { data: student } = await supabase.from('students').select('status').eq('user_id', user.id).single();
    
    if (student?.status === 'approved') { window.location.href = '/student'; return; }
    if (student?.status === 'pending') { window.location.href = '/pending'; return; }
    if (student?.status === 'rejected') { 
      await supabase.auth.signOut(); 
      toast.error('❌ معذرةً، تم رفض طلب انضمامك'); 
    }
    
    setAuthLoading(false);
  };

  const handleGoogle = async () => {
    setGoogleLoading(true);
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` }
    });
  };

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#09090b]">
      <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mb-4" />
      <p className="text-gray-500 font-bold animate-pulse">جاري التحقق...</p>
    </div>
  );

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden" dir="rtl">
      {/* Aurora Background Effects */}
      <div className="site-bg">
        <div className="aurora-orb aurora-orb-1" />
        <div className="aurora-orb aurora-orb-2" />
      </div>

      <div className="relative z-10 glass rounded-[2.5rem] p-8 md:p-12 w-full max-w-md animate-fade-in border border-white/10 shadow-2xl">
        <div className="text-center mb-10">
          <div className="w-20 h-20 gradient-primary rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-purple-500/20 rotate-3 hover:rotate-0 transition-transform duration-500">
            <FiLogIn className="text-4xl text-white" />
          </div>
          <h1 className="text-4xl font-black tracking-tight text-white">دخول المنصة</h1>
          <p className="text-gray-400 mt-3 font-medium">سجل دخولك لمتابعة دروسك اليوم</p>
        </div>

        {/* Google Login */}
        <button 
          onClick={handleGoogle} 
          disabled={googleLoading || authLoading}
          className="w-full bg-white text-gray-900 py-3.5 rounded-2xl font-black flex items-center justify-center gap-3 hover:bg-gray-100 transition-all active:scale-95 disabled:opacity-50 shadow-xl shadow-white/5"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          {googleLoading ? 'جاري الاتصال...' : 'الدخول بواسطة جوجل'}
        </button>

        <div className="flex items-center gap-4 my-8">
          <div className="flex-1 h-px bg-white/5" />
          <span className="text-gray-500 text-xs font-bold uppercase tracking-widest">أو الإيميل الشخصي</span>
          <div className="flex-1 h-px bg-white/5" />
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-400 mr-1 uppercase">البريد الإلكتروني</label>
            <div className="relative group">
              <FiMail className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-purple-500 transition-colors" />
              <input 
                type="email" 
                value={email} 
                onChange={e => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 pr-12 pl-4 text-white focus:border-purple-500/50 focus:outline-none focus:ring-4 focus:ring-purple-500/10 transition-all" 
                required 
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-400 mr-1 uppercase">كلمة المرور</label>
            <div className="relative group">
              <FiLock className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-purple-500 transition-colors" />
              <input 
                type="password" 
                value={password} 
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 pr-12 pl-4 text-white focus:border-purple-500/50 focus:outline-none focus:ring-4 focus:ring-purple-500/10 transition-all" 
                required 
              />
            </div>
          </div>

          <button 
            type="submit"
            disabled={authLoading || googleLoading}
            className="w-full gradient-primary py-4 rounded-2xl text-white font-black text-lg hover:shadow-xl hover:shadow-purple-500/20 transition-all active:scale-[0.98] disabled:opacity-50"
          >
            {authLoading ? 'جاري التحقق...' : 'تسجيل الدخول'}
          </button>
        </form>

        <div className="text-center mt-10 pt-6 border-t border-white/5">
          <p className="text-gray-400 text-sm font-medium">
            طالب جديد؟{' '}
            <Link href="/register" className="text-purple-400 font-black hover:text-purple-300 transition-colors underline underline-offset-4">أنشئ حسابك الآن</Link>
          </p>
          <Link href="/" className="inline-flex items-center gap-2 text-gray-500 hover:text-white transition-all text-xs mt-6 font-bold group">
            <FiArrowRight className="group-hover:translate-x-1 transition-transform" /> العودة للرئيسية
          </Link>
        </div>
      </div>
    </div>
  );
}
