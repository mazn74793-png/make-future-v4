import Navbar from '@/components/Navbar';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { FiPlay, FiArrowLeft, FiBookOpen, FiStar, FiAward, FiMessageCircle } from 'react-icons/fi';

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

  // حالة الصيانة
  if (settings?.is_maintenance) return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg)]">
      <div className="glass-card p-10 text-center max-w-md mx-4">
        <div className="text-6xl mb-6 animate-float">🔧</div>
        <h1 className="text-2xl font-black mb-2">{settings.maintenance_message}</h1>
        <p className="text-[var(--text-muted)] text-sm">نعمل حالياً على تحسين المنصة، سنعود قريباً!</p>
      </div>
    </div>
  );

  return (
    <div className="relative">
      <Navbar />

      {/* Announcements - تحسين العرض ليكون أنحف وأوضح */}
      {announcements?.length > 0 && (
        <div className="fixed top-16 w-full z-40 space-y-1">
          {announcements.map(ann => (
            <div key={ann.id} className={`px-4 py-2 text-center text-[11px] md:text-sm font-bold shadow-lg backdrop-blur-md ${
              ann.type === 'urgent' ? 'bg-red-500/90 text-white' :
              ann.type === 'warning' ? 'bg-amber-500/90 text-black' :
              ann.type === 'success' ? 'bg-emerald-600/90 text-white' : 'bg-indigo-600/90 text-white'}`}>
              📢 {ann.title}: {ann.content}
            </div>
          ))}
        </div>
      )}

      {/* ===== Hero Section ===== */}
      <section className="relative pt-32 pb-20 px-4 text-center overflow-hidden">
        <div className="max-w-5xl mx-auto">
          
          {/* صورة المدرس بتأثير Glow */}
          {settings?.teacher_image_url && (
            <div className="relative inline-block mb-10 animate-fade-in">
              <div className="w-32 h-32 md:w-48 md:h-48 rounded-3xl overflow-hidden mx-auto rotate-3 group hover:rotate-0 transition-transform duration-500 shadow-2xl border-4 border-white/5">
                <img src={settings.teacher_image_url} className="w-full h-full object-cover scale-110 group-hover:scale-100 transition-transform duration-500" alt={settings.teacher_name} />
              </div>
              <div className="absolute -bottom-4 -right-4 glass-card px-4 py-2 flex items-center gap-2 animate-float">
                <span className="flex h-2 w-2 rounded-full bg-emerald-500" />
                <span className="text-[10px] font-black uppercase tracking-widest">متواجد الآن</span>
              </div>
            </div>
          )}

          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-6 py-2 rounded-full mb-8 glass border-indigo-500/20 animate-fade-in" style={{ animationDelay: '0.1s' }}>
            <FiAward className="text-indigo-400" />
            <span className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wide">
              {settings?.teacher_name} {settings?.subject ? `| ${settings.subject}` : ''}
            </span>
          </div>

          <h1 className="font-black mb-8 leading-[1.1] animate-fade-in"
            style={{ fontSize: 'clamp(2.5rem, 8vw, 5.5rem)', animationDelay: '0.2s' }}>
            {settings?.hero_title || 'مستقبلك يبدأ من'}
            <span className="block gradient-primary bg-clip-text text-transparent animate-glow">
              {settings?.subject || 'هنا'}
            </span>
          </h1>

          <p className="text-sm md:text-lg mb-12 max-w-2xl mx-auto leading-relaxed text-[var(--text-muted)] animate-fade-in" style={{ animationDelay: '0.3s' }}>
            {settings?.hero_subtitle || settings?.site_description}
          </p>

          <div className="flex flex-col sm:flex-row justify-center gap-4 animate-fade-in" style={{ animationDelay: '0.4s' }}>
            <Link href="/login" className="px-10 py-4 rounded-2xl text-white font-bold flex items-center justify-center gap-3 transition-all hover:scale-105 gradient-primary shadow-xl shadow-indigo-500/20">
              <FiPlay fill="currentColor" /> ابدأ رحلتك الآن
            </Link>
            {settings?.whatsapp_number && (
              <a href={`https://wa.me/${settings.whatsapp_number}`} target="_blank"
                className="px-10 py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all hover:bg-white/5 glass text-[var(--text)]">
                تواصل مع الدعم <FiMessageCircle size={18} />
              </a>
            )}
          </div>
        </div>
      </section>

      {/* ===== Stats ===== */}
      <section className="py-12 px-4 relative z-10">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {[
            { label: 'طالب مشترك', val: `${statsData?.students || 0}+`, icon: '👥', color: 'var(--primary)' },
            { label: 'كورس متاح', val: `${statsData?.courses || 0}+`, icon: '📚', color: 'var(--accent)' },
            { label: 'فيديو تعليمي', val: `${statsData?.videos || 0}+`, icon: '🎬', color: 'var(--accent2)' },
            { label: 'سنة خبرة', val: settings?.stats_rating || '4.9⭐', icon: '🏆', color: '#fbbf24' },
          ].map((s, i) => (
            <div key={i} className="glass-card p-6 text-center animate-fade-in" style={{ animationDelay: `${i * 0.1}s` }}>
              <div className="text-2xl mb-3">{s.icon}</div>
              <div className="text-2xl md:text-3xl font-black mb-1" style={{ color: s.color }}>{s.val}</div>
              <div className="text-[10px] font-bold text-[var(--text-faint)] uppercase tracking-tighter">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ===== Courses ===== */}
      {courses?.length > 0 && (
        <section className="py-24 px-4">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-end justify-between mb-12">
              <div>
                <h2 className="text-3xl md:text-5xl font-black mb-2">أحدث الكورسات</h2>
                <div className="h-1.5 w-20 gradient-primary rounded-full" />
              </div>
              <Link href="/login" className="text-xs font-black uppercase tracking-widest text-indigo-400 hover:text-indigo-300">عرض الكل ←</Link>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {courses.map((course, i) => (
                <Link href="/login" key={course.id} className="glass-card group overflow-hidden animate-fade-in" style={{ animationDelay: `${i * 0.1}s` }}>
                  <div className="relative aspect-video overflow-hidden">
                    <img src={course.thumbnail_url || '/placeholder.png'} alt={course.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60" />
                    {course.is_free && <span className="absolute top-4 right-4 px-3 py-1 rounded-lg text-[10px] font-black bg-emerald-500 text-white shadow-lg">مجاني</span>}
                    {course.stage && <span className="absolute bottom-4 right-4 px-3 py-1 rounded-lg text-[10px] font-black bg-indigo-500/80 backdrop-blur-md text-white">{course.stage}</span>}
                  </div>
                  <div className="p-6">
                    <h3 className="font-black text-lg mb-2 line-clamp-1 group-hover:text-indigo-400 transition-colors">{course.title}</h3>
                    <p className="text-[var(--text-muted)] text-sm line-clamp-2 mb-6 leading-relaxed">{course.description}</p>
                    <div className="flex items-center justify-between pt-4 border-t border-white/5">
                      <span className="text-xl font-black text-indigo-400">{course.is_free ? '0' : course.price}<span className="text-[10px] mr-1 text-[var(--text-faint)] font-bold">ج.م</span></span>
                      <div className="flex items-center gap-2 text-xs font-bold text-indigo-400">
                        استكشف <FiArrowLeft />
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ===== Gallery (Grid Modern) ===== */}
      {gallery?.length > 0 && (
        <section className="py-24 px-4 bg-[var(--surface)]">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-3xl md:text-5xl font-black text-center mb-16">لحظات <span className="gradient-primary bg-clip-text text-transparent">النجاح</span></h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {gallery.map((img, i) => (
                <div key={img.id} className="glass-card aspect-square overflow-hidden group animate-fade-in" style={{ animationDelay: `${i * 0.05}s` }}>
                  <img src={img.url} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ===== About ===== */}
      {settings?.about_text && (
        <section className="py-24 px-4">
          <div className="max-w-4xl mx-auto glass-card p-8 md:p-16 relative overflow-hidden">
            <div className="relative z-10 flex flex-col md:flex-row items-center gap-10">
              <div className="w-32 h-32 md:w-44 md:h-44 rounded-full border-4 border-indigo-500/20 flex-shrink-0 overflow-hidden shadow-2xl">
                <img src={settings.teacher_image_url} alt="" className="w-full h-full object-cover" />
              </div>
              <div className="text-center md:text-right">
                <h2 className="text-3xl font-black mb-2">{settings.teacher_name}</h2>
                <p className="text-indigo-400 font-bold mb-6">{settings.subject} • {settings.stage}</p>
                <p className="text-[var(--text-muted)] leading-loose italic">"{settings.about_text}"</p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ===== Testimonials ===== */}
      {testimonials?.length > 0 && (
        <section className="py-24 px-4">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-3xl md:text-5xl font-black text-center mb-16">ماذا يقول <span className="text-indigo-400">طلابنا؟</span></h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {testimonials.map((t, i) => (
                <div key={t.id} className="glass-card p-8 animate-fade-in" style={{ animationDelay: `${i * 0.1}s` }}>
                  <div className="flex gap-1 mb-6">
                    {Array(t.rating).fill(0).map((_, j) => <FiStar key={j} fill="#fbbf24" stroke="none" size={16} />)}
                  </div>
                  <p className="text-[var(--text-muted)] leading-relaxed mb-8 italic">"{t.comment}"</p>
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center font-black text-white">{t.student_name[0]}</div>
                    <span className="font-bold text-sm">{t.student_name}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ===== Footer ===== */}
      <footer className="py-12 px-4 border-t border-white/5 bg-[var(--bg2)]">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="text-center md:text-right">
            <h3 className="font-black text-lg mb-2">{settings?.site_name}</h3>
            <p className="text-[var(--text-faint)] text-xs">{settings?.footer_text || '© 2026 جميع الحقوق محفوظة'}</p>
          </div>
          <div className="flex gap-6">
            {['Facebook', 'YouTube', 'Telegram'].map(platform => {
              const url = settings?.[`${platform.toLowerCase()}_url`];
              return url && (
                <a key={platform} href={url} target="_blank" className="text-xs font-bold text-[var(--text-muted)] hover:text-indigo-400 transition-colors uppercase tracking-widest">{platform}</a>
              );
            })}
          </div>
        </div>
      </footer>
    </div>
  );
}
