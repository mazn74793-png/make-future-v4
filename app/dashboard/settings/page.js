'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';
import { FiSave } from 'react-icons/fi';

export default function SettingsPage() {
  const [settings, setSettings] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from('site_settings').select('*').single();
      setSettings(data);
    };
    load();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    const { error } = await supabase.from('site_settings').update(settings).eq('id', 1);
    if (error) toast.error('حصل مشكلة');
    else toast.success('تم الحفظ بنجاح');
    setSaving(false);
  };

  const update = (key, value) => setSettings(prev => ({ ...prev, [key]: value }));

  if (!settings) return <div className="text-center py-20"><div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto" /></div>;

  const Section = ({ title, children }) => (
    <div className="glass rounded-2xl p-6 mb-6 animate-fade-in">
      <h2 className="text-xl font-bold mb-4 text-purple-400">{title}</h2>
      <div className="space-y-4">{children}</div>
    </div>
  );

  const Input = ({ label, field, type = 'text', placeholder = '' }) => (
    <div>
      <label className="text-sm text-gray-400 mb-1 block">{label}</label>
      <input type={type} value={settings[field] || ''} onChange={(e) => update(field, e.target.value)}
        placeholder={placeholder}
        className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white placeholder:text-gray-600 focus:border-purple-500 focus:outline-none transition" />
    </div>
  );

  const Textarea = ({ label, field, placeholder = '' }) => (
    <div>
      <label className="text-sm text-gray-400 mb-1 block">{label}</label>
      <textarea value={settings[field] || ''} onChange={(e) => update(field, e.target.value)}
        placeholder={placeholder} rows={3}
        className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white placeholder:text-gray-600 focus:border-purple-500 focus:outline-none transition resize-none" />
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-black">اعدادات الموقع</h1>
        <button onClick={handleSave} disabled={saving}
          className="gradient-primary px-6 py-3 rounded-xl text-white font-bold hover:opacity-90 transition disabled:opacity-50 flex items-center gap-2">
          <FiSave /> {saving ? 'جاري الحفظ...' : 'حفظ التغييرات'}
        </button>
      </div>

      <Section title="معلومات الموقع">
        <Input label="اسم المنصة" field="site_name" placeholder="منصة الأستاذ" />
        <Textarea label="وصف الموقع" field="site_description" placeholder="منصة تعليمية احترافية" />
        <Input label="رابط اللوجو" field="logo_url" placeholder="https://..." />
        <Input label="نص الفوتر" field="footer_text" placeholder="جميع الحقوق محفوظة" />
      </Section>

      <Section title="بيانات المدرس">
        <Input label="اسم المدرس" field="teacher_name" placeholder="أ/ محمد" />
        <Input label="المادة" field="subject" placeholder="رياضيات" />
        <Input label="المرحلة" field="stage" placeholder="ثانوية عامة" />
        <Textarea label="نبذة عن المدرس" field="about_text" placeholder="اكتب نبذة..." />
        <Input label="صورة المدرس (رابط)" field="teacher_image_url" placeholder="https://..." />
        <Textarea label="السيرة الذاتية" field="teacher_bio" />
      </Section>

      <Section title="الصفحة الرئيسية">
        <Input label="العنوان الرئيسي" field="hero_title" placeholder="تعلم بطريقة مختلفة" />
        <Textarea label="الوصف تحت العنوان" field="hero_subtitle" />
      </Section>

      <Section title="الاحصائيات">
        <div className="grid grid-cols-2 gap-4">
          <Input label="عدد الطلاب" field="stats_students" placeholder="+500" />
          <Input label="عدد الفيديوهات" field="stats_videos" placeholder="+50" />
          <Input label="عدد الكورسات" field="stats_courses" placeholder="+10" />
          <Input label="التقييم" field="stats_rating" placeholder="4.9" />
        </div>
      </Section>

      <Section title="التواصل والسوشيال ميديا">
        <Input label="رقم الواتساب (بالكود الدولي)" field="whatsapp_number" placeholder="201xxxxxxxxx" />
        <Input label="ايميل التواصل" field="contact_email" placeholder="email@example.com" />
        <Input label="رابط Facebook" field="facebook_url" placeholder="https://facebook.com/..." />
        <Input label="رابط YouTube" field="youtube_url" placeholder="https://youtube.com/..." />
        <Input label="رابط Telegram" field="telegram_url" placeholder="https://t.me/..." />
      </Section>

      <Section title="الألوان">
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="text-sm text-gray-400 mb-1 block">اللون الرئيسي</label>
            <div className="flex items-center gap-2">
              <input type="color" value={settings.primary_color || '#6C5CE7'} onChange={(e) => update('primary_color', e.target.value)} className="w-10 h-10 rounded cursor-pointer" />
              <span className="text-gray-400 text-sm">{settings.primary_color}</span>
            </div>
          </div>
          <div>
            <label className="text-sm text-gray-400 mb-1 block">اللون الثانوي</label>
            <div className="flex items-center gap-2">
              <input type="color" value={settings.secondary_color || '#A29BFE'} onChange={(e) => update('secondary_color', e.target.value)} className="w-10 h-10 rounded cursor-pointer" />
              <span className="text-gray-400 text-sm">{settings.secondary_color}</span>
            </div>
          </div>
          <div>
            <label className="text-sm text-gray-400 mb-1 block">لون مميز</label>
            <div className="flex items-center gap-2">
              <input type="color" value={settings.accent_color || '#FD79A8'} onChange={(e) => update('accent_color', e.target.value)} className="w-10 h-10 rounded cursor-pointer" />
              <span className="text-gray-400 text-sm">{settings.accent_color}</span>
            </div>
          </div>
        </div>
      </Section>

      <Section title="اعدادات متقدمة">
        <div className="flex items-center justify-between">
          <span className="text-gray-300">وضع الصيانة (يقفل الموقع)</span>
          <button onClick={() => update('is_maintenance', !settings.is_maintenance)}
            className={`w-14 h-7 rounded-full transition ${settings.is_maintenance ? 'bg-purple-500' : 'bg-white/10'}`}>
            <div className={`w-5 h-5 bg-white rounded-full transition-transform ${settings.is_maintenance ? '-translate-x-7' : '-translate-x-1'}`} />
          </button>
        </div>
        {settings.is_maintenance && (
          <Input label="رسالة الصيانة" field="maintenance_message" placeholder="الموقع تحت الصيانة" />
        )}
      </Section>

      <div className="text-center mt-8 mb-10">
        <button onClick={handleSave} disabled={saving}
          className="gradient-primary px-10 py-4 rounded-xl text-white font-bold text-lg hover:opacity-90 transition disabled:opacity-50 flex items-center gap-2 mx-auto">
          <FiSave /> {saving ? 'جاري الحفظ...' : 'حفظ كل التغييرات'}
        </button>
      </div>
    </div>
  );
}
