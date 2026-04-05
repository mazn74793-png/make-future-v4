'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useParams } from 'next/navigation';
import toast from 'react-hot-toast';
import { FiCheck, FiX, FiClock, FiSearch } from 'react-icons/fi';

export default function AttendanceDetailPage() {
  const { id } = useParams();
  const [session, setSession] = useState(null);
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [codeInput, setCodeInput] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const { data: sess } = await supabase.from('sessions').select('*').eq('id', id).single();
    setSession(sess);
    const query = supabase.from('students').select('*').eq('status', 'approved').order('name');
    if (sess?.stage) query.eq('stage', sess.stage);
    const { data: studs } = await query;
    setStudents(studs || []);
    const { data: att } = await supabase.from('attendance').select('*').eq('session_id', id);
    const attMap = {};
    (att || []).forEach(a => { attMap[a.student_id] = a.status; });
    setAttendance(attMap);
    setLoading(false);
  };

  useEffect(() => { load(); }, [id]);

  const markAttendance = async (studentId, status) => {
    const existing = attendance[studentId];
    if (existing) {
      await supabase.from('attendance').update({ status }).eq('session_id', id).eq('student_id', studentId);
    } else {
      await supabase.from('attendance').insert({ session_id: id, student_id: studentId, status });
    }
    setAttendance(prev => ({ ...prev, [studentId]: status }));
  };

  const handleCodeScan = async () => {
    if (!codeInput.trim()) return;
    const student = students.find(s => s.student_code?.toLowerCase() === codeInput.trim().toLowerCase());
    if (!student) {
      toast.error(`❌ مش لاقي طالب بكود "${codeInput}"`);
      setCodeInput('');
      return;
    }
    await markAttendance(student.id, 'present');
    toast.success(`✅ ${student.name} — حضر!`);
    setCodeInput('');
  };

  const presentCount = Object.values(attendance).filter(s => s === 'present').length;
  const absentCount = students.length - Object.keys(attendance).length;

  const filtered = students.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.student_code?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div dir="rtl">
      <div className="flex items-center gap-3 mb-6">
        <a href="/dashboard/attendance" className="p-2 rounded-xl bg-white/5 hover:bg-white/10 transition text-white">←</a>
        <div>
          <h1 className="text-xl font-black">{session?.title}</h1>
          <p className="text-gray-400 text-sm">
            {new Date(session?.date).toLocaleDateString('ar-EG')}
            {session?.stage && ` • ${session.stage}`}
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: 'حضر', value: presentCount, color: '#34d399', bg: 'rgba(52,211,153,0.1)' },
          { label: 'غائب', value: absentCount, color: '#f87171', bg: 'rgba(248,113,113,0.1)' },
          { label: 'متأخر', value: Object.values(attendance).filter(s => s === 'late').length, color: '#fbbf24', bg: 'rgba(251,191,36,0.1)' },
        ].map((s, i) => (
          <div key={i} className="glass rounded-xl p-4 text-center" style={{ borderColor: s.color + '30' }}>
            <p className="text-2xl font-black" style={{ color: s.color }}>{s.value}</p>
            <p className="text-xs text-gray-400 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* كود الطالب — التسجيل السريع */}
      <div className="glass rounded-2xl p-4 mb-6">
        <p className="font-bold mb-3 flex items-center gap-2">
          ⚡ تسجيل سريع بالكود
        </p>
        <div className="flex gap-2">
          <input type="text"
            placeholder="اكتب كود الطالب (مثال: ST1234)"
            value={codeInput}
            onChange={e => setCodeInput(e.target.value.toUpperCase())}
            onKeyDown={e => e.key === 'Enter' && handleCodeScan()}
            className="flex-1 py-3 px-4 rounded-xl text-sm focus:outline-none font-mono text-lg tracking-widest text-center"
            style={{ background: 'rgba(255,255,255,0.05)', border: '2px solid rgba(99,102,241,0.4)', color: 'white' }}
            autoFocus
          />
          <button onClick={handleCodeScan}
            className="px-6 py-3 rounded-xl text-white font-bold text-sm"
            style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
            تسجيل ✓
          </button>
        </div>
        <p className="text-gray-500 text-xs mt-2">اضغط Enter أو زرار التسجيل</p>
      </div>

      {/* البحث */}
      <div className="relative mb-4">
        <FiSearch className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input type="text" placeholder="ابحث باسم الطالب أو كوده..."
          value={search} onChange={e => setSearch(e.target.value)}
          className="w-full py-2.5 pr-10 pl-4 rounded-xl text-sm focus:outline-none"
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }} />
      </div>

      {/* قائمة الطلاب */}
      <div className="space-y-2">
        {filtered.map(student => {
          const status = attendance[student.id];
          return (
            <div key={student.id}
              className="rounded-xl p-3 flex items-center justify-between gap-3"
              style={{
                background: status === 'present' ? 'rgba(52,211,153,0.08)' :
                            status === 'late' ? 'rgba(251,191,36,0.08)' :
                            'rgba(255,255,255,0.03)',
                border: `1px solid ${status === 'present' ? 'rgba(52,211,153,0.2)' : status === 'late' ? 'rgba(251,191,36,0.2)' : 'rgba(255,255,255,0.06)'}`,
              }}>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-white text-sm flex-shrink-0"
                  style={{ background: 'linear-gradient(135deg, #6366f1, #f472b6)' }}>
                  {student.name?.[0]}
                </div>
                <div>
                  <p className="font-bold text-sm">{student.name}</p>
                  <p className="text-xs font-mono" style={{ color: '#818cf8' }}>{student.student_code}</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <button onClick={() => markAttendance(student.id, 'present')}
                  className="w-9 h-9 rounded-xl flex items-center justify-center transition"
                  style={{ background: status === 'present' ? '#34d399' : 'rgba(52,211,153,0.1)', color: status === 'present' ? 'white' : '#34d399' }}
                  title="حضر">
                  <FiCheck size={16} />
                </button>
                <button onClick={() => markAttendance(student.id, 'late')}
                  className="w-9 h-9 rounded-xl flex items-center justify-center transition"
                  style={{ background: status === 'late' ? '#fbbf24' : 'rgba(251,191,36,0.1)', color: status === 'late' ? 'white' : '#fbbf24' }}
                  title="متأخر">
                  <FiClock size={16} />
                </button>
                <button onClick={() => markAttendance(student.id, 'absent')}
                  className="w-9 h-9 rounded-xl flex items-center justify-center transition"
                  style={{ background: status === 'absent' ? '#f87171' : 'rgba(248,113,113,0.1)', color: status === 'absent' ? 'white' : '#f87171' }}
                  title="غائب">
                  <FiX size={16} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
