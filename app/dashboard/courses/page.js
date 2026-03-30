'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';
import { FiPlus, FiEdit, FiTrash2, FiEye, FiEyeOff } from 'react-icons/fi';

export default function ManageCoursesPage() {
  const [courses, setCourses] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ title: '', description: '', thumbnail_url: '', price: 0, duration: '', is_published: false, is_free: false });

  const loadCourses = async () => {
    const { data } = await supabase.from('courses').select('*').order('order');
    setCourses(data || []);
  };

  useEffect(() => { loadCourses(); }, []);

  const handleSave = async () => {
    if (!form.title) { toast.error('اكتب اسم الكورس'); return; }
    if (editing) {
      const { error } = await supabase.from('courses').update(form).eq('id', editing);
      if (error) toast.error('حصل مشكلة'); else toast.success('تم التعديل');
    } else {
      const { error } = await supabase.from('courses').insert(form);
      if (error) toast.error('حصل مشكلة'); else toast.success('تم الاضافة');
    }
    setForm({ title: '', description: '', thumbnail_url: '', price: 0, duration: '', is_published: false, is_free: false });
    setEditing(null);
    setShowForm(false);
    loadCourses();
  };

  const handleDelete = async (id, title) => {
    if (!confirm(`متأكد تمسح "${title}"؟`)) return;
    const { data: videos } = await supabase.from('videos').select('r2_file_key').eq('course_id', id);
    if (videos?.length > 0) {
      await fetch('/api/delete-course-videos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keys: videos.map(v => v.r2_file_key) }),
      });
    }
    const { error } = await supabase.from('courses').delete().eq('id', id);
    if (error) toast.error('حصل مشكلة'); else toast.success('اتمسح');
    loadCourses();
  };

  const togglePublish = async (id, current) => {
    await supabase.from('courses').update({ is_published: !current }).eq('id', id);
    toast.success(current ? 'تم الاخفاء' : 'تم النشر');
    loadCourses();
  };

  const startEdit = (course) => {
    setForm(course);
    setEditing(course.id);
    setShowForm(true);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-black">ادارة الكورسات</h1>
        <button onClick={() => { setShowForm(!showForm); setEditing(null); setForm({ title: '', description: '', thumbnail_url: '', price: 0, duration: '', is_published: false, is_free: false }); }}
          className="gradient-primary px-6 py-3 rounded-xl text-white font-bold flex items-center gap-2">
          <FiPlus /> {showForm ? 'الغاء' : 'كورس جديد'}
        </button>
      </div>

      {showForm && (
        <div className="glass rounded-2xl p-6 mb-8 animate-fade-in">
          <h2 className="text-xl font-bold mb-4">{editing ? 'تعديل كورس' : 'كورس جديد'}</h2>
          <div className="space-y-4">
            <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="اسم الكورس" className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white focus:border-purple-500 focus:outline-none" />
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="وصف الكورس" rows={3} className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white focus:border-purple-500 focus:outline-none resize-none" />
            <div className="grid grid-cols-2 gap-4">
              <input type="text" value={form.thumbnail_url} onChange={(e) => setForm({ ...form, thumbnail_url: e.target.value })}
                placeholder="رابط الصورة" className="bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white focus:border-purple-500 focus:outline-none" />
              <input type="text" value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })}
                placeholder="المدة" className="bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white focus:border-purple-500 focus:outline-none" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })}
                placeholder="السعر" className="bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white focus:border-purple-500 focus:outline-none" />
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.is_free} onChange={(e) => setForm({ ...form, is_free: e.target.checked })} className="w-5 h-5 accent-purple-500" />
                  <span>مجاني</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.is_published} onChange={(e) => setForm({ ...form, is_published: e.target.checked })} className="w-5 h-5 accent-purple-500" />
                  <span>منشور</span>
                </label>
              </div>
            </div>
            <button onClick={handleSave} className="gradient-primary px-8 py-3 rounded-xl text-white font-bold hover:opacity-90 transition">
              {editing ? 'حفظ التعديل' : 'اضافة الكورس'}
            </button>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {courses.map((course, i) => (
          <div key={course.id} className="glass rounded-xl p-4 flex items-center gap-4 card-hover animate-fade-in" style={{ animationDelay: `${i * 0.05}s` }}>
            {course.thumbnail_url ? (
              <img src={course.thumbnail_url} alt="" className="w-20 h-14 rounded-lg object-cover" />
            ) : (
              <div className="w-20 h-14 gradient-primary rounded-lg flex items-center justify-center text-2xl">📚</div>
            )}
            <div className="flex-1">
              <h3 className="font-bold">{course.title}</h3>
              <p className="text-gray-500 text-sm">{course.is_free ? 'مجاني' : `${course.price} جنيه`} - {course.is_published ? 'منشور' : 'مخفي'}</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => togglePublish(course.id, course.is_published)}
                className={`p-2 rounded-lg transition ${course.is_published ? 'bg-green-500/20 text-green-400' : 'bg-white/5 text-gray-400'}`}>
                {course.is_published ? <FiEye /> : <FiEyeOff />}
              </button>
              <button onClick={() => startEdit(course)} className="p-2 rounded-lg bg-blue-500/20 text-blue-400"><FiEdit /></button>
              <button onClick={() => handleDelete(course.id, course.title)} className="p-2 rounded-lg bg-red-500/20 text-red-400"><FiTrash2 /></button>
            </div>
          </div>
        ))}
        {courses.length === 0 && <p className="text-center text-gray-500 py-10">مفيش كورسات لسه</p>}
      </div>
    </div>
  );
}
