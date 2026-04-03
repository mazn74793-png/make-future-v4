'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';
import { FiTrash2, FiVideo, FiYoutube } from 'react-icons/fi';

export default function ManageVideosPage() {
  const [videos, setVideos] = useState([]);

  const load = async () => {
    const { data } = await supabase
      .from('videos')
      .select('*, courses(title)')
      .order('created_at', { ascending: false });
    setVideos(data || []);
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async (video) => {
    if (!confirm(`متأكد تمسح "${video.title}"؟`)) return;

    if (video.video_type === 'youtube' || !video.r2_file_key) {
      // يوتيوب — امسح من DB بس
      const { error } = await supabase.from('videos').delete().eq('id', video.id);
      if (error) toast.error(error.message);
      else { toast.success('✅ اتمسح'); load(); }
      return;
    }

    // R2 — امسح من R2 وDB
    const res = await fetch(`/api/videos/${video.id}`, { method: 'DELETE' });
    const data = await res.json();
    if (data.success) { toast.success('✅ اتمسح من R2 والداتابيس'); load(); }
    else toast.error(data.error || 'حصل مشكلة');
  };

  const formatSize = (bytes) => {
    if (!bytes) return null;
    if (bytes > 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-black">ادارة الفيديوهات</h1>
        <a href="/dashboard/videos/upload"
          className="gradient-primary px-6 py-3 rounded-xl text-white font-bold flex items-center gap-2">
          + رفع فيديو
        </a>
      </div>

      <div className="space-y-3">
        {videos.map((v, i) => (
          <div key={v.id} className="glass rounded-xl p-4 flex items-center gap-4 card-hover animate-fade-in"
            style={{ animationDelay: `${i * 0.05}s` }}>
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white ${v.video_type === 'youtube' ? 'bg-red-500/30' : 'gradient-primary'}`}>
              {v.video_type === 'youtube' ? <FiYoutube className="text-red-400" /> : <FiVideo />}
            </div>
            <div className="flex-1">
              <h3 className="font-bold">{v.title}</h3>
              <p className="text-gray-500 text-sm flex items-center gap-2 flex-wrap">
                <span>📚 {v.courses?.title || 'بدون كورس'}</span>
                <span>•</span>
                <span>{v.is_free ? '🆓 مجاني' : '💰 مدفوع'}</span>
                {formatSize(v.file_size) && <><span>•</span><span>{formatSize(v.file_size)}</span></>}
                {v.video_type === 'youtube' && <><span>•</span><span className="text-red-400">YouTube</span></>}
              </p>
            </div>
            <button onClick={() => handleDelete(v)}
              className="p-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition">
              <FiTrash2 />
            </button>
          </div>
        ))}
        {videos.length === 0 && <p className="text-center text-gray-500 py-10">مفيش فيديوهات لسه</p>}
      </div>
    </div>
  );
}
