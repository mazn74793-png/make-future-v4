'use client';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { FiUser, FiMail, FiLock, FiPhone, FiBookOpen, FiExternalLink, FiArrowRight } from 'react-icons/fi';
import Link from 'next/link';

const STAGES = ['الصف الأول الإعدادي','الصف الثاني الإعدادي','الصف الثالث الإعدادي','الصف الأول الثانوي','الصف الثاني الثانوي','الصف الثالث الثانوي'];

export default function RegisterPage() {
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', phone: '', parent_phone: '', stage: '', school: '', password: '' });

  const handleRegister = async () => {
    if (!form.name || !form.email || !form.password || !form.phone || !form.parent_phone || !form.stage || !form.school)
      return setError('من فضلك أكمل جميع الحقول المطلوبة');
    if (form.password.length < 6) return setError('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
    
    setLoading(true); 
    setError(''); 
    setStep('إنشاء الحساب...');

    const { data, error: signUpError } = await supabase.auth.signUp({ 
      email: form.email, 
      password: form.password 
    });

    if (signUpError) {
      setError(signUpError.message.includes('already registered') ? 'هذا البريد مسجل بالفعل' : signUpError.message);
      return setLoading(false);
    }

    setStep('حفظ البيانات...');
    const { error: insertError } = await supabase.from('students').upsert({
      user_id: data.user?.id, 
      name: form.name, 
      email: form.email,
      phone: form.phone, 
      parent_phone: form.parent_phone,
      stage: form.stage, 
      school: form.school, 
      status: 'pending', 
      profile_complete: true,
    }, { onConflict: 'email' });

    if (insertError) { 
      setError(insertError.message); 
      return setLoading(false); 
    }

    await supabase.auth.signOut();
    setSuccess(true); 
    setLoading(false);
  };

  if (success) return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden" dir="rtl">
      <div className="site-bg"><div className="aurora-orb aurora-orb-1" /><div className="aurora-orb aurora-orb-2" /></div>
      <div className="relative z-10 glass rounded-[2.5rem] p-10 text-center max-w-md border border-emerald-500/20 shadow-2xl animate-fade-in">
        <div className="w-20 h-20 bg-emerald-500/20 text-emerald-500 rounded-3xl flex items-center justify-center mx-auto mb-6 text-4xl animate-bounce">
          ✓
        </div>
        <h2 className="text-3xl font-black text-white mb-4">تم إرسال طلبك!</h2>
        <p className="text-gray-400 mb-8 leading-relaxed font-medium">
          شكراً لتسجيلك يا <span className="text-emerald-400">{form.name.split(' ')[0]}</span>. الطلب الآن قيد المراجعة، وسيتم تفعيل حسابك من قبل الإدارة قريباً.
        </p>
        <Link href="/login" className="gradient-primary w-full py-4 rounded-2xl text-white font-black inline-block shadow-lg shadow-purple-500/20 active:scale-95 transition-transform">
          العودة لتسجيل الدخول
        </Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 relative overflow-hidden" dir="rtl">
      {/* Background Orbs */}
      <div className="site-bg">
        <div className="aurora-orb aurora-orb-1" />
        <div className="aurora-orb aurora-orb-3" />
      </div>

      <div className="relative z-10 glass rounded-[2.5rem] p-8 md:p-10 w-full max-w-xl border border-white/10 shadow-2xl animate-fade-in">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black text-white">طالب جديد؟</h1>
          <p className="text-gray-400 mt-2 font-medium italic">انضم لرحلة النجاح في دقائق..</p>
        </div>

        {error && (
          <div className="p-4 rounded-2xl mb-6 text-sm text-center font-bold bg-red-500/10 text-red-400 border border-red-500/20 animate-pulse">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Inputs Group */}
          <div className="space-y-4 md:col-span-2">
             <div className="relative group">
              <FiUser className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-purple-500 transition-colors" />
              <input className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 pr-12 pl-4 text-white focus:border-purple-500/50 focus:outline-none transition-all" 
                type="text" placeholder="الاسم الكامل" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="relative group">
              <FiMail className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-purple-500 transition-colors" />
              <input className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 pr-12 pl-4 text-white focus:border-purple-500/50 focus:outline-none transition-all" 
                type="email" placeholder="البريد الإلكتروني" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
            </div>
          </div>

          <div className="relative group">
            <FiLock className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-purple-500 transition-colors" />
            <input className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 pr-12 pl-4 text-white focus:border-purple-500/50 focus:outline-none transition-all text-xs" 
              type="password" placeholder="كلمة المرور (6+)" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
          </div>

          <div className="relative group">
            <FiPhone className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-purple-500 transition-colors" />
            <input className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 pr-12 pl-4 text-white focus:border-purple-500/50 focus:outline-none transition-all" 
              type="tel" placeholder="موبايلك" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
          </div>

          <div className="relative group">
            <FiPhone className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-purple-500 transition-colors" />
            <input className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 pr-12 pl-4 text-white focus:border-purple-500/50 focus:outline-none transition-all" 
              type="tel" placeholder="موبايل ولي الأمر" value={form.parent_phone} onChange={e => setForm({ ...form, parent_phone: e.target.value })} />
          </div>

          <div className="relative group">
            <FiBookOpen className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-purple-500 transition-colors" />
            <select className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 pr-12 pl-4 text-white focus:border-purple-500/50 focus:outline-none transition-all appearance-none"
              value={form.stage} onChange={e => setForm({ ...form, stage: e.target.value })}>
              <option value="" className="bg-gray-900">الصف الدراسي</option>
              {STAGES.map(s => <option key={s} value={s} className="bg-gray-900">{s}</option>)}
            </select>
          </div>

          <div className="relative group md:col-span-2">
            <FiExternalLink className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-purple-500 transition-colors" />
            <input className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 pr-12 pl-4 text-white focus:border-purple-500/50 focus:outline-none transition-all" 
              type="text" placeholder="اسم المدرسة" value={form.school} onChange={e => setForm({ ...form, school: e.target.value })} />
          </div>

          <button onClick={handleRegister} disabled={loading}
            className="w-full md:col-span-2 mt-4 gradient-primary py-4 rounded-2xl text-white font-black text-lg hover:shadow-xl hover:shadow-purple-500/20 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-3">
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>{step}</span>
              </>
            ) : 'إنشاء الحساب وإرسال الطلب'}
          </button>
        </div>

        <div className="text-center mt-8 pt-6 border-t border-white/5">
          <p className="text-gray-400 text-sm">
            بالفعل طالب مسجل؟{' '}
            <Link href="/login" className="text-purple-400 font-black hover:underline underline-offset-4">سجل دخولك</Link>
          </p>
          <Link href="/" className="inline-flex items-center gap-2 text-gray-500 hover:text-white transition-all text-xs mt-6 font-bold group">
            <FiArrowRight className="group-hover:translate-x-1 transition-transform" /> العودة للرئيسية
          </Link>
        </div>
      </div>
    </div>
  );
}
