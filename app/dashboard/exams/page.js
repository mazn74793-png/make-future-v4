'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { FiPlus, FiTrash2, FiEdit, FiToggleLeft, FiToggleRight, FiEye } from 'react-icons/fi';

export default function ExamsPage() {
  const [exams, setExams] = useState([]);
  const [courses, setCourses] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    title: '', course_id: '', duration_minutes: 30,
    pass_score: 50, max_attempts: 1, instructions: '',
    start_time: '', end_time: ''
  });

  const load = async () => {
    const { data: examsData } = await supabase.from('exams').select('*, courses(title)').order('created_at', { ascending: false });
    setExams(examsData || []);
    const { data: coursesData } = await supabase.from('courses').select('id, title');
    setCourses(coursesData || []);
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async () => {
    if (!form.title) { toast.error('اكتب عنوان الامتحان'); return; }
    const { error } = await supabase.from('exams').insert({
      ...form,
      start_time: form.start_time || null,
      end_time: form.end_time || null,
      course_id: form.course_id || null,
    });
    if (error) toast.error(error.message);
    else {
      toast.success('✅ تم إنشاء الامتحان');
      setShowForm(false);
      setForm({ title: '', course_id: '', duration_minutes: 30, pass_score: 50, max_attempts: 1, instructions: '', start_time: '', end_time: '' });
      load();
    }
  };

  const toggleActive = async (id, current) => {
    await supabase.from('exams').update({ is_active: !current }).eq('id', id);
    toast.success(!current ? '✅ الامتحان متاح' : '🔒 الامتحان مقفول');
    load();
  };

  const handleDelete = async (id, title) => {
    if (!confirm(`متأكد تمسح "${title}"؟`)) return;
    await supabase.from('exams').delete().eq('id', id);
    toast.success('اتمسح'); load();
  };

  return (
    <div dir="rtl">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-black">الامتحانات</h1>
        <button onClick={() => setShowForm(!showForm)}
          className="gradient-primary px-6 py-3 rounded-xl text-white font-bold flex items-center gap-2">
          <FiPlus /> {showForm ? 'إلغاء' : 'امتحان جديد'}
        </button>
      </div>

      {showForm && (
        <div className="glass rounded-2xl p-6 mb-8 space-y-4 animate-fade-in">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="text-sm text-gray-400 mb-1 block">عنوان الامتحان *</label>
              <input type="text" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
                placeholder="امتحان الفصل الأول..."
                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white focus:border-purple-500 focus:outline-none" />
            </div>
            <div>
              <label className="text-sm text-gray-400 mb-1 block">الكورس (اختياري)</label>
              <select value={form.course_id} onChange={e => setForm({ ...form, course_id: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white focus:border-purple-500 focus:outline-none">
                <option value="">بدون كورس محدد</option>
                {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm text-gray-400 mb-1 block">المدة (دقيقة)</label>
              <input type="number" value={form.duration_minutes} onChange={e => setForm({ ...form, duration_minutes: parseInt(e.target.value) })}
                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white focus:border-purple-500 focus:outline-none" />
            </div>
            <div>
              <label className="text-sm text-gray-400 mb-1 block">درجة النجاح (%)</label>
              <input type="number" value={form.pass_score} onChange={e => setForm({ ...form, pass_score: parseInt(e.target.value) })}
                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white focus:border-purple-500 focus:outline-none" />
            </div>
            <div>
              <label className="text-sm text-gray-400 mb-1 block">عدد المحاولات</label>
              <input type="number" value={form.max_attempts} onChange={e => setForm({ ...form, max_attempts: parseInt(e.target.value) })}
                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white focus:border-purple-500 focus:outline-none" />
            </div>
            <div>
              <label className="text-sm text-gray-400 mb-1 block">تاريخ البداية (اختياري)</label>
              <input type="datetime-local" value={form.start_time} onChange={e => setForm({ ...form, start_time: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white focus:border-purple-500 focus:outline-none" />
            </div>
            <div>
              <label className="text-sm text-gray-400 mb-1 block">تاريخ النهاية (اختياري)</label>
              <input type="datetime-local" value={form.end_time} onChange={e => setForm({ ...form, end_time: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white focus:border-purple-500 focus:outline-none" />
            </div>
            <div className="md:col-span-2">
              <label className="text-sm text-gray-400 mb-1 block">تعليمات الامتحان</label>
              <textarea value={form.instructions} onChange={e => setForm({ ...form, instructions: e.target.value })}
                rows={3} placeholder="اقرأ الأسئلة بعناية..."
                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white focus:border-purple-500 focus:outline-none resize-none" />
            </div>
          </div>
          <button onClick={handleCreate} className="gradient-primary px-8 py-3 rounded-xl text-white font-bold">
            إنشاء الامتحان
          </button>
        </div>
      )}

      <div className="space-y-4">
        {exams.map(exam => (
          <div key={exam.id} className="glass rounded-2xl p-5 border border-white/5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="font-black text-lg">{exam.title}</h3>
                  <span className={`text-xs px-3 py-1 rounded-full font-bold ${exam.is_active ? 'bg-green-400/20 text-green-400' : 'bg-gray-400/20 text-gray-400'}`}>
                    {exam.is_active ? '✅ متاح' : '🔒 مقفول'}
                  </span>
                </div>
                <div className="flex flex-wrap gap-3 text-sm text-gray-400">
                  <span>⏱️ {exam.duration_minutes} دقيقة</span>
                  <span>🎯 نجاح من {exam.pass_score}%</span>
                  <span>🔄 {exam.max_attempts} محاولة</span>
                  {exam.courses && <span>📚 {exam.courses.title}</span>}
                  {exam.start_time && <span>📅 من {new Date(exam.start_time).toLocaleDateString('ar-EG')}</span>}
                  {exam.end_time && <span>📅 حتى {new Date(exam.end_time).toLocaleDateString('ar-EG')}</span>}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Link href={`/dashboard/exams/${exam.id}`}
                  className="p-2 rounded-xl bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition" title="إدارة الأسئلة والنتائج">
                  <FiEye />
                </Link>
                <button onClick={() => toggleActive(exam.id, exam.is_active)}
                  className={`p-2 rounded-xl transition ${exam.is_active ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30' : 'bg-gray-500/20 text-gray-400 hover:bg-gray-500/30'}`}>
                  {exam.is_active ? <FiToggleRight className="text-xl" /> : <FiToggleLeft className="text-xl" />}
                </button>
                <button onClick={() => handleDelete(exam.id, exam.title)}
                  className="p-2 rounded-xl bg-red-500/20 text-red-400 hover:bg-red-500/30 transition">
                  <FiTrash2 />
                </button>
              </div>
            </div>
          </div>
        ))}
        {exams.length === 0 && (
          <div className="glass rounded-2xl p-16 text-center">
            <p className="text-gray-400 text-lg">مفيش امتحانات لسه — ابدأ بإنشاء امتحان جديد!</p>
          </div>
        )}
      </div>
    </div>
  );
}
