import Navbar from '@/components/Navbar';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { FiPlay, FiArrowLeft, FiVideo, FiBookOpen, FiShield, FiHeadphones, FiClock, FiStar } from 'react-icons/fi';

export const revalidate = 60;

export default async function HomePage() {
  const { data: settings } = await supabase.from('site_settings').select('*').single();
  const { data: courses } = await supabase.from('courses').select('*').eq('is_published', true).order('order').limit(6);
  const { data: testimonials } = await supabase.from('testimonials').select('*').eq('is_visible', true).order('order').limit(6);
  const { data: announcements } = await supabase.from('announcements').select('*').eq('is_active', true);
  // بدل الـ static stats في الـ page.js ضيف ده في الأول
const { count: studentsCount } = await supabase.from('students').select('*', { count: 'exact', head: true }).eq('status', 'approved');
const { count: videosCount } = await supabase.from('videos').select('*', { count: 'exact', head: true });
const { count: coursesCount } = await supabase.from('courses').select('*', { count: 'exact', head: true }).eq('is_published', true);

  if (settings?.is_maintenance) {
    return (
      <div className="min-h-screen flex items-center justify-center gradient-dark">
        <div className="text-center">
          <div className="text-6xl mb-4">🔧</div>
          <h1 className="text-3xl font-black mb-2">{settings.maintenance_message}</h1>
        </div>
      </div>
    );
  }

  return (
    <main>
      <Navbar />

      {announcements?.length > 0 && (
        <div className="fixed top-16 w-full z-40">
          {announcements.map((ann) => (
            <div key={ann.id} className={`px-4 py-2 text-center text-sm ${
              ann.type === 'urgent' ? 'bg-red-500/90' :
              ann.type === 'warning' ? 'bg-yellow-500/90 text-black' :
              ann.type === 'success' ? 'bg-green-500/90' : 'bg-purple-500/90'
            }`}>
              <strong>{ann.title}:</strong> {ann.content}
            </div>
          ))}
        </div>
      )}

      <section className="min-h-screen flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 gradient-dark" />
        <div className="absolute top-20 right-20 w-72 h-72 bg-purple-500/20 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-20 left-20 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }} />

        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
          {settings?.teacher_image_url && (
            <img src={settings.teacher_image_url} alt={settings.teacher_name}
              className="w-24 h-24 rounded-full mx-auto mb-6 border-4 border-purple-500 animate-fade-in" />
          )}

          <div className="inline-flex items-center gap-2 glass px-4 py-2 rounded-full mb-8 animate-fade-in">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <span className="text-sm text-gray-300">{settings?.teacher_name || 'المدرس'} {settings?.subject ? `• ${settings.subject}` : ''} {settings?.stage ? `• ${settings.stage}` : ''}</span>
          </div>

          <h1 className="text-4xl md:text-7xl font-black mb-6 animate-fade-in" style={{ animationDelay: '0.2s' }}>
            {settings?.hero_title || 'تعلّم بطريقة'}
            <span className="block bg-gradient-to-l from-purple-400 via-pink-400 to-purple-600 bg-clip-text text-transparent">
              مختلفة تماماً
            </span>
          </h1>

          <p className="text-lg md:text-xl text-gray-400 mb-10 max-w-2xl mx-auto animate-fade-in" style={{ animationDelay: '0.4s' }}>
            {settings?.hero_subtitle || settings?.site_description || 'منصة تعليمية متكاملة'}
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in" style={{ animationDelay: '0.6s' }}>
            <Link href="/courses" className="gradient-primary px-8 py-4 rounded-2xl text-white font-bold text-lg hover:opacity-90 transition animate-glow flex items-center justify-center gap-2">
              <FiPlay /> ابدأ التعلم
            </Link>
            {settings?.whatsapp_number && (
              <a href={`https://wa.me/${settings.whatsapp_number}`} target="_blank"
                className="glass px-8 py-4 rounded-2xl text-white font-bold text-lg hover:bg-white/10 transition flex items-center justify-center gap-2">
                تواصل معانا <FiArrowLeft />
              </a>
            )}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-16 animate-fade-in" style={{ animationDelay: '0.8s' }}>
            {[
              { number: settings?.stats_students || '+500', label: 'طالب' },
              { number: settings?.stats_videos || '+50', label: 'فيديو' },
              { number: settings?.stats_courses || '+10', label: 'كورس' },
              { number: settings?.stats_rating || '4.9', label: 'تقييم' },
            ].map((stat, i) => (
              <div key={i} className="text-center">
                <div className="text-2xl md:text-4xl font-black bg-gradient-to-l from-purple-400 to-pink-400 bg-clip-text text-transparent">{stat.number}</div>
                <div className="text-xs md:text-sm text-gray-400 mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-5xl font-black text-center mb-4">
            ليه <span className="bg-gradient-to-l from-purple-400 to-pink-400 bg-clip-text text-transparent">منصتنا؟</span>
          </h2>
          <p className="text-gray-400 text-center mb-12">كل اللي محتاجه عشان تتفوق</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: <FiVideo className="text-3xl" />, title: 'فيديوهات HD', desc: 'شروحات بجودة عالية', color: 'from-purple-500 to-blue-500' },
              { icon: <FiBookOpen className="text-3xl" />, title: 'منهج متكامل', desc: 'كل المواد مرتبة', color: 'from-pink-500 to-rose-500' },
              { icon: <FiShield className="text-3xl" />, title: 'محتوى محمي', desc: 'فيديوهاتك آمنة', color: 'from-green-500 to-emerald-500' },
              { icon: <FiHeadphones className="text-3xl" />, title: 'دعم مستمر', desc: 'تواصل معانا أي وقت', color: 'from-orange-500 to-yellow-500' },
            ].map((f, i) => (
              <div key={i} className="glass rounded-2xl p-6 card-hover animate-fade-in" style={{ animationDelay: `${i * 0.1}s` }}>
                <div className={`w-14 h-14 rounded-xl bg-gradient-to-r ${f.color} flex items-center justify-center text-white mb-4`}>{f.icon}</div>
                <h3 className="text-lg font-bold mb-2">{f.title}</h3>
                <p className="text-gray-400 text-sm">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {courses?.length > 0 && (
        <section className="py-20 px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl md:text-5xl font-black text-center mb-12">
              أحدث <span className="bg-gradient-to-l from-purple-400 to-pink-400 bg-clip-text text-transparent">الكورسات</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {courses.map((course, i) => (
                <Link href={`/courses/${course.id}`} key={course.id}>
                  <div className="gradient-card rounded-2xl overflow-hidden card-hover border border-white/5 animate-fade-in" style={{ animationDelay: `${i * 0.1}s` }}>
                    <div className="relative h-48">
                      {course.thumbnail_url ? (
                        <img src={course.thumbnail_url} alt={course.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full gradient-primary flex items-center justify-center">
                          <FiBookOpen className="text-5xl text-white/50" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                      {course.is_free && <span className="absolute top-3 left-3 bg-green-500 px-3 py-1 rounded-full text-xs font-bold">مجاني</span>}
                    </div>
                    <div className="p-5">
                      <h3 className="text-lg font-bold mb-2">{course.title}</h3>
                      <p className="text-gray-400 text-sm line-clamp-2 mb-4">{course.description}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-purple-400 font-bold">{course.is_free ? 'مجاني' : `${course.price || 0} جنيه`}</span>
                        {course.duration && <span className="text-gray-500 text-sm flex items-center gap-1"><FiClock />{course.duration}</span>}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
            <div className="text-center mt-8">
              <Link href="/courses" className="glass px-8 py-3 rounded-xl text-white hover:bg-white/10 transition inline-block">عرض كل الكورسات ←</Link>
            </div>
          </div>
        </section>
      )}

      {settings?.about_text && (
        <section className="py-20 px-4">
          <div className="max-w-4xl mx-auto glass rounded-3xl p-8 md:p-12">
            <div className="flex flex-col md:flex-row items-center gap-8">
              {settings.teacher_image_url && (
                <img src={settings.teacher_image_url} alt={settings.teacher_name} className="w-32 h-32 rounded-2xl object-cover border-4 border-purple-500" />
              )}
              <div>
                <h2 className="text-3xl font-black mb-2">{settings.teacher_name}</h2>
                <p className="text-purple-400 mb-4">{settings.subject} • {settings.stage}</p>
                <p className="text-gray-300 leading-relaxed">{settings.about_text}</p>
              </div>
            </div>
          </div>
        </section>
      )}

      {testimonials?.length > 0 && (
        <section className="py-20 px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl md:text-5xl font-black text-center mb-12">
              آراء <span className="bg-gradient-to-l from-purple-400 to-pink-400 bg-clip-text text-transparent">طلابنا</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {testimonials.map((t, i) => (
                <div key={t.id} className="glass rounded-2xl p-6 card-hover animate-fade-in" style={{ animationDelay: `${i * 0.1}s` }}>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 gradient-primary rounded-full flex items-center justify-center font-bold">{t.student_name[0]}</div>
                    <div>
                      <h4 className="font-bold">{t.student_name}</h4>
                      <div className="flex gap-1">{Array(t.rating).fill(null).map((_, j) => <FiStar key={j} className="text-yellow-400 text-sm" />)}</div>
                    </div>
                  </div>
                  <p className="text-gray-300 text-sm">&quot;{t.comment}&quot;</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      <footer className="glass py-8 px-4 mt-10">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-gray-400">{settings?.footer_text || '© 2024 جميع الحقوق محفوظة'}</p>
            <div className="flex gap-4">
              {settings?.facebook_url && <a href={settings.facebook_url} target="_blank" className="text-gray-400 hover:text-blue-400 transition">Facebook</a>}
              {settings?.youtube_url && <a href={settings.youtube_url} target="_blank" className="text-gray-400 hover:text-red-400 transition">YouTube</a>}
              {settings?.telegram_url && <a href={settings.telegram_url} target="_blank" className="text-gray-400 hover:text-blue-300 transition">Telegram</a>}
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
