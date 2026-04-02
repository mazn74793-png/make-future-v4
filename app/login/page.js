'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';
import { FiMail, FiLock, FiLogIn } from 'react-icons/fi';
import Link from 'next/link';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(true);
  const [googleLoading, setGoogleLoading] = useState(false);

  useEffect(() => {
    const check = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }
      const { data: admin } = await supabase.from('admins').select('id').eq('email', user.email).single();
      if (admin) { window.location.href = '/dashboard'; return; }
      const { data: student } = await supabase.from('students').select('status, profile_complete').eq('user_id', user.id).single();
      if (!student || !student.profile_complete) { window.location.href = '/complete-profile'; return; }
      if (student?.status === 'approved') { window.location.href = '/student'; return; }
      if (student?.status === 'pending') { window.location.href = '/pending'; return; }
      setLoading(false);
    };
    check();
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) { toast.error('❌ إيميل أو باسورد غلط'); setLoading(false); return; }
    const user = data.user;
    const { data: admin } = await supabase.from('admins').select('id').eq('email', user.email).single();
    if (admin) { window.location.href = '/dashboard'; return; }
    const { data: student } = await supabase.from('students').select('status').eq('user_id', user.id).single();
    if (student?.status === 'approved') { window.location.href = '/student'; return; }
    if (student?.status === 'pending') { window.location.href = '/pending'; return; }
    if (student?.status === 'rejected') { await supabase.auth.signOut(); toast.error('❌ تم رفض طلبك'); }
    setLoading(false);
  };

  const handleGoogle = async () => {
    setGoogleLoading(true);
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` }
    });
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center gradient-dark">
      <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen flex items-center justify-center gradient-dark px-4">
      <div className="absolute top-20 right-20 w-72 h-72 bg-purple-500/20 rounded-full blur-3xl" />
      <div className="absolute bottom-20 left-20 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl" />
      <div className="relative z-10 glass rounded-3xl p-8 w-full max-w-md animate-fade-in">
        <div className="text-center mb-8">
          <div className="w-16 h-16 gradient-primary rounded-2xl flex items-center justify-center mx-auto mb-4">
            <FiLogIn className="text-3xl text-white" />
          </div>
          <h1 className="text-3xl font-black">تسجيل الدخول</h1>
          <p className="text-gray-400 mt-2">ادخل بياناتك عشان تكمل</p>
        </div>

        {/* Google Login */}
        <button onClick={handleGoogle} disabled={googleLoading}
          className="w-full bg-white text-gray-800 py-3 rounded-xl font-bold flex items-center justify-center gap-3 hover:bg-gray-100 transition mb-6 disabled:opacity-50">
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          {googleLoading ? 'جاري...' : 'دخول بحساب Google'}
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="flex-1 h-px bg-white/10" />
          <span className="text-gray-500 text-sm">أو بالإيميل</span>
          <div className="flex-1 h-px bg-white/10" />
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="text-sm text-gray-400 mb-1 block">الإيميل</label>
            <div className="relative">
              <FiMail className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500" />
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="example@email.com"
                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pr-12 pl-4 text-white placeholder:text-gray-600 focus:border-purple-500 focus:outline-none transition" required />
            </div>
          </div>
          <div>
            <label className="text-sm text-gray-400 mb-1 block">الباسورد</label>
            <div className="relative">
              <FiLock className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500" />
              <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pr-12 pl-4 text-white placeholder:text-gray-600 focus:border-purple-500 focus:outline-none transition" required />
            </div>
          </div>
          <button type="submit"
            className="w-full gradient-primary py-3 rounded-xl text-white font-bold text-lg hover:opacity-90 transition">
            🚀 دخول
          </button>
        </form>

        <div className="text-center mt-6 space-y-2">
          <p className="text-gray-500 text-sm">
            مش عندك حساب؟{' '}
            <Link href="/register" className="text-purple-400 font-semibold">سجل هنا</Link>
          </p>
          <Link href="/" className="text-gray-400 hover:text-white transition text-sm block">← رجوع للرئيسية</Link>
        </div>
      </div>
    </div>
  );
}
