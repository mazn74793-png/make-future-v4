'use client';
import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';
import { 
  FiSave, FiSettings, FiUser, FiLayout, FiBarChart2, 
  FiMessageCircle, FiMonitor, FiFacebook, FiYoutube, 
  FiSend, FiCheckCircle, FiInfo 
} from 'react-icons/fi';

// مكون القسم مع لمسة جمالية للـ Border
const Section = ({ title, icon, children }) => (
  <div className="glass rounded-[2rem] p-8 mb-8 animate-fade-in border border-white/5 hover:border-purple-500/20 transition-all duration-500 shadow-2xl relative overflow-hidden group">
    <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 rounded-full blur-3xl group-hover:bg-purple-500/10 transition-all" />
    <div className="flex items-center gap-4 mb-8">
      <div className="p-3 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-2xl text-purple-400 shadow-inner">
        {icon}
      </div>
      <h2 className="text-2xl font-black tracking-tight">{title}</h2>
    </div>
    <div className="grid grid-cols-1 gap-6 relative z-10">{children}</div>
  </div>
);

const Field = ({ label, value, onChange, type = 'text', placeholder = '', icon: Icon }) => (
  <div className="group">
    <label className="text-xs font-black text-gray-500 mb-2 mr-2 block uppercase tracking-widest group-focus-within:text-purple-400 transition-colors">
      {label}
    </label>
    <div className="relative">
      {Icon && <Icon className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 group-focus-within:text-purple-500 transition-colors" />}
      <input 
        type={type} 
        value={value || ''} 
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full bg-white/[0.03] border border-white/10 rounded-2xl py-4 ${Icon ? 'pl-12 pr-5' : 'px-5'} text-white placeholder:text-gray-700 focus:border-purple-500/50 focus:ring-4 focus:ring-purple-500/5 focus:outline-none transition-all font-bold`} 
      />
    </div>
  </div>
);

const TextareaField = ({ label, value, onChange, placeholder = '' }) => (
  <div className="group">
    <label className="text-xs font-black text-gray-500 mb-2 mr-2 block uppercase tracking-widest group-focus-within:text-purple-400 transition-colors">
      {label}
    </label>
    <textarea 
      value={value || ''} 
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder} 
      rows={3}
      className="w-full bg-white/[0.03] border border-white/10 rounded-2xl py-4 px-5 text-white placeholder:text-gray-700 focus:border-purple-500/50 focus:ring-4 focus:ring-purple-500/5 focus:outline-none transition-all resize-none font-medium leading-relaxed" 
    />
  </div>
);

export default function SettingsPage() {
  const [settings, setSettings] = useState(null);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

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

  // تحذير عند محاولة الخروج بدون حفظ
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (hasChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasChanges]);

  const update = useCallback((key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase.from('site_settings').update(settings).eq('id', 1);
      if (error) throw error;
      toast.success('تم الحفظ بنجاح ⚡', {
        style: { borderRadius: '15px', background: '#10b981', color: '#fff', fontWeight: 'bold' }
      });
      setHasChanges(false);
    } catch (error) {
      toast.error('حدث خطأ أثناء الحفظ');
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  if (!settings) return (
    <div className="flex flex-col items-center justify-center py-60 gap-6">
      <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-2xl animate-spin shadow-xl shadow-purple-500/20" />
      <div className="text-center">
        <p className="text-white text-xl font-black animate-pulse">جاري تهيئة الإعدادات</p>
        <p className="text-gray-500 text-sm mt-1">لحظات وتكون جاهزاً...</p>
      </div>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto px-6 pb-32 pt-8" dir="rtl">
      {/* Dynamic Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16 relative">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="px-3 py-1 bg-purple-500/10 text-purple-400 rounded-full text-[10px] font-black uppercase tracking-widest border border-purple-500/20">System Admin</span>
            {hasChanges && <span className="text-amber-500 text-[10px] font-black animate-pulse">● لديك تغييرات غير محفوظة</span>}
          </div>
          <h1 className="text-5xl font-black tracking-tighter text-white">إعدادات <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">المنصة</span></h1>
          <p className="text-gray-500 font-bold mt-2">تحكم كامل في هوية ومظهر ومحتوى موقعك التعليمي</p>
        </div>
        
        <button 
          onClick={handleSave} 
          disabled={saving}
          className={`group relative overflow-hidden px-10 py-5 rounded-[1.5rem] font-black transition-all flex items-center gap-3 shadow-2xl ${hasChanges ? 'gradient-primary text-white scale-105 shadow-purple-500/30' : 'bg-white/5 text-gray-400 border border-white/10'}`}
        >
          {saving ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <FiSave size={22} className="group-hover:rotate-12 transition-transform" />}
          <span className="relative z-10">{saving ? 'جاري المزامنة...' : 'تحديث البيانات'}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column - Main Settings */}
        <div className="lg:col-span-7 space-y-8">
          <Section title="هوية المنصة" icon={<FiSettings size={24} />}>
            <Field label="اسم الموقع الرسمي" value={settings.site_name} onChange={v => update('site_name', v)} placeholder="مثلاً: أكاديمية النخبة" />
            <TextareaField label="وصف الـ SEO (لظهورك في جوجل)" value={settings.site_description} onChange={v => update('site_description', v)} placeholder="اكتب وصفاً جذاباً لموقعك..." />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <Field label="رابط الشعار (Logo)" value={settings.logo_url} onChange={v => update('logo_url', v)} placeholder="https://..." />
               <Field label="نص الحقوق السفلي" value={settings.footer_text} onChange={v => update('footer_text', v)} />
            </div>
          </Section>

          <Section title="واجهة الـ Hero" icon={<FiLayout size={24} />}>
             <Field label="العنوان الرئيسي الصادم" value={settings.hero_title} onChange={v => update('hero_title', v)} />
             <TextareaField label="النص الفرعي المقنع" value={settings.hero_subtitle} onChange={v => update('hero_subtitle', v)} />
          </Section>

          <Section title="أرقام تفتخر بها" icon={<FiBarChart2 size={24} />}>
            <div className="grid grid-cols-2 gap-4">
              <Field label="عدد الطلاب" value={settings.stats_students} onChange={v => update('stats_students', v)} />
              <Field label="عدد المحاضرات" value={settings.stats_videos} onChange={v => update('stats_videos', v)} />
              <Field label="الكورسات المتاحة" value={settings.stats_courses} onChange={v => update('stats_courses', v)} />
              <Field label="التقييم العام" value={settings.stats_rating} onChange={v => update('stats_rating', v)} />
            </div>
          </Section>
        </div>

        {/* Right Column - Profiles & Social */}
        <div className="lg:col-span-5 space-y-8">
          <Section title="بروفايل المحاضر" icon={<FiUser size={24} />}>
            <Field label="الاسم بالكامل" value={settings.teacher_name} onChange={v => update('teacher_name', v)} />
            <Field label="التخصص العلمي" value={settings.subject} onChange={v => update('subject', v)} />
            <Field label="صورة البروفايل (URL)" value={settings.teacher_image_url} onChange={v => update('teacher_image_url', v)} />
            <TextareaField label="نبذة سريعة" value={settings.about_text} onChange={v => update('about_text', v)} />
            <TextareaField label="السيرة الذاتية (Bio)" value={settings.teacher_bio} onChange={v => update('teacher_bio', v)} />
          </Section>

          <Section title="قنوات التواصل" icon={<FiMessageCircle size={24} />}>
            <Field label="رقم الواتساب" value={settings.whatsapp_number} onChange={v => update('whatsapp_number', v)} icon={FiMessageCircle} />
            <Field label="البريد الرسمي" value={settings.contact_email} onChange={v => update('contact_email', v)} />
            <div className="space-y-3 pt-4 border-t border-white/5">
              <Field label="رابط الفيسبوك" value={settings.facebook_url} onChange={v => update('facebook_url', v)} icon={FiFacebook} />
              <Field label="قناة اليوتيوب" value={settings.youtube_url} onChange={v => update('youtube_url', v)} icon={FiYoutube} />
              <Field label="رابط التليجرام" value={settings.telegram_url} onChange={v => update('telegram_url', v)} icon={FiSend} />
            </div>
          </Section>

          <Section title="إدارة النظام" icon={<FiMonitor size={24} />}>
            <div className={`p-6 rounded-[1.5rem] border transition-all ${settings.is_maintenance ? 'bg-red-500/10 border-red-500/30' : 'bg-emerald-500/5 border-emerald-500/20'}`}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${settings.is_maintenance ? 'bg-red-500 animate-pulse' : 'bg-emerald-500'}`} />
                  <p className="font-black text-sm uppercase tracking-tighter">{settings.is_maintenance ? 'وضع الصيانة نشط' : 'الموقع متاح للجميع'}</p>
                </div>
                <button 
                  onClick={() => update('is_maintenance', !settings.is_maintenance)}
                  className={`w-14 h-8 rounded-full relative transition-all duration-500 shadow-inner ${settings.is_maintenance ? 'bg-red-500' : 'bg-white/10'}`}
                >
                  <div className={`w-6 h-6 bg-white rounded-full absolute top-1 transition-all duration-500 shadow-lg ${settings.is_maintenance ? 'left-1' : 'left-7'}`} />
                </button>
              </div>
              {settings.is_maintenance && (
                <div className="animate-slide-down">
                  <TextareaField label="رسالة الإغلاق للطلاب" value={settings.maintenance_message} onChange={v => update('maintenance_message', v)} />
                </div>
              )}
            </div>
          </Section>
        </div>
      </div>

      {/* Floating Prompt for unsaved changes */}
      {hasChanges && !saving && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 animate-bounce-in">
          <div className="bg-amber-500 text-black px-6 py-3 rounded-full font-black text-sm shadow-2xl flex items-center gap-2 border-4 border-black/10">
            <FiInfo /> لا تنسى حفظ التغييرات قبل الخروج!
          </div>
        </div>
      )}
    </div>
  );
}
