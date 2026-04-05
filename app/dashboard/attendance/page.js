'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { FiPlus, FiTrash2, FiEye, FiUsers, FiFilter, FiCalendar, FiMapPin, FiGlobe } from 'react-icons/fi';

export default function AttendancePage() {
  const [sessions, setSessions] = useState([]);
  const [students, setStudents] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [filterStage, setFilterStage] = useState('');
  const [loading, setLoading] = useState(true);
  
  const [form, setForm] = useState({ 
    title: '', type: 'center', subject: '', stage: '', 
    date: new Date().toISOString().split('T')[0], time: '', notes: '' 
  });

  const STAGES = [
    'الصف الأول الإعدادي', 'الصف الثاني الإعدادي', 'الصف الثالث الإعدادي',
    'الصف الأول الثانوي', 'الصف الثاني الثانوي', 'الصف الثالث الثانوي'
  ];

  const inpClass = "w-full py-3 px-4 rounded-2xl text-sm focus:outline-none transition-all duration-300 focus:ring-2 focus:ring-primary/50";
  const inpStyle = { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', color: 'white' };

  const loadData = async () => {
    setLoading(true);
    // جلب الحصص مع عدد الحضور لكل حصة
    const { data: sessData } = await supabase
      .from('sessions')
      .select('*, attendance(count)')
      .order('date', { ascending: false });
    
    setSessions(sessData || []);

    // جلب الطلاب المعتمدين لحساب النسب المئوية
    const { data: studData } = await supabase
      .from('students')
      .select('id, stage')
      .eq('status', 'approved');
      
    setStudents(studData || []);
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const handleCreate = async () => {
    if (!form.title || !form.date || !form.stage) { 
      toast.error('برجاء ملء البيانات الأساسية (العنوان، التاريخ، والصف)'); 
      return; 
    }
    
    const { error } = await supabase.from('sessions').insert(form);
    
    if (error) {
      toast.error('حدث خطأ أثناء الإنشاء');
    } else {
      toast.success('🎉 تم إنشاء الحصة بنجاح');
      setShowForm(false);
      setForm({ title: '', type: 'center', subject: '', stage: '', date: new Date().toISOString().split('T')[0], time: '', notes: '' });
      loadData();
    }
  };

  const handleDelete = async (id, count) => {
    if (count > 0) {
      if (!confirm(`تحذير: هذه الحصة تحتوي على ${count} طالب مسجلين حضور. هل أنت متأكد من حذفها نهائياً؟`)) return;
    } else {
      if (!confirm('هل تريد حذف هذه الحصة؟')) return;
    }
    
    await supabase.from('sessions').delete().eq('id', id);
    toast.success('تم الحذف بنجاح');
    loadData();
  };

  const getStageTotal = (stage) => students.filter(s => s.stage === stage).length;

  const filteredSessions = filterStage 
    ? sessions.filter(s => s.stage === filterStage)
    : sessions;

  return (
    <div className="min-h-screen p-2 md:p-6" dir="rtl">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
        <div>
          <h1 className="text-3xl font-black tracking-tight">إدارة الحصص والحضور 📅</h1>
          <p className="text-gray-500 text-sm mt-1 flex items-center gap-2">
             يوجد حالياً <span className="text-primary-light font-bold">{students.length} طالب</span> متاحين للتسجيل في مختلف المراحل.
          </p>
        </div>
        
        <div className="flex gap-3">
            <div className="relative group">
                <FiFilter className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <select 
                    value={filterStage} 
                    onChange={(e) => setFilterStage(e.target.value)}
                    className="pr-10 pl-4 py-2.5 glass rounded-xl text-xs font-bold focus:outline-none border-white/5"
                >
                    <option value="">كل المراحل</option>
                    {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
            </div>
            <button onClick={() => setShowForm(!showForm)}
                className={`px-6 py-2.5 rounded-xl font-black flex items-center gap-2 text-sm transition-all shadow-lg ${showForm ? 'bg-red-500/10 text-red-500' : 'gradient-primary text-white shadow-primary/20'}`}>
                {showForm ? <FiX /> : <FiPlus />} {showForm ? 'إلغاء' : 'إضافة حصة'}
            </button>
        </div>
      </div>

      {/* Create Session Form */}
      {showForm && (
        <div className="glass rounded-[2rem] p-8 mb-10 border-primary/20 animate-slide-down shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-primary/10 rounded-full -mr-10 -mt-10 blur-2xl" />
          <h2 className="text-xl font-black mb-6 flex items-center gap-2">
            <div className="w-2 h-6 gradient-primary rounded-full" />
            بيانات الحصة الجديدة
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="md:col-span-2">
                <label className="text-[10px] font-black text-gray-500 mr-2 uppercase tracking-widest">عنوان الحصة</label>
                <input className={inpClass} style={inpStyle} placeholder="مثال: مراجعة الباب الأول"
                  value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
            </div>
            <div>
                <label className="text-[10px] font-black text-gray-500 mr-2 uppercase tracking-widest">نوع الحصة</label>
                <select className={inpClass} style={{ ...inpStyle, cursor: 'pointer' }}
                  value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                  <option value="center">🏫 حضور بالسنتر</option>
                  <option value="online">💻 بث أونلاين</option>
                </select>
            </div>
            <div>
                <label className="text-[10px] font-black text-gray-500 mr-2 uppercase tracking-widest">التاريخ</label>
                <input className={inpClass} style={inpStyle} type="date"
                  value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
            </div>
            <div>
                <label className="text-[10px] font-black text-gray-500 mr-2 uppercase tracking-widest">الموعد</label>
                <input className={inpClass} style={inpStyle} type="time"
                  value={form.time} onChange={e => setForm({ ...form, time: e.target.value })} />
            </div>
            <div>
                <label className="text-[10px] font-black text-gray-500 mr-2 uppercase tracking-widest">الصف الدراسي</label>
                <select className={inpClass} style={{ ...inpStyle, cursor: 'pointer' }}
                  value={form.stage} onChange={e => setForm({ ...form, stage: e.target.value })}>
                  <option value="">اختر الصف الدراسي *</option>
                  {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
            </div>
          </div>
          <div className="mt-6 flex justify-end">
              <button onClick={handleCreate} className="gradient-primary px-10 py-4 rounded-2xl text-white font-black text-sm shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all">
                اعتماد وإنشاء الحصة
              </button>
          </div>
        </div>
      )}

      {/* Sessions Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filteredSessions.map((session, i) => {
          const isToday = new Date(session.date).toDateString() === new Date().toDateString();
          const attendanceCount = session.attendance?.[0]?.count || 0;
          const stageTotal = getStageTotal(session.stage);
          const attendancePercentage = stageTotal > 0 ? Math.round((attendanceCount / stageTotal) * 100) : 0;

          return (
            <div key={session.id} 
              className={`glass rounded-3xl p-5 border transition-all duration-500 flex flex-col sm:flex-row items-center gap-5 hover:border-primary/30 group animate-fade-in ${isToday ? 'border-primary/40 bg-primary/5' : 'border-white/5'}`}
              style={{ animationDelay: `${i * 0.05}s` }}
            >
              {/* Type Icon */}
              <div className={`w-16 h-16 rounded-[1.5rem] flex items-center justify-center text-2xl flex-shrink-0 shadow-inner transition-transform group-hover:scale-110 ${session.type === 'center' ? 'bg-indigo-500/10 text-indigo-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
                {session.type === 'center' ? <FiMapPin /> : <FiGlobe />}
              </div>

              {/* Info */}
              <div className="flex-1 text-center sm:text-right">
                <div className="flex flex-wrap justify-center sm:justify-start gap-2 mb-1">
                   {isToday && <span className="bg-primary text-[8px] font-black px-2 py-0.5 rounded-md uppercase animate-pulse">اليوم</span>}
                   <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{session.stage}</span>
                </div>
                <h3 className="font-black text-lg group-hover:text-primary-light transition-colors">{session.title}</h3>
                <div className="flex flex-wrap justify-center sm:justify-start gap-4 text-xs text-gray-500 mt-2">
                  <span className="flex items-center gap-1"><FiCalendar className="text-primary" /> {new Date(session.date).toLocaleDateString('ar-EG')}</span>
                  {session.time && <span className="flex items-center gap-1 font-mono">🕐 {session.time}</span>}
                </div>
              </div>

              {/* Attendance Progress */}
              <div className="flex flex-col items-center gap-3 w-full sm:w-auto px-4 border-r border-white/5">
                <div className="relative w-14 h-14 flex items-center justify-center">
                    <svg className="w-full h-full -rotate-90">
                        <circle cx="28" cy="28" r="24" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-white/5" />
                        <circle cx="28" cy="28" r="24" stroke="currentColor" strokeWidth="4" fill="transparent" 
                            strokeDasharray={150.8} strokeDashoffset={150.8 - (150.8 * attendancePercentage) / 100}
                            className="text-primary transition-all duration-1000" />
                    </svg>
                    <span className="absolute text-[10px] font-black">{attendancePercentage}%</span>
                </div>
                <div className="text-center">
                    <p className="text-sm font-black text-white">{attendanceCount} <span className="text-[10px] text-gray-500">طالب</span></p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex sm:flex-col gap-2">
                <Link href={`/dashboard/attendance/${session.id}`}
                  className="w-12 h-12 flex items-center justify-center rounded-2xl gradient-primary text-white shadow-lg shadow-primary/20 hover:scale-110 transition-all">
                  <FiEye size={20} />
                </Link>
                <button onClick={() => handleDelete(session.id, attendanceCount)}
                  className="w-12 h-12 flex items-center justify-center rounded-2xl bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all">
                  <FiTrash2 size={18} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {sessions.length === 0 && !loading && (
        <div className="glass rounded-[3rem] p-20 text-center border-dashed border-white/10 mt-10">
          <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
            <FiCalendar className="text-4xl text-gray-700" />
          </div>
          <h3 className="text-xl font-bold text-gray-400">لا توجد حصص مجدولة</h3>
          <p className="text-gray-600 text-sm mt-2">ابدأ بإضافة أول حصة للمنصة لبدء تسجيل الحضور.</p>
        </div>
      )}
    </div>
  );
}
