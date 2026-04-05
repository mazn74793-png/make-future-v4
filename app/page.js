import Navbar from '@/components/Navbar';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { FiPlay, FiArrowLeft, FiVideo, FiBookOpen, FiShield, FiHeadphones, FiClock, FiStar } from 'react-icons/fi';

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
    supabase.from('courses').select('id,title,description,thumbnail_url,price,is_free,duration,stage').eq('is_published', true).order('order').limit(6),
    supabase.from('testimonials').select('id,student_name,rating,comment').eq('is_visible', true).order('order').limit(6),
    supabase.from('announcements').select('id,title,content,type').eq('is_active', true),
    supabase.rpc('get_public_stats'),
    supabase.from('gallery').select('id,url,caption').eq('is_visible', true).order('order_num').limit(12),
  ]);

  const studentsCount = statsData?.students || 0;
  const videosCount = statsData?.videos || 0;
  const coursesCount = statsData?.courses || 0;

  if (settings?.is_maintenance) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg)' }}>
      <div className="text-center"><div className="text-6xl mb-4">🔧</div>
        <h1 className="text-3xl font-black mb-2">{settings.maintenance_message}</h1></div>
    </div>
  );

  return (
    <main style={{ background: 'var(--bg)', color: 'var(--text)' }} className="overflow-x-hidden">
      <Navbar />

      {/* Announcements: Fixed overlap by making it relative and adding padding */}
      {announcements?.length > 0 && (
        <div className="relative w-full z-40">
          {announcements.map(ann => (
            <div key={ann.id} className={`px-4 py-3 text-center text-xs md:text-sm font-bold shadow-sm ${
              ann.type === 'urgent' ? 'bg-red-500 text-white' : 
              ann.type === 'warning' ? 'bg-yellow-500 text-black' :
              ann.type === 'success' ? 'bg-green-500 text-white' : 'bg-indigo-500 text-white'}`}>
              <span className="opacity-90">{ann.title}:</span> {ann.content}
            </div>
          ))}
        </div>
      )}

      {/* Hero Section: Increased padding-top to prevent overlap with Navbar and Alerts */}
      <section className="relative min-h-[90vh] flex flex-col items-center justify-center overflow-hidden pt-32 pb-12 md:pt-40"
        style={{ position: 'relative' }}>
        
        {/* Background Blobs */}
        <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
          {[...Array(6)].map((_, i) => (
            <div key={i} className="animate-float" style={{
              position: 'absolute', borderRadius: '50%', filter: 'blur(80px)', opacity: 0.12,
              background: i % 2 === 0 ? '#6366f1' : '#f472b6',
              width: `${150 + i * 60}px`, height: `${150 + i * 60}px`,
              top: `${10 + i * 12}%`,
              left: i % 2 === 0 ? `${-5 + i * 15}%` : 'auto',
              right: i % 2 !== 0 ? `${-5 + i * 10}%` : 'auto',
              animationDelay: `${i * 0.8}s`,
            }} />
          ))}
        </div>

        <div className="relative z-10 text-center px-4 w-full max-w-4xl mx-auto">
          {settings?.teacher_image_url && (
            <div className="relative inline-block mb-6 animate-fade-in">
              <div className="w-28 h-28 md:w-36 md:h-36 rounded-full mx-auto overflow-hidden"
                style={{ border: '3px solid rgba(99,102,241,0.5)', boxShadow: '0 0 40px rgba(99,102,241,0.3), 0 0 0 6px rgba(99,102,241,0.1)' }}>
                <img src={settings.teacher_image_url} alt={settings.teacher_name} className="w-full h-full object-cover" />
              </div>
              <span style={{ position: 'absolute', bottom: '8px', right: '12px', width: '14px', height: '14px', borderRadius: '50%', background: '#34d399', border: '2px solid var(--bg)', boxShadow: '0 0 8px rgba(52,211,153,0.6)', display: 'block' }} />
            </div>
          )}

          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6 animate-fade-in"
            style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.25)', animationDelay: '0.1s' }}>
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-xs md:text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
              {settings?.teacher_name}{settings?.subject ? ` • ${settings.subject}` : ''}{settings?.stage ? ` • ${settings.stage}` : ''}
            </span>
          </div>

          <h1 className="font-black mb-4 animate-fade-in leading-tight tracking-tight"
            style={{ fontSize: 'clamp(1.8rem, 7vw, 4.5rem)', animationDelay: '0.2s', color: 'var(--text)' }}>
            {settings?.hero_title || 'تعلّم بطريقة'}
            <span className="block mt-2" style={{
              background: 'linear-gradient(135deg, #818cf8 0%, #f472b6 50%, #818cf8 100%)',
              backgroundSize: '200% auto', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              backgroundClip: 'text', animation: 'morphGrad 4s ease infinite',
            }}>مختلفة تماماً</span>
          </h1>

          <p className="text-sm md:text-lg mb-8 max-w-xl mx-auto animate-fade-in px-4"
            style={{ color: 'var(--text-muted)', animationDelay: '0.3s', lineHeight: '1.6' }}>
            {settings?.hero_subtitle || settings?.site_description || 'منصة تعليمية متكاملة'}
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-fade-in px-6" style={{ animationDelay: '0.4s' }}>
            <Link href="/login" className="w-full sm:w-auto flex items-center justify-center gap-2 px-10 py-4 rounded-2xl text-white font-bold text-base transition-all hover:opacity-90 hover:-translate-y-1 active:scale-95"
              style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', boxShadow: '0 10px 25px -5px rgba(99,102,241,0.4)' }}>
              <FiPlay /> ابدأ التعلم
            </Link>
            {settings?.whatsapp_number && (
              <a href={`https://wa.me/${settings.whatsapp_number}`} target="_blank"
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-10 py-4 rounded-2xl font-bold text-base transition-all hover:bg-opacity-80 active:scale-95"
                style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)' }}>
                تواصل معانا <FiArrowLeft />
              </a>
            )}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mt-16 px-4 animate-fade-in" style={{ animationDelay: '0.6s' }}>
            {[
              { number: `+${studentsCount}`, label: 'طالب' },
              { number: `+${videosCount}`, label: 'فيديو' },
              { number: `+${coursesCount}`, label: 'كورس' },
              { number: settings?.stats_rating || '4.9', label: 'تقييم ⭐' },
            ].map((stat, i) => (
              <div key={i} className="text-center py-5 px-2 rounded-2xl"
                style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                <div className="font-black mb-1" style={{
                  fontSize: 'clamp(1.2rem, 5vw, 1.8rem)',
                  background: 'linear-gradient(135deg, #818cf8, #f472b6)',
                  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
                }}>{stat.number}</div>
                <div className="text-[10px] md:text-xs font-bold" style={{ color: 'var(--text-muted)' }}>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="font-black text-center mb-12" style={{ fontSize: 'clamp(1.5rem, 5vw, 3rem)', color: 'var(--text)' }}>
            ليه <span style={{ background: 'linear-gradient(135deg, #818cf8, #f472b6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>منصتنا؟</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              { icon: <FiVideo />, title: 'فيديوهات HD', desc: 'شروحات بجودة عالية', color: '#6366f1' },
              { icon: <FiBookOpen />, title: 'منهج متكامل', desc: 'كل المواد مرتبة', color: '#f472b6' },
              { icon: <FiShield />, title: 'محتوى محمي', desc: 'فيديوهاتك آمنة', color: '#34d399' },
              { icon: <FiHeadphones />, title: 'دعم مستمر', desc: 'تواصل معانا أي وقت', color: '#fb923c' },
            ].map((f, i) => (
              <div key={i} className="p-6 rounded-2xl"
                style={{ background: 'var(--bg2)', border: '1px solid var(--border)' }}>
                <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white mb-4 text-2xl"
                  style={{ background: f.color }}>{f.icon}</div>
                <h3 className="font-bold mb-1" style={{ color: 'var(--text)' }}>{f.title}</h3>
                <p className="text-sm opacity-70">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Courses */}
      {courses?.length > 0 && (
        <section className="py-20 px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="font-black text-center mb-12" style={{ fontSize: 'clamp(1.5rem, 5vw, 3rem)' }}>الكورسات</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {courses.map((course) => (
                <Link href="/login" key={course.id}>
                  <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--bg2)', border: '1px solid var(--border)' }}>
                    <div className="h-44 bg-gray-800">
                      {course.thumbnail_url && <img src={course.thumbnail_url} className="w-full h-full object-cover" />}
                    </div>
                    <div className="p-4">
                      <h3 className="font-bold mb-2">{course.title}</h3>
                      <div className="flex justify-between items-center text-sm font-bold text-indigo-400">
                        <span>{course.is_free ? 'مجاني' : `${course.price} ج.م`}</span>
                        <span className="text-xs opacity-60">{course.stage}</span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Testimonials */}
      {testimonials?.length > 0 && (
        <section className="py-20 px-4">
          <div className="max-w-6xl mx-auto">
             <h2 className="font-black text-center mb-12" style={{ fontSize: 'clamp(1.5rem, 5vw, 3rem)' }}>آراء الطلاب</h2>
             <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {testimonials.map((t) => (
                  <div key={t.id} className="p-6 rounded-2xl" style={{ background: 'var(--bg2)', border: '1px solid var(--border)' }}>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-full bg-indigo-500 flex items-center justify-center text-white font-bold">{t.student_name[0]}</div>
                      <div className="font-bold text-sm">{t.student_name}</div>
                    </div>
                    <p className="text-sm opacity-80 italic">"{t.comment}"</p>
                  </div>
                ))}
             </div>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="py-12 px-4 border-t" style={{ borderColor: 'var(--border)', background: 'var(--bg2)' }}>
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-sm opacity-60">{settings?.footer_text || '© 2026 جميع الحقوق محفوظة'}</p>
          <div className="flex gap-4">
            {settings?.facebook_url && <a href={settings.facebook_url} className="opacity-60 hover:opacity-100">Facebook</a>}
            {settings?.youtube_url && <a href={settings.youtube_url} className="opacity-60 hover:opacity-100">YouTube</a>}
          </div>
        </div>
      </footer>
    </main>
  );
}
