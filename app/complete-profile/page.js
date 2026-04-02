'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function CompleteProfilePage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', parent_phone: '', stage: '', school: '', password: '', confirmPassword: '' });
  const [error, setError] = useState('');

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { window.location.href = '/login'; return; }
      setUser(user);
      if (user.user_metadata?.full_name) setForm(f => ({ ...f, name: user.user_metadata.full_name }));
    });
  }, []);

  const handleSubmit = async () => {
    if (!form.name || !form.phone || !form.stage) { setError('من فضلك اكمل كل البيانات المطلوبة'); return; }
    if (form.password && form.password !== form.confirmPassword) { setError('كلمتا المرور مش متطابقتين'); return; }
    if (form.password && form.password.length < 6) { setError('كلمة المرور لازم تكون 6 أحرف على الأقل'); return; }
    setLoading(true);
    setError('');

    // تحديث الباسورد لو اتكتب
    if (form.password) {
      await supabase.auth.updateUser({ password: form.password });
    }

    // إضافة أو تحديث الـ profile
    const { error: upsertError } = await supabase.from('students').upsert({
      user_id: user.id,
      name: form.name,
      email: user.email,
      phone: form.phone,
      parent_phone: form.parent_phone,
      stage: form.stage,
      school: form.school,
      status: 'pending',
      profile_complete: true,
    }, { onConflict: 'user_id' });

    if (upsertError) { setError(upsertError.message); setLoading(false); return; }

    await supabase.auth.signOut();
    window.location.href = '/pending';
  };

  return (
    <div className="min-h-screen flex items-center justify-center gradient-dark px-4" dir="rtl">
      <div className="glass rounded-2xl p-8 w-full max-w-md">
        <div className="text-center mb-6">
          <div className="text-4xl mb-3">👋</div>
          <h1 className="text-2xl font-black">اهلاً! كمّل بياناتك</h1>
          <p className="text-gray-400 text-sm mt-1">{user?.email}</p>
        </div>

        {error && <div className="bg-red-500/20 text-red-400 p-3 rounded-xl mb-4 text-sm">{error}</div>}

        <div className="space-y-4">
          <input type="text" placeholder="الاسم الكامل *" value={form.name}
            onChange={e => setForm({ ...form, name: e.target.value })}
            className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white focus:border-purple-500 focus:outline-none" />
          <input type="tel" placeholder="رقم الموبايل *" value={form.phone}
            onChange={e => setForm({ ...form, phone: e.target.value })}
            className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white focus:border-purple-500 focus:outline-none" />
          <input type="tel" placeholder="رقم ولي الأمر" value={form.parent_phone}
            onChange={e => setForm({ ...form, parent_phone: e.target.value })}
            className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white focus:border-purple-500 focus:outline-none" />
          <input type="text" placeholder="المرحلة الدراسية *" value={form.stage}
            onChange={e => setForm({ ...form, stage: e.target.value })}
            className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white focus:border-purple-500 focus:outline-none" />
          <input type="text" placeholder="المدرسة" value={form.school}
            onChange={e => setForm({ ...form, school: e.target.value })}
            className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white focus:border-purple-500 focus:outline-none" />

          <div className="border-t border-white/10 pt-4">
            <p className="text-gray-400 text-xs mb-3">اختياري — تحديد باسورد للدخول بالإيميل</p>
            <input type="password" placeholder="باسورد (اختياري)" value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white focus:border-purple-500 focus:outline-none mb-3" />
            {form.password && (
              <input type="password" placeholder="تأكيد الباسورد" value={form.confirmPassword}
                onChange={e => setForm({ ...form, confirmPassword: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white focus:border-purple-500 focus:outline-none" />
            )}
          </div>

          <button onClick={handleSubmit} disabled={loading}
            className="w-full gradient-primary py-3 rounded-xl text-white font-bold hover:opacity-90 disabled:opacity-50">
            {loading ? '⏳ جاري الحفظ...' : 'إرسال طلب التسجيل 🚀'}
          </button>
        </div>
      </div>
    </div>
  );
}
