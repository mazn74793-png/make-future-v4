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

  // لو مسجل بالفعل — وجهه فوراً
  useEffect(() => {
    const check = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      const { data: admin } = await supabase.from('admins').select('id').eq('email', user.email).single();
      if (admin) { window.location.href = '/dashboard'; return; }

      const { data: student } = await supabase.from('students').select('status').eq('user_id', user.id).single();
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
        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="text-sm text-gray-400 mb-1 block">الإيميل</label>
            <div className="relative">
              <FiMail className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500" />
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="example@email.com"
                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pr-12 pl-4 text-white placeholder:text-gray-600 focus:border-purple-500 focus:outline-none transition"
                required />
            </div>
          </div>
          <div>
            <label className="text-sm text-gray-400 mb-1 block">الباسورد</label>
            <div className="relative">
              <FiLock className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500" />
              <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pr-12 pl-4 text-white placeholder:text-gray-600 focus:border-purple-500 focus:outline-none transition"
                required />
            </div>
          </div>
          <button type="submit" disabled={loading}
            className="w-full gradient-primary py-3 rounded-xl text-white font-bold text-lg hover:opacity-90 transition disabled:opacity-50">
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
