'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';
import { FiUploadCloud, FiCheck } from 'react-icons/fi';

export default function UploadVideoPage() {
  const [courses, setCourses] = useState([]);
  const [title, setTitle] = useState('');
  const [courseId, setCourseId] = useState('');
  const [file, setFile] = useState(null);
  const [isFree, setIsFree] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    supabase.from('courses').select('*').order('title').then(({ data }) => setCourses(data || []));
  }, []);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file || !title || !courseId) { toast.error('كمل كل البيانات'); return; }
    setUploading(true);
    setProgress(10);
    const formData = new FormData();
    formData.append('video', file);
    formData.append('title', title);
    formData.append('courseId', courseId);
    formData.append('isFree', isFree);
    try {
      setProgress(30);
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      setProgress(80);
      const data = await res.json();
      if (data.success) {
        setProgress(100);
        toast.success('الفيديو اترفع');
        setTitle(''); setFile(null); setCourseId(''); setIsFree(false);
      } else { toast.error(data.error); }
    } catch { toast.error('حصل مشكلة'); }
    setUploading(false);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-black mb-8">رفع فيديو جديد</h1>
      <form onSubmit={handleUpload} className="space-y-6">
        <div>
          <label className="text-sm text-gray-400 mb-2 block">عنوان الفيديو</label>
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)}
            placeholder="الدرس الأول - المقدمة"
            className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white focus:border-purple-500 focus:outline-none" required />
        </div>
        <div>
          <label className="text-sm text-gray-400 mb-2 block">الكورس</label>
          <select value={courseId} onChange={(e) => setCourseId(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white focus:border-purple-500 focus:outline-none" required>
            <option value="">اختار الكورس</option>
            {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
          </select>
        </div>
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={isFree} onChange={(e) => setIsFree(e.target.checked)} className="w-5 h-5 accent-purple-500" />
          <span>فيديو مجاني (متاح للكل)</span>
        </label>
        <div onClick={() => document.getElementById('fileInput').click()}
          className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition
            ${file ? 'border-green-500 bg-green-500/10' : 'border-white/10 hover:border-white/30'}`}>
          <input id="fileInput" type="file" accept="video/*" onChange={(e) => setFile(e.target.files[0])} className="hidden" />
          {file ? (
            <div>
              <FiCheck className="text-4xl text-green-400 mx-auto mb-3" />
              <p className="font-bold text-green-400">{file.name}</p>
              <p className="text-gray-400 text-sm">{(file.size / (1024 * 1024)).toFixed(1)} MB</p>
            </div>
          ) : (
            <div>
              <FiUploadCloud className="text-4xl text-gray-500 mx-auto mb-3" />
              <p className="text-gray-400">اضغط لاختيار الفيديو</p>
              <p className="text-gray-600 text-sm mt-1">MP4, MOV - حد اقصى 500MB</p>
            </div>
          )}
        </div>
        {uploading && (
          <div className="w-full bg-white/5 rounded-full h-3">
            <div className="gradient-primary h-full rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
          </div>
        )}
        <button type="submit" disabled={uploading}
          className="w-full gradient-primary py-4 rounded-xl text-white font-bold text-lg hover:opacity-90 transition disabled:opacity-50 flex items-center justify-center gap-2">
          {uploading ? <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> جاري الرفع... {progress}%</> : <><FiUploadCloud /> ارفع الفيديو</>}
        </button>
      </form>
    </div>
  );
}
