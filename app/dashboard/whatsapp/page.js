'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';

const STAGES = ['الكل','الصف الأول الإعدادي','الصف الثاني الإعدادي','الصف الثالث الإعدادي','الصف الأول الثانوي','الصف الثاني الثانوي','الصف الثالث الثانوي'];

export default function WhatsAppPage() {
  const [students, setStudents] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [selected, setSelected] = useState([]);
  const [message, setMessage] = useState('');
  const [sendTo, setSendTo] = useState('students'); // 'students' | 'parents' | 'both'
  const [stageFilter, setStageFilter] = useState('الكل');
  const [templates] = useState([
    { label: '📢 تذكير بالحصة', text: 'عزيزي الطالب، تذكير بموعد الحصة غداً. نتمنى لك يوماً دراسياً موفقاً 📚' },
    { label: '✅ الامتحان قريب', text: 'عزيزي الطالب، الامتحان القادم يوم ... الساعة ... راجع المنهج وإن شاء الله النجاح ليك 💪' },
    { label: '📦 منتج جديد', text: 'يسعدنا إخبارك بتوفر ... بسعر ... جنيه. للطلب تواصل معنا 😊' },
    { label: '⚠️ غياب', text: 'عزيزي ولي الأمر، نود إحاطتكم علماً بغياب نجلكم/كريمتكم اليوم. نرجو التواصل معنا.' },
  ]);

  useEffect(() => {
    supabase.from('students').select('*').eq('status', 'approved').order('name')
      .then(({ data }) => { setStudents(data || []); setFiltered(data || []); });
  }, []);

  useEffect(() => {
    if (stageFilter === 'الكل') setFiltered(students);
    else setFiltered(students.filter(s => s.stage === stageFilter));
    setSelected([]);
  }, [stageFilter, students]);

  const toggleSelect = (id) => setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  const selectAll = () => setSelected(selected.length === filtered.length ? [] : filtered.map(s => s.id));

  const openWhatsApp = (phone, msg) => {
    if (!phone) return;
    const clean = phone.replace(/\D/g, '');
    const num = clean.startsWith('0') ? '2' + clean : clean.startsWith('20') ? clean : '20' + clean;
    window.open(`https://wa.me/${num}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const sendMessages = () => {
    if (!message.trim()) { toast.error('اكتب الرسالة الأول'); return; }
    if (selected.length === 0) { toast.error('اختار طلاب الأول'); return; }

    const targets = students.filter(s => selected.includes(s.id));
    let count = 0;

    targets.forEach((student, i) => {
      setTimeout(() => {
        const personalMsg = message.replace('{اسم الطالب}', student.name).replace('{كود الطالب}', student.student_code || '');

        if (sendTo === 'students' || sendTo === 'both') {
          if (student.phone) { openWhatsApp(student.phone, personalMsg); count++; }
        }
        if (sendTo === 'parents' || sendTo === 'both') {
          if (student.parent_phone) { openWhatsApp(student.parent_phone, `ولي أمر الطالب ${student.name}،\n${personalMsg}`); count++; }
        }
      }, i * 800); // تأخير بسيط عشان المتصفح مايبلوكش
    });

    toast.success(`✅ جاري فتح ${targets.length} محادثة واتساب`);
  };

  const inp = "w-full py-2.5 px-3 rounded-xl text-sm focus:outline-none";
  const inpStyle = { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' };

  return (
    <div dir="rtl">
      <h1 className="text-2xl font-black mb-6">💬 إرسال واتساب</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* الرسالة */}
        <div className="space-y-4">
          <div className="glass rounded-2xl p-5">
            <h2 className="font-black mb-4">✍️ الرسالة</h2>

            {/* Templates */}
            <div className="grid grid-cols-2 gap-2 mb-4">
              {templates.map((t, i) => (
                <button key={i} onClick={() => setMessage(t.text)}
                  className="text-xs py-2 px-3 rounded-xl text-right transition hover:opacity-80"
                  style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)', color: '#a5b4fc' }}>
                  {t.label}
                </button>
              ))}
            </div>

            <textarea rows={5} placeholder="اكتب رسالتك هنا...\nيمكنك استخدام {اسم الطالب} و {كود الطالب}"
              value={message} onChange={e => setMessage(e.target.value)}
              className={`${inp} resize-none`} style={inpStyle} />

            <p className="text-xs text-gray-500 mt-2">
              يمكنك استخدام: &#123;اسم الطالب&#125; و &#123;كود الطالب&#125;
            </p>

            {/* إرسال لـ */}
            <div className="mt-4">
              <p className="text-sm font-bold mb-2 text-gray-300">إرسال لـ:</p>
              <div className="flex gap-2">
                {[
                  { value: 'students', label: '👨‍🎓 الطلاب' },
                  { value: 'parents', label: '👨‍👩‍👦 أولياء الأمور' },
                  { value: 'both', label: '👥 الاثنين' },
                ].map(opt => (
                  <button key={opt.value} onClick={() => setSendTo(opt.value)}
                    className="flex-1 py-2 rounded-xl text-sm font-bold transition"
                    style={{
                      background: sendTo === opt.value ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : 'rgba(255,255,255,0.05)',
                      border: `1px solid ${sendTo === opt.value ? 'transparent' : 'rgba(255,255,255,0.1)'}`,
                      color: sendTo === opt.value ? 'white' : '#9ca3af',
                    }}>
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <button onClick={sendMessages}
              className="w-full mt-4 py-3 rounded-xl text-white font-bold flex items-center justify-center gap-2"
              style={{ background: 'linear-gradient(135deg, #25D366, #128C7E)' }}>
              📲 إرسال لـ {selected.length} طالب
            </button>
          </div>
        </div>

        {/* الطلاب */}
        <div className="glass rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-black">👥 اختار الطلاب</h2>
            <button onClick={selectAll} className="text-xs px-3 py-1.5 rounded-xl"
              style={{ background: 'rgba(99,102,241,0.15)', color: '#818cf8' }}>
              {selected.length === filtered.length ? 'إلغاء الكل' : 'تحديد الكل'}
            </button>
          </div>

          <select className={`${inp} mb-3`} style={{ ...inpStyle, cursor: 'pointer' }}
            value={stageFilter} onChange={e => setStageFilter(e.target.value)}>
            {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>

          <div className="space-y-2 max-h-96 overflow-y-auto">
            {filtered.map(student => (
              <div key={student.id}
                onClick={() => toggleSelect(student.id)}
                className="flex items-center gap-3 p-3 rounded-xl cursor-pointer transition"
                style={{
                  background: selected.includes(student.id) ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${selected.includes(student.id) ? 'rgba(99,102,241,0.3)' : 'rgba(255,255,255,0.06)'}`,
                }}>
                <div className="w-4 h-4 rounded flex items-center justify-center flex-shrink-0"
                  style={{
                    background: selected.includes(student.id) ? '#6366f1' : 'transparent',
                    border: `2px solid ${selected.includes(student.id) ? '#6366f1' : 'rgba(255,255,255,0.3)'}`,
                  }}>
                  {selected.includes(student.id) && <span className="text-white text-xs">✓</span>}
                </div>
                <div className="w-8 h-8 rounded-xl flex items-center justify-center font-bold text-white text-xs flex-shrink-0"
                  style={{ background: 'linear-gradient(135deg, #6366f1, #f472b6)' }}>
                  {student.name?.[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm truncate">{student.name}</p>
                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    <span className="font-mono" style={{ color: '#818cf8' }}>{student.student_code}</span>
                    {student.phone && <span>📱 {student.phone}</span>}
                  </div>
                </div>
                {/* زرار واتساب مباشر */}
                <div className="flex gap-1.5" onClick={e => e.stopPropagation()}>
                  {student.phone && (
                    <button onClick={() => openWhatsApp(student.phone, message || 'مرحباً ' + student.name)}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-xs"
                      style={{ background: 'rgba(37,211,102,0.15)', color: '#25D366' }} title="واتساب الطالب">
                      👨‍🎓
                    </button>
                  )}
                  {student.parent_phone && (
                    <button onClick={() => openWhatsApp(student.parent_phone, `ولي أمر ${student.name}، ${message || 'مرحباً'}`)}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-xs"
                      style={{ background: 'rgba(37,211,102,0.15)', color: '#25D366' }} title="واتساب ولي الأمر">
                      👨‍👩‍👦
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <p className="text-xs text-gray-500 mt-3 text-center">
            تم تحديد {selected.length} من {filtered.length} طالب
          </p>
        </div>
      </div>
    </div>
  );
}
