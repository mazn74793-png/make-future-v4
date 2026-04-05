import Navbar from '@/components/Navbar';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { FiPlay, FiArrowLeft, FiVideo, FiBookOpen, FiShield, FiHeadphones } from 'react-icons/fi';

export default async function HomePage() {
  const [{ data: settings }, { data: announcements }, { data: statsData }] = await Promise.all([
    supabase.from('site_settings').select('*').single(),
    supabase.from('announcements').select('*').eq('is_active', true),
    supabase.rpc('get_public_stats'),
  ]);

  return (
    <main className="relative min-h-screen">
      {/* 1. طبقة الخلفية المتحركة (Aurora) */}
      <div className="aurora-container">
        <div className="aurora-orb w-[500px] h-[500px] bg-indigo-600 top-[-10%] right-[-5%]" />
        <div className="aurora-orb w-[400px] h-[400px] bg-pink-600 bottom-[10%] left-[-5%] [animation-delay:2s]" />
        <div className="aurora-orb w-[300px] h-[300px] bg-emerald-600 top-[40%] left-[20%] [animation-delay:4s]" />
      </div>

      <Navbar />

      {/* 2. شريط التنبيهات (Relative لعدم التداخل) */}
      {announcements?.map(ann => (
        <div key={ann.id} className="relative z-50 bg-yellow-500 text-black py-3 px-4 text-center text-xs font-bold md:mt-0 mt-16">
          ⚠️ {ann.content}
        </div>
      ))}

      {/* 3. الهيرو سكشن (Hero Section) */}
      <section className="relative z-10 flex flex-col items-center justify-center pt-32 pb-20 px-4 text-center">
        {/* النقاط المتطايرة (Particles) */}
        <div className="absolute inset-0 pointer-events-none">
           {[...Array(6)].map((_, i) => (
             <div key={i} className={`absolute w-1 h-1 bg-white/20 rounded-full animate-pulse`} 
                  style={{ top: `${Math.random()*100}%`, left: `${Math.random()*100}%`, animationDelay: `${i}s` }} />
           ))}
        </div>

        {settings?.teacher_image_url && (
          <div className="mb-8 relative animate-fade-in">
            <div className="w-32 h-32 md:w-40 md:h-40 rounded-full border-4 border-indigo-500/30 p-1">
              <img src={settings.teacher_image_url} className="w-full h-full rounded-full object-cover shadow-2xl" alt="Teacher" />
            </div>
          </div>
        )}

        <h1 className="text-4xl md:text-7xl font-black mb-6 leading-tight animate-fade-in">
          {settings?.hero_title || 'تعلّم بطريقة'} <br/>
          <span className="bg-gradient-to-r from-indigo-400 to-pink-500 bg-clip-text text-transparent">مختلفة تماماً</span>
        </h1>

        <p className="text-muted text-sm md:text-lg max-w-2xl mx-auto mb-10 opacity-80">
          {settings?.hero_subtitle || 'منصة تعليمية متطورة توفر لك أفضل الشروحات والمتابعة الدورية.'}
        </p>

        <div className="flex flex-col sm:flex-row gap-4 animate-fade-in">
          <Link href="/login" className="px-10 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold shadow-lg shadow-indigo-500/20 transition-all flex items-center justify-center gap-2">
            <FiPlay /> ابدأ رحلتك الآن
          </Link>
          <a href={`https://wa.me/${settings?.whatsapp_number}`} className="px-10 py-4 bg-white/5 border border-white/10 hover:bg-white/10 rounded-2xl font-bold transition-all flex items-center justify-center gap-2">
            تواصل معنا <FiArrowLeft />
          </a>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-20 w-full max-w-4xl">
          {[
            { label: 'طالب مشترك', val: statsData?.students || 0 },
            { label: 'ساعة شرح', val: '500+' },
            { label: 'فيديو تعليمي', val: statsData?.videos || 0 },
            { label: 'تقييم عام', val: '4.9/5' },
          ].map((s, i) => (
            <div key={i} className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
              <div className="text-2xl font-black text-indigo-400">{s.val}</div>
              <div className="text-xs opacity-60 mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* 4. قسم المميزات (Simple Animated Cards) */}
      <section className="py-20 px-4 bg-black/20">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="p-8 rounded-3xl bg-gradient-to-b from-white/5 to-transparent border border-white/10 hover:border-indigo-500/50 transition-colors">
            <FiVideo className="text-4xl text-indigo-500 mb-4" />
            <h3 className="text-xl font-bold mb-2">جودة 4K</h3>
            <p className="text-sm opacity-60">شاهد الدروس بأعلى جودة ممكنة مع تقنيات ضغط متطورة لتوفير بياناتك.</p>
          </div>
          <div className="p-8 rounded-3xl bg-gradient-to-b from-white/5 to-transparent border border-white/10 hover:border-pink-500/50 transition-colors">
            <FiShield className="text-4xl text-pink-500 mb-4" />
            <h3 className="text-xl font-bold mb-2">حماية قصوى</h3>
            <p className="text-sm opacity-60">حسابك ومحتواك محمي بأعلى معايير الأمان لضمان تجربة تعليمية مستقرة.</p>
          </div>
          <div className="p-8 rounded-3xl bg-gradient-to-b from-white/5 to-transparent border border-white/10 hover:border-emerald-500/50 transition-colors">
            <FiHeadphones className="text-4xl text-emerald-500 mb-4" />
            <h3 className="text-xl font-bold mb-2">دعم فني 24/7</h3>
            <p className="text-sm opacity-60">فريقنا معك دائماً للإجابة على استفساراتك وحل مشاكلك التقنية فوراً.</p>
          </div>
        </div>
      </section>
    </main>
  );
}
