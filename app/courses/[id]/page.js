import Navbar from '@/components/Navbar';
import { supabase } from '@/lib/supabase';
import { FiPlay, FiLock, FiClock, FiVideo } from 'react-icons/fi';

export default async function CoursePage({ params }) {
  const { id } = params;
  const { data: course } = await supabase.from('courses').select('*').eq('id', id).single();
  const { data: videos } = await supabase.from('videos').select('*').eq('course_id', id).order('order');

  if (!course) {
    return (
      <div className="min-h-screen flex items-center justify-center gradient-dark">
        <p className="text-xl text-gray-400">الكورس مش موجود 😕</p>
      </div>
    );
  }

  return (
    <main>
      <Navbar />
      <div className="pt-24 pb-20 px-4 gradient-dark min-h-screen">
        <div className="max-w-4xl mx-auto">
          <div className="glass rounded-3xl overflow-hidden mb-8 animate-fade-in">
            {course.thumbnail_url && (
              <img src={course.thumbnail_url} alt={course.title} className="w-full h-64 object-cover" />
            )}
            <div className="p-6 md:p-8">
              <h1 className="text-3xl md:text-4xl font-black mb-4">{course.title}</h1>
              <p className="text-gray-300 mb-6">{course.description}</p>
              <div className="flex flex-wrap gap-4">
                <span className="glass px-4 py-2 rounded-xl flex items-center gap-2">
                  <FiVideo className="text-purple-400" /> {videos?.length || 0} فيديو
                </span>
                {course.duration && (
                  <span className="glass px-4 py-2 rounded-xl flex items-center gap-2">
                    <FiClock className="text-purple-400" /> {course.duration}
                  </span>
                )}
                <span className="gradient-primary px-4 py-2 rounded-xl font-bold">
                  {course.is_free ? '✨ مجاني' : `${course.price} جنيه`}
                </span>
              </div>
            </div>
          </div>

          <h2 className="text-2xl font-black mb-6">📋 محتوى الكورس</h2>
          <div className="space-y-3">
            {videos?.map((video, i) => (
              <div key={video.id} className="glass rounded-xl p-4 card-hover animate-fade-in flex items-center gap-4"
                style={{ animationDelay: `${i * 0.05}s` }}>
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${video.is_free ? 'gradient-primary' : 'bg-white/5'}`}>
                  {video.is_free ? <FiPlay className="text-white" /> : <FiLock className="text-gray-500" />}
                </div>
                <div className="flex-1">
                  <h3 className="font-bold">{video.title}</h3>
                  {video.duration && <span className="text-gray-500 text-sm">{video.duration}</span>}
                </div>
                <span className={`text-xs px-3 py-1 rounded-full ${video.is_free ? 'bg-green-500/20 text-green-400' : 'bg-white/5 text-gray-500'}`}>
                  {video.is_free ? 'مجاني' : 'مقفول'}
                </span>
              </div>
            ))}
            {(!videos || videos.length === 0) && (
              <p className="text-center text-gray-500 py-10">مفيش فيديوهات في الكورس ده لسه 📹</p>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
