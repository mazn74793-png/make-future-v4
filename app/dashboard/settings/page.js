'use client';
import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';
import { FiSave } from 'react-icons/fi';

// ⚠️ مهم جداً — معرّفين برا الـ component عشان متتعملش re-render
const Section = ({ title, children }) => (
  <div className="glass rounded-2xl p-6 mb-6 animate-fade-in">
    <h2 className="text-xl font-bold mb-4 text-purple-400">{title}</h2>
    <div className="space-y-4">{children}</div>
  </div>
);

const Field = ({ label, value, onChange, type = 'text', placeholder = '' }) => (
  <div>
    <label className="text-sm text-gray-400 mb-1 block">{label}</label>
    <input type={type} value={value || ''} onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white placeholder:text-gray-600 focus:border-purple-500 focus:outline-none transition" />
  </div>
);

const TextareaField = ({ label, value, onChange, placeholder = '' }) => (
  <div>
    <label className="text-sm text-gray-400 mb-1 block">{label}</label>
    <textarea value={value || ''} onChange={e => onChange(e.target.value)}
      placeholder={placeholder} rows={3}
      className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white placeholder:text-gray-600 focus:border-purple-500 focus:outline-none transition resize-none" />
  </div>
);

export default function SettingsPage() {
  const [settings, setSettings] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase.from('site_settings').select('*').single()
      .then(({ data }) => { if (data) setSettings(data); });
  }, []);

  const update = useCallback((key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    const { error } = await supabase.from('site_settings').update(settings).eq('id', 1);
    if (error) toast.error('حصل مشكلة');
    else toast.success('تم الحفظ بنجاح ✅');
    setSaving(false);
  };

  if (!settings) return (
    <div className="text-center py-20">
      <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto" />
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
        <Field label="اسم المنصة" value={settings.site_name} onChange={v => update('site_name', v)} placeholder="منصة الأستاذ" />
        <TextareaField label="وصف الموقع" value={settings.site_description} onChange={v => update('site_description', v)} placeholder="منصة تعليمية احترافية" />
        <Field label="رابط اللوجو" value={settings.logo_url} onChange={v => update('logo_url', v)} placeholder="https://..." />
        <Field label="نص الفوتر" value={settings.footer_text} onChange={v => update('footer_text', v)} placeholder="جميع الحقوق محفوظة" />
      </Section>

      <Section title="بيانات المدرس">
        <Field label="اسم المدرس" value={settings.teacher_name} onChange={v => update('teacher_name', v)} placeholder="أ/ محمد" />
        <Field label="المادة" value={settings.subject} onChange={v => update('subject', v)} placeholder="رياضيات" />
        <Field label="المرحلة" value={settings.stage} onChange={v => update('stage', v)} placeholder="ثانوية عامة" />
        <TextareaField label="نبذة عن المدرس" value={settings.about_text} onChange={v => update('about_text', v)} placeholder="اكتب نبذة..." />
        <Field label="صورة المدرس (رابط)" value={settings.teacher_image_url} onChange={v => update('teacher_image_url', v)} placeholder="https://..." />
        <TextareaField label="السيرة الذاتية" value={settings.teacher_bio} onChange={v => update('teacher_bio', v)} />
      </Section>

      <Section title="الصفحة الرئيسية">
        <Field label="العنوان الرئيسي" value={settings.hero_title} onChange={v => update('hero_title', v)} placeholder="تعلم بطريقة مختلفة" />
        <TextareaField label="الوصف تحت العنوان" value={settings.hero_subtitle} onChange={v => update('hero_subtitle', v)} />
      </Section>

      <Section title="الاحصائيات">
        <div className="grid grid-cols-2 gap-4">
          <Field label="عدد الطلاب" value={settings.stats_students} onChange={v => update('stats_students', v)} placeholder="+500" />
          <Field label="عدد الفيديوهات" value={settings.stats_videos} onChange={v => update('stats_videos', v)} placeholder="+50" />
          <Field label="عدد الكورسات" value={settings.stats_courses} onChange={v => update('stats_courses', v)} placeholder="+10" />
          <Field label="التقييم" value={settings.stats_rating} onChange={v => update('stats_rating', v)} placeholder="4.9" />
        </div>
      </Section>

      <Section title="التواصل والسوشيال ميديا">
        <Field label="رقم الواتساب (بالكود الدولي)" value={settings.whatsapp_number} onChange={v => update('whatsapp_number', v)} placeholder="201xxxxxxxxx" />
        <Field label="ايميل التواصل" value={settings.contact_email} onChange={v => update('contact_email', v)} placeholder="email@example.com" />
        <Field label="رابط Facebook" value={settings.facebook_url} onChange={v => update('facebook_url', v)} placeholder="https://facebook.com/..." />
        <Field label="رابط YouTube" value={settings.youtube_url} onChange={v => update('youtube_url', v)} placeholder="https://youtube.com/..." />
        <Field label="رابط Telegram" value={settings.telegram_url} onChange={v => update('telegram_url', v)} placeholder="https://t.me/..." />
      </Section>

      <Section title="الألوان">
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'اللون الرئيسي', field: 'primary_color', default: '#6C5CE7' },
            { label: 'اللون الثانوي', field: 'secondary_color', default: '#A29BFE' },
            { label: 'لون مميز', field: 'accent_color', default: '#FD79A8' },
          ].map(({ label, field, default: def }) => (
            <div key={field}>
              <label className="text-sm text-gray-400 mb-1 block">{label}</label>
              <div className="flex items-center gap-2">
                <input type="color" value={settings[field] || def}
                  onChange={e => update(field, e.target.value)}
                  className="w-10 h-10 rounded cursor-pointer" />
                <span className="text-gray-400 text-sm">{settings[field]}</span>
              </div>
            </div>
          ))}
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
          <Field label="رسالة الصيانة" value={settings.maintenance_message} onChange={v => update('maintenance_message', v)} placeholder="الموقع تحت الصيانة" />
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
