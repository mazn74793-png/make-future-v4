'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';
import { FiPlus, FiTrash2, FiUserCheck, FiUserX } from 'react-icons/fi';

export default function StudentsPage() {
  const [students, setStudents] = useState([]);
  const [pending, setPending] = useState([]);
  const [accessRequests, setAccessRequests] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', phone: '', parent_phone: '', stage: '', school: '' });

  const load = async () => {
    const { data: approved } = await supabase
      .from('students').select('*').eq('status', 'approved').order('created_at', { ascending: false });
    setStudents(approved || []);

    const { data: pendingData } = await supabase
      .from('students').select('*').eq('status', 'pending').order('created_at', { ascending: false });
    setPending(pendingData || []);

    const { data: accessReqs } = await supabase
      .from('access_requests')
      .select('*, students(name, email), courses(title)')
      .eq('status', 'pending')
      .order('created_at', { ascending: false });
    setAccessRequests(accessReqs || []);
  };

  useEffect(() => { load(); }, []);

  const handleAdd = async () => {
    if (!form.name || !form.email) { toast.error('الاسم والايميل مطلوبين'); return; }
    const { error } = await supabase.from('students').insert({ ...form, status: 'approved' });
    if (error) toast.error(error.message);
    else {
      toast.success('تمت الاضافة');
      setShowForm(false);
      setForm({ name: '', email: '', phone: '', parent_phone: '', stage: '', school: '' });
    }
    load();
  };

  const updateStatus = async (id, status) => {
    await supabase.from('students').update({ status }).eq('id', id);
    toast.success(status === 'approved' ? '✅ تم القبول' : '❌ تم الرفض');
    load();
  };

  const handleAccessRequest = async (id, status) => {
    await supabase.from('access_requests').update({ status }).eq('id', id);
    toast.success(status === 'approved' ? '✅ تم قبول الطلب' : '❌ تم رفض الطلب');
    load();
  };

  const toggleActive = async (id, current) => {
    await supabase.from('students').update({ is_active: !current }).eq('id', id);
    toast.success(current ? 'تم التعطيل' : 'تم التفعيل');
    load();
  };

  const handleDelete = async (id, name) => {
    if (!confirm(`متأكد تمسح "${name}"؟`)) return;
    await supabase.from('students').delete().eq('id', id);
    toast.success('اتمسح');
    load();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-black">ادارة الطلاب</h1>
        <button onClick={() => setShowForm(!showForm)}
          className="gradient-primary px-6 py-3 rounded-xl text-white font-bold flex items-center gap-2">
          <FiPlus /> {showForm ? 'الغاء' : 'طالب جديد'}
        </button>
      </div>

      {showForm && (
        <div className="glass rounded-2xl p-6 mb-8 animate-fade-in space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="اسم الطالب" className="bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white focus:border-purple-500 focus:outline-none" />
            <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="الايميل" className="bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white focus:border-purple-500 focus:outline-none" />
            <input type="text" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="رقم الموبايل" className="bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white focus:border-purple-500 focus:outline-none" />
            <input type="text" value={form.parent_phone} onChange={(e) => setForm({ ...form, parent_phone: e.target.value })}
              placeholder="رقم ولي الأمر" className="bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white focus:border-purple-500 focus:outline-none" />
            <input type="text" value={form.stage} onChange={(e) => setForm({ ...form, stage: e.target.value })}
              placeholder="المرحلة" className="bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white focus:border-purple-500 focus:outline-none" />
            <input type="text" value={form.school} onChange={(e) => setForm({ ...form, school: e.target.value })}
              placeholder="المدرسة" className="bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white focus:border-purple-500 focus:outline-none" />
          </div>
          <button onClick={handleAdd} className="gradient-primary px-8 py-3 rounded-xl text-white font-bold">اضافة الطالب</button>
        </div>
      )}

      {/* طلبات الوصول للكورسات */}
      {accessRequests.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-bold mb-4 text-blue-400 flex items-center gap-2">
            🔑 طلبات الوصول للكورسات
            <span className="bg-blue-400/20 text-blue-400 text-sm px-3 py-1 rounded-full">{accessRequests.length}</span>
          </h2>
          <div className="space-y-3">
            {accessRequests.map(req => (
              <div key={req.id} className="glass rounded-xl p-4 flex items-center justify-between border border-blue-400/20 animate-fade-in">
                <div>
                  <p className="font-bold">{req.students?.name}</p>
                  <p className="text-sm text-gray-400">{req.students?.email}</p>
                  <p className="text-sm text-blue-400 mt-1">📚 {req.courses?.title}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleAccessRequest(req.id, 'approved')}
                    className="bg-green-500/20 text-green-400 px-4 py-2 rounded-lg text-sm font-bold hover:bg-green-500/30 transition flex items-center gap-1">
                    <FiUserCheck /> قبول
                  </button>
                  <button onClick={() => handleAccessRequest(req.id, 'rejected')}
                    className="bg-red-500/20 text-red-400 px-4 py-2 rounded-lg text-sm font-bold hover:bg-red-500/30 transition flex items-center gap-1">
                    <FiUserX /> رفض
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* طلبات التسجيل الجديدة */}
      {pending.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-bold mb-4 text-yellow-400 flex items-center gap-2">
            ⏳ طلبات تسجيل جديدة
            <span className="bg-yellow-400/20 text-yellow-400 text-sm px-3 py-1 rounded-full">{pending.length}</span>
          </h2>
          <div className="space-y-3">
            {pending.map((s, i) => (
              <div key={s.id} className="glass rounded-xl p-4 flex items-center gap-4 border border-yellow-400/20 animate-fade-in" style={{ animationDelay: `${i * 0.05}s` }}>
                <div className="w-12 h-12 rounded-full bg-yellow-400/20 flex items-center justify-center font-bold text-lg text-yellow-400">
                  {s.name?.[0]}
                </div>
                <div className="flex-1">
                  <h3 className="font-bold">{s.name}</h3>
                  <p className="text-gray-500 text-sm">{s.email} {s.phone && `- ${s.phone}`}</p>
                  {s.stage && <p className="text-gray-600 text-xs">{s.stage} {s.school && `- ${s.school}`}</p>}
                </div>
                <span className="text-xs px-3 py-1 rounded-full bg-yellow-400/20 text-yellow-400">معلق</span>
                <button onClick={() => updateStatus(s.id, 'approved')}
                  className="px-4 py-2 rounded-lg bg-green-500/20 text-green-400 font-bold text-sm hover:bg-green-500/30 transition flex items-center gap-1">
                  <FiUserCheck /> قبول
                </button>
                <button onClick={() => updateStatus(s.id, 'rejected')}
                  className="px-4 py-2 rounded-lg bg-red-500/20 text-red-400 font-bold text-sm hover:bg-red-500/30 transition flex items-center gap-1">
                  <FiUserX /> رفض
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* الطلاب المقبولين */}
      <h2 className="text-xl font-bold mb-4">الطلاب المقبولين ({students.length})</h2>
      <div className="space-y-3">
        {students.map((s, i) => (
          <div key={s.id} className="glass rounded-xl p-4 flex items-center gap-4 card-hover animate-fade-in" style={{ animationDelay: `${i * 0.05}s` }}>
            <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${s.is_active ? 'gradient-primary' : 'bg-white/10'}`}>
              {s.name?.[0]}
            </div>
            <div className="flex-1">
              <h3 className="font-bold">{s.name}</h3>
              <p className="text-gray-500 text-sm">{s.email} {s.phone && `- ${s.phone}`}</p>
            </div>
            <span className={`text-xs px-3 py-1 rounded-full ${s.is_active ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
              {s.is_active ? 'نشط' : 'معطل'}
            </span>
            <button onClick={() => toggleActive(s.id, s.is_active)} className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition">
              {s.is_active ? <FiUserX className="text-yellow-400" /> : <FiUserCheck className="text-green-400" />}
            </button>
            <button onClick={() => handleDelete(s.id, s.name)} className="p-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition">
              <FiTrash2 />
            </button>
          </div>
        ))}
        {students.length === 0 && <p className="text-center text-gray-500 py-10">مفيش طلاب لسه</p>}
      </div>
    </div>
  );
}
