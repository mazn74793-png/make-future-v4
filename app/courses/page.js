import Navbar from '@/components/Navbar';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { FiBookOpen, FiClock, FiLock, FiStar, FiArrowLeft } from 'react-icons/fi';

// تحديث الصفحة كل 60 ثانية لجلب أي تعديلات
export const revalidate = 60;

export default async function CoursesPage() {
  const { data: courses } = await supabase
    .from('courses')
    .select('*')
    .eq('is_published', true)
    .order('order');

  return (
    <main className="min-h-screen site-bg">
      <Navbar />
      
      {/* Background Decor */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="aurora-orb aurora-orb-1 opacity-20" />
        <div className="aurora-orb aurora-orb-2 opacity-10" />
      </div>

      <div className="relative z-10 pt-32 pb-20 px-4">
        <div className="max-w-6xl mx-auto">
          
          {/* Header */}
          <div className="text-center mb-16 space-y-4 animate-fade-in">
            <span className="bg-primary/10 text-primary-light px-4 py-1.5 rounded-full text-xs font-black tracking-widest uppercase border border-primary/20">
              المستقبل يبدأ من هنا
            </span>
            <h1 className="text-4xl md:text-6xl font-black text-white tracking-tighter">
              استكشف <span className="text-primary-light">كورساتنا</span> التعليمية
            </h1>
            <p className="text-gray-500 max-w-xl mx-auto text-lg">
              اختر الكورس المناسب لسنتك الدراسية وابدأ رحلة التفوق مع أقوى شرح ومنهجية تعليمية.
            </p>
          </div>

          {/* CTA Banner: تحفيز على تسجيل الدخول */}
          <div className="glass rounded-3xl p-6 mb-12 border border-white/5 flex flex-col md:flex-row items-center justify-between gap-6 animate-fade-in shadow-2xl shadow-primary/5">
            <div className="flex items-center gap-4 text-right">
              <div className="w-12 h-12 bg-primary/20 rounded-2xl flex items-center justify-center text-primary text-xl flex-shrink-0">
                <FiStar className="animate-pulse" />
              </div>
              <div>
                <h4 className="text-white font-bold">هل تمتلك حساباً بالفعل؟</h4>
                <p className="text-gray-500 text-sm">سجل دخولك الآن لمتابعة دروسك واختباراتك من حيث توقفت.</p>
              </div>
            </div>
            <div className="flex items-center gap-3 w-full md:w-auto">
               <Link href="/register" className="flex-1 md:flex-none text-center bg-white/5 hover:bg-white/10 px-8 py-3.5 rounded-2xl text-white text-sm font-black transition-all border border-white/10">
                إنشاء حساب
              </Link>
              <Link href="/login" className="flex-1 md:flex-none text-center gradient-primary px-8 py-3.5 rounded-2xl text-white text-sm font-black hover:shadow-lg hover:shadow-primary/30 transition-all">
                تسجيل الدخول
              </Link>
            </div>
          </div>

          {/* Courses Grid */}
          {courses?.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {courses.map((course, i) => (
                <Link href={`/course/${course.id}`} key={course.id} className="group">
                  <div 
                    className="glass rounded-[2rem] overflow-hidden border border-white/5 transition-all duration-500 hover:border-primary/40 hover:-translate-y-2 flex flex-col h-full animate-fade-in shadow-xl"
                    style={{ animationDelay: `${i * 0.1}s` }}
                  >
                    {/* Thumbnail */}
                    <div className="relative h-56 overflow-hidden">
                      {course.thumbnail_url ? (
                        <img 
                          src={course.thumbnail_url} 
                          alt={course.title} 
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
                          <FiBookOpen className="text-6xl text-gray-700" />
                        </div>
                      )}
                      
                      {/* Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-[#09090b] via-transparent to-transparent opacity-80" />
                      
                      {/* Badge */}
                      <div className="absolute top-4 right-4 flex gap-2">
                        {course.is_free ? (
                          <span className="bg-emerald-500 text-white px-3 py-1 rounded-xl text-[10px] font-black uppercase">مجاني</span>
                        ) : (
                          <span className="bg-primary text-white px-3 py-1 rounded-xl text-[10px] font-black uppercase">مدفوع</span>
                        )}
                        <span className="glass-dark text-white/70 px-3 py-1 rounded-xl text-[10px] font-black uppercase">
                          {course.stage || 'عام'}
                        </span>
                      </div>

                      {/* Lock Icon on Hover */}
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                         <div className="bg-white/10 backdrop-blur-md p-4 rounded-full border border-white/20">
                            <FiArrowLeft className="text-white text-2xl" />
                         </div>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-6 flex flex-col flex-1">
                      <h3 className="text-xl font-black text-white mb-2 group-hover:text-primary-light transition-colors">
                        {course.title}
                      </h3>
                      <p className="text-gray-500 text-sm line-clamp-2 mb-6 leading-relaxed">
                        {course.description || "استمتع بتجربة تعليمية فريدة مع شرح مفصل وتدريبات شاملة لكل أجزاء المنهج."}
                      </p>

                      <div className="mt-auto pt-6 border-t border-white/5 flex items-center justify-between">
                        <div className="flex flex-col">
                          <span className="text-[10px] text-gray-600 font-bold uppercase tracking-wider">سعر الكورس</span>
                          <span className="text-lg font-black text-white">
                            {course.is_free ? 'مجاني بالكامل' : <>{course.price} <small className="text-xs">ج.م</small></>}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-500 text-xs font-bold bg-white/5 px-3 py-2 rounded-xl">
                          <FiClock className="text-primary" />
                          {course.duration || '12 ساعة'}
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-32 glass rounded-[3rem] border border-dashed border-white/10">
              <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
                <FiBookOpen className="text-4xl text-gray-700" />
              </div>
              <h3 className="text-xl font-bold text-gray-400">لا يوجد كورسات متاحة حالياً</h3>
              <p className="text-gray-600 text-sm mt-2 text-balance">نحن نعمل على تجهيز محتوى تعليمي رائع لك، انتظرنا قريباً!</p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
