'use client';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { FiUser, FiMail, FiLock, FiPhone, FiBookOpen, FiExternalLink, FiArrowRight, FiCheck } from 'react-icons/fi';
import Link from 'next/link';
import toast from 'react-hot-toast';

const STAGES = [
  'الصف الأول الإعدادي', 'الصف الثاني الإعدادي', 'الصف الثالث الإعدادي',
  'الصف الأول الثانوي', 'الصف الثاني الثانوي', 'الصف الثالث الثانوي'
];

export default function RegisterPage() {
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [form, setForm] = useState({ 
    name: '', email: '', phone: '', parent_phone: '', stage: '', school: '', password: '' 
  });

  const validateForm = () => {
    if (!form.name || !form.email || !form.password || !form.phone || !form.parent_phone || !form.stage || !form.school) {
      setError('من فضلك أكمل جميع الحقول المطلوبة');
      return false;
    }
    if (form.password.length < 6) {
      setError('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
      return false;
    }
    if (!/^01[0-2,5]{1}[0-9]{8}$/.test(form.phone)) {
      setError('رقم الموبايل الشخصي غير صحيح');
      return false;
    }
    return true;
  };

  const handleRegister = async () => {
    if (!validateForm()) return;
    
    setLoading(true); 
    setError(''); 
    setStep('جاري إنشاء حسابك...');

    try {
      // 1. إنشاء الحساب في Supabase Auth
      const { data: authData, error: signUpError } = await supabase.auth.signUp({ 
        email: form.email, 
        password: form.password 
      });

      if (signUpError) throw signUpError;

      setStep('جاري حفظ بيانات الطالب...');
      
      // 2. إدخال البيانات في جدول الطلاب
      const { error: insertError } = await supabase.from('students').upsert({
        user_id: authData.user?.id, 
        name: form.name, 
        email: form.email,
        phone: form.phone, 
        parent_phone: form.parent_phone,
        stage: form.stage, 
        school: form.school, 
        status: 'pending', 
        profile_complete: true,
      }, { onConflict: 'email' });

      if (insertError) throw insertError;

      // 3. تسجيل الخروج لضمان عدم دخول الطالب قبل قبول الأدمن
      await supabase.auth.signOut();
      setSuccess(true);
      toast.success('تم إرسال طلبك بنجاح');
      
    } catch (err) {
      setError(err.message.includes('already registered') ? 'هذا البريد مسجل بالفعل' : err.message);
    } finally {
      setLoading(false);
    }
  };

  if (success) return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden bg-[#09090b]" dir="rtl">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-emerald-500/10 blur-[120px] rounded-full animate-pulse" />
      </div>
      
      <div className="relative z-10 glass rounded-[3rem] p-10 md:p-14 text-center max-w-md border border-emerald-500/20 shadow-[0_0_50px_rgba(16,185,129,0.1)] animate-fade-in">
        <div className="w-24 h-24 bg-emerald-500/10 text-emerald-500 rounded-[2rem] flex items-center justify-center mx-auto mb-8 text-5xl shadow-inner shadow-emerald-500/20 border border-emerald-500/20">
          <FiCheck className="animate-bounce" />
        </div>
        <h2 className="text-3xl font-black text-white mb-4 tracking-tight">أهلاً بك يا بطل!</h2>
        <p className="text-gray-400 mb-8 leading-relaxed font-medium">
          تم استقبال طلب انضمامك يا <span className="text-emerald-400 font-bold">{form.name.split(' ')[0]}</span>. الأدمن يراجع البيانات الآن وسنخطرك عند التفعيل.
        </p>
        <Link href="/login" className="gradient-primary w-full py-4.5 rounded-2xl text-white font-black inline-block shadow-lg shadow-purple-500/20 hover:scale-[1.02] active:scale-95 transition-all">
          العودة لتسجيل الدخول
        </Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-20 relative overflow-hidden bg-[#09090b]" dir="rtl">
      {/* Dynamic Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[20%] right-[-10%] w-[40%] h-[40%] bg-purple-600/10 blur-[150px] rounded-full" />
        <div className="absolute bottom-[10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 blur-[150px] rounded-full" />
      </div>

      <div className="relative z-10 glass rounded-[2.5rem] p-8 md:p-12 w-full max-w-2xl border border-white/10 shadow-2xl backdrop-blur-2xl">
        <div className="text-center mb-10">
          <div className="inline-block px-4 py-1.5 bg-purple-500/10 text-purple-400 text-[10px] font-black rounded-full border border-purple-500/20 uppercase tracking-widest mb-4">
            New Student Registration
          </div>
          <h1 className="text-4xl font-black text-white tracking-tight leading-tight">ابدأ رحلتك التعليمية</h1>
          <p className="text-gray-500 mt-2 font-medium">خطوة واحدة تفصلك عن أقوى محتوى تعليمي</p>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-4 rounded-2xl mb-8 text-sm font-bold bg-red-500/10 text-red-400 border border-red-500/20">
            <FiLock className="shrink-0" /> {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Inputs Group */}
          <div className="md:col-span-2 space-y-5">
            <div className="relative group">
              <FiUser className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-purple-500 transition-all" />
              <input className="input-field pr-12" type="text" placeholder="الاسم الرباعي كما في البطاقة/الشهادة" 
                value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
            </div>
            
            <div className="relative group">
              <FiMail className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-purple-500 transition-all" />
              <input className="input-field pr-12" type="email" placeholder="البريد الإلكتروني الشخصي" 
                value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
            </div>
          </div>

          <div className="relative group">
            <FiLock className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-purple-500 transition-all" />
            <input className="input-field pr-12" type="password" placeholder="كلمة المرور" 
              value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
          </div>

          <div className="relative group">
            <FiPhone className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-purple-500 transition-all" />
            <input className="input-field pr-12" type="tel" placeholder="رقم موبايلك (واتساب)" 
              value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
          </div>

          <div className="relative group">
            <FiPhone className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-purple-500 transition-all" />
            <input className="input-field pr-12" type="tel" placeholder="رقم موبايل ولي الأمر" 
              value={form.parent_phone} onChange={e => setForm({ ...form, parent_phone: e.target.value })} />
          </div>

          <div className="relative group">
            <FiBookOpen className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-purple-500 transition-all" />
            <select className="input-field pr-12 appearance-none cursor-pointer"
              value={form.stage} onChange={e => setForm({ ...form, stage: e.target.value })}>
              <option value="" className="bg-gray-900">اختر المرحلة الدراسية</option>
              {STAGES.map(s => <option key={s} value={s} className="bg-gray-900">{s}</option>)}
            </select>
          </div>

          <div className="relative group md:col-span-2">
            <FiExternalLink className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-purple-500 transition-all" />
            <input className="input-field pr-12" type="text" placeholder="اسم المدرسة بالكامل" 
              value={form.school} onChange={e => setForm({ ...form, school: e.target.value })} />
          </div>

          <button onClick={handleRegister} disabled={loading}
            className="w-full md:col-span-2 mt-6 gradient-primary py-4.5 rounded-2xl text-white font-black text-lg hover:shadow-2xl hover:shadow-purple-500/30 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-3">
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>{step}</span>
              </>
            ) : 'إنشاء الحساب والانضمام الآن'}
          </button>
        </div>

        <div className="text-center mt-10 pt-8 border-t border-white/5">
          <p className="text-gray-500 text-sm font-medium">
            لديك حساب بالفعل؟{' '}
            <Link href="/login" className="text-purple-400 font-black hover:text-purple-300 transition-colors">سجل دخولك من هنا</Link>
          </p>
          <Link href="/" className="inline-flex items-center gap-2 text-gray-600 hover:text-white transition-all text-xs mt-8 font-bold group">
            <FiArrowRight className="group-hover:translate-x-1 transition-transform" /> العودة للرئيسية
          </Link>
        </div>
      </div>

      <style jsx>{`
        .input-field {
          @apply w-full bg-white/[0.03] border border-white/10 rounded-2xl py-4 pr-12 pl-4 text-white placeholder:text-gray-600 focus:border-purple-500/50 focus:bg-white/[0.05] focus:outline-none transition-all text-sm;
        }
      `}</style>
    </div>
  );
}
