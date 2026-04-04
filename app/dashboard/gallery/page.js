'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';
import { FiPlus, FiTrash2, FiImage } from 'react-icons/fi';

export default function GalleryPage() {
  const [images, setImages] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [caption, setCaption] = useState('');

  const load = async () => {
    const { data } = await supabase.from('gallery').select('*').order('order_num').order('created_at', { ascending: false });
    setImages(data || []);
  };
  useEffect(() => { load(); }, []);

  const handleUpload = async (file) => {
    setUploading(true);
    try {
      const res = await fetch('/api/upload-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileName: file.name, contentType: file.type })
      });
      const { uploadUrl, imageUrl } = await res.json();
      await fetch(uploadUrl, { method: 'PUT', headers: { 'Content-Type': file.type }, body: file });
      await supabase.from('gallery').insert({ url: imageUrl, caption, is_visible: true, order_num: images.length });
      toast.success('✅ الصورة اتضافت');
      setCaption('');
      load();
    } catch { toast.error('حصل مشكلة'); }
    setUploading(false);
  };

  const toggleVisible = async (id, current) => {
    await supabase.from('gallery').update({ is_visible: !current }).eq('id', id);
    load();
  };

  const deleteImage = async (id) => {
    if (!confirm('متأكد؟')) return;
    await supabase.from('gallery').delete().eq('id', id);
    toast.success('اتمسح'); load();
  };

  return (
    <div dir="rtl">
      <h1 className="text-2xl font-black mb-6">🖼️ معرض الصور</h1>

      <div className="glass rounded-2xl p-5 mb-6">
        <h2 className="font-bold mb-4">إضافة صورة جديدة</h2>
        <input type="text" placeholder="تعليق على الصورة (اختياري)" value={caption}
          onChange={e => setCaption(e.target.value)}
          className="w-full py-2.5 px-3 rounded-xl text-sm focus:outline-none mb-3"
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }} />
        <label className={`flex items-center justify-center gap-2 py-3 px-6 rounded-xl cursor-pointer text-sm font-bold text-white transition ${uploading ? 'opacity-50' : 'hover:opacity-90'}`}
          style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', display: 'inline-flex' }}>
          <FiImage /> {uploading ? 'جاري الرفع...' : 'اختار صورة'}
          <input type="file" accept="image/*" className="hidden" disabled={uploading}
            onChange={e => e.target.files[0] && handleUpload(e.target.files[0])} />
        </label>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {images.map(img => (
          <div key={img.id} className="relative rounded-2xl overflow-hidden group"
            style={{ aspectRatio: '1', background: 'rgba(255,255,255,0.05)' }}>
            <img src={img.url} alt={img.caption || ''} className="w-full h-full object-cover" />
            {!img.is_visible && (
              <div className="absolute inset-0 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.6)' }}>
                <span className="text-white text-xs font-bold">مخفي</span>
              </div>
            )}
            <div className="absolute inset-0 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ background: 'rgba(0,0,0,0.5)' }}>
              <button onClick={() => toggleVisible(img.id, img.is_visible)}
                className="w-9 h-9 rounded-xl flex items-center justify-center text-sm"
                style={{ background: img.is_visible ? 'rgba(251,191,36,0.8)' : 'rgba(52,211,153,0.8)' }}>
                {img.is_visible ? '🙈' : '👁️'}
              </button>
              <button onClick={() => deleteImage(img.id)}
                className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ background: 'rgba(248,113,113,0.8)' }}>
                <FiTrash2 className="text-white" size={16} />
              </button>
            </div>
            {img.caption && <div className="absolute bottom-0 left-0 right-0 p-2" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.7), transparent)' }}>
              <p className="text-white text-xs">{img.caption}</p>
            </div>}
          </div>
        ))}
      </div>
      {images.length === 0 && <div className="glass rounded-2xl p-12 text-center"><FiImage className="text-5xl text-gray-500 mx-auto mb-3" /><p className="text-gray-400">مفيش صور لسه</p></div>}
    </div>
  );
}
