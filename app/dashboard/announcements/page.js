'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { FiUsers, FiPlayCircle, FiCheck, FiX, FiActivity, FiLogOut, FiSearch, FiPhone } from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function AdminDashboard() {
  const [pendingStudents, setPendingStudents] = useState([]);
  const [allStudents, setAllStudents] = useState([]); // لحفظ كل الطلاب للبحث
  const [searchTerm, setSearchTerm] = useState('');
  const [stats, setStats] = useState({ total: 0, pending: 0, courses: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. جلب الطلبات المعلقة
      const { data: pending } = await supabase
        .from('students')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });
      
      setPendingStudents(pending || []);

      // 2. إحصائيات سريعة (بـ Query واحدة لتحسين الأداء)
      const { count: total } = await supabase.from('students').select('*', { count: 'exact', head: true });
      const { count: courses } = await supabase.from('courses').select('*', { count: 'exact', head: true });
      
      setStats({ 
        total: total || 0, 
        pending: pending?.length || 0, 
        courses: courses || 0 
      });
    } catch (error) {
      toast.error('فشل في جلب البيانات');
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (id, name, newStatus) => {
    // تأكيد قبل الرفض مثلاً
    if (newStatus === 'rejected' && !confirm(`هل أنت متأكد من رفض طلب ${name}؟`)) return;

    const { error } = await supabase
      .from('students')
      .update({ status: newStatus })
      .eq('id', id);

    if (error) {
      toast.error('حدث خطأ أثناء التحديث');
    } else {
      toast.success(newStatus === 'approved' ? `تم قبول ${name} 🎉` : 'تم الرفض');
      fetchData(); 
    }
  };

  // تصفية الطلاب بناءً على البحث
  const filteredStudents = pendingStudents.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.phone.includes(searchTerm)
  );

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#09090b]">
       <div className="relative">
          <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold">MR</div>
       </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#060608] text-white p-4 md:p-10 lg:px-20" dir="rtl">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
        <div>
          <h1 className="text-4xl font-black tracking-tighter">لوحة التحكم <span className="text-primary-light">الرئيسية</span></h1>
          <p className="text-gray-500 font-medium mt-2">إدارة الطلاب، الكورسات، والطلبات المعلقة.</p>
        </div>
        <div className="flex gap-3">
             <button onClick={fetchData} className="px-5 py-3 glass rounded-2xl text-sm font-bold hover:bg-white/10 transition-all">تحديث البيانات</button>
             <button 
              onClick={() => { supabase.auth.signOut(); window.location.href = '/login'; }}
              className="p-4 bg-red-500/10 text-red-500 rounded-2xl hover:bg-red-500 hover:text-white transition-all shadow-lg shadow-red-500/5"
            >
              <FiLogOut size={20} />
            </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
        <StatCard icon={<FiUsers />} label="إجمالي المنضمين" value={stats.total} color="blue" />
        <StatCard icon={<FiActivity />} label="طلبات قيد الانتظار" value={stats.pending} color="yellow" />
        <StatCard icon={<FiPlayCircle />} label="المحتوى التعليمي" value={`${stats.courses} كورس`} color="purple" />
      </div>

      {/* Main Content Area */}
      <div className="glass rounded-[2.5rem] border border-white/5 shadow-2xl overflow-hidden">
        {/* Table Header & Search */}
        <div className="p-8 border-b border-white/5 flex flex-col lg:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-4">
              <div className="w-3 h-8 gradient-primary rounded-full" />
              <h2 className="text-2xl font-black">طلبات الانضمام</h2>
          </div>
          
          <div className="relative w-full lg:w-96 group">
            <FiSearch className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-primary transition-colors" />
            <input 
              type="text" 
              placeholder="ابحث باسم الطالب أو رقم الهاتف..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 pr-12 pl-4 text-sm focus:border-primary/50 focus:outline-none transition-all"
            />
          </div>
        </div>

        {/* Desktop Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead>
              <tr className="bg-white/[0.02] text-gray-500 text-xs font-black uppercase tracking-widest">
                <th className="px-8 py-5">بيانات الطالب</th>
                <th className="px-8 py-5">المرحلة الدراسية</th>
                <th className="px-8 py-5">المدرسة والتواصل</th>
                <th className="px-8 py-5 text-center">التحكم</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredStudents.map((student) => (
                <tr key={student.id} className="hover:bg-white/[0.01] transition-all group">
                  <td className="px-8 py-6">
                    <div className="font-black text-white group-hover:text-primary-light transition-colors">{student.name}</div>
                    <div className="text-xs text-gray-500 mt-1 font-medium">{student.email}</div>
                  </td>
                  <td className="px-8 py-6">
                    <span className="bg-purple-500/10 text-purple-400 px-3 py-1 rounded-lg text-xs font-bold border border-purple-500/10">
                      {student.stage}
                    </span>
                  </td>
                  <td className="px-8 py-6">
                    <div className="text-sm font-bold text-gray-300">{student.school}</div>
                    <a href={`https://wa.me/2${student.phone}`} target="_blank" className="text-xs text-gray-500 hover:text-green-400 flex items-center gap-1 mt-1 transition-colors">
                      <FiPhone size={10} /> {student.phone}
                    </a>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex justify-center gap-3">
                      <button 
                        onClick={() => handleAction(student.id, student.name, 'approved')}
                        className="w-10 h-10 flex items-center justify-center bg-emerald-500/10 text-emerald-500 rounded-xl hover:bg-emerald-500 hover:text-white transition-all shadow-lg shadow-emerald-500/5"
                        title="قبول الطالب"
                      >
                        <FiCheck size={20} />
                      </button>
                      <button 
                        onClick={() => handleAction(student.id, student.name, 'rejected')}
                        className="w-10 h-10 flex items-center justify-center bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all shadow-lg shadow-red-500/5"
                        title="رفض الطلب"
                      >
                        <FiX size={20} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {filteredStudents.length === 0 && (
            <div className="py-20 text-center">
              <div className="text-gray-600 mb-2 font-bold text-lg">لا توجد نتائج بحث تطابق مدخلاتك</div>
              <p className="text-gray-700 text-sm italic">تأكد من كتابة الاسم بشكل صحيح</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, color }) {
  const colors = {
    blue: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
    yellow: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
    purple: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
  };
  return (
    <div className={`glass p-8 rounded-[2.5rem] border ${colors[color]} flex items-center gap-6 transition-transform hover:-translate-y-1`}>
      <div className={`w-16 h-16 rounded-[1.5rem] flex items-center justify-center text-3xl shadow-inner ${colors[color]}`}>
        {icon}
      </div>
      <div>
        <p className="text-gray-500 text-xs font-black uppercase tracking-widest mb-1">{label}</p>
        <p className="text-3xl font-black text-white">{value}</p>
      </div>
    </div>
  );
}
