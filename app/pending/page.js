'use client';
import { useEffect, useState } from 'react';
import { FiClock, FiPhone, FiLogOut, FiCheckCircle } from 'react-icons/fi';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function PendingPage() {
  const [userName, setUserName] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const router = useRouter();

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/login'); return; }
      const [{ data: student }, { data: settings }] = await Promise.all([
        supabase.from('students').select('name').eq('user_id', user.id).single(),
        supabase.from('site_settings').select('whatsapp_number').single(),
      ]);
      if (student) setUserName(student.name);
      if (settings?.whatsapp_number) setWhatsapp(settings.whatsapp_number);
    };
    load();
  }, [router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/login';
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8 relative overflow-hidden"
      style={{ background: 'var(--bg)' }} dir="rtl">

      {/* Aurora */}
      <div aria-hidden="true" style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none', overflow: 'hidden' }}>
        <div className="aurora-orb aurora-orb-1" />
        <div className="aurora-orb aurora-orb-2" />
        <div className="aurora-orb aurora-orb-3" />
      </div>

      <div className="relative z-10 w-full max-w-md animate-fade-in">
        <div className="rounded-3xl p-8 md:p-12 text-center"
          style={{
            background: 'var(--glass-bg)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid var(--border)',
            boxShadow: '0 0 60px rgba(99,102,241,0.08)',
          }}>

          {/* Icon */}
          <div className="relative w-24 h-24 mx-auto mb-8">
            <div className="absolute inset-0 rounded-full animate-ping opacity-20"
              style={{ background: 'rgba(99,102,241,0.4)' }} />
            <div className="relative w-full h-full rounded-3xl flex items-center justify-center rotate-6 hover:rotate-0 transition-transform duration-500"
              style={{
                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                boxShadow: '0 8px 32px rgba(99,102,241,0.35)',
              }}>
              <FiClock style={{ fontSize: '2.5rem', color: 'white' }} />
            </div>
          </div>

          {/* Title */}
          <h1 className="text-2xl md:text-3xl font-black mb-2 leading-tight" style={{ color: 'var(--text)' }}>
            صبراً يا {userName ? userName.split(' ')[0] : 'بطل'}..
          </h1>
          <p className="font-black mb-1" style={{
            background: 'linear-gradient(135deg, #818cf8, #f472b6)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
            fontSize: '1.1rem',
          }}>
            طلبك قيد المراجعة
          </p>

          <div className="w-16 h-1 rounded-full mx-auto my-5"
            style={{ background: 'linear-gradient(135deg, #6366f1, #f472b6)' }} />

          <p className="leading-relaxed mb-3 text-sm md:text-base" style={{ color: 'var(--text-muted)' }}>
            الأدمن بيراجع بياناتك دلوقتي للتأكد من صحتها.
          </p>

          <div className="px-4 py-3 rounded-2xl mb-8 text-sm font-bold"
            style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)', color: '#818cf8' }}>
            🚀 سيتم تفعيل حسابك خلال أقل من 24 ساعة
          </div>

          {/* Buttons */}
          <div className="space-y-3">
            {whatsapp && (
              <a href={`https://wa.me/${whatsapp}`} target="_blank"
                className="flex items-center justify-center gap-3 w-full py-4 rounded-2xl font-black text-base transition-all hover:-translate-y-0.5"
                style={{
                  background: '#25D366',
                  color: '#052d16',
                  boxShadow: '0 4px 20px rgba(37,211,102,0.25)',
                }}>
                <FiPhone size={18} /> تواصل مع السكرتارية
              </a>
            )}

            <button onClick={handleLogout}
              className="flex items-center justify-center gap-3 w-full py-3.5 rounded-2xl font-bold text-sm transition-all hover:-translate-y-0.5"
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                color: 'var(--text-muted)',
              }}>
              <FiLogOut size={15} /> تسجيل الخروج والعودة لاحقاً
            </button>
          </div>

          <div className="mt-8 pt-6 flex items-center justify-center gap-2"
            style={{ borderTop: '1px solid var(--border)' }}>
            <FiCheckCircle size={13} style={{ color: '#818cf8' }} />
            <span className="text-xs font-black uppercase tracking-widest" style={{ color: 'var(--text-faint)' }}>
              جاري معالجة بياناتك الآن
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
