'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { FiPlus, FiTrash2, FiSearch, FiToggleLeft, FiToggleRight, FiEye, FiClock, FiTarget, FiShuffle, FiFilter } from 'react-icons/fi';

export default function ExamsPage() {
  const [exams, setExams] = useState([]);
  const [courses, setCourses] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCourse, setFilterCourse] = useState('');
  const [form, setForm] = useState({
    title: '', course_id: '', duration_minutes: 30,
    pass_score: 50, max_attempts: 1, instructions: '',
    start_time: '', end_time: '', shuffle_questions: true
  });

  const inpClass = "w-full bg-white/[0.03] border border-white/10 rounded-xl py-3 px-4 text-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500/20 focus:outline-none transition-all placeholder:text-gray-600";

  const load = async () => {
    const { data: examsData } = await supabase.from('exams').select('*, courses(title)').order('created_at', { ascending: false });
    setExams(examsData || []);
    const { data: coursesData } = await supabase.from('courses').select('id, title');
    setCourses(coursesData || []);
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async () => {
    if (!form.title) { toast.error('اكتب عنوان الامتحان'); return; }
    const { error } = await supabase.from('exams').insert([{
      ...form,
      start_time: form.start_time || null,
      end_time: form.end_time || null,
      course_id: form.course_id || null,
    }]);
    
    if (error) toast.error(error.message);
    else {
      toast.success('✅ تم إنشاء الامتحان بنجاح');
      setShowForm(false);
      setForm({ title: '', course_id: '', duration_minutes: 30, pass_score: 50, max_attempts: 1, instructions: '', start_time: '', end_time: '', shuffle_questions: true });
      load();
    }
  };

  const toggleActive = async (id, current) => {
    const { error } = await supabase.from('exams').update({ is_active: !current }).eq('id', id);
    if (!error) {
      toast.success(!current ? '🚀 الامتحان متاح الآن' : '🔒 تم قفل الامتحان');
      load();
    }
  };

  const handleDelete = async (id, title) => {
    if (!confirm(`تحذير: سيتم حذف كل الأسئلة والنتائج الخاصة بـ "${title}". هل أنت متأكد؟`)) return;
    await supabase.from('exams').delete().eq('id', id);
    toast.success('تم الحذف'); 
    load();
  };

  // تصفية الامتحانات بناءً على البحث والكورس
  const filteredExams = exams.filter(e => 
    e.title.toLowerCase().includes(searchTerm.toLowerCase()) &&
    (filterCourse === '' || e.course_id === filterCourse)
  );

  return (
    <div className="max-w-6xl mx-auto" dir="rtl">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-10">
        <div>
          <h1 className="text-4xl font-black text-white">إدارة <span className="text-purple-500">الامتحانات</span></h1>
          <p className="text-gray-500 font-medium mt-1">أنشئ اختبارات لتقييم مستوى طلابك</p>
        </div>
        <button onClick={() => setShowForm(!showForm)}
          className={`flex items-center gap-2 px-8 py-3.5 rounded-2xl font-black transition-all shadow-xl ${showForm ? 'bg-red-500/10 text-red-500' : 'gradient-primary text-white hover:scale-105'}`}>
          {showForm ? 'إلغاء' : <><FiPlus /> امتحان جديد</>}
        </button>
      </div>

      {/* Quick Filters */}
      {!showForm && (
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <FiSearch className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500" />
            <input type="text" placeholder="ابحث عن امتحان بالاسم..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
              className={`${inpClass} pr-12`} />
          </div>
          <div className="relative min-w-[200px]">
            <FiFilter className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500" />
            <select value={filterCourse} onChange={e => setFilterCourse(e.target.value)} className={`${inpClass} pr-12 appearance-none`}>
              <option value="">كل الكورسات</option>
              {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
            </select>
          </div>
        </div>
      )}

      {/* Form Container */}
      {showForm && (
        <div className="glass rounded-[2rem] p-8 mb-10 border-white/5 animate-slide-down shadow-2xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-4">
              <div>
                <label className="text-xs font-black text-gray-500 mr-2 uppercase tracking-widest mb-2 block">عنوان الامتحان *</label>
                <input type="text" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
                  placeholder="مثال: اختبار شامل على الباب الثاني" className={inpClass} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-black text-gray-500 mr-2 uppercase mb-2 block tracking-widest text-[10px]">الكورس المرتبط</label>
                  <select value={form.course_id} onChange={e => setForm({ ...form, course_id: e.target.value })} className={inpClass}>
                    <option value="">بدون كورس محدد</option>
                    {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-black text-gray-500 mr-2 uppercase mb-2 block tracking-widest text-[10px]">عدد المحاولات</label>
                  <input type="number" value={form.max_attempts} onChange={e => setForm({ ...form, max_attempts: parseInt(e.target.value) })} className={inpClass} />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-black text-gray-500 mr-2 uppercase mb-2 block tracking-widest text-[10px]">المدة (دقيقة)</label>
                  <input type="number" value={form.duration_minutes} onChange={e => setForm({ ...form, duration_minutes: parseInt(e.target.value) })} className={inpClass} />
                </div>
                <div>
                  <label className="text-xs font-black text-gray-500 mr-2 uppercase mb-2 block tracking-widest text-[10px]">درجة النجاح %</label>
                  <input type="number" value={form.pass_score} onChange={e => setForm({ ...form, pass_score: parseInt(e.target.value) })} className={inpClass} />
                </div>
              </div>
              <label className="flex items-center gap-3 p-4 glass rounded-xl border-white/5 cursor-pointer group">
                <input type="checkbox" checked={form.shuffle_questions} onChange={e => setForm({...form, shuffle_questions: e.target.checked})} className="w-5 h-5 accent-purple-500" />
                <span className="text-sm font-bold text-gray-400 group-hover:text-white transition-colors">عشوائية ترتيب الأسئلة 🔀</span>
              </label>
            </div>

            <div className="md:col-span-1">
               <label className="text-xs font-black text-gray-500 mr-2 uppercase mb-2 block tracking-widest">تاريخ البداية</label>
               <input type="datetime-local" value={form.start_time} onChange={e => setForm({ ...form, start_time: e.target.value })} className={inpClass} />
            </div>
            <div className="md:col-span-1">
               <label className="text-xs font-black text-gray-500 mr-2 uppercase mb-2 block tracking-widest">تاريخ النهاية</label>
               <input type="datetime-local" value={form.end_time} onChange={e => setForm({ ...form, end_time: e.target.value })} className={inpClass} />
            </div>
            
            <div className="md:col-span-3">
              <label className="text-xs font-black text-gray-500 mr-2 uppercase mb-2 block tracking-widest">تعليمات تظهر للطالب قبل البدء</label>
              <textarea value={form.instructions} onChange={e => setForm({ ...form, instructions: e.target.value })}
                rows={3} placeholder="اكتب ملاحظاتك هنا..." className={`${inpClass} resize-none`} />
            </div>
          </div>
          <button onClick={handleCreate} className="w-full mt-6 gradient-primary py-4 rounded-2xl text-white font-black shadow-lg shadow-purple-500/20 hover:scale-[1.01] transition-all">
            اعتماد وإنشاء الامتحان
          </button>
        </div>
      )}

      {/* Exams List */}
      <div className="grid grid-cols-1 gap-4">
        {filteredExams.map((exam, i) => (
          <div key={exam.id} className="glass group rounded-2xl p-5 border-white/5 hover:border-purple-500/30 transition-all duration-300 animate-fade-in" style={{ animationDelay: `${i*0.05}s` }}>
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex-1 min-w-0 text-center md:text-right">
                <div className="flex flex-wrap justify-center md:justify-start items-center gap-3 mb-2">
                  <h3 className="font-black text-xl text-white truncate">{exam.title}</h3>
                  <span className={`text-[10px] px-3 py-1 rounded-full font-black uppercase tracking-tighter ${exam.is_active ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-gray-500/10 text-gray-500 border border-white/10'}`}>
                    {exam.is_active ? '● نـشـط' : '● مـسـودة'}
                  </span>
                  {exam.shuffle_questions && <FiShuffle className="text-purple-400" title="عشوائي" />}
                </div>
                
                <div className="flex flex-wrap justify-center md:justify-start gap-5 text-xs font-bold text-gray-500">
                  <span className="flex items-center gap-1.5"><FiClock className="text-purple-500"/> {exam.duration_minutes} دقيقة</span>
                  <span className="flex items-center gap-1.5"><FiTarget className="text-blue-500"/> نجاح {exam.pass_score}%</span>
                  {exam.courses && <span className="bg-white/5 px-2 py-0.5 rounded text-gray-400 font-medium">📚 {exam.courses.title}</span>}
                  {exam.start_time && <span className="text-[10px] opacity-70">📅 يبدأ: {new Date(exam.start_time).toLocaleString('ar-EG', { dateStyle:'short', timeStyle:'short' })}</span>}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Link href={`/dashboard/exams/${exam.id}`}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-500/10 text-blue-500 hover:bg-blue-500 hover:text-white transition-all font-bold text-sm">
                  <FiEye /> الأسئلة والنتائج
                </Link>
                <button onClick={() => toggleActive(exam.id, exam.is_active)}
                  className={`p-3 rounded-xl transition-all ${exam.is_active ? 'bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white' : 'bg-white/5 text-gray-500 hover:bg-white/20'}`}>
                  {exam.is_active ? <FiToggleRight className="text-2xl" /> : <FiToggleLeft className="text-2xl" />}
                </button>
                <button onClick={() => handleDelete(exam.id, exam.title)}
                  className="p-3 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all">
                  <FiTrash2 />
                </button>
              </div>
            </div>
          </div>
        ))}

        {filteredExams.length === 0 && (
          <div className="py-20 text-center glass rounded-[3rem] border-dashed border-white/10">
            <p className="text-gray-500 font-bold">مفيش امتحانات مطابقة للبحث.. جرب حاجة تانية!</p>
          </div>
        )}
      </div>
    </div>
  );
}
