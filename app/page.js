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

  const { data: statsData } = await supabase.rpc('get_public_stats');
  const studentsCount = statsData?.students || 0;
  const videosCount = statsData?.videos || 0;
  const coursesCount = statsData?.courses || 0;

  if (settings?.is_maintenance) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg)' }}>
        <div className="text-center">
          <div className="text-6xl mb-4">🔧</div>
          <h1 className="text-3xl font-black mb-2">{settings.maintenance_message}</h1>
        </div>
      </div>
    );
  }

  return (
    <main style={{ background: 'var(--bg)', color: 'var(--text)' }}>
      <Navbar />

      {/* Announcements */}
      {announcements?.length > 0 && (
        <div className="fixed top-16 w-full z-40">
          {announcements.map((ann) => (
            <div key={ann.id} className={`px-4 py-2 text-center text-sm font-bold ${
              ann.type === 'urgent' ? 'bg-red-500' :
              ann.type === 'warning' ? 'bg-yellow-500 text-black' :
              ann.type === 'success' ? 'bg-green-500' : 'bg-indigo-500'
            }`}>
              {ann.title}: {ann.content}
            </div>
          ))}
        </div>
      )}

      {/* ===== Hero ===== */}
      <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden"
        style={{ paddingTop: '80px', paddingBottom: '40px' }}>

        {/* Animated background orbs */}
        <div className="orb orb-primary animate-float"
          style={{ top: '10%', right: '-5%', animationDelay: '0s' }} />
        <div className="orb orb-accent animate-float"
          style={{ bottom: '15%', left: '-5%', animationDelay: '1.5s' }} />
        <div className="orb orb-primary animate-float"
          style={{ top: '60%', right: '30%', width: '200px', height: '200px', animationDelay: '3s' }} />

        <div className="relative z-10 text-center px-4 w-full max-w-3xl mx-auto">

          {/* صورة المدرس — ظاهرة صح */}
          {settings?.teacher_image_url && (
            <div className="relative inline-block mb-6 animate-fade-in">
              <div className="w-28 h-28 md:w-36 md:h-36 rounded-full mx-auto overflow-hidden"
                style={{
                  border: '3px solid rgba(99,102,241,0.5)',
                  boxShadow: '0 0 40px rgba(99,102,241,0.3), 0 0 0 6px rgba(99,102,241,0.1)',
                }}>
                <img src={settings.teacher_image_url} alt={settings.teacher_name}
                  className="w-full h-full object-cover" />
              </div>
              {/* Online dot */}
              <span className="absolute bottom-2 left-1/2 -translate-x-1/2 translate-x-6"
                style={{
                  width: '14px', height: '14px', borderRadius: '50%',
                  background: '#34d399',
                  border: '2px solid var(--bg)',
                  boxShadow: '0 0 8px rgba(52,211,153,0.6)',
                  display: 'block',
                }} />
            </div>
          )}

          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6 animate-fade-in"
            style={{
              background: 'rgba(99,102,241,0.1)',
              border: '1px solid rgba(99,102,241,0.25)',
              animationDelay: '0.1s',
            }}>
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
              {settings?.teacher_name || 'المدرس'}
              {settings?.subject ? ` • ${settings.subject}` : ''}
              {settings?.stage ? ` • ${settings.stage}` : ''}
            </span>
          </div>

          {/* Headline */}
          <h1 className="font-black mb-4 animate-fade-in leading-tight"
            style={{
              fontSize: 'clamp(2rem, 8vw, 5rem)',
              animationDelay: '0.2s',
              color: 'var(--text)',
            }}>
            {settings?.hero_title || 'تعلّم بطريقة'}
            <span className="block"
              style={{
                background: 'linear-gradient(135deg, #818cf8 0%, #f472b6 50%, #818cf8 100%)',
                backgroundSize: '200% auto',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                animation: 'morphGrad 4s ease infinite',
              }}>
              مختلفة تماماً
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-base md:text-lg mb-8 max-w-xl mx-auto animate-fade-in"
            style={{ color: 'var(--text-muted)', animationDelay: '0.3s' }}>
            {settings?.hero_subtitle || settings?.site_description || 'منصة تعليمية متكاملة'}
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center animate-fade-in"
            style={{ animationDelay: '0.4s' }}>
            <Link href="/login"
              className="flex items-center justify-center gap-2 px-8 py-3 rounded-2xl text-white font-bold text-base transition-all hover:opacity-90 hover:-translate-y-0.5"
              style={{
                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                boxShadow: '0 4px 20px rgba(99,102,241,0.35)',
              }}>
              <FiPlay /> ابدأ التعلم
            </Link>
            {settings?.whatsapp_number && (
              <a href={`https://wa.me/${settings.whatsapp_number}`} target="_blank"
                className="flex items-center justify-center gap-2 px-8 py-3 rounded-2xl font-bold text-base transition-all hover:opacity-90"
                style={{
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  color: 'var(--text)',
                }}>
                تواصل معانا <FiArrowLeft />
              </a>
            )}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-12 animate-fade-in"
            style={{ animationDelay: '0.6s' }}>
            {[
              { number: `+${studentsCount}`, label: 'طالب' },
              { number: `+${videosCount}`, label: 'فيديو' },
              { number: `+${coursesCount}`, label: 'كورس' },
              { number: settings?.stats_rating || '4.9', label: 'تقييم ⭐' },
            ].map((stat, i) => (
              <div key={i} className="text-center py-4 px-3 rounded-2xl"
                style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                <div className="font-black mb-1"
                  style={{
                    fontSize: 'clamp(1.5rem, 4vw, 2rem)',
                    background: 'linear-gradient(135deg, #818cf8, #f472b6)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }}>
                  {stat.number}
                </div>
                <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== Features ===== */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="font-black text-center mb-3 animate-fade-in"
            style={{ fontSize: 'clamp(1.5rem, 5vw, 3rem)', color: 'var(--text)' }}>
            ليه{' '}
            <span style={{
              background: 'linear-gradient(135deg, #818cf8, #f472b6)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text'
            }}>منصتنا؟</span>
          </h2>
          <p className="text-center mb-12 animate-fade-in" style={{ color: 'var(--text-muted)' }}>
            كل اللي محتاجه عشان تتفوق
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              { icon: <FiVideo className="text-2xl" />, title: 'فيديوهات HD', desc: 'شروحات بجودة عالية', color: '#6366f1' },
              { icon: <FiBookOpen className="text-2xl" />, title: 'منهج متكامل', desc: 'كل المواد مرتبة', color: '#f472b6' },
              { icon: <FiShield className="text-2xl" />, title: 'محتوى محمي', desc: 'فيديوهاتك آمنة', color: '#34d399' },
              { icon: <FiHeadphones className="text-2xl" />, title: 'دعم مستمر', desc: 'تواصل معانا أي وقت', color: '#fb923c' },
            ].map((f, i) => (
              <div key={i} className="p-6 rounded-2xl card-hover animate-fade-in"
                style={{
                  background: 'var(--bg2)',
                  border: '1px solid var(--border)',
                  animationDelay: `${i * 0.1}s`
                }}>
                <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white mb-4"
                  style={{ background: f.color, opacity: 1, boxShadow: `0 4px 16px ${f.color}40` }}>
                  {f.icon}
                </div>
                <h3 className="font-bold mb-1" style={{ color: 'var(--text)' }}>{f.title}</h3>
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== Courses ===== */}
      {courses?.length > 0 && (
        <section className="py-20 px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="font-black text-center mb-12"
              style={{ fontSize: 'clamp(1.5rem, 5vw, 3rem)', color: 'var(--text)' }}>
              أحدث{' '}
              <span style={{
                background: 'linear-gradient(135deg, #818cf8, #f472b6)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text'
              }}>الكورسات</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {courses.map((course, i) => (
                <Link href="/login" key={course.id}>
                  <div className="rounded-2xl overflow-hidden card-hover animate-fade-in"
                    style={{
                      background: 'var(--bg2)',
                      border: '1px solid var(--border)',
                      animationDelay: `${i * 0.1}s`
                    }}>
                    <div className="relative h-44">
                      {course.thumbnail_url ? (
                        <img src={course.thumbnail_url} alt={course.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center"
                          style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
                          <FiBookOpen className="text-5xl text-white/50" />
                        </div>
                      )}
                      <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.7), transparent)' }} />
                      {course.is_free && (
                        <span className="absolute top-3 left-3 px-3 py-1 rounded-full text-xs font-bold text-white"
                          style={{ background: '#10b981' }}>مجاني</span>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="font-bold mb-1" style={{ color: 'var(--text)' }}>{course.title}</h3>
                      <p className="text-sm line-clamp-2 mb-3" style={{ color: 'var(--text-muted)' }}>{course.description}</p>
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sm" style={{ color: '#818cf8' }}>
                          {course.is_free ? 'مجاني' : `${course.price || 0} جنيه`}
                        </span>
                        {course.duration && (
                          <span className="text-xs flex items-center gap-1" style={{ color: 'var(--text-faint)' }}>
                            <FiClock />{course.duration}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
            <div className="text-center mt-8">
              <Link href="/login"
                className="inline-block px-8 py-3 rounded-xl font-bold text-white transition hover:opacity-90"
                style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
                سجل دخول لمشاهدة الكورسات ←
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ===== About ===== */}
      {settings?.about_text && (
        <section className="py-20 px-4">
          <div className="max-w-4xl mx-auto p-8 md:p-10 rounded-3xl"
            style={{ background: 'var(--bg2)', border: '1px solid var(--border)' }}>
            <div className="flex flex-col md:flex-row items-center gap-8">
              {settings.teacher_image_url && (
                <img src={settings.teacher_image_url} alt={settings.teacher_name}
                  className="w-28 h-28 rounded-2xl object-cover flex-shrink-0"
                  style={{ border: '3px solid rgba(99,102,241,0.4)' }} />
              )}
              <div>
                <h2 className="text-2xl font-black mb-1" style={{ color: 'var(--text)' }}>{settings.teacher_name}</h2>
                <p className="mb-3 text-sm font-bold" style={{ color: '#818cf8' }}>{settings.subject} • {settings.stage}</p>
                <p className="leading-relaxed text-sm" style={{ color: 'var(--text-muted)' }}>{settings.about_text}</p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ===== Testimonials ===== */}
      {testimonials?.length > 0 && (
        <section className="py-20 px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="font-black text-center mb-12"
              style={{ fontSize: 'clamp(1.5rem, 5vw, 3rem)', color: 'var(--text)' }}>
              آراء{' '}
              <span style={{
                background: 'linear-gradient(135deg, #818cf8, #f472b6)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text'
              }}>طلابنا</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {testimonials.map((t, i) => (
                <div key={t.id} className="p-6 rounded-2xl card-hover animate-fade-in"
                  style={{
                    background: 'var(--bg2)',
                    border: '1px solid var(--border)',
                    animationDelay: `${i * 0.1}s`
                  }}>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-11 h-11 rounded-full flex items-center justify-center font-bold text-white text-base flex-shrink-0"
                      style={{ background: 'linear-gradient(135deg, #6366f1, #f472b6)' }}>
                      {t.student_name[0]}
                    </div>
                    <div>
                      <h4 className="font-bold text-sm" style={{ color: 'var(--text)' }}>{t.student_name}</h4>
                      <div className="flex gap-0.5">
                        {Array(t.rating).fill(null).map((_, j) => (
                          <FiStar key={j} className="text-yellow-400" style={{ fontSize: '12px' }} />
                        ))}
                      </div>
                    </div>
                  </div>
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>"{t.comment}"</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ===== Footer ===== */}
      <footer className="py-8 px-4 mt-10"
        style={{ borderTop: '1px solid var(--border)', background: 'var(--bg2)' }}>
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              {settings?.footer_text || '© 2024 جميع الحقوق محفوظة'}
            </p>
            <div className="flex gap-5">
              {settings?.facebook_url && (
                <a href={settings.facebook_url} target="_blank"
                  className="text-sm transition hover:opacity-80" style={{ color: 'var(--text-muted)' }}>
                  Facebook
                </a>
              )}
              {settings?.youtube_url && (
                <a href={settings.youtube_url} target="_blank"
                  className="text-sm transition hover:opacity-80" style={{ color: 'var(--text-muted)' }}>
                  YouTube
                </a>
              )}
              {settings?.telegram_url && (
                <a href={settings.telegram_url} target="_blank"
                  className="text-sm transition hover:opacity-80" style={{ color: 'var(--text-muted)' }}>
                  Telegram
                </a>
              )}
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
