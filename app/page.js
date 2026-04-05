import Navbar from '@/components/Navbar';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { FiPlay, FiArrowLeft, FiVideo, FiBookOpen, FiStar, FiAward } from 'react-icons/fi';

export const revalidate = 60;

export async function generateMetadata() {
  const { data: s } = await supabase.from('site_settings').select('site_name,site_description,teacher_image_url').single();
  return {
    title: s?.site_name || 'منصة تعليمية',
    description: s?.site_description || 'منصة تعليمية متكاملة',
    openGraph: { title: s?.site_name, description: s?.site_description, images: s?.teacher_image_url ? [s.teacher_image_url] : [] },
  };
}

export default async function HomePage() {
  const [
    { data: settings },
    { data: courses },
    { data: testimonials },
    { data: announcements },
    { data: statsData },
    { data: gallery },
  ] = await Promise.all([
    supabase.from('site_settings').select('*').single(),
    supabase.from('courses').select('id,title,description,thumbnail_url,price,is_free,stage').eq('is_published', true).order('order').limit(6),
    supabase.from('testimonials').select('id,student_name,rating,comment').eq('is_visible', true).order('order').limit(6),
    supabase.from('announcements').select('id,title,content,type').eq('is_active', true),
    supabase.rpc('get_public_stats'),
    supabase.from('gallery').select('id,url,caption').eq('is_visible', true).order('order_num').limit(12),
  ]);

  if (settings?.is_maintenance) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg)' }}>
      <div className="text-center p-8">
        <div className="text-6xl mb-4">🔧</div>
        <h1 className="text-2xl font-black" style={{ color: 'var(--text)' }}>{settings.maintenance_message}</h1>
      </div>
    </div>
  );

  return (
    <main style={{ background: 'var(--bg)', color: 'var(--text)', minHeight: '100dvh' }}>

      {/* Aurora Background */}
      <div aria-hidden="true" style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none', overflow: 'hidden' }}>
        <div className="aurora-orb aurora-orb-1" />
        <div className="aurora-orb aurora-orb-2" />
        <div className="aurora-orb aurora-orb-3" />
        <div className="aurora-orb aurora-orb-4" />
      </div>

      <div style={{ position: 'relative', zIndex: 1 }}>
        <Navbar />

        {/* Announcements */}
        {announcements?.length > 0 && (
          <div className="fixed top-16 w-full z-40">
            {announcements.map(ann => (
              <div key={ann.id} className={`px-4 py-2 text-center text-sm font-bold ${
                ann.type === 'urgent' ? 'bg-red-500' :
                ann.type === 'warning' ? 'bg-yellow-500 text-black' :
                ann.type === 'success' ? 'bg-green-600' : 'bg-indigo-600'}`}>
                📢 {ann.title}: {ann.content}
              </div>
            ))}
          </div>
        )}

        {/* ===== Hero ===== */}
        <section className="relative pt-28 pb-20 px-4 text-center overflow-hidden">
          <div className="max-w-4xl mx-auto">

            {settings?.teacher_image_url && (
              <div className="relative inline-block mb-8 animate-fade-in">
                <div className="w-32 h-32 md:w-44 md:h-44 rounded-full overflow-hidden mx-auto"
                  style={{
                    border: '3px solid rgba(99,102,241,0.5)',
                    boxShadow: '0 0 60px rgba(99,102,241,0.3), 0 0 0 8px rgba(99,102,241,0.08)',
                  }}>
                  <img src={settings.teacher_image_url} className="w-full h-full object-cover" alt={settings.teacher_name} />
                </div>
                <span style={{
                  position: 'absolute', bottom: '10px', right: '16px',
                  width: '16px', height: '16px', borderRadius: '50%',
                  background: '#34d399', border: '2px solid var(--bg)',
                  boxShadow: '0 0 10px rgba(52,211,153,0.7)', display: 'block',
                }} />
              </div>
            )}

            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full mb-6 animate-fade-in"
              style={{
                background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.25)',
                animationDelay: '0.1s',
              }}>
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-sm font-bold" style={{ color: 'var(--text-muted)' }}>
                {settings?.teacher_name}
                {settings?.subject ? ` • ${settings.subject}` : ''}
                {settings?.stage ? ` • ${settings.stage}` : ''}
              </span>
            </div>

            <h1 className="font-black mb-6 leading-tight animate-fade-in"
              style={{ fontSize: 'clamp(2.2rem, 9vw, 5.5rem)', animationDelay: '0.2s', color: 'var(--text)' }}>
              {settings?.hero_title || 'مستقبلك يبدأ من'}
              <span className="block" style={{
                background: 'linear-gradient(135deg, #818cf8 0%, #f472b6 50%, #818cf8 100%)',
                backgroundSize: '200% auto',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                backgroundClip: 'text', animation: 'morphGrad 4s ease infinite',
              }}>
                {settings?.subject || 'هنا'}
              </span>
            </h1>

            <p className="text-base md:text-xl mb-10 max-w-2xl mx-auto leading-relaxed animate-fade-in"
              style={{ color: 'var(--text-muted)', animationDelay: '0.3s' }}>
              {settings?.hero_subtitle || settings?.site_description || 'منصة تعليمية متكاملة'}
            </p>

            <div className="flex flex-col sm:flex-row justify-center gap-4 animate-fade-in" style={{ animationDelay: '0.4s' }}>
              <Link href="/login"
                className="px-10 py-4 rounded-2xl text-white font-bold flex items-center justify-center gap-2 transition-all hover:-translate-y-0.5"
                style={{
                  background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                  boxShadow: '0 8px 30px rgba(99,102,241,0.35)',
                }}>
                <FiPlay size={18} /> ابدأ رحلتك الآن
              </Link>
              {settings?.whatsapp_number && (
                <a href={`https://wa.me/${settings.whatsapp_number}`} target="_blank"
                  className="px-10 py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all hover:-translate-y-0.5"
                  style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)' }}>
                  تواصل مع الدعم <FiArrowLeft size={16} />
                </a>
              )}
            </div>
          </div>
        </section>

        {/* ===== Stats ===== */}
        <section className="py-10 px-4">
          <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'طالب مشترك', val: `+${statsData?.students || 0}`, icon: '👥', color: '#818cf8' },
              { label: 'كورس متاح', val: `+${statsData?.courses || 0}`, icon: '📚', color: '#f472b6' },
              { label: 'فيديو تعليمي', val: `+${statsData?.videos || 0}`, icon: '🎬', color: '#34d399' },
              { label: 'سنة خبرة', val: settings?.stats_rating || '4.9⭐', icon: '🏆', color: '#fbbf24' },
            ].map((s, i) => (
              <div key={i} className="text-center py-5 px-3 rounded-2xl animate-fade-in card-hover"
                style={{ background: 'var(--bg2)', border: '1px solid var(--border)', animationDelay: `${i * 0.1}s` }}>
                <div className="text-2xl mb-2">{s.icon}</div>
                <div className="text-2xl md:text-3xl font-black mb-1"
                  style={{
                    background: `linear-gradient(135deg, ${s.color}, #818cf8)`,
                    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
                  }}>{s.val}</div>
                <div className="text-xs font-bold" style={{ color: 'var(--text-muted)' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ===== Courses ===== */}
        {courses?.length > 0 && (
          <section className="py-20 px-4">
            <div className="max-w-7xl mx-auto">
              <div className="flex items-center justify-between mb-10">
                <h2 className="font-black" style={{ fontSize: 'clamp(1.5rem, 5vw, 3rem)', color: 'var(--text)' }}>
                  أحدث{' '}
                  <span style={{
                    background: 'linear-gradient(135deg, #818cf8, #f472b6)',
                    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
                  }}>الكورسات</span>
                </h2>
                <Link href="/login" className="text-sm font-bold" style={{ color: '#818cf8' }}>عرض الكل ←</Link>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {courses.map((course, i) => (
                  <Link href="/login" key={course.id}>
                    <div className="rounded-2xl overflow-hidden card-hover animate-fade-in"
                      style={{ background: 'var(--bg2)', border: '1px solid var(--border)', animationDelay: `${i * 0.08}s` }}>
                      <div className="relative h-44 overflow-hidden">
                        {course.thumbnail_url
                          ? <img src={course.thumbnail_url} alt={course.title} className="w-full h-full object-cover transition-transform duration-700 hover:scale-110" />
                          : <div className="w-full h-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
                              <FiBookOpen className="text-white/40" style={{ fontSize: '3rem' }} />
                            </div>}
                        <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.6), transparent)' }} />
                        {course.is_free && (
                          <span className="absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-black text-white" style={{ background: '#10b981' }}>مجاني</span>
                        )}
                        {course.stage && (
                          <span className="absolute top-3 left-3 px-2 py-1 rounded-full text-xs font-bold text-white" style={{ background: 'rgba(99,102,241,0.85)' }}>{course.stage}</span>
                        )}
                      </div>
                      <div className="p-5">
                        <h3 className="font-black mb-1 line-clamp-1" style={{ color: 'var(--text)' }}>{course.title}</h3>
                        <p className="text-sm line-clamp-2 mb-3" style={{ color: 'var(--text-muted)' }}>{course.description}</p>
                        <div className="flex items-center justify-between">
                          <span className="font-black" style={{ color: '#818cf8' }}>{course.is_free ? 'مجاني' : `${course.price || 0} ج.م`}</span>
                          <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'rgba(99,102,241,0.12)', color: '#818cf8' }}>
                            <FiArrowLeft size={15} />
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ===== Gallery ===== */}
        {gallery?.length > 0 && (
          <section className="py-20 px-4">
            <div className="max-w-7xl mx-auto">
              <h2 className="font-black text-center mb-12" style={{ fontSize: 'clamp(1.5rem, 5vw, 3rem)', color: 'var(--text)' }}>
                لحظات من{' '}
                <span style={{
                  background: 'linear-gradient(135deg, #818cf8, #f472b6)',
                  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
                }}>نجاحنا</span>
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {gallery.map((img, i) => (
                  <div key={img.id} className="relative rounded-2xl overflow-hidden card-hover group animate-fade-in"
                    style={{ aspectRatio: '1', animationDelay: `${i * 0.05}s` }}>
                    <img src={img.url} alt={img.caption || ''} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                    {img.caption && (
                      <div className="absolute inset-0 flex items-end p-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                        style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.75), transparent)' }}>
                        <p className="text-white text-xs font-bold">{img.caption}</p>
                      </div>
                    )}
                  </div>
                ))}
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
              <h2 className="font-black text-center mb-12" style={{ fontSize: 'clamp(1.5rem, 5vw, 3rem)', color: 'var(--text)' }}>
                أبطالنا{' '}
                <span style={{
                  background: 'linear-gradient(135deg, #818cf8, #f472b6)',
                  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
                }}>بيقولوا إيه؟</span>
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {testimonials.map((t, i) => (
                  <div key={t.id} className="p-6 rounded-2xl card-hover animate-fade-in relative overflow-hidden"
                    style={{ background: 'var(--bg2)', border: '1px solid var(--border)', animationDelay: `${i * 0.1}s` }}>
                    <FiStar className="absolute top-6 left-6 opacity-10" size={48} style={{ color: '#818cf8' }} />
                    <div className="flex gap-0.5 mb-4">
                      {Array(t.rating).fill(null).map((_, j) => (
                        <FiStar key={j} fill="#fbbf24" stroke="none" size={14} className="text-yellow-400" />
                      ))}
                    </div>
                    <p className="text-sm leading-relaxed mb-6 italic" style={{ color: 'var(--text-muted)' }}>"{t.comment}"</p>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center font-black text-white flex-shrink-0"
                        style={{ background: 'linear-gradient(135deg, #6366f1, #f472b6)' }}>
                        {t.student_name[0]}
                      </div>
                      <span className="font-bold text-sm" style={{ color: 'var(--text)' }}>{t.student_name}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ===== Footer ===== */}
        <footer className="py-10 px-4" style={{ borderTop: '1px solid var(--border)', background: 'var(--bg2)' }}>
          <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              {settings?.footer_text || '© 2026 جميع الحقوق محفوظة'}
            </p>
            <div className="flex gap-5">
              {settings?.facebook_url && <a href={settings.facebook_url} target="_blank" className="text-sm transition hover:opacity-80" style={{ color: 'var(--text-muted)' }}>Facebook</a>}
              {settings?.youtube_url && <a href={settings.youtube_url} target="_blank" className="text-sm transition hover:opacity-80" style={{ color: 'var(--text-muted)' }}>YouTube</a>}
              {settings?.telegram_url && <a href={settings.telegram_url} target="_blank" className="text-sm transition hover:opacity-80" style={{ color: 'var(--text-muted)' }}>Telegram</a>}
            </div>
          </div>
        </footer>
      </div>
    </main>
  );
}
