'use client';
import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';
import { FiPlus, FiTrash2, FiUserCheck, FiUserX, FiKey, FiSearch, FiFilter, FiMail, FiPhone, FiBook } from 'react-icons/fi';

const STAGES = ['الصف الأول الإعدادي','الصف الثاني الإعدادي','الصف الثالث الإعدادي','الصف الأول الثانوي','الصف الثاني الثانوي','الصف الثالث الثانوي'];

export default function StudentsPage() {
  const [students, setStudents] = useState([]);
  const [pending, setPending] = useState([]);
  const [accessRequests, setAccessRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [stageFilter, setStageFilter] = useState('');
  
  const [showForm, setShowForm] = useState(false);
  const [approvingAll, setApprovingAll] = useState(false);
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
    const { error } = await supabase.from('students').insert({ ...form, status:'approved', profile_complete:true });
    if (error) toast.error(error.message);
    else {
      toast.success('✅ تمت إضافة الطالب بنجاح');
      setShowForm(false);
      setForm({ name:'', email:'', phone:'', parent_phone:'', stage:'', school:'' });
      loadData();
    }
  };

  const updateStatus = async (id, status) => {
    const { error } = await supabase.from('students').update({ status }).eq('id', id);
    if (error) return toast.error('حدث خطأ');

    if (status === 'approved') {
      const student = pending.find(s => s.id === id);
      if (student?.parent_phone) {
        await supabase.from('whatsapp_notifications').insert({
          student_id: id,
          type: 'enrollment',
          phone: student.parent_phone,
          message: `ولي أمر الطالب ${student.name}، تم قبول نجلكم في المنصة بنجاح ✅. الكود: ${student.student_code || 'سيصلكم قريباً'}`,
        });
      }
      toast.success('✅ تم قبول الطالب');
    } else {
      toast.error('❌ تم رفض الطلب');
    }
    loadData();
  };

  const handleAccessRequest = async (id, status) => {
    await supabase.from('access_requests').update({ status }).eq('id', id);
    toast.success(status === 'approved' ? '✅ تم تفعيل الكورس للطالب' : '❌ تم الرفض');
    loadData();
  };

  const handleChangePassword = async (studentId, email) => {
    if (!newPassword || newPassword.length < 6) return toast.error('الباسورد ضعيف (6+ أحرف)');
    const res = await fetch('/api/change-password', {
      method: 'POST',
      headers: { 'Content-Type':'application/json' },
      body: JSON.stringify({ studentId, email, newPassword }),
    });
    const data = await res.json();
    if (data.success) {
      toast.success('✅ تم تحديث الباسورد');
      setChangingPassword(null);
      setNewPassword('');
    } else toast.error(data.error || 'فشلت العملية');
  };

  const toggleActive = async (id, current) => {
    await supabase.from('students').update({ is_active:!current }).eq('id', id);
    toast.success(current ? 'تم تعطيل الحساب' : '✅ تم تفعيل الحساب');
    loadData();
  };

  const filteredStudents = students.filter(s => 
    (s.name.toLowerCase().includes(search.toLowerCase()) || (s.student_code && s.student_code.includes(search))) &&
    (stageFilter === '' || s.stage === stageFilter)
  );

  if (loading && students.length === 0) return (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mb-4" />
      <p className="text-gray-500 font-bold">جاري جلب قائمة الطلاب...</p>
    </div>
  );

  return (
    <div dir="rtl" className="animate-fade-in pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black">إدارة الطلاب</h1>
          <p className="text-gray-500 text-sm">متابعة تسجيلات الطلاب، تفعيل الحسابات، وإدارة الصلاحيات.</p>
        </div>
        <button onClick={() => setShowForm(!showForm)}
          className={`flex items-center justify-center gap-2 px-6 py-3 rounded-2xl font-bold transition-all shadow-lg ${showForm ? 'bg-red-500/10 text-red-500 border border-red-500/20' : 'gradient-primary text-white hover:scale-105 shadow-purple-500/20'}`}>
          {showForm ? 'إلغاء' : <><FiPlus /> إضافة طالب يدوياً</>}
        </button>
      </div>

      {/* Add Form */}
      {showForm && (
        <div className="glass rounded-3xl p-6 mb-10 border border-purple-500/20 animate-scale-in">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 mr-2">اسم الطالب</label>
              <input className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 px-4 focus:border-purple-500 focus:outline-none transition-all" 
                type="text" placeholder="الاسم ثلاثي..." value={form.name} onChange={e => setForm({...form, name:e.target.value})} />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 mr-2">البريد الإلكتروني</label>
              <input className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 px-4 focus:border-purple-500 focus:outline-none" 
                type="email" placeholder="example@gmail.com" value={form.email} onChange={e => setForm({...form, email:e.target.value})} />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 mr-2">السنة الدراسية</label>
              <select className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 px-4 focus:border-purple-500 focus:outline-none" 
                value={form.stage} onChange={e => setForm({...form, stage:e.target.value})}>
                <option value="" className="bg-gray-900">اختار الصف</option>
                {STAGES.map(s => <option key={s} value={s} className="bg-gray-900">{s}</option>)}
              </select>
            </div>
            <input className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 px-4 focus:border-purple-500 focus:outline-none" 
              type="tel" placeholder="رقم موبايل الطالب" value={form.phone} onChange={e => setForm({...form, phone:e.target.value})} />
            <input className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 px-4 focus:border-purple-500 focus:outline-none" 
              type="tel" placeholder="رقم ولي الأمر" value={form.parent_phone} onChange={e => setForm({...form, parent_phone:e.target.value})} />
            <input className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 px-4 focus:border-purple-500 focus:outline-none" 
              type="text" placeholder="المدرسة" value={form.school} onChange={e => setForm({...form, school:e.target.value})} />
          </div>
          <button onClick={handleAdd} className="gradient-primary w-full md:w-auto px-10 py-3 rounded-2xl text-white font-bold shadow-xl shadow-purple-500/20">تأكيد الإضافة</button>
        </div>
      )}

      {/* Stats/Quick Actions for Requests */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
        {/* Access Requests */}
        <div className={`glass rounded-3xl p-6 border transition-all ${accessRequests.length > 0 ? 'border-indigo-500/30' : 'border-white/5 opacity-60'}`}>
          <h2 className="font-black text-lg mb-4 flex items-center gap-2">
            <FiKey className="text-indigo-400" /> طلبات وصول الكورسات
            {accessRequests.length > 0 && <span className="bg-indigo-500 text-white text-[10px] px-2 py-0.5 rounded-full animate-pulse">{accessRequests.length}</span>}
          </h2>
          <div className="max-h-[300px] overflow-y-auto space-y-3 custom-scrollbar">
            {accessRequests.map(req => (
              <div key={req.id} className="bg-indigo-500/5 border border-indigo-500/10 rounded-2xl p-4 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="font-bold text-sm truncate">{req.students?.name}</p>
                  <p className="text-[10px] text-indigo-400 font-bold mb-2">كورس: {req.courses?.title}</p>
                  <div className="flex gap-2">
                    <button onClick={() => handleAccessRequest(req.id,'approved')} className="bg-emerald-500 text-white text-[10px] px-3 py-1.5 rounded-lg font-bold hover:bg-emerald-600 transition-colors">تفعيل</button>
                    <button onClick={() => handleAccessRequest(req.id,'rejected')} className="bg-white/5 text-red-400 text-[10px] px-3 py-1.5 rounded-lg font-bold border border-white/5 hover:bg-red-500/10">رفض</button>
                  </div>
                </div>
              </div>
            ))}
            {accessRequests.length === 0 && <p className="text-center py-6 text-xs text-gray-500">لا يوجد طلبات شراء حالياً</p>}
          </div>
        </div>

        {/* Pending Registration */}
        <div className={`glass rounded-3xl p-6 border transition-all ${pending.length > 0 ? 'border-yellow-500/30' : 'border-white/5 opacity-60'}`}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-black text-lg flex items-center gap-2">
              <FiUserCheck className="text-yellow-400" /> طلبات تسجيل بانتظار المراجعة
              {pending.length > 0 && <span className="bg-yellow-500 text-black text-[10px] px-2 py-0.5 rounded-full">{pending.length}</span>}
            </h2>
          </div>
          <div className="max-h-[300px] overflow-y-auto space-y-3 custom-scrollbar">
            {pending.map(s => (
              <div key={s.id} className="bg-yellow-500/5 border border-yellow-500/10 rounded-2xl p-4 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="font-bold text-sm truncate">{s.name}</p>
                  <p className="text-[10px] text-gray-400">{s.stage || 'غير محدد'}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => updateStatus(s.id,'approved')} className="bg-yellow-500 text-black text-[10px] px-3 py-1.5 rounded-lg font-bold hover:bg-yellow-600 transition-colors">قبول</button>
                  <button onClick={() => updateStatus(s.id,'rejected')} className="bg-white/5 text-red-400 text-[10px] px-3 py-1.5 rounded-lg font-bold border border-white/5 hover:bg-red-500/10">رفض</button>
                </div>
              </div>
            ))}
            {pending.length === 0 && <p className="text-center py-6 text-xs text-gray-500">لا يوجد طلبات تسجيل معلقة</p>}
          </div>
        </div>
      </div>

      {/* Main Students List with Filters */}
      <div className="glass rounded-3xl p-6 border border-white/5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <h2 className="text-xl font-black">الطلاب المقبولين</h2>
          
          <div className="flex flex-wrap items-center gap-3">
            {/* Search */}
            <div className="relative group min-w-[250px]">
              <FiSearch className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-purple-500 transition-colors" />
              <input 
                type="text" 
                placeholder="ابحث بالاسم أو الكود..." 
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-2.5 pr-11 pl-4 text-sm focus:border-purple-500 focus:outline-none transition-all"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            {/* Filter */}
            <div className="relative">
              <FiFilter className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500" />
              <select 
                className="bg-white/5 border border-white/10 rounded-2xl py-2.5 pr-11 pl-8 text-sm focus:border-purple-500 focus:outline-none appearance-none"
                value={stageFilter}
                onChange={e => setStageFilter(e.target.value)}
              >
                <option value="" className="bg-gray-900">كل المراحل</option>
                {STAGES.map(s => <option key={s} value={s} className="bg-gray-900">{s}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Table/List View */}
        <div className="space-y-3">
          {filteredStudents.map(s => (
            <div key={s.id} className={`group flex flex-col md:flex-row md:items-center gap-4 p-5 rounded-3xl border transition-all hover:shadow-xl ${s.is_active ? 'bg-white/5 border-white/5 hover:border-purple-500/30' : 'bg-red-500/5 border-red-500/10 opacity-70'}`}>
              
              {/* Avatar & Basic Info */}
              <div className="flex items-center gap-4 flex-1 min-w-0">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-white text-xl shadow-lg shrink-0 ${s.is_active ? 'bg-gradient-to-br from-purple-500 to-indigo-600' : 'bg-gray-700'}`}>
                  {s.name?.[0]}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-sm md:text-base truncate">{s.name}</h3>
                    {s.student_code && <span className="bg-purple-500/10 text-purple-400 text-[10px] font-mono px-2 py-0.5 rounded-md border border-purple-500/20">{s.student_code}</span>}
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 opacity-50">
                    <span className="flex items-center gap-1 text-[10px]"><FiMail size={12}/> {s.email}</span>
                    {s.phone && <span className="flex items-center gap-1 text-[10px]"><FiPhone size={12}/> {s.phone}</span>}
                    {s.stage && <span className="flex items-center gap-1 text-[10px]"><FiBook size={12}/> {s.stage}</span>}
                  </div>
                </div>
              </div>

              {/* Status & Controls */}
              <div className="flex items-center justify-between md:justify-end gap-3 border-t md:border-t-0 border-white/5 pt-4 md:pt-0">
                {/* Change Password Inline */}
                {changingPassword === s.id ? (
                  <div className="flex items-center gap-2 animate-scale-in">
                    <input 
                      type="password" 
                      placeholder="كلمة المرور الجديدة" 
                      className="bg-white/10 border border-purple-500/30 rounded-xl px-3 py-2 text-[10px] w-32 focus:outline-none" 
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                    />
                    <button onClick={() => handleChangePassword(s.id, s.email)} className="bg-emerald-500 text-white p-2 rounded-xl hover:bg-emerald-600 transition-colors">✅</button>
                    <button onClick={() => {setChangingPassword(null); setNewPassword('')}} className="bg-white/10 text-white p-2 rounded-xl hover:bg-white/20 transition-colors">✕</button>
                  </div>
                ) : (
                  <button 
                    onClick={() => setChangingPassword(s.id)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[10px] font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 hover:bg-indigo-500 hover:text-white transition-all"
                  >
                    <FiKey /> كلمة المرور
                  </button>
                )}

                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => toggleActive(s.id, s.is_active)}
                    className={`p-2.5 rounded-xl transition-all ${s.is_active ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20 hover:bg-orange-500 hover:text-white' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500 hover:text-white'}`}
                    title={s.is_active ? 'تعطيل الحساب' : 'تفعيل الحساب'}
                  >
                    {s.is_active ? <FiUserX size={16}/> : <FiUserCheck size={16}/>}
                  </button>
                  <button 
                    onClick={() => {
                      if(window.confirm(`هل أنت متأكد من حذف الطالب "${s.name}" نهائياً؟`)) {
                        supabase.from('students').delete().eq('id', s.id).then(() => {
                          toast.success('تم حذف الطالب بنجاح');
                          loadData();
                        });
                      }
                    }}
                    className="p-2.5 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500 hover:text-white transition-all"
                    title="حذف نهائي"
                  >
                    <FiTrash2 size={16}/>
                  </button>
                </div>
              </div>
            </div>
          ))}

          {filteredStudents.length === 0 && (
            <div className="text-center py-20 bg-white/5 rounded-3xl border border-dashed border-white/10">
              <div className="text-4xl mb-4 opacity-20">🔍</div>
              <p className="text-gray-500 font-bold">مفيش طلاب بالبيانات دي..</p>
              <button onClick={() => {setSearch(''); setStageFilter('')}} className="text-purple-500 text-xs mt-2 underline">إلغاء الفلترة</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
