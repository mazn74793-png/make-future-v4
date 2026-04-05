'use client';
import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter, useParams } from 'next/navigation';
import { FiPlay, FiLock, FiYoutube, FiChevronLeft, FiChevronRight, FiList } from 'react-icons/fi';

// دالة استخراج ID اليوتيوب
function getYoutubeId(url) {
  const match = url?.match(/(?:v=|youtu\.be\/|embed\/)([^&\n?#]+)/);
  return match?.[1] || null;
}

function VideoPlayer({ video }) {
  const videoRef = useRef(null);

  // منع كليك يمين على الفيديو لحماية المحتوى
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
        ref={videoRef}
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
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/login'); return; }

      const { data: student } = await supabase.from('students').select('id, status').eq('user_id', user.id).single();
      if (!student || student.status !== 'approved') { router.push('/pending'); return; }

      const { data: courseData } = await supabase.from('courses').select('*').eq('id', id).single();
      if (!courseData) { router.push('/student'); return; }
      setCourse(courseData);

      const { data: enrollment } = await supabase.from('enrollments')
        .select('is_active').eq('student_id', student.id).eq('course_id', id).eq('is_active', true).single();

      const access = !!enrollment || courseData.visibility === 'public';
      setHasAccess(access);

      if (access) {
        const { data: videosData } = await supabase.from('videos').select('*').eq('course_id', id).order('order', { ascending: true });
        setVideos(videosData || []);
        if (videosData?.length > 0) setActiveVideo(videosData[0]);
      }
      setLoading(false);
    };
    loadData();
  }, [id, router]);

  const goToNextVideo = () => {
    const currentIndex = videos.findIndex(v => v.id === activeVideo.id);
    if (currentIndex < videos.length - 1) {
      setActiveVideo(videos[currentIndex + 1]);
    }
  };

  const goToPrevVideo = () => {
    const currentIndex = videos.findIndex(v => v.id === activeVideo.id);
    if (currentIndex > 0) {
      setActiveVideo(videos[currentIndex - 1]);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#09090b]">
      <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mb-4" />
      <p className="text-gray-500 font-bold animate-pulse">جاري تحضير الدرس...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#09090b] text-white" dir="rtl">
      {/* Navbar */}
      <nav className="glass sticky top-0 z-50 border-b border-white/5 px-4 md:px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => router.push('/student')} className="p-2.5 rounded-2xl bg-white/5 hover:bg-white/10 transition-all active:scale-95 group">
            <FiChevronRight className="text-xl group-hover:translate-x-1 transition-transform" />
          </button>
          <div className="hidden sm:block h-8 w-px bg-white/10 mx-2" />
          <div>
            <h1 className="font-black text-lg md:text-xl truncate max-w-[200px] md:max-w-md">{course?.title}</h1>
            <div className="flex items-center gap-2 text-[10px] text-purple-400 font-bold uppercase tracking-widest">
               <FiList className="text-xs" /> المحتوى الدراسي
            </div>
          </div>
        </div>
      </nav>

      {!hasAccess ? (
        <div className="flex items-center justify-center min-h-[80vh] px-4">
          <div className="glass rounded-[2.5rem] p-10 text-center max-w-md border border-white/10 shadow-2xl">
            <div className="w-20 h-20 bg-yellow-500/10 rounded-3xl flex items-center justify-center mx-auto mb-6">
               <FiLock className="text-4xl text-yellow-500" />
            </div>
            <h2 className="text-2xl font-black mb-3">هذا المحتوى مقيد</h2>
            <p className="text-gray-400 mb-8 leading-relaxed">تحتاج لتفعيل الاشتراك في هذا الكورس لتتمكن من مشاهدة الدروس.</p>
            <button onClick={() => router.push('/student')} className="gradient-primary w-full py-4 rounded-2xl text-white font-black shadow-lg shadow-purple-500/20">
              العودة للمنصة
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col lg:flex-row min-h-[calc(100vh-80px)]">
          {/* Main Content Area */}
          <main className="flex-1 p-4 lg:p-8 overflow-y-auto custom-scrollbar">
            {activeVideo ? (
              <div className="max-w-5xl mx-auto animate-fade-in">
                <VideoPlayer video={activeVideo} />
                
                <div className="mt-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      {activeVideo.video_type === 'youtube' ? 
                        <span className="px-3 py-1 rounded-full bg-red-500/10 text-red-500 text-[10px] font-black uppercase tracking-tighter border border-red-500/10">YouTube</span> : 
                        <span className="px-3 py-1 rounded-full bg-purple-500/10 text-purple-500 text-[10px] font-black uppercase tracking-tighter border border-purple-500/10">Premium Server</span>
                      }
                    </div>
                    <h2 className="text-2xl md:text-3xl font-black tracking-tight">{activeVideo.title}</h2>
                  </div>

                  {/* Navigation Buttons */}
                  <div className="flex items-center gap-3">
                    <button 
                      disabled={videos.findIndex(v => v.id === activeVideo.id) === 0}
                      onClick={goToPrevVideo}
                      className="p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all disabled:opacity-20 active:scale-95 flex items-center gap-2 font-bold text-sm"
                    >
                      <FiChevronRight /> السابق
                    </button>
                    <button 
                      disabled={videos.findIndex(v => v.id === activeVideo.id) === videos.length - 1}
                      onClick={goToNextVideo}
                      className="p-4 rounded-2xl gradient-primary text-white transition-all disabled:opacity-20 active:scale-95 flex items-center gap-2 font-black text-sm px-8"
                    >
                      التالي <FiChevronLeft />
                    </button>
                  </div>
                </div>

                <div className="mt-6 p-6 rounded-3xl bg-white/5 border border-white/10">
                   <h4 className="text-gray-400 text-xs font-bold uppercase mb-3 tracking-widest">عن هذا الدرس</h4>
                   <p className="text-gray-300 leading-relaxed">{activeVideo.description || "لا يوجد وصف متاح لهذا الدرس حالياً."}</p>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-gray-500 font-medium">برجاء اختيار درس للبدء</p>
              </div>
            )}
          </main>

          {/* Playlist Sidebar */}
          <aside className="w-full lg:w-[400px] bg-black/40 backdrop-blur-xl border-t lg:border-t-0 lg:border-r border-white/5">
            <div className="p-6 sticky top-[80px]">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-black text-lg text-white">قائمة المحتوى</h3>
                <span className="text-xs font-bold text-purple-400 bg-purple-500/10 px-3 py-1 rounded-full border border-purple-400/20">
                  {videos.length} درس
                </span>
              </div>
              
              <div className="space-y-3 overflow-y-auto max-h-[calc(100vh-250px)] pr-1 custom-scrollbar">
                {videos.map((v, i) => (
                  <button 
                    key={v.id} 
                    onClick={() => setActiveVideo(v)}
                    className={`w-full text-right p-4 rounded-2xl transition-all duration-300 flex items-center gap-4 border group ${
                      activeVideo?.id === v.id 
                      ? 'bg-purple-600/10 border-purple-500/50 text-white shadow-lg shadow-purple-500/5' 
                      : 'bg-white/5 border-transparent hover:border-white/10 text-gray-400 hover:text-gray-200'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-sm font-black transition-all ${
                      activeVideo?.id === v.id 
                      ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/50' 
                      : 'bg-white/5 text-gray-500 group-hover:bg-white/10'
                    }`}>
                      {v.video_type === 'youtube' ? <FiYoutube className="text-lg" /> : (i + 1).toString().padStart(2, '0')}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-bold truncate ${activeVideo?.id === v.id ? 'text-white' : ''}`}>
                        {v.title}
                      </p>
                      <div className="flex items-center gap-3 mt-1">
                         <span className="text-[10px] opacity-60 flex items-center gap-1">
                           <FiPlay className="text-[8px]" /> {v.duration || 'مدد غير محددة'}
                         </span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
