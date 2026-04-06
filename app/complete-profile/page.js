'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

const STAGES = [
  'الصف الأول الإعدادي','الصف الثاني الإعدادي','الصف الثالث الإعدادي',
  'الصف الأول الثانوي','الصف الثاني الثانوي','الصف الثالث الثانوي',
];

export default function CompleteProfilePage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name:'', phone:'', parent_phone:'', stage:'', school:'', password:'', confirmPassword:'' });
  const [error, setError] = useState('');

  const inp = "w-full py-3 px-4 rounded-xl text-sm focus:outline-none";
  const inpStyle = { background:'var(--surface)', border:'1px solid var(--border)', color:'var(--text)' };

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { window.location.href = '/login'; return; }
      setUser(user);
      if (user.user_metadata?.full_name) setForm(f => ({ ...f, name: user.user_metadata.full_name }));
    });
  }, []);

  const handleSubmit = async () => {
    if (!form.name || !form.phone || !form.parent_phone || !form.stage || !form.school)
      return setError('من فضلك اكمل كل البيانات المطلوبة');
    if (form.password && form.password !== form.confirmPassword) return setError('كلمتا المرور مش متطابقتين');
    if (form.password && form.password.length < 6) return setError('كلمة المرور لازم 6 أحرف على الأقل');
    setLoading(true); setError('');

    if (form.password) await supabase.auth.updateUser({ password: form.password });

    const { data: existing } = await supabase.from('students').select('id').eq('email', user.email).single();
    let upsertError;
    if (existing) {
      const { error } = await supabase.from('students').update({
        user_id: user.id, name: form.name, phone: form.phone,
        parent_phone: form.parent_phone, stage: form.stage, school: form.school, profile_complete: true,
      }).eq('email', user.email);
      upsertError = error;
    } else {
      const { error } = await supabase.from('students').insert({
        user_id: user.id, name: form.name, email: user.email,
        phone: form.phone, parent_phone: form.parent_phone,
        stage: form.stage, school: form.school, status: 'pending', profile_complete: true,
      });
      upsertError = error;
    }
    if (upsertError) { setError(upsertError.message); setLoading(false); return; }
    await supabase.auth.signOut();
    window.location.href = '/pending';
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8 relative overflow-hidden"
      style={{ background: 'var(--bg)' }} dir="rtl">

      {/* Aurora */}
      <div aria-hidden="true" style={{ position:'fixed', inset:0, zIndex:0, pointerEvents:'none', overflow:'hidden' }}>
        <div className="aurora-orb aurora-orb-1" />
        <div className="aurora-orb aurora-orb-2" />
        <div className="aurora-orb aurora-orb-4" />
      </div>

      <div className="relative z-10 w-full max-w-md animate-fade-in">
        <div className="rounded-2xl p-7"
          style={{
            background: 'var(--glass-bg)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid var(--border)',
          }}>

          <div className="text-center mb-6">
            <div className="text-4xl mb-3">👋</div>
            <h1 className="text-2xl font-black" style={{ color: 'var(--text)' }}>اهلاً! كمّل بياناتك</h1>
            <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>{user?.email}</p>
          </div>

          {error && (
            <div className="p-3 rounded-xl mb-4 text-sm text-center"
              style={{ background:'rgba(248,113,113,0.1)', color:'#f87171', border:'1px solid rgba(248,113,113,0.2)' }}>
              {error}
            </div>
          )}

          <div className="space-y-3">
            <input className={inp} style={inpStyle} type="text" placeholder="الاسم الكامل *"
              value={form.name} onChange={e => setForm({...form, name:e.target.value})} />
            <input className={inp} style={inpStyle} type="tel" placeholder="رقم موبايلك *"
              value={form.phone} onChange={e => setForm({...form, phone:e.target.value})} />
            <input className={inp} style={inpStyle} type="tel" placeholder="رقم ولي الأمر *"
              value={form.parent_phone} onChange={e => setForm({...form, parent_phone:e.target.value})} />

            <select className={inp} style={{ ...inpStyle, cursor:'pointer' }}
              value={form.stage} onChange={e => setForm({...form, stage:e.target.value})}>
              <option value="">اختار الصف الدراسي *</option>
              {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>

            <input className={inp} style={inpStyle} type="text" placeholder="اسم المدرسة *"
              value={form.school} onChange={e => setForm({...form, school:e.target.value})} />

            <div className="pt-3" style={{ borderTop:'1px solid var(--border)' }}>
              <p className="text-xs mb-2" style={{ color:'var(--text-muted)' }}>اختياري — باسورد للدخول بالإيميل</p>
              <input className={inp} style={inpStyle} type="password" placeholder="باسورد (اختياري)"
                value={form.password} onChange={e => setForm({...form, password:e.target.value})} />
              {form.password && (
                <input className={`${inp} mt-2`} style={inpStyle} type="password" placeholder="تأكيد الباسورد"
                  value={form.confirmPassword} onChange={e => setForm({...form, confirmPassword:e.target.value})} />
              )}
            </div>

            <button onClick={handleSubmit} disabled={loading}
              className="w-full py-4 rounded-xl text-white font-black text-base disabled:opacity-50 transition hover:-translate-y-0.5"
              style={{
                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                boxShadow: loading ? 'none' : '0 4px 20px rgba(99,102,241,0.3)',
              }}>
              {loading ? '⏳ جاري الحفظ...' : 'إرسال طلب التسجيل 🚀'}
            </button>
          </div>

          <p className="text-center text-xs mt-4" style={{ color:'var(--text-faint)' }}>
            كل البيانات محمية ومشفرة 🔒
          </p>
        </div>
      </div>
    </div>
  );
}
