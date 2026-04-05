'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';
import { useParams } from 'next/navigation';
import { 
  FiPlus, FiTrash2, FiImage, FiToggleLeft, FiToggleRight, 
  FiRefreshCw, FiAlertTriangle, FiCheckCircle, FiXCircle, 
  FiUsers, FiTrendingUp, FiArrowUp, FiArrowDown 
} from 'react-icons/fi';

export default function ExamDetailPage() {
  const { id } = useParams();
  const [exam, setExam] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [attempts, setAttempts] = useState([]);
  const [activeTab, setActiveTab] = useState('questions');
  const [showForm, setShowForm] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({ 
    question:'', type:'mcq', points:1, image_url:'', 
    options:['','','',''], correct_answer:'' 
  });

  const load = async () => {
    const { data: examData } = await supabase.from('exams').select('*, courses(title)').eq('id', id).single();
    setExam(examData);
    
    const { data: qData } = await supabase.from('exam_questions').select('*').eq('exam_id', id).order('order_num');
    setQuestions(qData || []);
    
    const { data: aData } = await supabase.from('exam_attempts')
      .select('*, students(name, email, student_code)')
      .eq('exam_id', id)
      .order('submitted_at', { ascending: false });
    setAttempts(aData || []);
  };

  useEffect(() => { load(); }, [id]);

  // إحصائيات سريعة
  const submitted = attempts.filter(a => a.is_submitted);
  const passedCount = submitted.filter(a => a.percentage >= (exam?.pass_score || 50)).length;
  const avgScore = submitted.length > 0 ? Math.round(submitted.reduce((acc, curr) => acc + curr.percentage, 0) / submitted.length) : 0;

  const handleImageUpload = async (file) => {
    setUploading(true);
    try {
      const res = await fetch('/api/upload-image', { 
        method:'POST', 
        headers:{'Content-Type':'application/json'}, 
        body: JSON.stringify({ fileName:file.name, contentType:file.type }) 
      });
      const { uploadUrl, imageUrl } = await res.json();
      await fetch(uploadUrl, { method:'PUT', headers:{'Content-Type':file.type}, body:file });
      setForm(f => ({ ...f, image_url: imageUrl }));
      toast.success('✅ الصورة اترفعت');
    } catch { toast.error('حصل مشكلة في الرفع'); }
    setUploading(false);
  };

  const handleAddQuestion = async () => {
    if (!form.question) { toast.error('اكتب السؤال'); return; }
    if (form.type === 'mcq' && !form.correct_answer) { toast.error('اختار الإجابة الصحيحة'); return; }
    
    const { error } = await supabase.from('exam_questions').insert({
      exam_id: id, question: form.question, type: form.type,
      image_url: form.image_url || null,
      options: form.type === 'mcq' ? form.options.filter(o => o.trim()) : null,
      correct_answer: form.correct_answer || null, 
      points: form.points, 
      order_num: questions.length,
    });

    if (error) toast.error(error.message);
    else { 
      toast.success('✅ السؤال اتضاف'); 
      setShowForm(false); 
      setForm({ question:'', type:'mcq', points:1, image_url:'', options:['','','',''], correct_answer:'' }); 
      load(); 
    }
  };

  const moveQuestion = async (index, direction) => {
    const newQuestions = [...questions];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= questions.length) return;

    [newQuestions[index], newQuestions[targetIndex]] = [newQuestions[targetIndex], newQuestions[index]];
    
    const updates = newQuestions.map((q, i) => ({ id: q.id, order_num: i }));
    for (const u of updates) {
        await supabase.from('exam_questions').update({ order_num: u.order_num }).eq('id', u.id);
    }
    load();
  };

  const reopenAttempt = async (attemptId, studentName) => {
    if (!confirm(`سيتم حذف إجابات "${studentName}" الحالية والسماح له بالدخول مرة أخرى. هل أنت متأكد؟`)) return;
    const { error } = await supabase.from('exam_attempts').update({
      is_submitted: false, force_submitted: false,
      submitted_at: null, score: 0, total_points: 0,
      percentage: 0, answers: {}, reopened_at: new Date().toISOString(),
    }).eq('id', attemptId);
    
    if (error) toast.error(error.message);
    else { toast.success(`✅ تم تصفير المحاولة لـ ${studentName}`); load(); }
  };

  const toggleActive = async () => {
    const { error } = await supabase.from('exams').update({ is_active: !exam.is_active }).eq('id', id);
    if (!error) {
        toast.success(!exam.is_active ? '✅ الامتحان متاح للطلاب الآن' : '🔒 تم إخفاء الامتحان'); 
        load();
    }
  };

  if (!exam) return <div className="flex items-center justify-center py-20"><div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6" dir="rtl">
      {/* Header & Stats Cards */}
      <div className="flex flex-col md:flex-row justify-between gap-6 mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <button onClick={() => window.history.back()} className="p-2 glass rounded-xl hover:bg-white/10 transition">←</button>
            <h1 className="text-3xl font-black">{exam.title}</h1>
          </div>
          <p className="text-gray-500 font-bold mr-12">{exam.courses?.title} • {exam.duration_minutes} دقيقة</p>
        </div>
        
        <div className="grid grid-cols-2 md:flex gap-3">
            <div className="glass p-4 rounded-2xl flex flex-col items-center justify-center min-w-[100px]">
                <FiUsers className="text-blue-400 mb-1" />
                <span className="text-lg font-black">{submitted.length}</span>
                <span className="text-[10px] text-gray-500 font-bold uppercase">ممتحن</span>
            </div>
            <div className="glass p-4 rounded-2xl flex flex-col items-center justify-center min-w-[100px]">
                <FiCheckCircle className="text-green-400 mb-1" />
                <span className="text-lg font-black text-green-400">{passedCount}</span>
                <span className="text-[10px] text-gray-500 font-bold uppercase">ناجح</span>
            </div>
            <div className="glass p-4 rounded-2xl flex flex-col items-center justify-center min-w-[100px]">
                <FiTrendingUp className="text-purple-400 mb-1" />
                <span className="text-lg font-black">{avgScore}%</span>
                <span className="text-[10px] text-gray-500 font-bold uppercase">متوسط</span>
            </div>
            <button onClick={toggleActive}
              className={`flex flex-col items-center justify-center p-4 rounded-2xl font-black transition min-w-[100px] border ${exam.is_active ? 'bg-green-500/10 border-green-500/20 text-green-500' : 'bg-red-500/10 border-red-500/20 text-red-500'}`}>
              {exam.is_active ? <><FiToggleRight className="text-xl mb-1" /> متاح</> : <><FiToggleLeft className="text-xl mb-1" /> مقفول</>}
            </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 p-1.5 glass rounded-2xl w-fit mb-8">
        {[
          { key:'questions', label:`الأسئلة (${questions.length})` },
          { key:'results', label:`النتائج (${submitted.length})` },
          { key:'open', label:`مباشر (${attempts.filter(a=>!a.is_submitted).length})` },
        ].map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className={`px-6 py-2.5 rounded-[0.9rem] font-black transition-all text-sm ${activeTab===tab.key ? 'gradient-primary text-white shadow-lg shadow-primary/20' : 'text-gray-500 hover:text-white'}`}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* QUESTIONS CONTENT */}
      {activeTab === 'questions' && (
        <div className="animate-fade-in">
          <button onClick={() => setShowForm(!showForm)} className={`px-8 py-3.5 rounded-xl font-black flex items-center gap-2 mb-8 transition-all ${showForm ? 'bg-red-500/10 text-red-500' : 'gradient-primary text-white shadow-xl shadow-primary/20 hover:scale-105'}`}>
            {showForm ? <FiXCircle /> : <FiPlus />} {showForm ? 'إلغاء الإضافة' : 'إضافة سؤال جديد'}
          </button>

          {showForm && (
            <div className="glass rounded-[2rem] p-8 mb-10 border-primary/20 space-y-6 shadow-2xl relative overflow-hidden">
               <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -mr-10 -mt-10" />
               <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="md:col-span-2">
                    <label className="text-xs font-black text-gray-500 mr-2 uppercase mb-2 block tracking-widest">نص السؤال</label>
                    <textarea value={form.question} onChange={e => setForm({...form, question:e.target.value})} rows={3} placeholder="اكتب السؤال هنا..." className="w-full glass border-white/10 rounded-2xl py-4 px-5 text-white focus:border-primary focus:outline-none resize-none font-bold" />
                  </div>
                  <div className="space-y-4">
                    <div>
                        <label className="text-xs font-black text-gray-500 mr-2 uppercase mb-2 block tracking-widest">نوع السؤال</label>
                        <select value={form.type} onChange={e => setForm({...form, type:e.target.value})} className="w-full glass border-white/10 rounded-xl py-3.5 px-4 text-white focus:outline-none font-bold">
                            <option value="mcq">اختيار من متعدد</option>
                            <option value="text">إجابة نصية (مقالي)</option>
                        </select>
                    </div>
                    <div>
                        <label className="text-xs font-black text-gray-500 mr-2 uppercase mb-2 block tracking-widest">الدرجة</label>
                        <input type="number" value={form.points} min="1" onChange={e => setForm({...form, points:parseInt(e.target.value)})} className="w-full glass border-white/10 rounded-xl py-3.5 px-4 text-white focus:outline-none font-black" />
                    </div>
                  </div>
               </div>

               <div>
                  <label className="text-xs font-black text-gray-500 mr-2 uppercase mb-2 block tracking-widest">صورة توضيحية</label>
                  <div className="flex items-center gap-4 p-4 glass rounded-2xl border-white/5">
                    <input type="file" accept="image/*" id="imgUpload" className="hidden" onChange={e => e.target.files[0] && handleImageUpload(e.target.files[0])} />
                    <label htmlFor="imgUpload" className={`flex items-center gap-2 px-6 py-2.5 rounded-xl cursor-pointer transition-all font-bold text-sm ${uploading ? 'opacity-50' : 'bg-white/5 hover:bg-white/10 border border-white/10'}`}>
                      <FiImage className="text-primary" /> {uploading ? 'جاري الرفع...' : 'اختر صورة من الجهاز'}
                    </label>
                    {form.image_url && <div className="flex items-center gap-3 animate-fade-in"><img src={form.image_url} alt="" className="w-14 h-14 rounded-xl object-cover border border-primary/30" /><button onClick={() => setForm(f=>({...f,image_url:''}))} className="text-red-400 text-xs font-bold hover:underline">حذف الصورة</button></div>}
                  </div>
               </div>

               {form.type === 'mcq' && (
                 <div className="p-6 glass rounded-[1.5rem] border-white/5">
                    <label className="text-xs font-black text-gray-500 mr-2 uppercase mb-4 block tracking-widest">الاختيارات (حدد الدائرة بجانب الإجابة الصحيحة)</label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {form.options.map((opt, i) => (
                          <div key={i} className="flex items-center gap-3 p-3 rounded-2xl bg-white/[0.02] border border-white/5 transition-all focus-within:border-primary/50">
                            <input type="radio" name="correct" checked={form.correct_answer === opt && opt !== ''} onChange={() => opt && setForm({...form, correct_answer:opt})} className="w-5 h-5 accent-primary cursor-pointer flex-shrink-0" />
                            <input type="text" value={opt} onChange={e => { const n=[...form.options]; n[i]=e.target.value; setForm({...form, options:n}); }} placeholder={`اكتب الاختيار رقم ${i+1}`} className="bg-transparent w-full text-sm font-bold focus:outline-none" />
                          </div>
                        ))}
                    </div>
                 </div>
               )}

               <button onClick={handleAddQuestion} className="w-full md:w-auto gradient-primary px-12 py-4 rounded-2xl text-white font-black text-lg shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all">إضافة السؤال للامتحان</button>
            </div>
          )}

          <div className="space-y-6">
            {questions.map((q, i) => (
              <div key={q.id} className="glass group rounded-[2rem] p-6 border-white/5 transition-all hover:border-primary/30">
                <div className="flex flex-col md:flex-row gap-6">
                    {/* Reordering Controls */}
                    <div className="flex md:flex-col gap-2 justify-center">
                        <button onClick={() => moveQuestion(i, 'up')} className="p-2 rounded-lg glass hover:text-primary transition"><FiArrowUp /></button>
                        <span className="w-8 h-8 flex items-center justify-center font-black text-primary bg-primary/10 rounded-lg">{i+1}</span>
                        <button onClick={() => moveQuestion(i, 'down')} className="p-2 rounded-lg glass hover:text-primary transition"><FiArrowDown /></button>
                    </div>

                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-3">
                            <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-tighter ${q.type==='mcq'?'bg-blue-500/10 text-blue-400':'bg-amber-500/10 text-amber-400'}`}>
                                {q.type==='mcq'?'اختيار من متعدد':'سؤال مقالي'}
                            </span>
                            <span className="text-[10px] font-black bg-white/5 px-3 py-1 rounded-full text-gray-400 tracking-tighter">{q.points} نقاط</span>
                        </div>
                        <h4 className="text-lg font-bold mb-4 leading-relaxed">{q.question}</h4>
                        
                        {q.image_url && <img src={q.image_url} alt="" className="rounded-2xl mb-4 max-h-64 object-cover border border-white/5" />}
                        
                        {q.options && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                {q.options.map((opt,j) => (
                                    <div key={j} className={`text-sm px-4 py-3 rounded-xl border ${opt===q.correct_answer?'bg-green-500/10 border-green-500/30 text-green-400 font-bold':'bg-white/5 border-white/5 text-gray-400'}`}>
                                        {opt===q.correct_answer ? '✅ ' : '○ '} {opt}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                    
                    <button onClick={async()=>{ if(confirm('حذف السؤال؟')){ await supabase.from('exam_questions').delete().eq('id',q.id); toast.success('تم الحذف'); load(); } }} className="self-start p-4 rounded-2xl bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all shadow-lg">
                        <FiTrash2 size={20} />
                    </button>
                </div>
              </div>
            ))}
            {questions.length===0 && <div className="glass rounded-[3rem] p-20 text-center border-dashed border-white/10"><p className="text-gray-500 font-bold">الامتحان فاضي.. ضيف أول سؤال!</p></div>}
          </div>
        </div>
      )}

      {/* RESULTS TAB CONTENT */}
      {activeTab === 'results' && (
        <div className="space-y-4 animate-fade-in">
          {submitted.map(attempt => {
            const passed = attempt.percentage >= (exam?.pass_score || 50);
            return (
              <div key={attempt.id} className="glass rounded-3xl p-6 border-white/5 hover:border-white/20 transition-all">
                <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                  <div className="flex items-center gap-4 text-center md:text-right">
                    <div className="w-14 h-14 gradient-primary rounded-2xl flex items-center justify-center font-black text-white text-xl shadow-lg shadow-primary/20">
                        {attempt.students?.name?.[0]}
                    </div>
                    <div>
                      <h4 className="font-black text-lg">{attempt.students?.name}</h4>
                      <p className="text-xs text-gray-500 font-mono tracking-tighter">{attempt.students?.student_code || attempt.students?.email}</p>
                      {attempt.force_submitted && <span className="flex items-center gap-1 text-[10px] font-bold text-amber-500 mt-1"><FiAlertTriangle size={10}/> سحب ورقة تلقائي</span>}
                    </div>
                  </div>

                  <div className="flex items-center gap-8 text-center">
                    <div>
                        <p className={`text-3xl font-black ${passed?'text-green-400':'text-red-400'}`}>{Math.round(attempt.percentage)}%</p>
                        <p className="text-[10px] font-bold text-gray-500 uppercase">النسبة المئوية</p>
                    </div>
                    <div>
                        <p className="text-xl font-black text-white">{attempt.score} <span className="text-xs text-gray-500">/ {attempt.total_points}</span></p>
                        <p className="text-[10px] font-bold text-gray-500 uppercase">النقاط</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 w-full md:w-auto">
                    <div className={`flex-1 md:flex-none px-6 py-3 rounded-2xl text-center font-black text-sm ${passed?'bg-green-500/10 text-green-400':'bg-red-500/10 text-red-500'}`}>
                        {passed ? 'PASS ✅' : 'FAIL ❌'}
                    </div>
                    <button onClick={() => reopenAttempt(attempt.id, attempt.students?.name)}
                      className="p-3.5 rounded-2xl bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500 hover:text-white transition-all shadow-lg"
                      title="تصفير المحاولة وإعادة فتح الامتحان">
                      <FiRefreshCw size={20}/>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
          {submitted.length===0 && <div className="glass rounded-[3rem] p-20 text-center border-dashed border-white/10 text-gray-500 font-bold">لا يوجد نتائج لعرضها حالياً.</div>}
        </div>
      )}

      {/* LIVE CONTENT */}
      {activeTab === 'open' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-fade-in">
          {attempts.filter(a=>!a.is_submitted).map(attempt => (
            <div key={attempt.id} className="glass rounded-2xl p-5 border-amber-500/20 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-1 h-full bg-amber-500/40 animate-pulse" />
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center font-black text-white">
                    {attempt.students?.name?.[0]}
                </div>
                <div>
                  <h5 className="font-bold text-sm truncate w-32">{attempt.students?.name}</h5>
                  <p className="text-[10px] text-amber-500 font-black animate-pulse">يؤدي الامتحان الآن ⚡</p>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-white/5 flex justify-between items-center text-[10px] font-bold text-gray-500">
                <span>بدأ الساعة {new Date(attempt.started_at).toLocaleTimeString('ar-EG')}</span>
                <span className="bg-white/5 px-2 py-1 rounded-md">ID: {attempt.students?.student_code || '---'}</span>
              </div>
            </div>
          ))}
          {attempts.filter(a=>!a.is_submitted).length === 0 && <div className="col-span-full py-20 text-center glass rounded-[3rem] text-gray-500 font-bold">لا يوجد طلاب ممتحنين حالياً.</div>}
        </div>
      )}
    </div>
  );
}
