'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';
import { FiPlus, FiEdit, FiTrash2, FiEye, FiEyeOff, FiImage, FiClock, FiDollarSign } from 'react-icons/fi';

const STAGES = ['الصف الأول الإعدادي','الصف الثاني الإعدادي','الصف الثالث الإعدادي','الصف الأول الثانوي','الصف الثاني الثانوي','الصف الثالث الثانوي'];

export default function ManageCoursesPage() {
  const [courses, setCourses] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ 
    title:'', description:'', thumbnail_url:'', price:0, 
    duration:'', stage:'', is_published:false, is_free:false 
  });

  const inpClass = "w-full bg-white/[0.03] border border-white/10 rounded-[1.2rem] py-3.5 px-5 text-white focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 focus:outline-none transition-all duration-300 placeholder:text-gray-600";

  const loadCourses = async () => {
    const { data } = await supabase.from('courses').select('*').order('order', { ascending: true });
    setCourses(data || []);
  };

  useEffect(() => { loadCourses(); }, []);

  const handleSave = async () => {
    if (!form.title || !form.stage) { toast.error('أكمل البيانات الأساسية (الاسم والمرحلة)'); return; }
    
    setLoading(true);
    const payload = { ...form, price: form.is_free ? 0 : Number(form.price) };
    
    try {
      if (editing) {
        const { error } = await supabase.from('courses').update(payload).eq('id', editing);
        if (error) throw error;
        toast.success('✅ تم تحديث الكورس');
      } else {
        const { error } = await supabase.from('courses').insert([{ ...payload, order: courses.length }]);
        if (error) throw error;
        toast.success('✅ تمت إضافة الكورس بنجاح');
      }
      resetForm();
      loadCourses();
    } catch (err) {
      toast.error('حدث خطأ في الحفظ');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, title) => {
    if (!confirm(`تحذير: مسح "${title}" سيمسح كل الفيديوهات والملفات المرتبطة به. هل أنت متأكد؟`)) return;
    
    // جلب فيديوهات الكورس لمسحها من R2 أولاً
    const { data: videos } = await supabase.from('videos').select('r2_file_key').eq('course_id', id);
    if (videos?.length > 0) {
      await fetch('/api/delete-course-videos', { 
        method:'POST', 
        headers:{'Content-Type':'application/json'}, 
        body: JSON.stringify({ keys: videos.map(v => v.r2_file_key) }) 
      });
    }
    
    await supabase.from('courses').delete().eq('id', id);
    toast.success('تم الحذف بنجاح');
    loadCourses();
  };

  const togglePublish = async (id, currentStatus) => {
    const { error } = await supabase.from('courses').update({ is_published: !currentStatus }).eq('id', id);
    if (!error) {
      toast.success(!currentStatus ? '🚀 الكورس الآن متاح للطلاب' : '🔒 تم إخفاء الكورس');
      loadCourses();
    }
  };

  const startEdit = (course) => { 
    setForm(course); 
    setEditing(course.id); 
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const resetForm = () => { 
    setForm({ title:'', description:'', thumbnail_url:'', price:0, duration:'', stage:'', is_published:false, is_free:false }); 
    setEditing(null); 
    setShowForm(false); 
  };

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8" dir="rtl">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-12">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-white">إدارة <span className="text-purple-500">المحتوى</span></h1>
          <p className="text-gray-500 font-medium mt-2">لديك حالياً {courses.length} كورس متاح في المنصة.</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} 
          className={`flex items-center gap-2 px-8 py-3.5 rounded-2xl font-black transition-all shadow-xl ${showForm ? 'bg-red-500/10 text-red-500' : 'gradient-primary text-white shadow-purple-500/20 hover:scale-105 active:scale-95'}`}>
          {showForm ? <FiPlus className="rotate-45" /> : <FiPlus />} {showForm ? 'إلغاء' : 'إضافة كورس جديد'}
        </button>
      </div>

      {/* Course Form */}
      {showForm && (
        <div className="glass rounded-[2.5rem] p-8 mb-12 border-white/5 animate-slide-down">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-6">
              <div>
                <label className="text-xs font-black text-gray-500 mr-2 uppercase tracking-widest mb-2 block">عنوان الكورس *</label>
                <input type="text" value={form.title} onChange={e => setForm({...form, title:e.target.value})} placeholder="مثال: فيزياء الحديثة - الفصل الأول" className={inpClass} />
              </div>
              <div>
                <label className="text-xs font-black text-gray-500 mr-2 uppercase tracking-widest mb-2 block">وصف مختصر</label>
                <textarea value={form.description} onChange={e => setForm({...form, description:e.target.value})} placeholder="ماذا سيتعلم الطالب في هذا الكورس؟" rows={4} className={`${inpClass} resize-none`} />
              </div>
              <div className="flex items-center gap-6 p-4 glass rounded-2xl border-white/5">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input type="checkbox" checked={form.is_free} onChange={e => setForm({...form, is_free:e.target.checked})} className="w-5 h-5 rounded-lg accent-purple-500" />
                  <span className="font-bold text-sm text-gray-300 group-hover:text-white transition-colors">كورس مجاني 🎁</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input type="checkbox" checked={form.is_published} onChange={e => setForm({...form, is_published:e.target.checked})} className="w-5 h-5 rounded-lg accent-emerald-500" />
                  <span className="font-bold text-sm text-gray-300 group-hover:text-white transition-colors">نشر الآن 🚀</span>
                </label>
              </div>
            </div>

            <div className="space-y-6">
               <div>
                <label className="text-xs font-black text-gray-500 mr-2 uppercase tracking-widest mb-2 block">الصف الدراسي</label>
                <select value={form.stage} onChange={e => setForm({...form, stage:e.target.value})} className={inpClass}>
                  <option value="">اختر الصف الدراسي...</option>
                  {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-black text-gray-500 mr-2 uppercase tracking-widest mb-2 block">السعر (جنيه)</label>
                  <div className="relative">
                    <FiDollarSign className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500" />
                    <input type="number" disabled={form.is_free} value={form.price} onChange={e => setForm({...form, price:e.target.value})} className={`${inpClass} pr-12`} />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-black text-gray-500 mr-2 uppercase tracking-widest mb-2 block">المدة</label>
                  <div className="relative">
                    <FiClock className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500" />
                    <input type="text" value={form.duration} onChange={e => setForm({...form, duration:e.target.value})} placeholder="10 ساعات" className={`${inpClass} pr-12`} />
                  </div>
                </div>
              </div>
              <div>
                <label className="text-xs font-black text-gray-500 mr-2 uppercase tracking-widest mb-2 block">رابط صورة الغلاف</label>
                <div className="relative">
                  <FiImage className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input type="text" value={form.thumbnail_url} onChange={e => setForm({...form, thumbnail_url:e.target.value})} placeholder="https://..." className={`${inpClass} pr-12`} />
                </div>
              </div>
              <button onClick={handleSave} disabled={loading} className="w-full gradient-primary py-4 rounded-[1.2rem] text-white font-black shadow-lg shadow-purple-500/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50">
                {loading ? 'جاري الحفظ...' : editing ? 'تحديث بيانات الكورس' : 'اعتماد وإضافة الكورس'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Courses List */}
      <div className="grid grid-cols-1 gap-4">
        {courses.map((course, i) => (
          <div key={course.id} className="glass group rounded-[2rem] p-5 flex flex-col md:flex-row items-center gap-6 border-white/5 transition-all duration-500 hover:border-purple-500/30 animate-fade-in" style={{ animationDelay:`${i*0.1}s` }}>
            {/* Thumbnail */}
            <div className="w-full md:w-48 h-32 rounded-2xl overflow-hidden flex-shrink-0 relative">
              {course.thumbnail_url ? (
                <img src={course.thumbnail_url} alt="" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
              ) : (
                <div className="w-full h-full gradient-primary flex items-center justify-center text-3xl font-black">📚</div>
              )}
              {!course.is_published && (
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center">
                   <span className="text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 bg-white/10 rounded-full border border-white/20">مسودة</span>
                </div>
              )}
            </div>

            {/* Content */}
            <div className="flex-1 text-center md:text-right min-w-0">
              <span className="text-[10px] font-black text-purple-400 uppercase tracking-widest">{course.stage}</span>
              <h3 className="text-xl font-black text-white mt-1 group-hover:text-purple-400 transition-colors truncate">{course.title}</h3>
              <p className="text-gray-500 text-sm mt-2 line-clamp-1">{course.description || 'لا يوجد وصف متاح لهذا الكورس.'}</p>
              
              <div className="flex flex-wrap justify-center md:justify-start gap-4 mt-4 text-xs font-bold">
                <span className={`px-3 py-1 rounded-lg ${course.is_free ? 'bg-emerald-500/10 text-emerald-500' : 'bg-purple-500/10 text-purple-500'}`}>
                   {course.is_free ? 'مجاني 🎁' : `${course.price} جنيه`}
                </span>
                {course.duration && <span className="px-3 py-1 rounded-lg bg-white/5 text-gray-400 flex items-center gap-1"><FiClock /> {course.duration}</span>}
              </div>
            </div>

            {/* Actions */}
            <div className="flex md:flex-col gap-2 w-full md:w-auto">
              <button onClick={() => togglePublish(course.id, course.is_published)} title={course.is_published ? 'إخفاء' : 'نشر'}
                className={`flex-1 md:w-11 md:h-11 flex items-center justify-center rounded-xl transition-all ${course.is_published ? 'bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white' : 'bg-white/5 text-gray-500 hover:bg-white/20'}`}>
                {course.is_published ? <FiEye size={18} /> : <FiEyeOff size={18} />}
              </button>
              <button onClick={() => startEdit(course)} className="flex-1 md:w-11 md:h-11 flex items-center justify-center rounded-xl bg-blue-500/10 text-blue-500 hover:bg-blue-500 hover:text-white transition-all">
                <FiEdit size={18} />
              </button>
              <button onClick={() => handleDelete(course.id, course.title)} className="flex-1 md:w-11 md:h-11 flex items-center justify-center rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all">
                <FiTrash2 size={18} />
              </button>
            </div>
          </div>
        ))}
        
        {courses.length === 0 && (
          <div className="py-20 text-center glass rounded-[3rem] border-dashed border-white/10">
            <p className="text-gray-500 font-bold">لم تقم بإضافة أي كورسات بعد. ابدأ الآن!</p>
          </div>
        )}
      </div>
    </div>
  );
}
