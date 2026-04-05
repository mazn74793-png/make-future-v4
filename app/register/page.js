'use client';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';

const STAGES = ['الصف الأول الإعدادي','الصف الثاني الإعدادي','الصف الثالث الإعدادي','الصف الأول الثانوي','الصف الثاني الثانوي','الصف الثالث الثانوي'];

export default function RegisterPage() {
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', phone: '', parent_phone: '', stage: '', school: '', password: '' });

  const inp = "w-full py-3 px-4 rounded-xl text-sm focus:outline-none";
  const inpStyle = { background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)' };

  const handleRegister = async () => {
    if (!form.name || !form.email || !form.password || !form.phone || !form.parent_phone || !form.stage || !form.school)
      return setError('من فضلك اكمل كل البيانات المطلوبة');
    if (form.password.length < 6) return setError('كلمة المرور لازم 6 أحرف على الأقل');
    setLoading(true); setError(''); setStep('جاري إنشاء الحساب...');

    const { data, error: signUpError } = await supabase.auth.signUp({ email: form.email, password: form.password });
    if (signUpError) {
      setError(signUpError.message.includes('already registered') ? 'الإيميل ده مسجّل بالفعل' : signUpError.message);
      return setLoading(false);
    }
    setStep('جاري حفظ بياناتك...');
    const { error: insertError } = await supabase.from('students').upsert({
      user_id: data.user?.id, name: form.name, email: form.email,
      phone: form.phone, parent_phone: form.parent_phone,
      stage: form.stage, school: form.school, status: 'pending', profile_complete: true,
    }, { onConflict: 'email' });
    if (insertError) { setError(insertError.message); return setLoading(false); }
    await supabase.auth.signOut();
    setSuccess(true); setLoading(false);
  };

  if (success) return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'var(--bg)' }} dir="rtl">
      <div className="p-10 text-center max-w-md rounded-2xl" style={{ background: 'var(--bg2)', border: '1px solid var(--border)' }}>
        <div className="text-6xl mb-4">✅</div>
        <h2 className="text-2xl font-black mb-2" style={{ color: 'var(--text)' }}>طلبك اتبعت!</h2>
        <p className="mb-6 text-sm" style={{ color: 'var(--text-muted)' }}>الأدمن هيراجع طلبك وهيتواصل معاك قريباً</p>
        <a href="/login" className="px-8 py-3 rounded-xl text-white font-bold inline-block"
          style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>رجوع لتسجيل الدخول</a>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8" style={{ background: 'var(--bg)' }} dir="rtl">
      <div className="w-full max-w-md rounded-2xl p-6" style={{ background: 'var(--bg2)', border: '1px solid var(--border)' }}>
        <div className="text-center mb-6">
          <h1 className="text-2xl font-black" style={{ color: 'var(--text)' }}>إنشاء حساب جديد</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>كل البيانات مطلوبة</p>
        </div>

        {error && <div className="p-3 rounded-xl mb-4 text-sm text-center" style={{ background: 'rgba(248,113,113,0.1)', color: '#f87171', border: '1px solid rgba(248,113,113,0.2)' }}>{error}</div>}

        <div className="space-y-3">
          <input className={inp} style={inpStyle} type="text" placeholder="الاسم الكامل *"
            value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
          <input className={inp} style={inpStyle} type="email" placeholder="البريد الإلكتروني *"
            value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
          <input className={inp} style={inpStyle} type="password" placeholder="كلمة المرور * (6 أحرف على الأقل)"
            value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
          <input className={inp} style={inpStyle} type="tel" placeholder="رقم موبايلك *"
            value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
          <input className={inp} style={inpStyle} type="tel" placeholder="رقم ولي الأمر *"
            value={form.parent_phone} onChange={e => setForm({ ...form, parent_phone: e.target.value })} />

          {/* Stage Dropdown */}
          <select className={inp} style={{ ...inpStyle, cursor: 'pointer' }}
            value={form.stage} onChange={e => setForm({ ...form, stage: e.target.value })}>
            <option value="">اختار الصف الدراسي *</option>
            {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>

          <input className={inp} style={inpStyle} type="text" placeholder="اسم المدرسة *"
            value={form.school} onChange={e => setForm({ ...form, school: e.target.value })} />

          <button onClick={handleRegister} disabled={loading}
            className="w-full py-3 rounded-xl text-white font-bold flex items-center justify-center gap-2 disabled:opacity-50"
            style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
            {loading ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />{step}</> : 'إرسال طلب التسجيل'}
          </button>
        </div>

        <p className="text-center text-sm mt-4" style={{ color: 'var(--text-muted)' }}>
          عندك حساب؟ <a href="/login" style={{ color: '#818cf8' }} className="font-bold">سجل دخول</a>
        </p>
      </div>
    </div>
  );
}
