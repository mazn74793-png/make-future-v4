'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { FiPlus, FiTrash2, FiEye, FiUsers } from 'react-icons/fi';

export default function AttendancePage() {
  const [sessions, setSessions] = useState([]);
  const [students, setStudents] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', type: 'center', subject: '', stage: '', date: new Date().toISOString().split('T')[0], time: '', notes: '' });

  const STAGES = ['الصف الأول الإعدادي','الصف الثاني الإعدادي','الصف الثالث الإعدادي','الصف الأول الثانوي','الصف الثاني الثانوي','الصف الثالث الثانوي'];
  const inp = "w-full py-2.5 px-3 rounded-xl text-sm focus:outline-none";
  const inpStyle = { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' };

  const load = async () => {
    const { data } = await supabase.from('sessions').select('*, attendance(count)').order('date', { ascending: false });
    setSessions(data || []);
    const { data: s } = await supabase.from('students').select('id, name, student_code, stage').eq('status', 'approved').order('name');
    setStudents(s || []);
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async () => {
    if (!form.title || !form.date) { toast.error('العنوان والتاريخ مطلوبين'); return; }
    const { error } = await supabase.from('sessions').insert(form);
    if (error) toast.error(error.message);
    else { toast.success('✅ تم إنشاء الحصة'); setShowForm(false); setForm({ title: '', type: 'center', subject: '', stage: '', date: new Date().toISOString().split('T')[0], time: '', notes: '' }); load(); }
  };

  const handleDelete = async (id) => {
    if (!confirm('متأكد؟')) return;
    await supabase.from('sessions').delete().eq('id', id);
    toast.success('اتمسح'); load();
  };

  const totalStudents = (stage) => stage ? students.filter(s => s.stage === stage).length : students.length;

  return (
    <div dir="rtl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black">📋 الحضور والغياب</h1>
          <p className="text-gray-400 text-sm mt-1">{students.length} طالب مسجل</p>
        </div>
        <button onClick={() => setShowForm(!showForm)}
          className="gradient-primary px-5 py-2.5 rounded-xl text-white font-bold flex items-center gap-2 text-sm">
          <FiPlus /> {showForm ? 'إلغاء' : 'حصة جديدة'}
        </button>
      </div>

      {showForm && (
        <div className="glass rounded-2xl p-5 mb-6 animate-fade-in space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input className={inp} style={inpStyle} placeholder="عنوان الحصة *"
              value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
            <select className={inp} style={{ ...inpStyle, cursor: 'pointer' }}
              value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
              <option value="center">🏫 سنتر</option>
              <option value="online">💻 أونلاين</option>
            </select>
            <input className={inp} style={inpStyle} type="date"
              value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
            <input className={inp} style={inpStyle} type="time"
              value={form.time} onChange={e => setForm({ ...form, time: e.target.value })} />
            <input className={inp} style={inpStyle} placeholder="المادة"
              value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} />
            <select className={inp} style={{ ...inpStyle, cursor: 'pointer' }}
              value={form.stage} onChange={e => setForm({ ...form, stage: e.target.value })}>
              <option value="">كل الصفوف</option>
              {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <textarea className={`${inp} md:col-span-2`} style={inpStyle} placeholder="ملاحظات" rows={2}
              value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
          </div>
          <button onClick={handleCreate} className="gradient-primary px-6 py-2.5 rounded-xl text-white font-bold text-sm">
            إنشاء الحصة
          </button>
        </div>
      )}

      <div className="space-y-3">
        {sessions.map(session => (
          <div key={session.id} className="glass rounded-xl p-4 flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
                style={{ background: session.type === 'center' ? 'rgba(99,102,241,0.2)' : 'rgba(52,211,153,0.2)' }}>
                {session.type === 'center' ? '🏫' : '💻'}
              </div>
              <div>
                <h3 className="font-bold text-sm">{session.title}</h3>
                <div className="flex flex-wrap gap-2 text-xs text-gray-400 mt-0.5">
                  <span>📅 {new Date(session.date).toLocaleDateString('ar-EG')}</span>
                  {session.time && <span>🕐 {session.time}</span>}
                  {session.stage && <span>🎓 {session.stage}</span>}
                  {session.subject && <span>📖 {session.subject}</span>}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-center">
                <p className="font-black text-lg" style={{ color: '#818cf8' }}>
                  {session.attendance?.[0]?.count || 0}
                </p>
                <p className="text-xs text-gray-500">
                  من {totalStudents(session.stage)}
                </p>
              </div>
              <Link href={`/dashboard/attendance/${session.id}`}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-white font-bold text-sm"
                style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
                <FiEye size={14} /> تسجيل الحضور
              </Link>
              <button onClick={() => handleDelete(session.id)}
                className="p-2 rounded-xl text-red-400 hover:bg-red-500/10 transition">
                <FiTrash2 size={16} />
              </button>
            </div>
          </div>
        ))}
        {sessions.length === 0 && (
          <div className="glass rounded-2xl p-12 text-center">
            <FiUsers className="text-5xl text-gray-500 mx-auto mb-3" />
            <p className="text-gray-400">مفيش حصص لسه — ابدأ بإنشاء حصة جديدة</p>
          </div>
        )}
      </div>
    </div>
  );
}
