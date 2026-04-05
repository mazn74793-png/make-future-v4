'use client';
import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter, useParams } from 'next/navigation';
import { FiPlay, FiLock, FiYoutube, FiChevronLeft, FiChevronRight, FiList } from 'react-icons/fi';

function getYoutubeId(url) {
  const match = url?.match(/(?:v=|youtu\.be\/|embed\/)([^&\n?#]+)/);
  return match?.[1] || null;
}

function VideoPlayer({ video }) {
  const handleContextMenu = (e) => e.preventDefault();

  if (video.video_type === 'youtube') {
    const ytId = getYoutubeId(video.video_url);
    return (
      <div className="relative w-full aspect-video rounded-3xl overflow-hidden bg-black shadow-2xl border border-white/5">
        <iframe 
          src={`https://www.youtube.com/embed/${ytId}?rel=0&modestbranding=1&autoplay=1`}
          className="w-full h-full" 
          allowFullScreen 
          allow="autoplay; encrypted-media" 
        />
      </div>
    );
  }

  return (
    <div className="relative w-full aspect-video rounded-3xl overflow-hidden bg-black shadow-2xl border border-white/5">
      <video 
        src={video.video_url} 
        controls 
        className="w-full h-full"
        onContextMenu={handleContextMenu}
        controlsList="nodownload"
        disablePictureInPicture
      />
    </div>
  );
}

export default function StudentCoursePage() {
  const { id } = useParams();
  const router = useRouter();
  const [course, setCourse] = useState(null);
  const [videos, setVideos] = useState([]);
  const [activeVideo, setActiveVideo] = useState(null);
  const [hasAccess, setHasAccess] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { router.push('/login'); return; }

        // 1. جلب بيانات الطالب
        const { data: student } = await supabase.from('students').select('id, status').eq('user_id', user.id).single();
        if (!student || student.status !== 'approved') { router.push('/pending'); return; }

        // 2. جلب بيانات الكورس
        const { data: courseData } = await supabase.from('courses').select('*').eq('id', id).single();
        if (!courseData) { router.push('/student'); return; }
        setCourse(courseData);

        // 3. التحقق من الصلاحية (التعديل هنا)
        // استخدمنا select().eq().maybeSingle() عشان ميعملش Error لو مفيش اشتراك
        const { data: enrollment } = await supabase.from('enrollments')
          .select('is_active')
          .eq('student_id', student.id)
          .eq('course_id', id)
          .eq('is_active', true)
          .maybeSingle();

        const access = !!enrollment || courseData.visibility === 'public';
        setHasAccess(access);

        // 4. جلب الفيديوهات لو فيه صلاحية
        if (access) {
          const { data: videosData } = await supabase.from('videos')
            .select('*')
            .eq('course_id', id)
            .order('order', { ascending: true });
          
          setVideos(videosData || []);
          if (videosData?.length > 0) setActiveVideo(videosData[0]);
        }
      } catch (err) {
        console.error("Error loading course:", err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [id, router]);

  const goToNextVideo = () => {
    const currentIndex = videos.findIndex(v => v.id === activeVideo.id);
    if (currentIndex < videos.length - 1) setActiveVideo(videos[currentIndex + 1]);
  };

  const goToPrevVideo = () => {
    const currentIndex = videos.findIndex(v => v.id === activeVideo.id);
    if (currentIndex > 0) setActiveVideo(videos[currentIndex - 1]);
  };

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#09090b]">
      <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mb-4" />
      <p className="text-gray-500 font-bold animate-pulse">جاري تحضير الدرس...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#09090b] text-white" dir="rtl">
      <nav className="sticky top-0 z-50 bg-[#09090b]/80 backdrop-blur-md border-b border-white/5 px-4 md:px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => router.push('/student')} className="p-2.5 rounded-2xl bg-white/5 hover:bg-white/10 transition-all">
            <FiChevronRight size={20} />
          </button>
          <div>
            <h1 className="font-bold text-lg truncate max-w-[200px]">{course?.title}</h1>
            <p className="text-[10px] text-purple-400 font-bold uppercase tracking-widest flex items-center gap-1">
              <FiList /> {videos.length} دروس
            </p>
          </div>
        </div>
      </nav>

      {!hasAccess ? (
        <div className="flex items-center justify-center min-h-[80vh] px-4">
          <div className="bg-[#111114] rounded-[2rem] p-10 text-center max-w-md border border-white/5">
            <FiLock className="text-4xl text-yellow-500 mx-auto mb-6" />
            <h2 className="text-2xl font-bold mb-3">المحتوى مغلق</h2>
            <p className="text-gray-400 mb-8 text-sm">أنت غير مشترك في هذا الكورس حالياً. تواصل مع الإدارة للتفعيل.</p>
            <button onClick={() => router.push('/student')} className="w-full py-4 bg-indigo-600 rounded-2xl font-bold hover:bg-indigo-700 transition-all">
              العودة للمنصة
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col lg:flex-row min-h-[calc(100vh-80px)]">
          <main className="flex-1 p-4 lg:p-8">
            {activeVideo ? (
              <div className="max-w-5xl mx-auto">
                <VideoPlayer video={activeVideo} />
                <div className="mt-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div>
                    <h2 className="text-2xl font-bold">{activeVideo.title}</h2>
                    <p className="text-sm text-gray-400 mt-2">{activeVideo.description}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button disabled={videos.findIndex(v => v.id === activeVideo.id) === 0} onClick={goToPrevVideo} className="p-3 bg-white/5 rounded-xl disabled:opacity-20 hover:bg-white/10">
                      السابق
                    </button>
                    <button disabled={videos.findIndex(v => v.id === activeVideo.id) === videos.length - 1} onClick={goToNextVideo} className="px-6 py-3 bg-indigo-600 rounded-xl disabled:opacity-20 hover:bg-indigo-700 font-bold">
                      التالي
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">لا توجد فيديوهات في هذا الكورس</div>
            )}
          </main>

          <aside className="w-full lg:w-96 bg-[#111114] border-t lg:border-t-0 lg:border-r border-white/5 p-6 overflow-y-auto">
            <h3 className="font-bold mb-6">قائمة المحتوى</h3>
            <div className="space-y-3">
              {videos.map((v, i) => (
                <button 
                  key={v.id} 
                  onClick={() => setActiveVideo(v)}
                  className={`w-full text-right p-4 rounded-2xl flex items-center gap-4 transition-all ${activeVideo?.id === v.id ? 'bg-indigo-600/20 border border-indigo-600/50' : 'bg-white/5 border border-transparent'}`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${activeVideo?.id === v.id ? 'bg-indigo-600' : 'bg-white/10 text-gray-500'}`}>
                    {v.video_type === 'youtube' ? <FiYoutube /> : i + 1}
                  </div>
                  <span className="text-sm font-medium truncate">{v.title}</span>
                </button>
              ))}
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
