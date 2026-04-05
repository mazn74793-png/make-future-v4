import Navbar from '@/components/Navbar';
import { supabase } from '@/lib/supabase';
import { FiPlay, FiLock, FiClock, FiVideo, FiCheckCircle, FiInfo } from 'react-icons/fi';
import Link from 'next/link';

export default async function CoursePage({ params }) {
  const { id } = params;

  // 1. جلب البيانات (كورس + فيديوهات + حالة المستخدم)
  const { data: course } = await supabase.from('courses').select('*').eq('id', id).single();
  const { data: videos } = await supabase.from('videos').select('*').eq('course_id', id).order('order');
  
  // التحقق من الجلسة (اختياري في الـ Server Side)
  const { data: { user } } = await supabase.auth.getUser();
  
  // هل الطالب مشترك؟ (نبحث في جدول اسمه enrollments مثلاً)
  let isEnrolled = false;
  if (user) {
    const { data: enrollment } = await supabase
      .from('enrollments')
      .select('id')
      .eq('course_id', id)
      .eq('user_id', user.id)
      .single();
    if (enrollment) isEnrolled = true;
  }

  if (!course) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center site-bg text-white">
        <FiInfo size={50} className="text-gray-600 mb-4 animate-bounce" />
        <h2 className="text-2xl font-bold">عذراً، الكورس غير متاح حالياً</h2>
        <Link href="/" className="mt-4 text-primary hover:underline">العودة للرئيسية</Link>
      </div>
    );
  }

  return (
    <main className="min-h-screen site-bg text-white">
      <Navbar />
      
      {/* Hero Section */}
      <div className="pt-24 pb-12 px-4">
        <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* الجانب الأيمن: تفاصيل الكورس */}
          <div className="lg:col-span-2 space-y-6">
            <div className="glass rounded-[2rem] overflow-hidden border border-white/5 shadow-2xl animate-fade-in">
              {course.thumbnail_url && (
                <div className="relative group">
                  <img src={course.thumbnail_url} alt={course.title} className="w-full h-[300px] object-cover transition-transform duration-700 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#09090b] to-transparent opacity-60" />
                </div>
              )}
              
              <div className="p-8">
                <div className="flex items-center gap-2 mb-4">
                  <span className="bg-primary/20 text-primary text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest border border-primary/20">
                    {course.category || 'دورة تدريبية'}
                  </span>
                </div>
                <h1 className="text-3xl md:text-5xl font-black mb-4 leading-tight">{course.title}</h1>
                <p className="text-gray-400 leading-relaxed text-lg">{course.description}</p>
                
                <div className="flex flex-wrap gap-4 mt-8">
                  <div className="flex items-center gap-2 text-sm font-bold text-gray-300 bg-white/5 px-4 py-2 rounded-2xl border border-white/5">
                    <FiVideo className="text-primary" /> {videos?.length || 0} درس فيديو
                  </div>
                  <div className="flex items-center gap-2 text-sm font-bold text-gray-300 bg-white/5 px-4 py-2 rounded-2xl border border-white/5">
                    <FiClock className="text-primary" /> {course.duration || 'وقت غير محدد'}
                  </div>
                </div>
              </div>
            </div>

            {/* قائمة الدروس */}
            <div className="space-y-4">
              <h2 className="text-2xl font-black flex items-center gap-3 mt-10">
                <div className="w-2 h-8 gradient-primary rounded-full" />
                محتوى الدورة
              </h2>
              
              <div className="grid gap-3">
                {videos?.map((video, i) => {
                  const canAccess = video.is_free || isEnrolled;
                  return (
                    <div key={video.id} className={`glass rounded-2xl p-5 border border-white/5 flex items-center gap-5 transition-all duration-300 ${canAccess ? 'hover:border-primary/40 cursor-pointer group' : 'opacity-70'}`}>
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl transition-all shadow-lg ${canAccess ? 'gradient-primary text-white group-hover:scale-110' : 'bg-white/10 text-gray-500'}`}>
                        {canAccess ? <FiPlay /> : <FiLock />}
                      </div>
                      
                      <div className="flex-1">
                        <h3 className={`font-bold transition-colors ${canAccess ? 'group-hover:text-primary' : 'text-gray-400'}`}>
                          {video.title}
                        </h3>
                        <p className="text-xs text-gray-500 mt-1 font-medium">{video.duration || 'فيديو تعليمي'}</p>
                      </div>

                      {canAccess ? (
                        <span className="text-[10px] font-black text-emerald-400 bg-emerald-400/10 px-3 py-1.5 rounded-xl border border-emerald-400/20">جاهز للمشاهدة</span>
                      ) : (
                        <span className="text-[10px] font-black text-gray-500 bg-white/5 px-3 py-1.5 rounded-xl border border-white/5 italic text-left">مغلق</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* الجانب الأيسر: زرار الاشتراك (Sticky Card) */}
          <div className="lg:col-span-1">
            <div className="glass rounded-[2.5rem] p-8 border border-white/10 sticky top-28 shadow-2xl text-center space-y-6">
              <div className="space-y-2">
                <p className="text-gray-400 text-sm font-bold uppercase tracking-widest">سعر الاشتراك</p>
                <div className="text-5xl font-black tracking-tighter">
                  {course.is_free ? 'مجاني' : <>{course.price} <small className="text-lg font-bold text-gray-500">ج.م</small></>}
                </div>
              </div>

              <div className="space-y-4 pt-4">
                {isEnrolled ? (
                  <Link href={`/course/${id}/learn`} className="w-full gradient-primary py-5 rounded-[1.5rem] font-black flex items-center justify-center gap-3 shadow-xl shadow-primary/30 hover:scale-105 active:scale-95 transition-all">
                     استكمال التعلم <FiPlay />
                  </Link>
                ) : (
                  <Link href={`/checkout/${id}`} className="w-full gradient-primary py-5 rounded-[1.5rem] font-black flex items-center justify-center gap-3 shadow-xl shadow-primary/30 hover:scale-105 active:scale-95 transition-all">
                     اشترك في الكورس الآن <FiCheckCircle />
                  </Link>
                )}
                
                <p className="text-[10px] text-gray-500 font-bold leading-relaxed">
                  * بالاشتراك في الكورس، ستحصل على وصول كامل لجميع الفيديوهات والملفات الخاصة به مدى الحياة.
                </p>
              </div>

              <div className="pt-6 border-t border-white/5 grid grid-cols-2 gap-4">
                <div className="text-center">
                  <p className="text-xs text-gray-500 mb-1 font-bold">المستوى</p>
                  <p className="text-sm font-black">{course.level || 'عام'}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-500 mb-1 font-bold">اللغة</p>
                  <p className="text-sm font-black">العربية</p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </main>
  );
}
