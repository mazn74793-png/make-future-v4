'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';
import { FiPlus, FiTrash2, FiUserCheck, FiUserX, FiKey } from 'react-icons/fi';

const STAGES = ['الصف الأول الإعدادي','الصف الثاني الإعدادي','الصف الثالث الإعدادي','الصف الأول الثانوي','الصف الثاني الثانوي','الصف الثالث الثانوي'];

export default function StudentsPage() {
  const [students, setStudents] = useState([]);
  const [pending, setPending] = useState([]);
  const [accessRequests, setAccessRequests] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [approvingAll, setApprovingAll] = useState(false);
  const [changingPassword, setChangingPassword] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [form, setForm] = useState({ name:'', email:'', phone:'', parent_phone:'', stage:'', school:'' });

  const inp = "w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white focus:border-purple-500 focus:outline-none text-sm";

  const load = async () => {
    const [{ data: approved }, { data: pendingData }, { data: accessReqs }] = await Promise.all([
      supabase.from('students').select('*').eq('status','approved').order('created_at',{ ascending:false }),
      supabase.from('students').select('*').eq('status','pending').order('created_at',{ ascending:false }),
      supabase.from('access_requests').select('*, students(name,email), courses(title)').eq('status','pending').order('created_at',{ ascending:false }),
    ]);
    setStudents(approved || []);
    setPending(pendingData || []);
    setAccessRequests(accessReqs || []);
  };

  useEffect(() => { load(); }, []);

  const handleAdd = async () => {
    if (!form.name || !form.email) { toast.error('الاسم والايميل مطلوبين'); return; }
    const { error } = await supabase.from('students').insert({ ...form, status:'approved', profile_complete:true });
    if (error) toast.error(error.message);
    else { toast.success('✅ تمت الاضافة'); setShowForm(false); setForm({ name:'', email:'', phone:'', parent_phone:'', stage:'', school:'' }); }
    load();
  };

  const updateStatus = async (id, status) => {
    await supabase.from('students').update({ status }).eq('id', id);
    // إشعار واتساب عند القبول
    if (status === 'approved') {
      const student = pending.find(s => s.id === id);
      if (student?.parent_phone) {
        await supabase.from('whatsapp_notifications').insert({
          student_id: id, type:'enrollment', phone: student.parent_phone,
          message: `ولي أمر الطالب ${student.name}، تم قبول اشتراك نجلكم في المنصة ✅. كوده: ${student.student_code || 'سيظهر قريباً'}`,
        });
      }
      toast.success('✅ تم القبول');
    } else {
      toast.error('❌ تم الرفض');
    }
    load();
  };

  const approveAll = async () => {
    if (!pending.length) return;
    setApprovingAll(true);
    await supabase.from('students').update({ status:'approved' }).in('id', pending.map(s => s.id));
    toast.success(`✅ تم قبول ${pending.length} طالب`);
    setApprovingAll(false);
    load();
  };

  const handleAccessRequest = async (id, status) => {
    await supabase.from('access_requests').update({ status }).eq('id', id);
    toast.success(status === 'approved' ? '✅ تم القبول' : '❌ تم الرفض');
    load();
  };

  // ✅ Fix: بيبعت studentId + email مش userId
  const handleChangePassword = async (studentId, email) => {
    if (!newPassword || newPassword.length < 6) { toast.error('6 أحرف على الأقل'); return; }
    const res = await fetch('/api/change-password', {
      method: 'POST',
      headers: { 'Content-Type':'application/json' },
      body: JSON.stringify({ studentId, email, newPassword }),
    });
    const data = await res.json();
    if (data.success) {
      toast.success(data.created ? '✅ تم إنشاء حساب وتعيين الباسورد' : '✅ تم تغيير الباسورد');
      setChangingPassword(null); setNewPassword('');
    } else {
      toast.error(data.error || 'حصل مشكلة');
    }
  };

  const toggleActive = async (id, current) => {
    await supabase.from('students').update({ is_active:!current }).eq('id', id);
    toast.success(current ? 'تم التعطيل' : '✅ تم التفعيل');
    load();
  };

  const handleDelete = async (id, name) => {
    if (!confirm(`متأكد تمسح "${name}"؟`)) return;
    await supabase.from('students').delete().eq('id', id);
    toast.success('اتمسح'); load();
  };

  return (
    <div dir="rtl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-black">ادارة الطلاب</h1>
        <button onClick={() => setShowForm(!showForm)}
          className="gradient-primary px-5 py-2.5 rounded-xl text-white font-bold flex items-center gap-2 text-sm">
          <FiPlus /> {showForm ? 'إلغاء' : 'طالب جديد'}
        </button>
      </div>

      {/* فورم إضافة */}
      {showForm && (
        <div className="glass rounded-2xl p-5 mb-6 animate-fade-in space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input className={inp} type="text" placeholder="اسم الطالب *" value={form.name} onChange={e => setForm({...form, name:e.target.value})} />
            <input className={inp} type="email" placeholder="الايميل *" value={form.email} onChange={e => setForm({...form, email:e.target.value})} />
            <input className={inp} type="tel" placeholder="الموبايل" value={form.phone} onChange={e => setForm({...form, phone:e.target.value})} />
            <input className={inp} type="tel" placeholder="رقم ولي الأمر" value={form.parent_phone} onChange={e => setForm({...form, parent_phone:e.target.value})} />
            <select className={inp} value={form.stage} onChange={e => setForm({...form, stage:e.target.value})}>
              <option value="">اختار الصف</option>
              {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <input className={inp} type="text" placeholder="المدرسة" value={form.school} onChange={e => setForm({...form, school:e.target.value})} />
          </div>
          <button onClick={handleAdd} className="gradient-primary px-8 py-2.5 rounded-xl text-white font-bold text-sm">اضافة الطالب</button>
        </div>
      )}

      {/* طلبات وصول الكورسات */}
      {accessRequests.length > 0 && (
        <div className="mb-6">
          <h2 className="font-black mb-3 flex items-center gap-2">
            🔑 طلبات وصول الكورسات
            <span className="text-sm px-3 py-1 rounded-full" style={{ background:'rgba(99,102,241,0.15)', color:'#818cf8' }}>{accessRequests.length}</span>
          </h2>
          <div className="space-y-2">
            {accessRequests.map(req => (
              <div key={req.id} className="glass rounded-xl p-4 flex items-center justify-between flex-wrap gap-3"
                style={{ border:'1px solid rgba(99,102,241,0.2)' }}>
                <div>
                  <p className="font-bold text-sm">{req.students?.name}</p>
                  <p className="text-xs text-gray-400">{req.students?.email}</p>
                  <p className="text-xs mt-1" style={{ color:'#818cf8' }}>📚 {req.courses?.title}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleAccessRequest(req.id,'approved')}
                    className="flex items-center gap-1 px-4 py-2 rounded-xl text-sm font-bold bg-green-500/20 text-green-400 hover:bg-green-500/30">
                    <FiUserCheck size={13}/> قبول
                  </button>
                  <button onClick={() => handleAccessRequest(req.id,'rejected')}
                    className="flex items-center gap-1 px-4 py-2 rounded-xl text-sm font-bold bg-red-500/20 text-red-400 hover:bg-red-500/30">
                    <FiUserX size={13}/> رفض
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* طلبات تسجيل */}
      {pending.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-black flex items-center gap-2">
              ⏳ طلبات تسجيل جديدة
              <span className="text-sm px-3 py-1 rounded-full" style={{ background:'rgba(251,191,36,0.15)', color:'#fbbf24' }}>{pending.length}</span>
            </h2>
            {pending.length > 1 && (
              <button onClick={approveAll} disabled={approvingAll}
                className="px-4 py-2 rounded-xl text-sm font-bold disabled:opacity-50 flex items-center gap-1 bg-green-500/20 text-green-400 hover:bg-green-500/30">
                {approvingAll ? '⏳' : '✅'} قبول الكل ({pending.length})
              </button>
            )}
          </div>
          <div className="space-y-2">
            {pending.map(s => (
              <div key={s.id} className="glass rounded-xl p-4 flex items-center gap-4 flex-wrap"
                style={{ border:'1px solid rgba(251,191,36,0.2)' }}>
                <div className="w-11 h-11 rounded-full flex items-center justify-center font-bold text-lg flex-shrink-0"
                  style={{ background:'rgba(251,191,36,0.15)', color:'#fbbf24' }}>
                  {s.name?.[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-sm">{s.name}</h3>
                  <p className="text-xs truncate text-gray-400">{s.email}{s.phone && ` • ${s.phone}`}</p>
                  {s.stage && <p className="text-xs text-gray-500">{s.stage}{s.school && ` • ${s.school}`}</p>}
                </div>
                <div className="flex gap-2">
                  <button onClick={() => updateStatus(s.id,'approved')}
                    className="flex items-center gap-1 px-3 py-2 rounded-xl text-sm font-bold bg-green-500/20 text-green-400 hover:bg-green-500/30">
                    <FiUserCheck size={13}/> قبول
                  </button>
                  <button onClick={() => updateStatus(s.id,'rejected')}
                    className="flex items-center gap-1 px-3 py-2 rounded-xl text-sm font-bold bg-red-500/20 text-red-400 hover:bg-red-500/30">
                    <FiUserX size={13}/> رفض
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* الطلاب المقبولين */}
      <h2 className="font-black mb-4">الطلاب المقبولين ({students.length})</h2>
      <div className="space-y-2">
        {students.map(s => (
          <div key={s.id} className="glass rounded-xl p-4 flex items-center gap-3 flex-wrap card-hover">
            <div className={`w-11 h-11 rounded-full flex items-center justify-center font-bold text-lg flex-shrink-0 ${s.is_active ? 'gradient-primary' : 'bg-white/10'}`}>
              {s.name?.[0]}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-sm">{s.name}</h3>
              <p className="text-xs truncate text-gray-400">{s.email}{s.phone && ` • ${s.phone}`}</p>
              <div className="flex items-center gap-2 mt-0.5">
                {s.student_code && <span className="text-xs font-mono" style={{ color:'#818cf8' }}>{s.student_code}</span>}
                {s.stage && <span className="text-xs text-gray-500">{s.stage}</span>}
              </div>
            </div>

            <span className={`text-xs px-2 py-1 rounded-full flex-shrink-0 ${s.is_active ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
              {s.is_active ? 'نشط' : 'معطل'}
            </span>

            {/* تغيير باسورد */}
            {changingPassword === s.id ? (
              <div className="flex items-center gap-2 flex-shrink-0">
                <input type="password" placeholder="باسورد جديد (6+)" value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleChangePassword(s.id, s.email)}
                  className="bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-white text-sm w-36 focus:outline-none focus:border-purple-500" />
                {/* ✅ Fix: s.id و s.email بدل s.user_id */}
                <button onClick={() => handleChangePassword(s.id, s.email)}
                  className="px-3 py-2 rounded-xl text-sm font-bold bg-purple-500/20 text-purple-400 hover:bg-purple-500/30">✅</button>
                <button onClick={() => { setChangingPassword(null); setNewPassword(''); }}
                  className="px-3 py-2 rounded-xl text-sm bg-white/5 text-gray-400">❌</button>
              </div>
            ) : (
              <button onClick={() => setChangingPassword(s.id)}
                className="p-2 rounded-xl bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 transition flex-shrink-0" title="تغيير الباسورد">
                <FiKey size={15}/>
              </button>
            )}

            <button onClick={() => toggleActive(s.id, s.is_active)}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 transition flex-shrink-0">
              {s.is_active ? <FiUserX className="text-yellow-400" size={15}/> : <FiUserCheck className="text-green-400" size={15}/>}
            </button>
            <button onClick={() => handleDelete(s.id, s.name)}
              className="p-2 rounded-xl bg-red-500/20 text-red-400 hover:bg-red-500/30 transition flex-shrink-0">
              <FiTrash2 size={15}/>
            </button>
          </div>
        ))}
        {students.length === 0 && <p className="text-center text-gray-500 py-10">مفيش طلاب لسه</p>}
      </div>
    </div>
  );
}
