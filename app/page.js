import Navbar from '@/components/Navbar';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { FiPlay, FiArrowLeft, FiVideo, FiBookOpen, FiStar, FiImage, FiAward } from 'react-icons/fi';

export const revalidate = 60; // تحديث البيانات كل دقيقة

export default async function HomePage() {
  const [
    { data: settings },
    { data: courses },
    { data: testimonials },
    { data: announcements },
    { data: statsData },
    { data: gallery }
  ] = await Promise.all([
    supabase.from('site_settings').select('*').single(),
    supabase.from('courses').select('*').eq('is_published', true).order('order'),
    supabase.from('testimonials').select('*').eq('is_visible', true).order('order'),
    supabase.from('announcements').select('*').eq('is_active', true),
    supabase.rpc('get_public_stats'),
    supabase.from('gallery').select('*').eq('is_visible', true).order('order_num')
  ]);

  if (settings?.is_maintenance) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white p-6 text-center">
        <h1 className="text-2xl font-bold">{settings.maintenance_message}</h1>
      </div>
    );
  }

  return (
    <main className="relative min-h-screen">
      <div className="site-bg" />
      <Navbar />

      {/* Announcements - حل مشكلة التداخل في الموبايل */}
      <div className="pt-20 md:pt-4"> {/* مساحة الهيدر في الموبايل */}
        {announcements?.map(ann => (
          <div key={ann.id} className="bg-indigo-600 text-white py-3 px-4 text-center text-xs md:text-sm font-bold animate-pulse">
            📢 {ann.content}
          </div>
        ))}
      </div>

      {/* Hero Section */}
      <section className="relative pt-12 pb-20 px-4 text-center overflow-hidden">
        <div className="max-w-4xl mx-auto reveal">
          {settings?.teacher_image_url && (
            <div className="relative inline-block mb-8">
              <div className="absolute inset-0 bg-indigo-500 blur-2xl opacity-20 rounded-full"></div>
              <img src={settings.teacher_image_url} className="relative w-32 h-32 md:w-44 md:h-44 rounded-full border-4 border-white/10 object-cover shadow-2xl" alt="Teacher" />
            </div>
          )}
          
          <h1 className="text-4xl md:text-7xl font-black mb-6 leading-[1.2]">
            {settings?.hero_title || 'مستقبلك يبدأ من'} <br/>
            <span className="text-indigo-500">{settings?.subject || 'هنا'}</span>
          </h1>
          
          <p className="text-gray-400 text-base md:text-xl mb-10 max-w-2xl mx-auto px-4 leading-relaxed">
            {settings?.hero_subtitle}
          </p>
          
          <div className="flex flex-col sm:flex-row justify-center gap-4 px-6">
            <Link href="/login" className="px-10 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold flex items-center justify-center gap-2 transition-all transform hover:scale-105 shadow-xl shadow-indigo-500/20">
              <FiPlay size={18} /> ابدأ رحلتك الآن
            </Link>
            <a href={`https://wa.me/${settings?.whatsapp_number}`} target="_blank" className="px-10 py-4 bg-white/5 border border-white/10 rounded-2xl font-bold hover:bg-white/10 transition-all flex items-center justify-center gap-2">
              تواصل مع الدعم الفني
            </a>
          </div>
        </div>
      </section>

      {/* Stats - Responsive Grid */}
      <section className="py-10 px-4 max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4 reveal">
        {[
          { label: 'طالب مشترك', val: statsData?.students || 0, icon: <FiStar className="text-yellow-500"/> },
          { label: 'كورس متاح', val: statsData?.courses || 0, icon: <FiBookOpen className="text-indigo-500"/> },
          { label: 'فيديو تعليمي', val: statsData?.videos || 0, icon: <FiVideo className="text-pink-500"/> },
          { label: 'سنة خبرة', val: '10+', icon: <FiAward className="text-emerald-500"/> },
        ].map((s, i) => (
          <div key={i} className="glass-card p-6 text-center group">
             <div className="flex justify-center mb-2 text-xl opacity-80 group-hover:scale-125 transition-transform">{s.icon}</div>
             <div className="text-2xl md:text-3xl font-black mb-1">{s.val}</div>
             <div className="text-[10px] md:text-xs text-gray-500 font-bold uppercase tracking-widest">{s.label}</div>
          </div>
        ))}
      </section>

      {/* Courses Section */}
      <section className="py-20 px-4 max-w-7xl mx-auto reveal">
        <div className="flex items-center justify-between mb-10 px-2">
          <h2 className="text-2xl md:text-4xl font-black">أحدث الكورسات</h2>
          <Link href="/login" className="text-indigo-500 text-sm font-bold">عرض الكل</Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {courses?.map(course => (
            <Link href={`/login`} key={course.id} className="glass-card overflow-hidden group">
              <div className="aspect-video relative overflow-hidden">
                <img src={course.thumbnail_url} className="object-cover w-full h-full group-hover:scale-110 transition duration-700" alt={course.title} />
                <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-bold border border-white/10">
                  {course.stage}
                </div>
              </div>
              <div className="p-6">
                <h3 className="font-bold text-lg mb-2 line-clamp-1">{course.title}</h3>
                <p className="text-gray-500 text-xs mb-4 line-clamp-2 leading-relaxed">{course.description}</p>
                <div className="flex justify-between items-center">
                  <span className="text-indigo-400 font-black">{course.is_free ? 'مجاني' : `${course.price} ج.م`}</span>
                  <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-500"><FiArrowLeft/></div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Gallery Section */}
      {gallery?.length > 0 && (
        <section className="py-20 px-4 max-w-7xl mx-auto reveal">
          <h2 className="text-3xl font-black mb-12 text-center">لحظات من نجاحنا</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            {gallery.map(img => (
              <div key={img.id} className="glass-card p-2 rounded-2xl group cursor-pointer">
                <div className="overflow-hidden rounded-xl h-40 md:h-56">
                  <img src={img.url} className="w-full h-full object-cover group-hover:scale-110 transition duration-500" alt={img.caption} />
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Testimonials */}
      <section className="py-20 px-4 bg-indigo-600/5 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-black mb-16 text-center">أبطالنا بيقولوا إيه؟</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials?.map(t => (
              <div key={t.id} className="glass-card p-8 relative">
                <FiStar className="absolute top-8 left-8 text-indigo-500/20" size={40} />
                <div className="flex gap-1 text-yellow-500 mb-6">
                  {[...Array(t.rating)].map((_, i) => <FiStar key={i} fill="currentColor" size={14} />)}
                </div>
                <p className="text-gray-300 text-sm italic mb-8 leading-relaxed">"{t.comment}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center font-bold text-indigo-500 text-xs">
                    {t.student_name[0]}
                  </div>
                  <div className="font-bold text-sm">{t.student_name}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="py-12 border-t border-white/5 text-center px-4">
        <p className="text-gray-500 text-xs md:text-sm">
          {settings?.footer_text || 'جميع الحقوق محفوظة © 2026'}
        </p>
      </footer>
    </main>
  );
}
