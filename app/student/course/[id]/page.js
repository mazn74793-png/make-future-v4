'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter, useParams } from 'next/navigation';
import { FiArrowRight, FiPlay, FiLock, FiYoutube } from 'react-icons/fi';

// استخراج YouTube ID
function getYoutubeId(url) {
  const match = url?.match(/(?:v=|youtu\.be\/)([^&\n?#]+)/);
  return match?.[1] || null;
}

// مشغل الفيديو
function VideoPlayer({ video }) {
  if (video.video_type === 'youtube') {
    const ytId = getYoutubeId(video.video_url);
    return (
      <div className="w-full aspect-video rounded-2xl overflow-hidden bg-black">
        <iframe
          src={`https://www.youtube.com/embed/${ytId}?autoplay=1`}
          className="w-full h-full"
          allowFullScreen
          allow="autoplay; encrypted-media"
        />
      </div>
    );
  }
  return (
    <div className="w-full aspect-video rounded-2xl overflow-hidden bg-black">
      <video
        src={video.video_url}
        controls
        className="w-full h-full"
        controlsList="nodownload"
        onContextMenu={e => e.preventDefault()}
      />
    </div>
  );
}

export default function StudentCoursePage() {
  const { id } = useParams();
  const router = useRouter();
  const [student, setStudent] = useState(null);
  const [course, setCourse] = useState(null);
  const [videos, setVideos] = useState([]);
  const [activeVideo, setActiveVideo] = useState(null);
  const [hasAccess, setHasAccess] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/login'); return; }

      // بيانات الطالب
      const { data: studentData } = await supabase
        .from('students').select('*').eq('user_id', user.id).single();

      if (!studentData || studentData.status !== 'approved') {
        router.push('/pending'); return;
      }
      setStudent(studentData);

      // بيانات الكورس
      const { data: courseData } = await supabase
        .from('courses').select('*').eq('id', id).single();

      if (!courseData) { router.push('/student'); return; }
      setCourse(courseData);

      // هل الطالب مشترك؟
      const { data: enrollment } = await supabase
        .from('enrollments')
        .select('id')
        .eq('student_id', studentData.id)
        .eq('course_id', id)
        .eq('is_active', true)
        .single();

      const access = !!enrollment || courseData.visibility === 'public';
      setHasAccess(access);

      if (access) {
        // جيب الفيديوهات
        const { data: videosData } = await supabase
          .from('videos')
          .select('*')
          .eq('course_id', id)
          .order('order');
        setVideos(videosData || []);
        if (videosData?.length > 0) setActiveVideo(videosData[0]);
      }

      setLoading(false);
    };
    load();
  }, [id, router]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center gradient-dark">
      <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen gradient-dark" dir="rtl">
      {/* Header */}
      <div className="glass border-b border-white/5 px-6 py-4 flex items-center gap-4 sticky top-0 z-10">
        <button onClick={() => router.push('/student')}
          className="p-2 rounded-xl bg-white/5 hover:bg-white/10 transition">
          <FiArrowRight />
        </button>
        <div>
          <h1 className="font-black text-lg">{course?.title}</h1>
          <p className="text-gray-400 text-xs">{videos.length} درس</p>
        </div>
      </div>

      {!hasAccess ? (
        <div className="flex items-center justify-center min-h-[80vh]">
          <div className="glass rounded-2xl p-10 text-center max-w-md">
            <FiLock className="text-6xl text-yellow-400 mx-auto mb-4" />
            <h2 className="text-2xl font-black mb-2">محتاج إذن</h2>
            <p className="text-gray-400 mb-6">لازم الأدمن يوافق على طلبك عشان تشوف الفيديوهات</p>
            <button onClick={() => router.push('/student')}
              className="gradient-primary px-8 py-3 rounded-xl text-white font-bold">
              رجوع
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col lg:flex-row h-[calc(100vh-65px)]">
          {/* مشغل الفيديو */}
          <div className="flex-1 p-4 lg:p-6 overflow-y-auto">
            {activeVideo ? (
              <>
                <VideoPlayer video={activeVideo} />
                <div className="mt-4">
                  <div className="flex items-center gap-2 mb-1">
                    {activeVideo.video_type === 'youtube'
                      ? <FiYoutube className="text-red-400" />
                      : <FiPlay className="text-purple-400" />}
                    <h2 className="text-xl font-black">{activeVideo.title}</h2>
                  </div>
                  {activeVideo.description && (
                    <p className="text-gray-400 text-sm mt-2">{activeVideo.description}</p>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-64 glass rounded-2xl">
                <p className="text-gray-400">اختار درس من القائمة</p>
              </div>
            )}
          </div>

          {/* قائمة الفيديوهات */}
          <div className="w-full lg:w-80 glass border-t lg:border-t-0 lg:border-r border-white/5 overflow-y-auto">
            <div className="p-4">
              <h3 className="font-black mb-4 text-gray-300">محتوى الكورس</h3>
              <div className="space-y-2">
                {videos.map((v, i) => (
                  <button key={v.id} onClick={() => setActiveVideo(v)}
                    className={`w-full text-right p-3 rounded-xl transition flex items-center gap-3 ${
                      activeVideo?.id === v.id
                        ? 'gradient-primary text-white'
                        : 'bg-white/5 hover:bg-white/10 text-gray-300'
                    }`}>
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-sm font-bold ${
                      activeVideo?.id === v.id ? 'bg-white/20' : 'bg-white/10'
                    }`}>
                      {v.video_type === 'youtube'
                        ? <FiYoutube className="text-sm" />
                        : i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">{v.title}</p>
                      {v.duration && <p className="text-xs opacity-60">{v.duration}</p>}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
