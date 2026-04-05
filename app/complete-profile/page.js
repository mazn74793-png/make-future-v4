'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation'; // استخدام Router أسرع
import { supabase } from '@/lib/supabase';
import { FiUser, FiPhone, FiBookOpen, FiHome, FiLock, FiCheckCircle, FiChevronDown } from 'react-icons/fi';
import toast from 'react-hot-toast';

const STAGES = ['الصف الأول الإعدادي','الصف الثاني الإعدادي','الصف الثالث الإعدادي','الصف الأول الثانوي','الصف الثاني الثانوي','الصف الثالث الثانوي'];

export default function CompleteProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', parent_phone: '', stage: '', school: '', password: '', confirmPassword: '' });

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.replace('/login'); return; }
      setUser(user);
      if (user.user_metadata?.full_name) setForm(f => ({ ...f, name: user.user_metadata.full_name }));
    };
    checkUser();
  }, [router]);

  const handleSubmit = async () => {
    // التحقق من البيانات
    if (!form.name || !form.phone || !form.parent_phone || !form.stage || !form.school)
      return toast.error('من فضلك أكمل كل البيانات المطلوبة ⚠️');
    
    if (form.password) {
        if (form.password.length < 6) return toast.error('كلمة المرور ضعيفة جداً 🔒');
        if (form.password !== form.confirmPassword) return toast.error('كلمتا المرور غير متطابقتين ❌');
    }

    setLoading(true);

    try {
      // 1. تحديث الباسورد لو موجود
      if (form.password) {
        const { error: pwdErr } = await supabase.auth.updateUser({ password: form.password });
        if (pwdErr) throw pwdErr;
      }

      // 2. تحديث البيانات في الجدول
      const profileData = {
        user_id: user.id,
        email: user.email,
        name: form.name,
        phone: form.phone,
        parent_phone: form.parent_phone,
        stage: form.stage,
        school: form.school,
        profile_complete: true,
        status: 'pending', // دايماً بيرجع pending للمراجعة
        updated_at: new Date()
      };

      const { error: dbError } = await supabase
        .from('students')
        .upsert(profileData, { onConflict: 'email' }); // استخدام upsert مباشر

      if (dbError) throw dbError;

      toast.success('تم حفظ بياناتك بنجاح! 🎉');
      
      // التوجه لصفحة الانتظار (بدون عمل Logout)
      router.push('/pending');

    } catch (err) {
      toast.error(err.message || 'حدث خطأ غير متوقع');
      setLoading(false);
    }
  };

  if (!user) return <div className="min-h-screen flex items-center justify-center bg-[#09090b]"><div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 relative overflow-hidden" dir="rtl">
      {/* Orbs Decor */}
      <div className="site-bg">
        <div className="aurora-orb aurora-orb-1 opacity-40" />
        <div className="aurora-orb aurora-orb-2 opacity-30" />
      </div>

      <div className="relative z-10 glass rounded-[2.5rem] p-8 md:p-10 w-full max-w-xl border border-white/10 shadow-2xl animate-fade-in">
        <div className="text-center mb-8">
          <div className="w-16 h-16 gradient-primary rounded-[1.2rem] flex items-center justify-center mx-auto mb-4 shadow-xl shadow-primary/20 rotate-6 transform transition-transform hover:rotate-0 cursor-default">
            <span className="text-3xl">📝</span>
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">أهلاً بك معنا!</h1>
          <p className="text-gray-400 mt-2 text-sm">نحتاج لبعض التفاصيل البسيطة لنبدأ الرحلة التعليمية.</p>
        </div>

        <div className="space-y-4">
          {/* الاسم */}
          <div className="relative group">
            <FiUser className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-primary transition-colors z-10" />
            <input className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pr-12 pl-4 text-white focus:border-primary/50 focus:outline-none transition-all placeholder:text-gray-600 text-sm font-bold" 
              type="text" placeholder="الاسم الكامل للطالب" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* رقم الطالب */}
            <div className="relative group">
              <FiPhone className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-primary transition-colors z-10" />
              <input className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pr-12 pl-4 text-white focus:border-primary/50 focus:outline-none transition-all placeholder:text-gray-600 text-sm font-bold" 
                type="tel" placeholder="رقم موبايلك" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
            </div>

            {/* رقم ولي الأمر */}
            <div className="relative group">
              <FiPhone className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-primary transition-colors z-10" />
              <input className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pr-12 pl-4 text-white focus:border-primary/50 focus:outline-none transition-all placeholder:text-gray-600 text-sm font-bold" 
                type="tel" placeholder="رقم ولي الأمر" value={form.parent_phone} onChange={e => setForm({ ...form, parent_phone: e.target.value })} />
            </div>

            {/* السنة الدراسية */}
            <div className="relative group">
              <FiBookOpen className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-primary transition-colors z-10" />
              <select className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pr-12 pl-4 text-white focus:border-primary/50 focus:outline-none transition-all appearance-none text-sm font-bold cursor-pointer"
                value={form.stage} onChange={e => setForm({ ...form, stage: e.target.value })}>
                <option value="" disabled className="bg-[#111116]">اختر سنتك الدراسية</option>
                {STAGES.map(s => <option key={s} value={s} className="bg-[#111116]">{s}</option>)}
              </select>
              <FiChevronDown className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
            </div>

            {/* المدرسة */}
            <div className="relative group">
              <FiHome className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-primary transition-colors z-10" />
              <input className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pr-12 pl-4 text-white focus:border-primary/50 focus:outline-none transition-all placeholder:text-gray-600 text-sm font-bold" 
                type="text" placeholder="اسم مدرستك" value={form.school} onChange={e => setForm({ ...form, school: e.target.value })} />
            </div>
          </div>

          {/* الباسوردات */}
          <div className="pt-2">
            <div className="flex items-center gap-3 mb-4 opacity-50">
              <div className="h-px flex-1 bg-white/10"></div>
              <span className="text-[10px] font-black uppercase tracking-tighter">كلمة مرور المنصة</span>
              <div className="h-px flex-1 bg-white/10"></div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div className="relative group">
                <FiLock className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-primary transition-colors z-10" />
                <input className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pr-12 pl-4 text-white focus:border-primary/50 focus:outline-none transition-all placeholder:text-gray-600 text-sm font-bold" 
                  type="password" placeholder="كلمة سر (اختياري)" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
              </div>
              <div className="relative group">
                <FiLock className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-primary transition-colors z-10" />
                <input className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pr-12 pl-4 text-white focus:border-primary/50 focus:outline-none transition-all placeholder:text-gray-600 text-sm font-bold" 
                  type="password" placeholder="تأكيد كلمة السر" value={form.confirmPassword} onChange={e => setForm({ ...form, confirmPassword: e.target.value })} />
              </div>
            </div>
          </div>

          <button onClick={handleSubmit} disabled={loading}
            className="w-full mt-6 gradient-primary py-4 rounded-2xl text-white font-black text-lg shadow-xl shadow-primary/20 hover:shadow-primary/40 hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-50 flex items-center justify-center gap-3 group">
            {loading ? <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><FiCheckCircle className="text-2xl group-hover:scale-110 transition-transform" /> إنهاء التسجيل</>}
          </button>
        </div>
      </div>
    </div>
  );
}
