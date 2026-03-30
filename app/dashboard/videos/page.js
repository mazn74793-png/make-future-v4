'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';
import { FiTrash2, FiVideo } from 'react-icons/fi';

export default function ManageVideosPage() {
  const [videos, setVideos] = useState([]);

  const load = async () => {
    const { data } = await supabase.from('videos').select('*, courses(title)').order('created_at', { ascending: false });
    setVideos(data || []);
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async (video) => {
    if (!confirm(`متأكد تمسح "${video.title}"؟`)) return;
    const res = await fetch(`/api/videos/${video.id}`, { method: 'DELETE' });
    const data = await res.json();
    if (data.success) { toast.success('اتمسح'); load(); }
    else toast.error(data.error);
  };

  return (
    <div>
      <h1 className="text-3xl font-black mb-8">ادارة الفيديوهات</h1>
      <div className="space-y-3">
        {videos.map((v, i) => (
          <div key={v.id} className="glass rounded-xl p-4 flex items-center gap-4 card-hover animate-fade-in" style={{ animationDelay: `${i * 0.05}s` }}>
            <div className="w-12 h-12 gradient-primary rounded-xl flex items-center justify-center"><FiVideo /></div>
            <div className="flex-1">
              <h3 className="font-bold">{v.title}</h3>
              <p className="text-gray-500 text-sm">
                {v.courses?.title || 'بدون كورس'} - {v.is_free ? 'مجاني' : 'مدفوع'}
                {v.file_size && ` - ${(v.file_size / (1024*1024)).toFixed(1)}MB`}
              </p>
            </div>
            <button onClick={() => handleDelete(v)} className="p-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition"><FiTrash2 /></button>
          </div>
        ))}
        {videos.length === 0 && <p className="text-center text-gray-500 py-10">مفيش فيديوهات لسه</p>}
      </div>
    </div>
  );
}
