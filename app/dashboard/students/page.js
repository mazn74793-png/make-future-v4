'use client';
import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';
import { 
  FiPlus, FiTrash2, FiUserCheck, FiUserX, FiKey, 
  FiSearch, FiFilter, FiMail, FiPhone, FiBook, 
  FiDownload, FiExternalLink, FiShield, FiAlertCircle 
} from 'react-icons/fi';

const STAGES = ['الصف الأول الإعدادي','الصف الثاني الإعدادي','الصف الثالث الإعدادي','الصف الأول الثانوي','الصف الثاني الثانوي','الصف الثالث الثانوي'];

export default function StudentsPage() {
  const [students, setStudents] = useState([]);
  const [pending, setPending] = useState([]);
  const [accessRequests, setAccessRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [stageFilter, setStageFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // all, active, blocked
  
  const [showForm, setShowForm] = useState(false);
  const [changingPassword, setChangingPassword] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [form, setForm] = useState({ name:'', email:'', phone:'', parent_phone:'', stage:'', school:'' });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [
        { data: approved },
        { data: pendingData },
        { data: accessReqs },
      ] = await Promise.all([
        supabase.from('students').select('*').eq('status','approved').order('created_at',{ ascending:false }),
        supabase.from('students').select('*').eq('status','pending').order('created_at',{ ascending:false }),
        supabase.from('access_requests').select('*, students(name,email), courses(title)').eq('status','pending').order('created_at',{ ascending:false }),
      ]);
      setStudents(approved || []);
      setPending(pendingData || []);
      setAccessRequests(accessReqs || []);
    } catch (err) {
      toast.error('فشل تحميل البيانات');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleAdd = async () => {
    if (!form.name || !form.email) return toast.error('الاسم والايميل مطلوبين');
    
    // توليد كود طالب تلقائي بسيط إذا لم يوجد
    const studentCode = `STU-${Math.floor(1000 + Math.random() * 9000)}`;

    const { error } = await supabase.from('students').insert({ 
      ...form, 
      student_code: studentCode,
      status:'approved', 
      profile_complete:true,
      is_active: true
    });

    if (error) toast.error(error.message);
    else {
      toast.success(`✅ تمت إضافة الطالب بكود: ${studentCode}`);
      setShowForm(false);
      setForm({ name:'', email:'', phone:'', parent_phone:'', stage:'', school:'' });
      loadData();
    }
  };

  const updateStatus = async (id, status) => {
    const { error } = await supabase.from('students').update({ status }).eq('id', id);
    if (error) return toast.error('حدث خطأ');

    if (status === 'approved') {
      toast.success('✅ تم قبول الطالب بنجاح');
    } else {
      toast.error('❌ تم رفض الطلب');
    }
    loadData();
  };

  const handleAccessRequest = async (id, status) => {
    const { error } = await supabase.from('access_requests').update({ status }).eq('id', id);
    if (!error) {
      toast.success(status === 'approved' ? '🚀 تم تفعيل الكورس' : '❌ تم الرفض');
      loadData();
    }
  };

  // تصدير للـ Excel (بسيط)
  const exportData = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + "الاسم,الايميل,المرحلة,الكود,المدرسة\n"
      + filteredStudents.map(s => `${s.name},${s.email},${s.stage},${s.student_code},${s.school}`).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `طلاب_المنصة_${new Date().toLocaleDateString()}.csv`);
    document.body.appendChild(link);
    link.click();
  };

  const filteredStudents = students.filter(s => {
    const matchSearch = s.name.toLowerCase().includes(search.toLowerCase()) || 
                       (s.student_code && s.student_code.includes(search));
    const matchStage = stageFilter === '' || s.stage === stageFilter;
    const matchStatus = statusFilter === 'all' || 
                       (statusFilter === 'active' && s.is_active) || 
                       (statusFilter === 'blocked' && !s.is_active);
    return matchSearch && matchStage && matchStatus;
  });

  return (
    <div dir="rtl" className="max-w-7xl mx-auto px-4 pb-20 pt-4">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-10">
        <div>
          <h1 className="text-4xl font-black text-white tracking-tight">إدارة <span className="text-purple-500">الطلاب</span></h1>
          <p className="text-gray-500 font-medium mt-1">لديك حالياً {students.length} طالب مقبول في المنصة</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={exportData} className="p-3.5 bg-white/5 border border-white/10 rounded-2xl text-gray-400 hover:text-white transition-all shadow-xl" title="تصدير بيانات الطلاب">
            <FiDownload size={20} />
          </button>
          <button onClick={() => setShowForm(!showForm)}
            className={`flex items-center gap-2 px-8 py-3.5 rounded-2xl font-black transition-all shadow-2xl ${showForm ? 'bg-red-500/10 text-red-500 border border-red-500/20' : 'gradient-primary text-white hover:scale-105'}`}>
            {showForm ? 'إلغاء' : <><FiPlus /> إضافة طالب</>}
          </button>
        </div>
      </div>

      {/* Quick Action Badges (طلبات معلقة) */}
      {(accessRequests.length > 0 || pending.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10 animate-slide-down">
          {/* طلبات الكورسات */}
          {accessRequests.length > 0 && (
            <div className="bg-indigo-600/10 border border-indigo-500/20 rounded-[2rem] p-6 relative overflow-hidden group">
               <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform"><FiShield size={80}/></div>
               <h2 className="text-indigo-400 font-black mb-4 flex items-center gap-2">🛒 طلبات تفعيل كورسات ({accessRequests.length})</h2>
               <div className="space-y-3 max-h-[200px] overflow-y-auto custom-scrollbar pr-2">
                 {accessRequests.map(req => (
                   <div key={req.id} className="bg-black/20 p-3 rounded-xl flex items-center justify-between border border-white/5">
                      <div className="text-xs">
                        <p className="font-bold text-white">{req.students?.name}</p>
                        <p className="text-gray-500 mt-0.5">{req.courses?.title}</p>
                      </div>
                      <div className="flex gap-1.5">
                        <button onClick={() => handleAccessRequest(req.id,'approved')} className="p-2 bg-emerald-500/20 text-emerald-500 rounded-lg hover:bg-emerald-500 hover:text-white transition-all"><FiUserCheck size={14}/></button>
                        <button onClick={() => handleAccessRequest(req.id,'rejected')} className="p-2 bg-red-500/20 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-all"><FiUserX size={14}/></button>
                      </div>
                   </div>
                 ))}
               </div>
            </div>
          )}
          {/* طلبات التسجيل */}
          {pending.length > 0 && (
            <div className="bg-amber-600/10 border border-amber-500/20 rounded-[2rem] p-6 relative overflow-hidden group">
               <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform"><FiAlertCircle size={80}/></div>
               <h2 className="text-amber-500 font-black mb-4 flex items-center gap-2">⏳ طلبات انضمام جديدة ({pending.length})</h2>
               <div className="space-y-3 max-h-[200px] overflow-y-auto custom-scrollbar pr-2">
                 {pending.map(s => (
                   <div key={s.id} className="bg-black/20 p-3 rounded-xl flex items-center justify-between border border-white/5">
                      <div className="text-xs">
                        <p className="font-bold text-white">{s.name}</p>
                        <p className="text-gray-500 mt-0.5">{s.stage}</p>
                      </div>
                      <div className="flex gap-1.5">
                        <button onClick={() => updateStatus(s.id,'approved')} className="p-2 bg-amber-500 text-black rounded-lg hover:bg-amber-600 transition-all font-black text-[10px]">قـبـول</button>
                        <button onClick={() => updateStatus(s.id,'rejected')} className="p-2 bg-red-500/20 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-all"><FiTrash2 size={14}/></button>
                      </div>
                   </div>
                 ))}
               </div>
            </div>
          )}
        </div>
      )}

      {/* Main List & Filters */}
      <div className="glass rounded-[2.5rem] p-8 border-white/5 shadow-2xl">
        {/* Filters Row */}
        <div className="flex flex-col md:flex-row gap-4 mb-10">
          <div className="relative flex-1 group">
            <FiSearch className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-purple-500 transition-colors" />
            <input type="text" placeholder="ابحث بالاسم، الكود، أو الإيميل..." value={search} onChange={e => setSearch(e.target.value)}
              className="w-full bg-white/[0.03] border border-white/10 rounded-2xl py-4 pr-12 pl-4 focus:border-purple-500/50 focus:outline-none transition-all font-bold" />
          </div>
          
          <select value={stageFilter} onChange={e => setStageFilter(e.target.value)}
            className="bg-white/[0.03] border border-white/10 rounded-2xl px-6 py-4 text-sm font-bold focus:outline-none focus:border-purple-500/50 appearance-none min-w-[180px]">
            <option value="" className="bg-gray-900">كل المراحل</option>
            {STAGES.map(s => <option key={s} value={s} className="bg-gray-900">{s}</option>)}
          </select>

          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            className="bg-white/[0.03] border border-white/10 rounded-2xl px-6 py-4 text-sm font-bold focus:outline-none focus:border-purple-500/50 appearance-none min-w-[150px]">
            <option value="all" className="bg-gray-900">كل الحالات</option>
            <option value="active" className="bg-gray-900 text-emerald-500">نشط فقط</option>
            <option value="blocked" className="bg-gray-900 text-red-500">محظور فقط</option>
          </select>
        </div>

        {/* List View */}
        <div className="space-y-4">
          {filteredStudents.map((s, i) => (
            <div key={s.id} className={`group flex flex-col md:flex-row md:items-center gap-6 p-6 rounded-[2rem] border transition-all duration-300 ${s.is_active ? 'bg-white/[0.02] border-white/5 hover:border-purple-500/30' : 'bg-red-500/[0.03] border-red-500/10 grayscale opacity-60 hover:grayscale-0 hover:opacity-100'}`}>
              
              <div className="flex items-center gap-5 flex-1">
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center font-black text-2xl shadow-inner shrink-0 ${s.is_active ? 'bg-gradient-to-br from-purple-500/20 to-indigo-500/20 text-purple-400' : 'bg-gray-800 text-gray-500'}`}>
                  {s.name?.[0]}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-3 mb-1.5">
                    <h3 className="font-black text-lg text-white group-hover:text-purple-400 transition-colors truncate">{s.name}</h3>
                    <span className="bg-white/5 text-gray-500 text-[10px] font-mono px-2 py-0.5 rounded-md border border-white/5 uppercase tracking-tighter group-hover:border-purple-500/20 group-hover:text-purple-500">#{s.student_code}</span>
                  </div>
                  <div className="flex flex-wrap gap-x-6 gap-y-2">
                    <span className="flex items-center gap-2 text-xs font-bold text-gray-500"><FiMail className="text-purple-500/50"/> {s.email}</span>
                    <span className="flex items-center gap-2 text-xs font-bold text-gray-500"><FiPhone className="text-emerald-500/50"/> {s.phone}</span>
                    <span className="flex items-center gap-2 text-xs font-bold text-gray-500"><FiBook className="text-blue-500/50"/> {s.stage}</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3 border-t md:border-t-0 border-white/5 pt-4 md:pt-0">
                 <button onClick={() => setChangingPassword(s.id)} 
                   className="p-3 rounded-xl bg-white/5 text-gray-400 hover:bg-indigo-500 hover:text-white transition-all" title="تغيير كلمة المرور">
                   <FiKey size={18} />
                 </button>
                 <button onClick={() => {
                   supabase.from('students').update({ is_active: !s.is_active }).eq('id', s.id).then(() => loadData());
                   toast.success(s.is_active ? 'تم إيقاف الحساب' : 'تم تفعيل الحساب');
                 }} 
                   className={`p-3 rounded-xl transition-all ${s.is_active ? 'bg-orange-500/10 text-orange-500 hover:bg-orange-500 hover:text-white' : 'bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white'}`}>
                   {s.is_active ? <FiUserX size={18} /> : <FiUserCheck size={18} />}
                 </button>
                 <button onClick={() => {
                   if(confirm('سيتم حذف الطالب وكافة بياناته ودرجاته نهائياً.. هل أنت متأكد؟')) {
                     supabase.from('students').delete().eq('id', s.id).then(() => loadData());
                   }
                 }} 
                   className="p-3 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all">
                   <FiTrash2 size={18} />
                 </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
