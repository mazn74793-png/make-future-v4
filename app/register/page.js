'use client';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function RegisterPage() {
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(''); // رسالة الخطوة الحالية
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [form, setForm] = useState({
    name: '', email: '', phone: '', parent_phone: '', stage: '', school: '', password: ''
  });

  const handleRegister = async () => {
    if (!form.name || !form.email || !form.password) {
      setError('من فضلك اكمل الاسم والايميل وكلمة المرور');
      return;
    }
    if (form.password.length < 6) { setError('كلمة المرور لازم 6 أحرف على الأقل'); return; }

    setLoading(true);
    setError('');
    setStep('جاري إنشاء الحساب...');

    const { data, error: signUpError } = await supabase.auth.signUp({
      email: form.email, password: form.password,
    });

    if (signUpError) {
      setError(signUpError.message.includes('already registered')
        ? 'الإيميل ده مسجّل بالفعل، جرّب تسجيل الدخول'
        : signUpError.message);
      setLoading(false); setStep(''); return;
    }

    setStep('جاري حفظ بياناتك...');

    const { error: insertError } = await supabase.from('students').upsert({
      user_id: data.user?.id,
      name: form.name, email: form.email,
      phone: form.phone, parent_phone: form.parent_phone,
      stage: form.stage, school: form.school,
      status: 'pending', profile_complete: true,
    }, { onConflict: 'email' });

    if (insertError) {
      setError(insertError.message);
      setLoading(false); setStep(''); return;
    }

    setStep('تم! جاري الإنهاء...');
    await supabase.auth.signOut();
    setSuccess(true);
    setLoading(false); setStep('');
  };

  if (success) return (
    <div className="min-h-screen flex items-center justify-center gradient-dark" dir="rtl">
      <div className="glass rounded-2xl p-10 text-center max-w-md animate-fade-in">
        <div className="text-6xl mb-4">✅</div>
        <h2 className="text-2xl font-black mb-2">طلبك اتبعت!</h2>
        <p className="text-gray-400 mb-6">الأدمن هيراجع طلبك وهيتواصل معاك قريباً</p>
        <a href="/login" className="gradient-primary px-8 py-3 rounded-xl text-white font-bold inline-block">
          رجوع لتسجيل الدخول
        </a>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex items-center justify-center gradient-dark px-4" dir="rtl">
      <div className="glass rounded-2xl p-8 w-full max-w-md">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-black">إنشاء حساب جديد</h1>
          <p className="text-gray-400 text-sm mt-1">سجّل وانتظر موافقة الأدمن</p>
        </div>

        {error && <div className="bg-red-500/20 text-red-400 p-3 rounded-xl mb-4 text-sm">{error}</div>}

        <div className="space-y-3">
          {[
            { key: 'name', ph: 'الاسم الكامل *', type: 'text' },
            { key: 'email', ph: 'البريد الإلكتروني *', type: 'email' },
            { key: 'password', ph: 'كلمة المرور * (6 أحرف على الأقل)', type: 'password' },
            { key: 'phone', ph: 'رقم الموبايل', type: 'tel' },
            { key: 'parent_phone', ph: 'رقم ولي الأمر', type: 'tel' },
            { key: 'stage', ph: 'المرحلة الدراسية', type: 'text' },
            { key: 'school', ph: 'المدرسة', type: 'text' },
          ].map(({ key, ph, type }) => (
            <input key={key} type={type} placeholder={ph} value={form[key]}
              onChange={e => setForm({ ...form, [key]: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white focus:border-purple-500 focus:outline-none text-sm" />
          ))}

          <button onClick={handleRegister} disabled={loading}
            className="w-full gradient-primary py-3 rounded-xl text-white font-bold hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2">
            {loading ? (
              <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />{step || 'جاري...'}</>
            ) : 'إرسال طلب التسجيل'}
          </button>
        </div>

        <p className="text-center text-sm text-gray-400 mt-4">
          عندك حساب؟ <a href="/login" className="text-purple-400 font-semibold">سجل دخول</a>
        </p>
      </div>
    </div>
  );
}
