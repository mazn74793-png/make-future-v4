'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { FiUser, FiPhone, FiBookOpen, FiHome, FiLock, FiCheckCircle } from 'react-icons/fi';

const STAGES = ['الصف الأول الإعدادي','الصف الثاني الإعدادي','الصف الثالث الإعدادي','الصف الأول الثانوي','الصف الثاني الثانوي','الصف الثالث الثانوي'];

export default function CompleteProfilePage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', parent_phone: '', stage: '', school: '', password: '', confirmPassword: '' });
  const [error, setError] = useState('');

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { window.location.href = '/login'; return; }
      setUser(user);
      // سحب الاسم لو متاح من جوجل تلقائياً
      if (user.user_metadata?.full_name) setForm(f => ({ ...f, name: user.user_metadata.full_name }));
    });
  }, []);

  const handleSubmit = async () => {
    if (!form.name || !form.phone || !form.parent_phone || !form.stage || !form.school)
      return setError('من فضلك أكمل كل البيانات المطلوبة ⚠️');
    
    if (form.password && form.password !== form.confirmPassword) 
      return setError('كلمتا المرور غير متطابقتين ❌');
    
    if (form.password && form.password.length < 6) 
      return setError('كلمة المرور يجب أن تكون 6 أحرف على الأقل 🔒');

    setLoading(true); 
    setError('');

    // تحديث الباسورد لو الطالب حابب يضيف واحد لحسابه
    if (form.password) await supabase.auth.updateUser({ password: form.password });

    const { data: existing } = await supabase.from('students').select('id').eq('email', user.email).single();
    
    let upsertError;
    const profileData = {
      user_id: user.id, 
      name: form.name, 
      phone: form.phone,
      parent_phone: form.parent_phone, 
      stage: form.stage, 
      school: form.school, 
      profile_complete: true,
    };

    if (existing) {
      const { error } = await supabase.from('students').update(profileData).eq('email', user.email);
      upsertError = error;
    } else {
      const { error } = await supabase.from('students').insert({
        ...profileData,
        email: user.email,
        status: 'pending'
      });
      upsertError = error;
    }

    if (upsertError) { 
      setError(upsertError.message); 
      setLoading(false); 
      return; 
    }

    // تسجيل خروج عشان السيستم يوجهه لصفحة الـ Pending صح
    await supabase.auth.signOut();
    window.location.href = '/pending';
  };

  if (!user) return (
    <div className="min-h-screen flex items-center justify-center bg-[#09090b]">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 relative overflow-hidden" dir="rtl">
      {/* Background Decor */}
      <div className="site-bg">
        <div className="aurora-orb aurora-orb-1 opacity-50" />
        <div className="aurora-orb aurora-orb-3 opacity-30" />
      </div>

      <div className="relative z-10 glass rounded-[2.5rem] p-8 md:p-10 w-full max-w-xl border border-white/10 shadow-2xl animate-fade-in">
        <div className="text-center mb-10">
          <div className="w-16 h-16 gradient-primary rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-primary/20 rotate-6">
            <span className="text-3xl">👋</span>
          </div>
          <h1 className="text-3xl font-black text-white">خطوة أخيرة!</h1>
          <p className="text-gray-400 mt-2 font-medium">مرحباً <span className="text-primary-light">{user.email}</span>، أكمل بياناتك لتفعيل الحساب.</p>
        </div>

        {error && (
          <div className="p-4 rounded-2xl mb-6 text-sm text-center font-bold bg-red-500/10 text-red-400 border border-red-500/20 animate-pulse">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative group md:col-span-2">
            <FiUser className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-primary transition-colors" />
            <input className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 pr-12 pl-4 text-white focus:border-primary/50 focus:outline-none transition-all" 
              type="text" placeholder="الاسم الكامل" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
          </div>

          <div className="relative group">
            <FiPhone className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-primary transition-colors" />
            <input className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 pr-12 pl-4 text-white focus:border-primary/50 focus:outline-none transition-all" 
              type="tel" placeholder="رقم موبايلك" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
          </div>

          <div className="relative group">
            <FiPhone className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-primary transition-colors" />
            <input className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 pr-12 pl-4 text-white focus:border-primary/50 focus:outline-none transition-all" 
              type="tel" placeholder="رقم ولي الأمر" value={form.parent_phone} onChange={e => setForm({ ...form, parent_phone: e.target.value })} />
          </div>

          <div className="relative group">
            <FiBookOpen className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-primary transition-colors" />
            <select className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 pr-12 pl-4 text-white focus:border-primary/50 focus:outline-none transition-all appearance-none"
              value={form.stage} onChange={e => setForm({ ...form, stage: e.target.value })}>
              <option value="" className="bg-[#111116]">السنة الدراسية</option>
              {STAGES.map(s => <option key={s} value={s} className="bg-[#111116]">{s}</option>)}
            </select>
          </div>

          <div className="relative group">
            <FiHome className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-primary transition-colors" />
            <input className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 pr-12 pl-4 text-white focus:border-primary/50 focus:outline-none transition-all" 
              type="text" placeholder="اسم المدرسة" value={form.school} onChange={e => setForm({ ...form, school: e.target.value })} />
          </div>

          <div className="md:col-span-2 pt-4">
            <div className="flex items-center gap-2 mb-4">
              <div className="h-px flex-1 bg-white/10"></div>
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">تأمين الحساب (اختياري)</span>
              <div className="h-px flex-1 bg-white/10"></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div className="relative group">
                <FiLock className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-primary transition-colors" />
                <input className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 pr-12 pl-4 text-white focus:border-primary/50 focus:outline-none transition-all" 
                  type="password" placeholder="كلمة سر جديدة" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
              </div>
              <div className="relative group">
                <FiLock className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-primary transition-colors" />
                <input className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 pr-12 pl-4 text-white focus:border-primary/50 focus:outline-none transition-all" 
                  type="password" placeholder="تأكيد كلمة السر" value={form.confirmPassword} onChange={e => setForm({ ...form, confirmPassword: e.target.value })} />
              </div>
            </div>
          </div>

          <button onClick={handleSubmit} disabled={loading}
            className="w-full md:col-span-2 mt-6 gradient-primary py-4 rounded-2xl text-white font-black text-lg hover:shadow-xl hover:shadow-primary/20 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-3">
            {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><FiCheckCircle className="text-xl" /> حفظ البيانات وإرسال الطلب</>}
          </button>
        </div>
      </div>
    </div>
  );
}
