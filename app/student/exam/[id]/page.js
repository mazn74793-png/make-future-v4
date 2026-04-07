'use client';
import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useParams, useRouter } from 'next/navigation';
import { FiClock, FiCheck, FiAlertTriangle, FiChevronRight, FiChevronLeft } from 'react-icons/fi';

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

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
  const examRef = useRef(null);
  const timeLeftRef = useRef(0);

  useEffect(() => { answersRef.current = answers; }, [answers]);
  useEffect(() => { questionsRef.current = questions; }, [questions]);
  useEffect(() => { examRef.current = exam; }, [exam]);
  useEffect(() => { timeLeftRef.current = timeLeft; }, [timeLeft]);

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
      totalPoints += (q.points || 1);
      if (q.type === 'mcq' && q.correct_answer === finalAnswers[q.id]) score += (q.points || 1);
    });
    const percentage = totalPoints > 0 ? (score / totalPoints) * 100 : 0;
    const timeTaken = (examRef.current?.duration_minutes * 60) - timeLeftRef.current;

    setPhase('loading');
    const { data: updated } = await supabase.from('exam_attempts').update({
      answers: finalAnswers,
      score,
      total_points: totalPoints,
      percentage,
      time_taken_seconds: timeTaken,
      submitted_at: new Date().toISOString(),
      is_submitted: true,
      force_submitted: forced,
    }).eq('id', att.id).select().single();

    if (updated) { setResult(updated); setPhase('submitted'); }
  }, [phase]);

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/login'); return; }

      const { data: st } = await supabase.from('students').select('*').eq('user_id', user.id).single();
      if (!st || st.status !== 'approved') { router.push('/student'); return; }
      setStudent(st);

      const { data: ex } = await supabase.from('exams').select('*').eq('id', id).eq('is_active', true).single();
      if (!ex) { router.push('/student'); return; }
      setExam(ex);

      const { data: qs } = await supabase.from('exam_questions')
        .select('id,question,type,options,correct_answer,points,image_url,order_num')
        .eq('exam_id', id).order('order_num');

      const orderedQs = ex.shuffle_questions ? shuffle(qs || []) : (qs || []);
      setQuestions(orderedQs);

      // شيك على محاولة موجودة
      const { data: att } = await supabase.from('exam_attempts')
        .select('*').eq('exam_id', id).eq('student_id', st.id).maybeSingle();

      if (att?.is_submitted) {
        setResult(att);
        setPhase('submitted');
        return;
      }

      if (att && !att.is_submitted) {
        // محاولة ناقصة — رجّعله من حيث وقف
        attemptRef.current = att;
        setAnswers(att.answers || {});
        const elapsed = Math.floor((Date.now() - new Date(att.started_at).getTime()) / 1000);
        const remain = (ex.duration_minutes * 60) - elapsed;
        if (remain <= 0) {
          await supabase.from('exam_attempts').update({
            is_submitted: true, force_submitted: true,
            submitted_at: new Date().toISOString(),
          }).eq('id', att.id);
          const { data: done } = await supabase.from('exam_attempts').select('*').eq('id', att.id).single();
          setResult(done);
          setPhase('submitted');
          return;
        }
        setTimeLeft(remain);
        setPhase('exam');
        timerRef.current = setInterval(() => {
          setTimeLeft(prev => {
            if (prev <= 1) { clearInterval(timerRef.current); submitExam(true); return 0; }
            return prev - 1;
          });
        }, 1000);
        return;
      }

      setPhase('instructions');
    };
    load();
    return () => clearInterval(timerRef.current);
  }, [id, router, submitExam]);

  const startExam = async () => {
    const { data: newAtt } = await supabase.from('exam_attempts').insert({
      exam_id: id,
      student_id: student.id,
      started_at: new Date().toISOString(),
      answers: {},
      question_order: questions.map(q => q.id),
    }).select().single();
    attemptRef.current = newAtt;
    setTimeLeft(exam.duration_minutes * 60);
    setPhase('exam');
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) { clearInterval(timerRef.current); submitExam(true); return 0; }
        return prev - 1;
      });
    }, 1000);
  };

  const handleAnswer = async (qId, val) => {
    const newAns = { ...answers, [qId]: val };
    setAnswers(newAns);
    setIsSaving(true);
    await supabase.from('exam_attempts').update({ answers: newAns }).eq('id', attemptRef.current.id);
    setIsSaving(false);
  };

  const formatTime = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  // ===== LOADING =====
  if (phase === 'loading') return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg)' }}>
      <div className="w-14 h-14 rounded-full border-4 border-t-transparent animate-spin"
        style={{ borderColor: 'rgba(99,102,241,0.3)', borderTopColor: '#6366f1' }} />
    </div>
  );

  // ===== INSTRUCTIONS =====
  if (phase === 'instructions') return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'var(--bg)' }} dir="rtl">
      <div className="rounded-3xl p-8 max-w-lg w-full" style={{ background: 'var(--bg2)', border: '1px solid var(--border)' }}>
        <h1 className="text-2xl font-black mb-2" style={{ color: 'var(--text)' }}>{exam?.title}</h1>
        <div className="flex flex-wrap gap-3 text-sm mb-4" style={{ color: 'var(--text-muted)' }}>
          <span>⏱️ {exam?.duration_minutes} دقيقة</span>
          <span>❓ {questions.length} سؤال</span>
          <span>🎯 نجاح من {exam?.pass_score}%</span>
          {exam?.shuffle_questions && <span>🔀 عشوائي</span>}
        </div>
        {exam?.start_time && (
          <div className="p-3 rounded-xl mb-3 text-sm" style={{ background: 'rgba(99,102,241,0.08)', color: '#818cf8' }}>
            📅 من {new Date(exam.start_time).toLocaleString('ar-EG')}
            {exam.end_time && ` حتى ${new Date(exam.end_time).toLocaleString('ar-EG')}`}
          </div>
        )}
        {exam?.instructions && (
          <div className="p-4 rounded-xl mb-4 text-sm leading-relaxed" style={{ background: 'var(--surface)', color: 'var(--text-muted)' }}>
            {exam.instructions}
          </div>
        )}
        <div className="p-3 rounded-xl mb-6 text-sm font-bold flex items-center gap-2"
          style={{ background: 'rgba(251,191,36,0.08)', color: '#fbbf24', border: '1px solid rgba(251,191,36,0.2)' }}>
          <FiAlertTriangle size={14} /> لو الوقت خلص هيتسلم تلقائياً!
        </div>
        <button onClick={startExam} className="w-full py-4 rounded-xl text-white font-black text-lg hover:opacity-90 transition"
          style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', boxShadow: '0 4px 20px rgba(99,102,241,0.3)' }}>
          🚀 ابدأ الامتحان
        </button>
      </div>
    </div>
  );

  // ===== EXAM =====
  if (phase === 'exam') {
    const q = questions[currentQ];
    const answeredCount = Object.keys(answers).length;

    return (
      <div className="min-h-screen" style={{ background: 'var(--bg)' }} dir="rtl">
        {/* Header */}
        <div className="sticky top-0 z-10 px-4 py-3 flex items-center justify-between"
          style={{
            background: 'var(--glass-bg)', backdropFilter: 'blur(16px)',
            borderBottom: `1px solid ${timeLeft < 60 ? 'rgba(248,113,113,0.3)' : 'var(--border)'}`,
          }}>
          <div className="flex items-center gap-3">
            <h2 className="font-black text-sm truncate max-w-[160px]" style={{ color: 'var(--text)' }}>{exam?.title}</h2>
            {isSaving && <span className="text-xs animate-pulse" style={{ color: '#34d399' }}>💾 حفظ...</span>}
          </div>
          <div className={`flex items-center gap-1.5 font-black text-lg px-4 py-2 rounded-xl ${timeLeft < 60 ? 'animate-pulse' : ''}`}
            style={{
              background: timeLeft < 60 ? 'rgba(248,113,113,0.15)' : 'var(--surface)',
              color: timeLeft < 60 ? '#f87171' : 'var(--text)',
            }}>
            <FiClock size={16} /> {formatTime(timeLeft)}
          </div>
        </div>

        {/* Navigator */}
        <div className="px-4 py-3 overflow-x-auto" style={{ borderBottom: '1px solid var(--border)', scrollbarWidth: 'none' }}>
          <div className="flex gap-1.5">
            {questions.map((ques, i) => {
              const s = answers[ques.id] !== undefined ? 'answered' : i === currentQ ? 'current' : 'unanswered';
              return (
                <button key={ques.id} onClick={() => setCurrentQ(i)}
                  className="w-9 h-9 rounded-xl text-xs font-black flex-shrink-0 transition-all"
                  style={{
                    background: s === 'answered' ? '#34d399' : s === 'current' ? '#6366f1' : 'var(--surface)',
                    color: s === 'unanswered' ? 'var(--text-muted)' : 'white',
                    border: s === 'current' ? '2px solid #818cf8' : '1px solid transparent',
                  }}>
                  {i + 1}
                </button>
              );
            })}
          </div>
          <div className="flex gap-4 mt-2 text-xs" style={{ color: 'var(--text-muted)' }}>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded" style={{ background: '#34d399', display: 'inline-block' }} />
              تم ({answeredCount})
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded" style={{ background: 'var(--surface)', display: 'inline-block' }} />
              لم يجب ({questions.length - answeredCount})
            </span>
          </div>
        </div>

        {/* Question */}
        <div className="max-w-3xl mx-auto px-4 py-6">
          {q && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <span className="w-8 h-8 rounded-xl flex items-center justify-center font-black text-sm text-white"
                  style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
                  {currentQ + 1}
                </span>
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  {q.points || 1} درجة • {q.type === 'mcq' ? 'اختيار من متعدد' : 'إجابة نصية'}
                </span>
              </div>

              <p className="font-bold text-lg mb-5 leading-relaxed" style={{ color: 'var(--text)' }}>
                {q.question}
              </p>

              {/* صورة السؤال */}
              {q.image_url && (
                <img src={q.image_url} alt="" className="rounded-2xl mb-5 max-h-72 object-contain w-full"
                  style={{ border: '1px solid var(--border)' }} />
              )}

              {/* MCQ Options */}
              {q.type === 'mcq' ? (
                <div className="space-y-3 mb-6">
                  {q.options?.map((opt, j) => (
                    <button key={j} onClick={() => handleAnswer(q.id, opt)}
                      className="w-full text-right px-5 py-4 rounded-2xl transition-all font-medium"
                      style={{
                        background: answers[q.id] === opt ? 'rgba(99,102,241,0.18)' : 'var(--surface)',
                        border: `2px solid ${answers[q.id] === opt ? '#6366f1' : 'var(--border)'}`,
                        color: 'var(--text)',
                        transform: answers[q.id] === opt ? 'scale(1.01)' : 'scale(1)',
                      }}>
                      <span className="ml-3" style={{ color: answers[q.id] === opt ? '#818cf8' : 'var(--text-faint)' }}>
                        {answers[q.id] === opt ? '✅' : '○'}
                      </span>
                      {opt}
                    </button>
                  ))}
                </div>
              ) : (
                <textarea value={answers[q.id] || ''}
                  onChange={e => handleAnswer(q.id, e.target.value)}
                  placeholder="اكتب إجابتك هنا..." rows={4}
                  className="w-full py-3 px-4 rounded-xl focus:outline-none resize-none mb-6"
                  style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)' }} />
              )}

              {/* Navigation */}
              <div className="flex items-center justify-between gap-3">
                <button onClick={() => setCurrentQ(Math.max(0, currentQ - 1))} disabled={currentQ === 0}
                  className="flex items-center gap-1.5 px-5 py-3 rounded-xl font-bold text-sm disabled:opacity-30 transition"
                  style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)' }}>
                  <FiChevronRight /> السابق
                </button>

                <span className="text-sm font-bold" style={{ color: 'var(--text-muted)' }}>
                  {currentQ + 1} / {questions.length}
                </span>

                {currentQ < questions.length - 1 ? (
                  <button onClick={() => setCurrentQ(currentQ + 1)}
                    className="flex items-center gap-1.5 px-5 py-3 rounded-xl font-bold text-sm text-white transition hover:opacity-90"
                    style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
                    التالي <FiChevronLeft />
                  </button>
                ) : (
                  <button onClick={() => submitExam(false)}
                    className="flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm text-white transition hover:opacity-90"
                    style={{ background: 'linear-gradient(135deg, #34d399, #059669)' }}>
                    <FiCheck size={15} /> تسليم الامتحان
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ===== SUBMITTED — نتيجة + تقرير =====
  if (phase === 'submitted' && result) {
    const passed = result.percentage >= (exam?.pass_score || 50);
    const answersMap = result.answers || {};

    return (
      <div className="min-h-screen px-4 py-8" style={{ background: 'var(--bg)' }} dir="rtl">
        <div className="max-w-3xl mx-auto">

          {/* Result Card */}
          <div className="rounded-3xl p-8 text-center mb-8"
            style={{
              background: 'var(--bg2)',
              border: `2px solid ${passed ? 'rgba(52,211,153,0.3)' : 'rgba(248,113,113,0.3)'}`,
            }}>
            {result.force_submitted && (
              <div className="flex items-center gap-2 justify-center px-4 py-2 rounded-xl mb-4 text-sm font-bold w-fit mx-auto"
                style={{ background: 'rgba(248,113,113,0.1)', color: '#f87171' }}>
                <FiAlertTriangle size={13} /> انتهى الوقت — تم التسليم تلقائياً
              </div>
            )}
            <div className="text-5xl mb-3">{passed ? '🎉' : '😔'}</div>
            <h1 className="text-2xl font-black mb-1" style={{ color: 'var(--text)' }}>
              {passed ? 'مبروك! نجحت' : 'للأسف لم تنجح'}
            </h1>
            <div className="text-6xl font-black my-4" style={{ color: passed ? '#34d399' : '#f87171' }}>
              {Math.round(result.percentage || 0)}%
            </div>
            <div className="flex items-center justify-center gap-6 text-sm" style={{ color: 'var(--text-muted)' }}>
              <span>الدرجة: {result.score} / {result.total_points}</span>
              {result.time_taken_seconds && (
                <span>الوقت: {formatTime(result.time_taken_seconds)}</span>
              )}
            </div>
          </div>

          {/* تقرير الإجابات — فقط لو في أسئلة */}
          {questions.length > 0 && (
            <div>
              <h2 className="font-black text-xl mb-4" style={{ color: 'var(--text)' }}>📊 تقرير الإجابات</h2>
              <div className="space-y-4">
                {questions.map((q, i) => {
                  const studentAnswer = answersMap[q.id];
                  const isCorrect = q.type === 'mcq' ? studentAnswer === q.correct_answer : null;

                  return (
                    <div key={q.id} className="rounded-2xl p-5"
                      style={{
                        background: q.type === 'mcq'
                          ? (isCorrect ? 'rgba(52,211,153,0.05)' : 'rgba(248,113,113,0.05)')
                          : 'var(--bg2)',
                        border: `1px solid ${q.type === 'mcq'
                          ? (isCorrect ? 'rgba(52,211,153,0.2)' : 'rgba(248,113,113,0.2)')
                          : 'var(--border)'}`,
                      }}>
                      <div className="flex items-start gap-3 mb-3">
                        <span className="w-7 h-7 rounded-xl flex items-center justify-center text-xs font-black text-white flex-shrink-0"
                          style={{ background: q.type === 'mcq' ? (isCorrect ? '#34d399' : '#f87171') : '#818cf8' }}>
                          {i + 1}
                        </span>
                        <p className="font-bold text-sm leading-relaxed" style={{ color: 'var(--text)' }}>{q.question}</p>
                      </div>

                      {/* صورة السؤال في التقرير */}
                      {q.image_url && (
                        <img src={q.image_url} alt="" className="rounded-xl mb-3 max-h-40 object-contain"
                          style={{ border: '1px solid var(--border)' }} />
                      )}

                      {q.type === 'mcq' ? (
                        <div className="space-y-1.5 mr-10">
                          {q.options?.map((opt, j) => {
                            const isSelected = studentAnswer === opt;
                            const isRight = opt === q.correct_answer;
                            return (
                              <div key={j} className="flex items-center gap-2 text-sm px-3 py-2.5 rounded-xl"
                                style={{
                                  background: isRight ? 'rgba(52,211,153,0.12)' : isSelected && !isRight ? 'rgba(248,113,113,0.12)' : 'var(--surface)',
                                  border: `1px solid ${isRight ? 'rgba(52,211,153,0.3)' : isSelected && !isRight ? 'rgba(248,113,113,0.3)' : 'var(--border)'}`,
                                  color: isRight ? '#34d399' : isSelected && !isRight ? '#f87171' : 'var(--text-muted)',
                                  fontWeight: isRight || isSelected ? '700' : '400',
                                }}>
                                {isRight ? '✅' : isSelected && !isRight ? '❌' : '○'} {opt}
                                {isRight && <span className="mr-auto text-xs opacity-60">(الإجابة الصحيحة)</span>}
                                {isSelected && !isRight && <span className="mr-auto text-xs opacity-60">(إجابتك)</span>}
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="mr-10 space-y-2">
                          <div className="text-sm p-3 rounded-xl" style={{ background: 'var(--surface)', color: 'var(--text-muted)' }}>
                            <span className="font-bold" style={{ color: 'var(--text-muted)' }}>إجابتك: </span>
                            {studentAnswer || <span style={{ color: 'var(--text-faint)', fontStyle: 'italic' }}>لم تجب على هذا السؤال</span>}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="text-center mt-8">
                <a href="/student" className="inline-block px-8 py-3.5 rounded-xl text-white font-black transition hover:opacity-90"
                  style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
                  رجوع للرئيسية
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return null;
}
