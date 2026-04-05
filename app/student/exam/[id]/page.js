'use client';
import { useEffect, useState, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useParams, useRouter } from 'next/navigation';
import { FiClock, FiCheck, FiAlertTriangle, FiChevronRight, FiChevronLeft, FiSave, FiSend } from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function StudentExamPage() {
  const { id } = useParams();
  const router = useRouter();
  
  const [exam, setExam] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [student, setStudent] = useState(null);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [phase, setPhase] = useState('loading');
  const [result, setResult] = useState(null);
  const [currentQ, setCurrentQ] = useState(0);
  const [isSaving, setIsSaving] = useState(false);

  const timerRef = useRef(null);
  const attemptRef = useRef(null);
  const answersRef = useRef({});
  const questionsRef = useRef([]);

  useEffect(() => { answersRef.current = answers; }, [answers]);
  useEffect(() => { questionsRef.current = questions; }, [questions]);

  // --- 1. تسليم الامتحان ---
  const submitExam = useCallback(async (forced = false) => {
    if (phase === 'submitted') return;
    clearInterval(timerRef.current);
    
    const att = attemptRef.current;
    if (!att) return;

    const qs = questionsRef.current;
    const finalAnswers = answersRef.current;
    
    let score = 0;
    let totalPoints = 0;

    qs.forEach(q => {
      totalPoints += q.points;
      if (q.correct_answer === finalAnswers[q.id]) {
        score += q.points;
      }
    });

    const percentage = totalPoints > 0 ? (score / totalPoints) * 100 : 0;
    setPhase('loading');
    
    const { data: updated, error } = await supabase.from('exam_attempts').update({
      answers: finalAnswers,
      score,
      total_points: totalPoints,
      percentage,
      submitted_at: new Date().toISOString(),
      is_submitted: true,
      force_submitted: forced,
    }).eq('id', att.id).select().single();

    if (!error) {
      setResult(updated);
      setPhase('submitted');
      toast.success("تم حفظ النتيجة بنجاح");
    }
  }, [phase]);

  // --- 2. تحميل البيانات ---
  useEffect(() => {
    const loadExamData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return router.push('/login');

      const { data: st } = await supabase.from('students').select('*').eq('user_id', user.id).single();
      setStudent(st);

      const { data: ex } = await supabase.from('exams').select('*').eq('id', id).single();
      if (!ex) return router.push('/student');
      setExam(ex);

      // التعديل هنا: استخدمنا maybeSingle عشان ميوقفش الكود لو مفيش محاولة سابقة
      const { data: att } = await supabase.from('exam_attempts')
        .select('*').eq('exam_id', id).eq('student_id', st.id).maybeSingle();

      const { data: qs } = await supabase.from('exam_questions').select('*').eq('exam_id', id).order('order_num');
      setQuestions(qs || []);

      if (att?.is_submitted) {
        setResult(att);
        setPhase('submitted');
      } else if (att) {
        // لو عنده محاولة لسه مخلصتش
        attemptRef.current = att;
        setAnswers(att.answers || {});
        const elapsed = Math.floor((new Date().getTime() - new Date(att.started_at).getTime()) / 1000);
        const remain = (ex.duration_minutes * 60) - elapsed;
        if (remain <= 0) submitExam(true);
        else {
          setTimeLeft(remain);
          setPhase('exam');
          startTimer();
        }
      } else {
        setPhase('instructions');
      }
    };
    loadExamData();
  }, [id]);

  const startTimer = () => {
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) { clearInterval(timerRef.current); submitExam(true); return 0; }
        return prev - 1;
      });
    }, 1000);
  };

  const startExam = async () => {
    const { data: newAtt } = await supabase.from('exam_attempts').insert({
      exam_id: id,
      student_id: student.id,
      started_at: new Date().toISOString(),
      answers: {},
    }).select().single();

    attemptRef.current = newAtt;
    setPhase('exam');
    setTimeLeft(exam.duration_minutes * 60);
    startTimer();
  };

  const handleAnswer = async (qId, val) => {
    const newAns = { ...answers, [qId]: val };
    setAnswers(newAns);
    setIsSaving(true);
    await supabase.from('exam_attempts').update({ answers: newAns }).eq('id', attemptRef.current.id);
    setIsSaving(false);
  };

  // --- UI Rendering ---
  if (phase === 'loading') return <div className="h-screen bg-black flex items-center justify-center">جاري التحميل...</div>;

  if (phase === 'instructions') return (
    <div className="min-h-screen bg-[#09090b] flex items-center justify-center p-6 text-white" dir="rtl">
      <div className="max-w-md w-full bg-[#111114] p-8 rounded-3xl border border-white/5 text-center">
        <FiAlertTriangle className="text-yellow-500 text-5xl mx-auto mb-4" />
        <h2 className="text-2xl font-bold mb-2">{exam.title}</h2>
        <p className="text-gray-400 mb-6 text-sm">مدة الامتحان: {exam.duration_minutes} دقيقة</p>
        <button onClick={startExam} className="w-full py-4 bg-indigo-600 rounded-2xl font-black">ابدأ الآن</button>
      </div>
    </div>
  );

  if (phase === 'exam') {
    const q = questions[currentQ];
    return (
      <div className="min-h-screen bg-[#09090b] text-white" dir="rtl">
        <div className="sticky top-0 z-20 bg-[#09090b]/80 backdrop-blur-md border-b border-white/5 p-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <span className="text-sm font-bold text-gray-400">سؤال {currentQ + 1} من {questions.length}</span>
            {isSaving && <span className="text-[10px] text-emerald-400 animate-pulse">جاري الحفظ...</span>}
          </div>
          <div className={`px-4 py-2 rounded-xl border ${timeLeft < 60 ? 'border-red-500 text-red-500' : 'border-white/10'}`}>
            <FiClock className="inline ml-2" /> {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}
          </div>
        </div>

        <main className="max-w-3xl mx-auto p-6 mt-10">
          <div className="bg-[#111114] p-8 rounded-[2.5rem] border border-white/5">
            <h3 className="text-xl font-bold mb-8 leading-relaxed">{q?.question_text}</h3>
            <div className="space-y-4">
              {q?.options?.map((opt, i) => (
                <button
                  key={i}
                  onClick={() => handleAnswer(q.id, opt)}
                  className={`w-full text-right p-5 rounded-2xl border transition-all ${answers[q.id] === opt ? 'bg-indigo-600 border-indigo-500' : 'bg-white/5 border-transparent hover:border-white/10'}`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-8 flex justify-between items-center">
            <button disabled={currentQ === 0} onClick={() => setCurrentQ(prev => prev - 1)} className="p-4 bg-white/5 rounded-2xl disabled:opacity-20"><FiChevronRight /></button>
            
            {currentQ === questions.length - 1 ? (
              <button onClick={() => submitExam()} className="px-8 py-4 bg-emerald-600 rounded-2xl font-bold flex items-center gap-2">تسليم الامتحان <FiSend /></button>
            ) : (
              <button onClick={() => setCurrentQ(prev => prev + 1)} className="p-4 bg-white/5 rounded-2xl"><FiChevronLeft /></button>
            )}
          </div>
        </main>
      </div>
    );
  }

  if (phase === 'submitted') return (
    <div className="min-h-screen bg-[#09090b] flex items-center justify-center p-6 text-white text-center" dir="rtl">
      <div className="max-w-md w-full bg-[#111114] p-10 rounded-[3rem] border border-white/5">
        <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <FiCheck className="text-4xl text-emerald-500" />
        </div>
        <h2 className="text-3xl font-black mb-2">تم التسليم!</h2>
        <div className="text-5xl font-black text-indigo-500 my-6">{result.percentage}%</div>
        <p className="text-gray-400 mb-8">لقد أجبت بشكل صحيح على {result.score} من {result.total_points} درجة.</p>
        <button onClick={() => router.push('/student')} className="w-full py-4 bg-white/5 rounded-2xl font-bold border border-white/10">العودة للرئيسية</button>
      </div>
    </div>
  );

  return null;
}
