'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';
import { FiPlus, FiTrash2, FiEye, FiEyeOff, FiStar, FiUser, FiMessageSquare, FiImage, FiX } from 'react-icons/fi';

export default function TestimonialsPage() {
  const [items, setItems] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ student_name: '', comment: '', rating: 5, student_image_url: '' });

  const load = async () => {
    const { data } = await supabase.from('testimonials').select('*').order('created_at', { ascending: false });
    setItems(data || []);
  };

  useEffect(() => { load(); }, []);

  const handleAdd = async () => {
    if (!form.student_name || !form.comment) return toast.error('يا بطل كمل البيانات الأول ✍️');
    
    setLoading(true);
    const { error } = await supabase.from('testimonials').insert([{ ...form, is_visible: true }]);
    
    if (error) {
      toast.error('حصلت مشكلة وأحنا بنرفع الرأي');
    } else {
      toast.success('تمت إضافة رأي الطالب بنجاح ⭐');
      setShowForm(false);
      setForm({ student_name: '', comment: '', rating: 5, student_image_url: '' });
      load();
    }
    setLoading(false);
  };

  const toggleVisible = async (id, current) => {
    const { error } = await supabase.from('testimonials').update({ is_visible: !current }).eq('id', id);
    if (!error) {
      toast.success(current ? 'تم إخفاء الرأي من الموقع' : 'الرأي الآن ظاهر للجميع');
      load();
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('هل أنت متأكد من حذف هذا الرأي؟')) return;
    const { error } = await supabase.from('testimonials').delete().eq('id', id);
    if (!error) {
      toast.success('تم الحذف بنجاح');
      load();
    }
  };

  return (
    <div className="animate-fade-in" dir="rtl">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
        <div>
          <h1 className="text-3xl font-black text-white italic">آراء النجوم 🌟</h1>
          <p className="text-gray-400 text-sm mt-1">إدارة التعليقات والتقييمات التي تظهر في الصفحة الرئيسية</p>
        </div>
        <button 
          onClick={() => setShowForm(!showForm)} 
          className={`flex items-center justify-center gap-2 px-6 py-3 rounded-2xl font-bold transition-all active:scale-95 ${showForm ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20' : 'gradient-primary text-white shadow-lg shadow-purple-500/20'}`}
        >
          {showForm ? <><FiX /> إلغاء</> : <><FiPlus /> إضافة رأي جديد</>}
        </button>
      </div>

      {/* Add Form */}
      {showForm && (
        <div className="glass rounded-[2rem] p-8 mb-10 border border-white/10 shadow-2xl animate-slide-down">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="relative group">
                <FiUser className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-primary transition-colors" />
                <input type="text" value={form.student_name} onChange={(e) => setForm({...form, student_name: e.target.value})}
                  placeholder="اسم الطالب الثنائي" className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 pr-12 pl-4 text-white focus:border-primary/50 focus:outline-none transition-all" />
              </div>
              
              <div className="relative group">
                <FiMessageSquare className="absolute right-4 top-4 text-gray-500 group-focus-within:text-primary transition-colors" />
                <textarea value={form.comment} onChange={(e) => setForm({...form, comment: e.target.value})}
                  placeholder="ماذا قال الطالب عن المنصة؟" rows={4} className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 pr-12 pl-4 text-white focus:border-primary/50 focus:outline-none resize-none transition-all" />
              </div>
            </div>

            <div className="space-y-6">
              <div className="p-5 bg-white/5 rounded-2xl border border-white/5">
                <label className="text-xs font-bold text-gray-500 block mb-3 uppercase tracking-widest text-center">التقييم بالنجوم</label>
                <div className="flex justify-center gap-3">
                  {[1,2,3,4,5].map(n => (
                    <button key={n} onClick={() => setForm({...form, rating: n})}
                      className={`text-3xl transition-all hover:scale-125 ${n <= form.rating ? 'text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.5)]' : 'text-gray-700'}`}>
                      <FiStar fill={n <= form.rating ? "currentColor" : "none"} />
                    </button>
                  ))}
                </div>
              </div>

              <div className="relative group">
                <FiImage className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-primary transition-colors" />
                <input type="text" value={form.student_image_url} onChange={(e) => setForm({...form, student_image_url: e.target.value})}
                  placeholder="رابط صورة الطالب (اختياري)" className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 pr-12 pl-4 text-white focus:border-primary/50 focus:outline-none transition-all" />
              </div>

              <button 
                onClick={handleAdd} 
                disabled={loading}
                className="w-full gradient-primary py-4 rounded-2xl text-white font-black text-lg shadow-xl shadow-primary/20 active:scale-[0.98] transition-all disabled:opacity-50"
              >
                {loading ? 'جاري الحفظ...' : 'نشر الرأي الآن 🚀'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* List Items */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {items.map((t, i) => (
          <div key={t.id} className={`glass rounded-[2rem] p-6 border border-white/5 relative group transition-all hover:border-primary/30 ${!t.is_visible && 'opacity-60 grayscale'}`}>
            
            <div className="flex items-center gap-4 mb-4">
              {t.student_image_url ? (
                <img src={t.student_image_url} alt={t.student_name} className="w-14 h-14 rounded-2xl object-cover border-2 border-primary/20 shadow-lg" />
              ) : (
                <div className="w-14 h-14 gradient-primary rounded-2xl flex items-center justify-center text-xl font-black text-white shadow-lg rotate-3">
                  {t.student_name[0]}
                </div>
              )}
              <div>
                <h3 className="font-bold text-white text-lg leading-tight">{t.student_name}</h3>
                <div className="flex text-yellow-400 text-xs mt-1">
                  {[...Array(5)].map((_, i) => (
                    <FiStar key={i} fill={i < t.rating ? "currentColor" : "none"} className={i < t.rating ? "text-yellow-400" : "text-gray-600"} />
                  ))}
                </div>
              </div>
            </div>

            <p className="text-gray-400 text-sm leading-relaxed mb-6 italic h-20 overflow-hidden">
              &quot;{t.comment}&quot;
            </p>

            <div className="flex items-center justify-between pt-4 border-t border-white/5">
              <div className="flex gap-2">
                <button 
                  onClick={() => toggleVisible(t.id, t.is_visible)} 
                  className={`p-2.5 rounded-xl border transition-all ${t.is_visible ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-gray-500/10 text-gray-500 border-gray-500/20'}`}
                  title={t.is_visible ? "إخفاء" : "إظهار"}
                >
                  {t.is_visible ? <FiEye /> : <FiEyeOff />}
                </button>
                <button 
                  onClick={() => handleDelete(t.id)} 
                  className="p-2.5 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500 hover:text-white transition-all"
                >
                  <FiTrash2 />
                </button>
              </div>
              <span className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">
                {new Date(t.created_at).toLocaleDateString('ar-EG')}
              </span>
            </div>
          </div>
        ))}
      </div>

      {items.length === 0 && (
        <div className="glass rounded-[2.5rem] py-20 text-center border-dashed border-2 border-white/5">
          <FiMessageSquare className="text-6xl text-gray-700 mx-auto mb-4" />
          <p className="text-gray-500 font-bold">لا توجد آراء طلاب حالياً.. ابدأ بإضافة نجاحاتك!</p>
        </div>
      )}
    </div>
  );
}
