'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';
import { FiPlus, FiTrash2, FiEye, FiEyeOff } from 'react-icons/fi';

export default function TestimonialsPage() {
  const [items, setItems] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ student_name: '', comment: '', rating: 5, student_image_url: '' });

  const load = async () => {
    const { data } = await supabase.from('testimonials').select('*').order('order');
    setItems(data || []);
  };

  useEffect(() => { load(); }, []);

  const handleAdd = async () => {
    if (!form.student_name || !form.comment) { toast.error('كمل البيانات'); return; }
    await supabase.from('testimonials').insert(form);
    toast.success('تمت الاضافة');
    setShowForm(false); setForm({ student_name: '', comment: '', rating: 5, student_image_url: '' });
    load();
  };

  const toggleVisible = async (id, current) => {
    await supabase.from('testimonials').update({ is_visible: !current }).eq('id', id);
    load();
  };

  const handleDelete = async (id) => {
    if (!confirm('متأكد؟')) return;
    await supabase.from('testimonials').delete().eq('id', id);
    toast.success('اتمسح'); load();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-black">اراء الطلاب</h1>
        <button onClick={() => setShowForm(!showForm)} className="gradient-primary px-6 py-3 rounded-xl text-white font-bold flex items-center gap-2">
          <FiPlus /> {showForm ? 'الغاء' : 'رأي جديد'}
        </button>
      </div>

      {showForm && (
        <div className="glass rounded-2xl p-6 mb-8 animate-fade-in space-y-4">
          <input type="text" value={form.student_name} onChange={(e) => setForm({...form, student_name: e.target.value})}
            placeholder="اسم الطالب" className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white focus:border-purple-500 focus:outline-none" />
          <textarea value={form.comment} onChange={(e) => setForm({...form, comment: e.target.value})}
            placeholder="رأي الطالب..." rows={3} className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white focus:border-purple-500 focus:outline-none resize-none" />
          <div className="flex items-center gap-4">
            <span className="text-gray-400">التقييم:</span>
            {[1,2,3,4,5].map(n => (
              <button key={n} onClick={() => setForm({...form, rating: n})}
                className={`text-2xl ${n <= form.rating ? 'text-yellow-400' : 'text-gray-600'}`}>&#9733;</button>
            ))}
          </div>
          <input type="text" value={form.student_image_url} onChange={(e) => setForm({...form, student_image_url: e.target.value})}
            placeholder="رابط صورة الطالب (اختياري)" className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white focus:border-purple-500 focus:outline-none" />
          <button onClick={handleAdd} className="gradient-primary px-8 py-3 rounded-xl text-white font-bold">اضافة</button>
        </div>
      )}

      <div className="space-y-3">
        {items.map((t, i) => (
          <div key={t.id} className="glass rounded-xl p-4 flex items-center gap-4 animate-fade-in" style={{ animationDelay: `${i * 0.05}s` }}>
            <div className="w-12 h-12 gradient-primary rounded-full flex items-center justify-center font-bold">{t.student_name[0]}</div>
            <div className="flex-1">
              <h3 className="font-bold">{t.student_name}</h3>
              <p className="text-gray-400 text-sm">{'★'.repeat(t.rating)} - &quot;{t.comment}&quot;</p>
            </div>
            <button onClick={() => toggleVisible(t.id, t.is_visible)} className="p-2 rounded-lg bg-white/5">
              {t.is_visible ? <FiEye className="text-green-400" /> : <FiEyeOff className="text-gray-500" />}
            </button>
            <button onClick={() => handleDelete(t.id)} className="p-2 rounded-lg bg-red-500/20 text-red-400"><FiTrash2 /></button>
          </div>
        ))}
        {items.length === 0 && <p className="text-center text-gray-500 py-10">مفيش اراء لسه</p>}
      </div>
    </div>
  );
}
