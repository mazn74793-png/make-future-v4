'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';
import { FiSend, FiUsers, FiFilter, FiCheckSquare, FiMessageCircle, FiUser, FiHome, FiLoader } from 'react-icons/fi';
import { FaWhatsapp } from 'react-icons/fa';

const STAGES = ['الكل','الصف الأول الإعدادي','الصف الثاني الإعدادي','الصف الثالث الإعدادي','الصف الأول الثانوي','الصف الثاني الثانوي','الصف الثالث الثانوي'];

export default function WhatsAppPage() {
  const [students, setStudents] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [selected, setSelected] = useState([]);
  const [message, setMessage] = useState('');
  const [sendTo, setSendTo] = useState('students');
  const [stageFilter, setStageFilter] = useState('الكل');
  const [isSending, setIsSending] = useState(false);
  const [progress, setProgress] = useState(0);

  const templates = [
    { label: '📢 تذكير بالحصة', text: 'عزيزي الطالب {اسم الطالب}، تذكير بموعد الحصة غداً. نتمنى لك يوماً دراسياً موفقاً 📚' },
    { label: '✅ الامتحان قريب', text: 'عزيزي الطالب {اسم الطالب}، الامتحان القادم يوم ... الساعة ... راجع المنهج وإن شاء الله النجاح ليك 💪' },
    { label: '📦 منتج جديد', text: 'يسعدنا إخبارك بتوفر ... بسعر ... جنيه. للطلب تواصل معنا 😊' },
    { label: '⚠️ غياب', text: 'عزيزي ولي الأمر، نود إحاطتكم علماً بغياب نجلكم/كريمتكم {اسم الطالب} اليوم. نرجو التواصل معنا.' },
  ];

  useEffect(() => {
    loadStudents();
  }, []);

  const loadStudents = async () => {
    const { data } = await supabase.from('students').select('*').eq('status', 'approved').order('name');
    setStudents(data || []);
    setFiltered(data || []);
  };

  useEffect(() => {
    let result = students;
    if (stageFilter !== 'الكل') {
      result = students.filter(s => s.stage === stageFilter);
    }
    setFiltered(result);
    setSelected([]); // إعادة ضبط التحديد عند تغيير الفلتر
  }, [stageFilter, students]);

  const toggleSelect = (id) => setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  const selectAll = () => setSelected(selected.length === filtered.length ? [] : filtered.map(s => s.id));

  const openWhatsApp = (phone, msg) => {
    if (!phone) return;
    const clean = phone.replace(/\D/g, '');
    const num = clean.startsWith('0') ? '2' + clean : clean.startsWith('20') ? clean : '20' + clean;
    window.open(`https://wa.me/${num}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const sendMessages = async () => {
    if (!message.trim()) return toast.error('أكتب الرسالة أولاً ✍️');
    if (selected.length === 0) return toast.error('اختر الطلاب المستهدفين 👥');

    setIsSending(true);
    setProgress(0);
    const targets = students.filter(s => selected.includes(s.id));

    for (let i = 0; i < targets.length; i++) {
      const student = targets[i];
      const personalMsg = message.replace(/{اسم الطالب}/g, student.name).replace(/{كود الطالب}/g, student.student_code || '');

      if (sendTo === 'students' || sendTo === 'both') {
        if (student.phone) openWhatsApp(student.phone, personalMsg);
      }
      
      if (sendTo === 'parents' || sendTo === 'both') {
        if (student.parent_phone) {
            const pMsg = sendTo === 'both' ? `رسالة لولي الأمر بخصوص ${student.name}:\n${personalMsg}` : personalMsg;
            openWhatsApp(student.parent_phone, pMsg);
        }
      }

      setProgress(Math.round(((i + 1) / targets.length) * 100));
      // تأخير 1 ثانية بين كل فتح نافذة عشان المتصفح والكمبيوتر ميهنجش
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    toast.success(`تم فتح ${targets.length} محادثة بنجاح ✅`);
    setIsSending(false);
  };

  return (
    <div className="animate-fade-in" dir="rtl">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 bg-emerald-500/20 rounded-2xl flex items-center justify-center text-emerald-500 text-2xl">
          <FaWhatsapp />
        </div>
        <div>
          <h1 className="text-3xl font-black text-white italic">مرسال واتساب 💬</h1>
          <p className="text-gray-400 text-sm">تواصل ذكي وسريع مع الطلاب وأولياء الأمور</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* عمود الرسالة والإعدادات */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass rounded-[2rem] p-8 border border-white/5 relative overflow-hidden">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2"><FiMessageCircle className="text-emerald-400"/> صياغة الرسالة</h2>
            
            {/* القوالب الجاهزة */}
            <div className="flex flex-wrap gap-2 mb-6">
              {templates.map((t, i) => (
                <button key={i} onClick={() => setMessage(t.text)}
                  className="text-[11px] font-bold py-2 px-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 text-emerald-400 hover:bg-emerald-500 hover:text-white transition-all">
                  {t.label}
                </button>
              ))}
            </div>

            <textarea 
              rows={6} 
              placeholder="اكتب رسالتك هنا... استخدم {اسم الطالب} لتخصيص الرسالة"
              value={message} 
              onChange={e => setMessage(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-5 text-white focus:border-emerald-500/50 focus:outline-none resize-none transition-all placeholder:text-gray-600"
            />

            <div className="flex items-center gap-4 mt-4">
               <span className="text-[10px] bg-white/5 px-3 py-1 rounded-full text-gray-500 font-bold border border-white/5 italic">{'اسم الطالب'} لتبديل الاسم</span>
               <span className="text-[10px] bg-white/5 px-3 py-1 rounded-full text-gray-500 font-bold border border-white/5 italic">{'كود الطالب'} لتبديل الكود</span>
            </div>

            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
                <div>
                   <label className="text-xs font-bold text-gray-500 block mb-3 uppercase tracking-widest mr-2 text-right">المستلم</label>
                   <div className="flex p-1.5 bg-black/20 rounded-2xl border border-white/5">
                        {['students', 'parents', 'both'].map((type) => (
                            <button key={type} onClick={() => setSendTo(type)}
                                className={`flex-1 py-2.5 rounded-xl text-xs font-black transition-all ${sendTo === type ? 'bg-emerald-500 text-white shadow-lg' : 'text-gray-500'}`}>
                                {type === 'students' ? 'طالب' : type === 'parents' ? 'ولي أمر' : 'الكل'}
                            </button>
                        ))}
                   </div>
                </div>

                <button 
                  onClick={sendMessages}
                  disabled={isSending}
                  className="gradient-emerald w-full py-4 rounded-2xl text-white font-black text-lg shadow-xl shadow-emerald-500/20 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                >
                  {isSending ? (
                    <><FiLoader className="animate-spin" /> جاري الإرسال {progress}%</>
                  ) : (
                    <><FiSend /> إرسال لـ {selected.length} مستلم</>
                  )}
                </button>
            </div>
          </div>
        </div>

        {/* عمود الاختيار */}
        <div className="space-y-6">
          <div className="glass rounded-[2rem] p-6 border border-white/5 flex flex-col h-[600px]">
             <div className="flex items-center justify-between mb-6">
                <h2 className="font-bold flex items-center gap-2"><FiUsers className="text-blue-400"/> القائمة</h2>
                <button onClick={selectAll} className="text-[10px] font-black uppercase text-blue-400 hover:underline">
                  {selected.length === filtered.length ? 'إلغاء' : 'تحديد الكل'}
                </button>
             </div>

             <div className="relative mb-4">
                <FiFilter className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <select 
                  value={stageFilter} 
                  onChange={e => setStageFilter(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pr-10 pl-4 text-xs text-white focus:outline-none appearance-none"
                >
                  {STAGES.map(s => <option key={s} value={s} className="bg-[#111116]">{s}</option>)}
                </select>
             </div>

             <div className="flex-1 overflow-y-auto space-y-2 custom-scrollbar">
                {filtered.map(student => (
                   <div key={student.id} 
                    onClick={() => toggleSelect(student.id)}
                    className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center gap-3 group ${selected.includes(student.id) ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-white/5 border-white/5 hover:border-white/20'}`}>
                        <div className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-all ${selected.includes(student.id) ? 'bg-emerald-500 border-emerald-500' : 'border-white/20'}`}>
                            {selected.includes(student.id) && <FiCheckSquare className="text-white text-xs"/>}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className={`text-xs font-bold truncate ${selected.includes(student.id) ? 'text-emerald-400' : 'text-gray-300'}`}>{student.name}</p>
                            <p className="text-[10px] text-gray-500 font-mono mt-0.5">{student.student_code}</p>
                        </div>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                           {student.phone && <div className="w-6 h-6 bg-emerald-500/20 text-emerald-500 rounded-lg flex items-center justify-center text-[10px]"><FiUser/></div>}
                           {student.parent_phone && <div className="w-6 h-6 bg-blue-500/20 text-blue-500 rounded-lg flex items-center justify-center text-[10px]"><FiHome/></div>}
                        </div>
                   </div>
                ))}
             </div>

             <div className="pt-4 mt-4 border-t border-white/5 text-center">
                <p className="text-[10px] font-bold text-gray-500 uppercase">مختار حالياً: <span className="text-white">{selected.length}</span></p>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
