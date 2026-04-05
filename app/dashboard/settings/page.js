'use client';
import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';
import { FiSave, FiSettings, FiUser, FiLayout, FiBarChart2, FiMessageCircle, FiMonitor } from 'react-icons/fi';

// مكون القسم مع أيقونة اختيارية
const Section = ({ title, icon, children }) => (
  <div className="glass rounded-3xl p-6 mb-8 animate-fade-in border border-white/5 hover:border-white/10 transition-all shadow-xl">
    <div className="flex items-center gap-3 mb-6">
      <div className="p-2 bg-purple-500/10 rounded-lg text-purple-400">
        {icon}
      </div>
      <h2 className="text-xl font-black">{title}</h2>
    </div>
    <div className="space-y-5">{children}</div>
  </div>
);

const Field = ({ label, value, onChange, type = 'text', placeholder = '' }) => (
  <div className="group">
    <label className="text-sm font-bold text-gray-500 mb-2 block group-focus-within:text-purple-400 transition-colors">
      {label}
    </label>
    <input 
      type={type} 
      value={value || ''} 
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 px-5 text-white placeholder:text-gray-600 focus:border-purple-500/50 focus:ring-4 focus:ring-purple-500/10 focus:outline-none transition-all" 
    />
  </div>
);

const TextareaField = ({ label, value, onChange, placeholder = '' }) => (
  <div className="group">
    <label className="text-sm font-bold text-gray-500 mb-2 block group-focus-within:text-purple-400 transition-colors">
      {label}
    </label>
    <textarea 
      value={value || ''} 
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder} 
      rows={3}
      className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 px-5 text-white placeholder:text-gray-600 focus:border-purple-500/50 focus:ring-4 focus:ring-purple-500/10 focus:outline-none transition-all resize-none" 
    />
  </div>
);

export default function SettingsPage() {
  const [settings, setSettings] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function fetchSettings() {
      const { data, error } = await supabase.from('site_settings').select('*').single();
      if (error) {
        toast.error('فشل تحميل الإعدادات');
        return;
      }
      if (data) setSettings(data);
    }
    fetchSettings();
  }, []);

  const update = useCallback((key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase.from('site_settings').update(settings).eq('id', 1);
      if (error) throw error;
      toast.success('تم حفظ جميع التغييرات بنجاح ✅', {
        style: { borderRadius: '15px', background: '#18181b', color: '#fff' }
      });
    } catch (error) {
      toast.error('حدث خطأ أثناء الحفظ');
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  if (!settings) return (
    <div className="flex flex-col items-center justify-center py-40 gap-4">
      <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
      <p className="text-gray-500 font-bold animate-pulse">جاري تحميل الإعدادات...</p>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto px-4 pb-20 pt-4" dir="rtl">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-12">
        <div>
          <h1 className="text-4xl font-black tracking-tight">إعدادات المنصة</h1>
          <p className="text-gray-500 mt-1">تحكم في كل تفاصيل موقعك من مكان واحد</p>
        </div>
        <button 
          onClick={handleSave} 
          disabled={saving}
          className="gradient-primary px-8 py-4 rounded-2xl text-white font-bold hover:scale-105 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-purple-500/20"
        >
          {saving ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <FiSave size={20} />}
          {saving ? 'جاري الحفظ...' : 'حفظ التغييرات'}
        </button>
      </div>

      <div className="grid grid-cols-1 gap-2">
        
        <Section title="هوية الموقع" icon={<FiSettings />}>
          <Field label="اسم المنصة" value={settings.site_name} onChange={v => update('site_name', v)} placeholder="مثلاً: منصة المستقبل" />
          <TextareaField label="وصف الموقع (SEO)" value={settings.site_description} onChange={v => update('site_description', v)} />
          <Field label="رابط اللوجو" value={settings.logo_url} onChange={v => update('logo_url', v)} placeholder="https://..." />
          <Field label="نص الحقوق (Footer)" value={settings.footer_text} onChange={v => update('footer_text', v)} />
        </Section>

        <Section title="بيانات المدرس" icon={<FiUser />}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="اسم المدرس" value={settings.teacher_name} onChange={v => update('teacher_name', v)} />
            <Field label="المادة العلمية" value={settings.subject} onChange={v => update('subject', v)} />
          </div>
          <Field label="صورة المدرس (رابط URL)" value={settings.teacher_image_url} onChange={v => update('teacher_image_url', v)} />
          <TextareaField label="نبذة قصيرة" value={settings.about_text} onChange={v => update('about_text', v)} />
          <TextareaField label="السيرة الذاتية المفصلة" value={settings.teacher_bio} onChange={v => update('teacher_bio', v)} />
        </Section>

        <Section title="واجهة الصفحة الرئيسية" icon={<FiLayout />}>
          <Field label="العنوان الجذاب (Hero Title)" value={settings.hero_title} onChange={v => update('hero_title', v)} />
          <TextareaField label="الوصف التوضيحي" value={settings.hero_subtitle} onChange={v => update('hero_subtitle', v)} />
        </Section>

        <Section title="الإحصائيات والأرقام" icon={<FiBarChart2 />}>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Field label="الطلاب" value={settings.stats_students} onChange={v => update('stats_students', v)} />
            <Field label="الفيديوهات" value={settings.stats_videos} onChange={v => update('stats_videos', v)} />
            <Field label="الكورسات" value={settings.stats_courses} onChange={v => update('stats_courses', v)} />
            <Field label="التقييم" value={settings.stats_rating} onChange={v => update('stats_rating', v)} />
          </div>
        </Section>

        <Section title="روابط التواصل" icon={<FiMessageCircle />}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="واتساب (مثال: 201000000000)" value={settings.whatsapp_number} onChange={v => update('whatsapp_number', v)} />
            <Field label="البريد الإلكتروني" value={settings.contact_email} onChange={v => update('contact_email', v)} />
          </div>
          <div className="space-y-4">
            <Field label="فيسبوك" value={settings.facebook_url} onChange={v => update('facebook_url', v)} />
            <Field label="يوتيوب" value={settings.youtube_url} onChange={v => update('youtube_url', v)} />
            <Field label="تليجرام" value={settings.telegram_url} onChange={v => update('telegram_url', v)} />
          </div>
        </Section>

        <Section title="وضع الصيانة" icon={<FiMonitor />}>
          <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
            <div>
              <p className="font-bold">تفعيل وضع الصيانة</p>
              <p className="text-xs text-gray-500">عند التفعيل، سيتم قفل الموقع عن الطلاب وعرض رسالة تنبيه</p>
            </div>
            <button 
              onClick={() => update('is_maintenance', !settings.is_maintenance)}
              className={`w-14 h-8 rounded-full relative transition-all duration-300 ${settings.is_maintenance ? 'bg-red-500 shadow-lg shadow-red-500/20' : 'bg-white/10'}`}
            >
              <div className={`w-6 h-6 bg-white rounded-full absolute top-1 transition-all duration-300 ${settings.is_maintenance ? 'left-1' : 'left-7'}`} />
            </button>
          </div>
          {settings.is_maintenance && (
            <div className="mt-4 animate-scale-in">
              <Field label="رسالة التنبيه للطلاب" value={settings.maintenance_message} onChange={v => update('maintenance_message', v)} />
            </div>
          )}
        </Section>

      </div>

      {/* Floating Save Button Mobile */}
      <div className="fixed bottom-6 left-6 right-6 md:hidden z-50">
        <button 
          onClick={handleSave} 
          disabled={saving}
          className="w-full gradient-primary py-4 rounded-2xl text-white font-bold shadow-2xl flex items-center justify-center gap-2"
        >
          {saving ? 'جاري الحفظ...' : 'حفظ التغييرات'}
        </button>
      </div>
    </div>
  );
}
