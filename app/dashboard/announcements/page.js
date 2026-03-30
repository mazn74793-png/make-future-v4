'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';
import { FiPlus, FiTrash2, FiBell } from 'react-icons/fi';

export default function AnnouncementsPage() {
  const [items, setItems] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', content: '', type: 'info' });

  const load = async () => {
    const { data } = await supabase.from('announcements').select('*').order('created_at', { ascending: false });
    setItems(data || []);
  };

  useEffect(() => { load(); }, []);

  const handleAdd = async () => {
    if (!form.title || !form.content) { toast.error('كمل البيانات'); return; }
    await supabase.from('announcements').insert(form);
    toast.success('تم الاضافة');
    setShowForm(false); setForm({ title: '', content: '', type: 'info' });
    load();
  };

  const toggleActive = async (id, current) => {
    await supabase.from('announcements').update({ is_active: !current }).eq('id', id);
    load();
  };

  const handleDelete = async (id) => {
    if (!confirm('متأكد؟')) return;
    await supabase.from('announcements').delete().eq('id', id);
    toast.success('اتمسح'); load();
  };

  const typeColors = { info: 'bg-purple-500/20 text-purple-400', warning: 'bg-yellow-500/20 text-yellow-400', success: 'bg-green-500/20 text-green-400', urgent: 'bg-red-500/20 text-red-400' };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-black">الاعلانات</h1>
        <button onClick={() => setShowForm(!showForm)} className="gradient-primary px-6 py-3 rounded-xl text-white font-bold flex items-center gap-2">
          <FiPlus /> {showForm ? 'الغاء' : 'اعلان جديد'}
        </button>
      </div>

      {showForm && (
        <div className="glass rounded-2xl p-6 mb-8 animate-fade-in space-y-4">
          <input type="text" value={form.title} onChange={(e) => setForm({...form, title: e.target.value})}
            placeholder="عنوان الاعلان" className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white focus:border-purple-500 focus:outline-none" />
          <textarea value={form.content} onChange={(e) => setForm({...form, content: e.target.value})}
            placeholder="محتوى الاعلان" rows={3} className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white focus:border-purple-500 focus:outline-none resize-none" />
          <select value={form.type} onChange={(e) => setForm({...form, type: e.target.value})}
            className="bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white focus:border-purple-500 focus:outline-none">
            <option value="info">معلومة</option>
            <option value="success">نجاح</option>
            <option value="warning">تحذير</option>
            <option value="urgent">عاجل</option>
          </select>
          <button onClick={handleAdd} className="gradient-primary px-8 py-3 rounded-xl text-white font-bold">اضافة</button>
        </div>
      )}

      <div className="space-y-3">
        {items.map((a, i) => (
          <div key={a.id} className="glass rounded-xl p-4 flex items-center gap-4 animate-fade-in" style={{ animationDelay: `${i * 0.05}s` }}>
            <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-white/5"><FiBell /></div>
            <div className="flex-1">
              <h3 className="font-bold">{a.title}</h3>
              <p className="text-gray-400 text-sm">{a.content}</p>
            </div>
            <span className={`text-xs px-3 py-1 rounded-full ${typeColors[a.type]}`}>{a.type}</span>
            <button onClick={() => toggleActive(a.id, a.is_active)}
              className={`text-xs px-3 py-1 rounded-full ${a.is_active ? 'bg-green-500/20 text-green-400' : 'bg-white/5 text-gray-500'}`}>
              {a.is_active ? 'مفعل' : 'متوقف'}
            </button>
            <button onClick={() => handleDelete(a.id)} className="p-2 rounded-lg bg-red-500/20 text-red-400"><FiTrash2 /></button>
          </div>
        ))}
        {items.length === 0 && <p className="text-center text-gray-500 py-10">مفيش اعلانات لسه</p>}
      </div>
    </div>
  );
}
