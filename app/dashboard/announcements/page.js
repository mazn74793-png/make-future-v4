'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { FiUsers, FiPlayCircle, FiCheck, FiX, FiActivity, FiLogOut } from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function AdminDashboard() {
  const [pendingStudents, setPendingStudents] = useState([]);
  const [stats, setStats] = useState({ total: 0, pending: 0, courses: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    // 1. جلب الطلبات المعلقة
    const { data: pending } = await supabase
      .from('students')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: false });
    
    setPendingStudents(pending || []);

    // 2. جلب إحصائيات سريعة
    const { count: totalStudents } = await supabase.from('students').select('*', { count: 'exact', head: true });
    const { count: pendingCount } = await supabase.from('students').select('*', { count: 'exact', head: true }).eq('status', 'pending');
    const { count: coursesCount } = await supabase.from('courses').select('*', { count: 'exact', head: true });

    setStats({ total: totalStudents || 0, pending: pendingCount || 0, courses: coursesCount || 0 });
    setLoading(false);
  };

  const handleAction = async (id, newStatus) => {
    const { error } = await supabase
      .from('students')
      .update({ status: newStatus })
      .eq('id', id);

    if (error) {
      toast.error('حدث خطأ أثناء التحديث');
    } else {
      toast.success(newStatus === 'approved' ? 'تم قبول الطالب بنجاح ✅' : 'تم رفض الطلب');
      fetchData(); // تحديث البيانات
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#09090b]">
      <div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#09090b] text-white p-4 md:p-8" dir="rtl">
      {/* Header */}
      <div className="flex justify-between items-center mb-10">
        <div>
          <h1 className="text-3xl font-black">لوحة التحكم 🖥️</h1>
          <p className="text-gray-400 mt-1">أهلاً بك يا أدمن، إليك حالة المنصة اليوم</p>
        </div>
        <button 
          onClick={() => { supabase.auth.signOut(); window.location.href = '/login'; }}
          className="p-3 bg-red-500/10 text-red-500 rounded-2xl hover:bg-red-500 hover:text-white transition-all"
        >
          <FiLogOut size={24} />
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <StatCard icon={<FiUsers />} label="إجمالي الطلاب" value={stats.total} color="blue" />
        <StatCard icon={<FiActivity />} label="طلبات معلقة" value={stats.pending} color="yellow" />
        <StatCard icon={<FiPlayCircle />} label="الكورسات المرفوعة" value={stats.courses} color="purple" />
      </div>

      {/* Pending Students Table */}
      <div className="glass rounded-[2rem] border border-white/5 overflow-hidden">
        <div className="p-6 border-b border-white/5 flex justify-between items-center">
          <h2 className="text-xl font-bold">طلبات الانضمام الجديدة</h2>
          <span className="bg-purple-500/20 text-purple-400 px-4 py-1 rounded-full text-xs font-bold">
            {pendingStudents.length} طلب ينتظر مراجعتك
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-sm">
            <thead className="bg-white/5 text-gray-400 uppercase text-xs">
              <tr>
                <th className="px-6 py-4">الطالب</th>
                <th className="px-6 py-4">السنة الدراسية</th>
                <th className="px-6 py-4">المدرسة / الهاتف</th>
                <th className="px-6 py-4 text-center">الإجراء</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {pendingStudents.map((student) => (
                <tr key={student.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-6 py-4 font-bold">{student.name} <br/><span className="text-[10px] text-gray-500">{student.email}</span></td>
                  <td className="px-6 py-4 text-purple-400 font-medium">{student.stage}</td>
                  <td className="px-6 py-4">
                    <span className="text-gray-300">{student.school}</span> <br/>
                    <span className="text-xs text-gray-500">{student.phone}</span>
                  </td>
                  <td className="px-6 py-4 flex justify-center gap-2">
                    <button 
                      onClick={() => handleAction(student.id, 'approved')}
                      className="p-2 bg-emerald-500/20 text-emerald-500 rounded-xl hover:bg-emerald-500 hover:text-white transition-all"
                    >
                      <FiCheck size={18} />
                    </button>
                    <button 
                      onClick={() => handleAction(student.id, 'rejected')}
                      className="p-2 bg-red-500/20 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all"
                    >
                      <FiX size={18} />
                    </button>
                  </td>
                </tr>
              ))}
              {pendingStudents.length === 0 && (
                <tr>
                  <td colSpan="4" className="px-6 py-10 text-center text-gray-500 italic">لا توجد طلبات معلقة حالياً</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// مكون فرعي لبطاقات الإحصائيات
function StatCard({ icon, label, value, color }) {
  const colors = {
    blue: 'text-blue-400 bg-blue-500/10',
    yellow: 'text-yellow-400 bg-yellow-500/10',
    purple: 'text-purple-400 bg-purple-500/10',
  };
  return (
    <div className="glass p-6 rounded-[2rem] border border-white/5 flex items-center gap-5">
      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl ${colors[color]}`}>
        {icon}
      </div>
      <div>
        <p className="text-gray-400 text-sm font-medium">{label}</p>
        <p className="text-2xl font-black">{value}</p>
      </div>
    </div>
  );
}
