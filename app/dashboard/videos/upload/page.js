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

    try {
      // 1. اطلب presigned URL من السيرفر
      const res = await fetch('/api/presign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: file.name,
          contentType: file.type,
          title,
          courseId,
          isFree,
          fileSize: file.size,
        }),
      });

      const { uploadUrl, error } = await res.json();
      if (error) { toast.error(error); setUploading(false); return; }

      setProgress(30);

      // 2. ارفع الفيديو مباشرة لـ R2 من البراوزر
      await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            const pct = Math.round((e.loaded / e.total) * 60) + 30; // 30% → 90%
            setProgress(pct);
          }
        });
        xhr.addEventListener('load', () => {
          if (xhr.status === 200) resolve();
          else reject(new Error('فشل الرفع لـ R2'));
        });
        xhr.addEventListener('error', () => reject(new Error('خطأ في الشبكة')));
        xhr.open('PUT', uploadUrl);
        xhr.setRequestHeader('Content-Type', file.type);
        xhr.send(file);
      });

      setProgress(100);
      toast.success('✅ الفيديو اترفع بنجاح!');
      setTitle(''); setFile(null); setCourseId(''); setIsFree(false); setProgress(0);

    } catch (err) {
      toast.error(err.message || 'حصل مشكلة');
    }

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
              <p className="text-gray-600 text-sm mt-1">MP4, MOV - بدون حد اقصى 🚀</p>
            </div>
          )}
        </div>
        {uploading && (
          <div>
            <div className="w-full bg-white/5 rounded-full h-3 mb-2">
              <div className="gradient-primary h-full rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
            </div>
            <p className="text-center text-sm text-gray-400">{progress}% - جاري الرفع مباشرة لـ Cloudflare R2...</p>
          </div>
        )}
        <button type="submit" disabled={uploading}
          className="w-full gradient-primary py-4 rounded-xl text-white font-bold text-lg hover:opacity-90 transition disabled:opacity-50 flex items-center justify-center gap-2">
          {uploading
            ? <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> جاري الرفع... {progress}%</>
            : <><FiUploadCloud /> ارفع الفيديو</>}
        </button>
      </form>
    </div>
  );
}
