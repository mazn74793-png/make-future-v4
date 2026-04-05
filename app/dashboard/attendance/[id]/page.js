'use client';
import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useParams, useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { FiCheck, FiX, FiClock, FiSearch, FiArrowRight, FiUserCheck } from 'react-icons/fi';

export default function AttendanceDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const inputRef = useRef(null); // عشان نرجع الفوكوس للانبوت تلقائياً
  
  const [session, setSession] = useState(null);
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [codeInput, setCodeInput] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      // جلب بيانات الحصة
      const { data: sess } = await supabase.from('sessions').select('*').eq('id', id).single();
      setSession(sess);

      // جلب الطلاب المعتمدين في نفس مرحلة الحصة
      const query = supabase.from('students').select('*').eq('status', 'approved').order('name');
      if (sess?.stage) query.eq('stage', sess.stage);
      const { data: studs } = await query;
      setStudents(studs || []);

      // جلب سجل الحضور الحالي
      const { data: att } = await supabase.from('attendance').select('*').eq('session_id', id);
      const attMap = {};
      (att || []).forEach(a => { attMap[a.student_id] = a.status; });
      setAttendance(attMap);
    } catch (error) {
      toast.error('خطأ في تحميل البيانات');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, [id]);

  // دالة تسجيل الحضور (تحسين باستخدام upsert)
  const markAttendance = async (studentId, status) => {
    const { error } = await supabase.from('attendance').upsert({
      session_id: id,
      student_id: studentId,
      status: status,
      updated_at: new Date()
    }, { onConflict: 'session_id, student_id' }); // تأكد أن الجدول فيه unique constraint على العمودين دول

    if (error) {
      toast.error('فشل في حفظ الحالة');
      return;
    }
    setAttendance(prev => ({ ...prev, [studentId]: status }));
  };

  const handleCodeScan = async () => {
    const code = codeInput.trim().toUpperCase();
    if (!code) return;

    const student = students.find(s => s.student_code?.toUpperCase() === code);
    
    if (!student) {
      new Audio('/sounds/error.mp3').play().catch(() => {}); // اختياري: صوت خطأ
      toast.error(`❌ الكود ${code} غير مسجل`);
      setCodeInput('');
      return;
    }

    // لو الطالب متسجل حضور فعلاً، نبه الأدمن
    if (attendance[student.id] === 'present') {
      toast.error('هذا الطالب مسجل حضور بالفعل! ⚠️');
      setCodeInput('');
      return;
    }

    await markAttendance(student.id, 'present');
    new Audio('/sounds/success.mp3').play().catch(() => {}); // اختياري: صوت نجاح
    toast.success(`✅ تم تحضير: ${student.name}`, { icon: '🎓' });
    setCodeInput('');
    inputRef.current?.focus(); // إرجاع الفوكوس فوراً للـ Scanner
  };

  // إحصائيات سريعة
  const stats = {
    present: Object.values(attendance).filter(s => s === 'present').length,
    late: Object.values(attendance).filter(s => s === 'late').length,
    absent: students.length - Object.values(attendance).filter(s => s === 'present' || s === 'late').length,
  };

  const filtered = students.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.student_code?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center site-bg">
      <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
      <p className="text-gray-500 font-bold animate-pulse">جاري تجهيز كشف الحضور...</p>
    </div>
  );

  return (
    <div className="min-h-screen site-bg text-white p-4 md:p-8" dir="rtl">
      {/* Top Header */}
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button onClick={() => router.back()} className="w-10 h-10 rounded-2xl glass flex items-center justify-center hover:bg-white/10 transition">
              <FiArrowRight />
            </button>
            <div>
              <h1 className="text-2xl font-black">{session?.title}</h1>
              <p className="text-primary-light text-sm font-bold flex items-center gap-2">
                <FiUserCheck /> {session?.stage} • {new Date(session?.date).toLocaleDateString('ar-EG')}
              </p>
            </div>
          </div>
          <div className="hidden md:block glass px-5 py-2 rounded-2xl border-emerald-500/20 text-emerald-400 font-bold text-sm">
             قائمة الحضور النشطة 🟢
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <StatMini label="حاضر" value={stats.present} color="emerald" />
          <StatMini label="متأخر" value={stats.late} color="amber" />
          <StatMini label="غائب" value={stats.absent} color="red" />
        </div>

        {/* Scanner Section */}
        <div className="glass rounded-[2rem] p-6 mb-8 border-primary/30 shadow-2xl shadow-primary/5 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full gradient-primary" />
          <label className="block text-sm font-black text-gray-400 mb-3 px-2 uppercase tracking-widest">
            ⚡ نظام التسجيل السريع (Scanner)
          </label>
          <div className="flex gap-3">
            <input 
              ref={inputRef}
              type="text"
              placeholder="مرر الكود أو اكتبه هنا..."
              value={codeInput}
              onChange={e => setCodeInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleCodeScan()}
              className="flex-1 bg-white/5 border-2 border-white/10 rounded-[1.2rem] py-4 px-6 text-2xl font-mono text-center tracking-[0.3em] focus:border-primary/50 focus:outline-none transition-all"
              autoFocus
            />
            <button onClick={handleCodeScan} className="gradient-primary px-8 rounded-[1.2rem] font-black hover:scale-105 active:scale-95 transition-all">
              تسجيل
            </button>
          </div>
        </div>

        {/* Search & List */}
        <div className="glass rounded-[2rem] border-white/5 overflow-hidden">
          <div className="p-6 border-b border-white/5 bg-white/5">
            <div className="relative">
              <FiSearch className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500" />
              <input 
                type="text" 
                placeholder="ابحث بالاسم أو الكود لتعديل الحالة يدوياً..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full bg-[#09090b] border border-white/10 rounded-xl py-3 pr-12 pl-4 text-sm focus:border-primary/40 focus:outline-none transition-all"
              />
            </div>
          </div>

          <div className="divide-y divide-white/5">
            {filtered.map(student => {
              const status = attendance[student.id];
              return (
                <div key={student.id} className="p-4 flex items-center justify-between hover:bg-white/[0.02] transition-colors group">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black transition-all ${status === 'present' ? 'gradient-primary' : 'bg-white/5 text-gray-600 group-hover:bg-white/10'}`}>
                      {student.name?.[0]}
                    </div>
                    <div>
                      <p className="font-bold text-sm">{student.name}</p>
                      <p className="text-[10px] font-mono text-gray-500 group-hover:text-primary-light transition-colors">{student.student_code}</p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <StatusBtn active={status === 'present'} color="emerald" icon={<FiCheck />} onClick={() => markAttendance(student.id, 'present')} />
                    <StatusBtn active={status === 'late'} color="amber" icon={<FiClock />} onClick={() => markAttendance(student.id, 'late')} />
                    <StatusBtn active={status === 'absent'} color="red" icon={<FiX />} onClick={() => markAttendance(student.id, 'absent')} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// مكونات صغيرة لتحسين الكود
function StatMini({ label, value, color }) {
  const colors = {
    emerald: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    amber: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    red: 'text-red-400 bg-red-500/10 border-red-500/20',
  };
  return (
    <div className={`glass rounded-2xl p-4 text-center border ${colors[color]}`}>
      <p className="text-2xl font-black leading-none mb-1">{value}</p>
      <p className="text-[10px] font-bold uppercase tracking-widest opacity-60">{label}</p>
    </div>
  );
}

function StatusBtn({ active, color, icon, onClick }) {
  const colors = {
    emerald: active ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20',
    amber: active ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/20' : 'bg-amber-500/10 text-amber-500 hover:bg-amber-500/20',
    red: active ? 'bg-red-500 text-white shadow-lg shadow-red-500/20' : 'bg-red-500/10 text-red-500 hover:bg-red-500/20',
  };
  return (
    <button onClick={onClick} className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${colors[color]}`}>
      {icon}
    </button>
  );
}
