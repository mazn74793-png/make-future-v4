'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';
import { useParams } from 'next/navigation';
import { FiPlus, FiTrash2, FiImage, FiToggleLeft, FiToggleRight, FiRefreshCw, FiAlertTriangle } from 'react-icons/fi';

export default function ExamDetailPage() {
  const { id } = useParams();
  const [exam, setExam] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [attempts, setAttempts] = useState([]);
  const [activeTab, setActiveTab] = useState('questions');
  const [showForm, setShowForm] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({ question:'', type:'mcq', points:1, image_url:'', options:['','','',''], correct_answer:'' });

  const load = async () => {
    const { data: examData } = await supabase.from('exams').select('*, courses(title)').eq('id', id).single();
    setExam(examData);
    const { data: qData } = await supabase.from('exam_questions').select('*').eq('exam_id', id).order('order_num');
    setQuestions(qData || []);
    const { data: aData } = await supabase.from('exam_attempts')
      .select('*, students(name, email, student_code)').eq('exam_id', id)
      .order('submitted_at', { ascending: false });
    setAttempts(aData || []);
  };

  useEffect(() => { load(); }, [id]);

  const handleImageUpload = async (file) => {
    setUploading(true);
    try {
      const res = await fetch('/api/upload-image', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ fileName:file.name, contentType:file.type }) });
      const { uploadUrl, imageUrl } = await res.json();
      await fetch(uploadUrl, { method:'PUT', headers:{'Content-Type':file.type}, body:file });
      setForm(f => ({ ...f, image_url: imageUrl }));
      toast.success('✅ الصورة اترفعت');
    } catch { toast.error('حصل مشكلة'); }
    setUploading(false);
  };

  const handleAddQuestion = async () => {
    if (!form.question) { toast.error('اكتب السؤال'); return; }
    if (form.type === 'mcq' && !form.correct_answer) { toast.error('اختار الإجابة الصحيحة'); return; }
    const { error } = await supabase.from('exam_questions').insert({
      exam_id:id, question:form.question, type:form.type,
      image_url:form.image_url||null,
      options:form.type==='mcq'?form.options.filter(o=>o.trim()):null,
      correct_answer:form.correct_answer||null, points:form.points, order_num:questions.length,
    });
    if (error) toast.error(error.message);
    else { toast.success('✅ السؤال اتضاف'); setShowForm(false); setForm({ question:'', type:'mcq', points:1, image_url:'', options:['','','',''], correct_answer:'' }); load(); }
  };

  const reopenAttempt = async (attemptId, studentName) => {
    if (!confirm(`هتفتح الامتحان تاني لـ "${studentName}"؟`)) return;
    const { error } = await supabase.from('exam_attempts').update({
      is_submitted: false, force_submitted: false,
      submitted_at: null, score: 0, total_points: 0,
      percentage: 0, answers: {}, reopened_at: new Date().toISOString(),
    }).eq('id', attemptId);
    if (error) toast.error(error.message);
    else { toast.success(`✅ تم فتح الامتحان لـ ${studentName}`); load(); }
  };

  const toggleActive = async () => {
    await supabase.from('exams').update({ is_active: !exam.is_active }).eq('id', id);
    toast.success(!exam.is_active ? '✅ الامتحان متاح' : '🔒 الامتحان مقفول'); load();
  };

  if (!exam) return <div className="flex items-center justify-center py-20"><div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" /></div>;

  const submittedAttempts = attempts.filter(a => a.is_submitted);
  const openAttempts = attempts.filter(a => !a.is_submitted);

  return (
    <div dir="rtl">
      <div className="flex items-center justify-between mb-8 flex-wrap gap-3">
        <div className="flex items-center gap-4">
          <a href="/dashboard/exams" className="p-2 rounded-xl bg-white/5 hover:bg-white/10 transition text-white">←</a>
          <div>
            <h1 className="text-2xl font-black">{exam.title}</h1>
            <p className="text-gray-400 text-sm">{exam.duration_minutes} دقيقة • {questions.length} سؤال • نجاح من {exam.pass_score}% {exam.shuffle_questions && '• 🔀 عشوائي'}</p>
          </div>
        </div>
        <button onClick={toggleActive}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition ${exam.is_active ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'}`}>
          {exam.is_active ? <><FiToggleRight className="text-xl" /> متاح</> : <><FiToggleLeft className="text-xl" /> مقفول</>}
        </button>
      </div>

      <div className="flex gap-3 mb-6 flex-wrap">
        {[
          { key:'questions', label:`الأسئلة (${questions.length})` },
          { key:'results', label:`النتائج (${submittedAttempts.length})` },
          openAttempts.length > 0 && { key:'open', label:`جاري الامتحان (${openAttempts.length})` },
        ].filter(Boolean).map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className={`px-5 py-2 rounded-xl font-bold transition text-sm ${activeTab===tab.key ? 'gradient-primary text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* QUESTIONS TAB */}
      {activeTab === 'questions' && (
        <div>
          <button onClick={() => setShowForm(!showForm)} className="gradient-primary px-6 py-3 rounded-xl text-white font-bold flex items-center gap-2 mb-6">
            <FiPlus /> {showForm ? 'إلغاء' : 'سؤال جديد'}
          </button>
          {showForm && (
            <div className="glass rounded-2xl p-6 mb-6 space-y-4 animate-fade-in">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-400 mb-1 block">نوع السؤال</label>
                  <select value={form.type} onChange={e => setForm({...form, type:e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white focus:border-purple-500 focus:outline-none">
                    <option value="mcq">اختيار من متعدد</option>
                    <option value="text">إجابة نصية</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm text-gray-400 mb-1 block">الدرجة</label>
                  <input type="number" value={form.points} min="1" onChange={e => setForm({...form, points:parseInt(e.target.value)})} className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white focus:border-purple-500 focus:outline-none" />
                </div>
              </div>
              <div>
                <label className="text-sm text-gray-400 mb-1 block">نص السؤال *</label>
                <textarea value={form.question} onChange={e => setForm({...form, question:e.target.value})} rows={3} placeholder="اكتب السؤال هنا..." className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white focus:border-purple-500 focus:outline-none resize-none" />
              </div>
              <div>
                <label className="text-sm text-gray-400 mb-1 block">صورة (اختياري)</label>
                <div className="flex items-center gap-3">
                  <input type="file" accept="image/*" id="imgUpload" className="hidden" onChange={e => e.target.files[0] && handleImageUpload(e.target.files[0])} />
                  <label htmlFor="imgUpload" className={`flex items-center gap-2 border border-white/10 px-4 py-2 rounded-xl cursor-pointer hover:bg-white/10 text-sm ${uploading ? 'opacity-50' : 'bg-white/5'}`}>
                    <FiImage /> {uploading ? '⏳ جاري...' : 'رفع صورة'}
                  </label>
                  {form.image_url && <><img src={form.image_url} alt="" className="w-16 h-16 rounded-xl object-cover" /><button onClick={() => setForm(f=>({...f,image_url:''}))} className="text-red-400 text-xs">حذف</button></>}
                </div>
              </div>
              {form.type === 'mcq' && (
                <div>
                  <label className="text-sm text-gray-400 mb-2 block">الاختيارات — اضغط الدائرة للصح</label>
                  <div className="space-y-2">
                    {form.options.map((opt, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <input type="radio" name="correct" checked={form.correct_answer===opt&&opt!==''} onChange={() => opt&&setForm({...form, correct_answer:opt})} className="accent-purple-500 w-4 h-4 flex-shrink-0" />
                        <input type="text" value={opt} onChange={e => { const n=[...form.options]; n[i]=e.target.value; setForm({...form, options:n}); }} placeholder={`الاختيار ${i+1}`} className="flex-1 bg-white/5 border border-white/10 rounded-xl py-2 px-3 text-white focus:border-purple-500 focus:outline-none text-sm" />
                      </div>
                    ))}
                  </div>
                  {form.correct_answer && <p className="text-green-400 text-xs mt-2">✅ {form.correct_answer}</p>}
                </div>
              )}
              <button onClick={handleAddQuestion} className="gradient-primary px-8 py-3 rounded-xl text-white font-bold">إضافة السؤال</button>
            </div>
          )}
          <div className="space-y-4">
            {questions.map((q, i) => (
              <div key={q.id} className="glass rounded-xl p-5 border border-white/5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="w-7 h-7 gradient-primary rounded-lg flex items-center justify-center text-sm font-bold text-white">{i+1}</span>
                      <span className="text-xs text-gray-400 bg-white/5 px-2 py-1 rounded-full">{q.type==='mcq'?'اختيار':'نصي'} • {q.points} درجة</span>
                    </div>
                    <p className="font-semibold mb-3">{q.question}</p>
                    {q.image_url && <img src={q.image_url} alt="" className="rounded-xl mb-3 max-h-48 object-cover" />}
                    {q.options && <div className="space-y-1">{q.options.map((opt,j)=><div key={j} className={`text-sm px-3 py-2 rounded-lg ${opt===q.correct_answer?'bg-green-500/20 text-green-400 font-bold':'bg-white/5 text-gray-300'}`}>{opt===q.correct_answer?'✅':'○'} {opt}</div>)}</div>}
                  </div>
                  <button onClick={async()=>{ await supabase.from('exam_questions').delete().eq('id',q.id); toast.success('اتمسح'); load(); }} className="p-2 rounded-xl bg-red-500/20 text-red-400 hover:bg-red-500/30 transition flex-shrink-0"><FiTrash2 /></button>
                </div>
              </div>
            ))}
            {questions.length===0 && <div className="glass rounded-2xl p-10 text-center"><p className="text-gray-400">ضيف أسئلة 👆</p></div>}
          </div>
        </div>
      )}

      {/* RESULTS TAB */}
      {activeTab === 'results' && (
        <div className="space-y-4">
          {submittedAttempts.map(attempt => {
            const passed = attempt.percentage >= (exam?.pass_score || 50);
            return (
              <div key={attempt.id} className="glass rounded-xl p-5 border border-white/5">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 gradient-primary rounded-full flex items-center justify-center font-bold text-white">{attempt.students?.name?.[0]}</div>
                    <div>
                      <p className="font-bold">{attempt.students?.name}</p>
                      <div className="flex items-center gap-2 text-xs text-gray-400">
                        <span>{attempt.students?.email}</span>
                        {attempt.students?.student_code && <span className="font-mono" style={{color:'#818cf8'}}>{attempt.students.student_code}</span>}
                      </div>
                      {attempt.force_submitted && (
                        <div className="flex items-center gap-1 text-xs mt-1" style={{color:'#fbbf24'}}>
                          <FiAlertTriangle size={10}/> انتهى وقته تلقائياً
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-4 flex-wrap">
                    <div className="text-center">
                      <p className={`text-2xl font-black ${passed?'text-green-400':'text-red-400'}`}>{Math.round(attempt.percentage||0)}%</p>
                      <p className="text-xs text-gray-400">{attempt.score}/{attempt.total_points} درجة</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-gray-400">⏱️ {attempt.time_taken_seconds?`${Math.floor(attempt.time_taken_seconds/60)}:${String(attempt.time_taken_seconds%60).padStart(2,'0')}`:'-'}</p>
                      <p className="text-xs text-gray-500">{attempt.submitted_at?new Date(attempt.submitted_at).toLocaleDateString('ar-EG'):''}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-bold ${passed?'bg-green-400/20 text-green-400':'bg-red-400/20 text-red-400'}`}>{passed?'✅ ناجح':'❌ راسب'}</span>
                    <button onClick={() => reopenAttempt(attempt.id, attempt.students?.name)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-bold transition"
                      style={{background:'rgba(99,102,241,0.12)', color:'#818cf8', border:'1px solid rgba(99,102,241,0.25)'}}>
                      <FiRefreshCw size={12}/> إعادة فتح
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
          {submittedAttempts.length===0 && <div className="glass rounded-2xl p-10 text-center"><p className="text-gray-400">مفيش نتائج لسه</p></div>}
        </div>
      )}

      {/* OPEN ATTEMPTS */}
      {activeTab === 'open' && (
        <div className="space-y-3">
          <p className="text-yellow-400 text-sm font-bold mb-4">⚡ هؤلاء يعملون الامتحان دلوقتي</p>
          {openAttempts.map(attempt => (
            <div key={attempt.id} className="glass rounded-xl p-4 flex items-center justify-between" style={{border:'1px solid rgba(251,191,36,0.2)'}}>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-white text-sm" style={{background:'linear-gradient(135deg,#6366f1,#f472b6)'}}>{attempt.students?.name?.[0]}</div>
                <div>
                  <p className="font-bold text-sm">{attempt.students?.name}</p>
                  <p className="text-xs text-gray-400">بدأ: {new Date(attempt.started_at).toLocaleTimeString('ar-EG')}</p>
                </div>
              </div>
              <span className="text-xs px-3 py-1 rounded-full font-bold animate-pulse" style={{background:'rgba(251,191,36,0.15)', color:'#fbbf24'}}>جاري...</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
