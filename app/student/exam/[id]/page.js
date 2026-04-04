'use client';
import { useEffect, useState, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useParams, useRouter } from 'next/navigation';
import { FiClock, FiCheck, FiAlertTriangle } from 'react-icons/fi';

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
  const [attempt, setAttempt] = useState(null);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [phase, setPhase] = useState('loading');
  const [result, setResult] = useState(null);
  const [currentQ, setCurrentQ] = useState(0);
  const timerRef = useRef(null);
  const attemptRef = useRef(null);
  const answersRef = useRef({});

  // sync answersRef مع answers
  useEffect(() => { answersRef.current = answers; }, [answers]);

  const submitExam = useCallback(async (forced = false) => {
    clearInterval(timerRef.current);
    const att = attemptRef.current;
    if (!att) return;

    const qs = questions.length > 0 ? questions : [];
    const totalPoints = qs.reduce((sum, q) => sum + q.points, 0);
    let score = 0;
    qs.forEach(q => {
      if (q.type === 'mcq' && answersRef.current[q.id] === q.correct_answer) score += q.points;
    });
    const percentage = totalPoints > 0 ? (score / totalPoints) * 100 : 0;
    const timeTaken = (exam?.duration_minutes * 60) - timeLeft;

    const { data: updated } = await supabase.from('exam_attempts').update({
      answers: answersRef.current, score, total_points: totalPoints, percentage,
      time_taken_seconds: timeTaken,
      submitted_at: new Date().toISOString(),
      is_submitted: true,
      force_submitted: forced,
    }).eq('id', att.id).select().single();

    setResult(updated);
    setPhase('submitted');
  }, [questions, timeLeft, exam]);

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/login'); return; }
      const { data: studentData } = await supabase.from('students').select('*').eq('user_id', user.id).single();
      if (!studentData) { router.push('/student'); return; }
      setStudent(studentData);

      const { data: examData } = await supabase.from('exams').select('*').eq('id', id).eq('is_active', true).single();
      if (!examData) { router.push('/student'); return; }
      setExam(examData);

      const { data: existing } = await supabase.from('exam_attempts')
        .select('*').eq('exam_id', id).eq('student_id', studentData.id).eq('is_submitted', true).single();
      if (existing) { setResult(existing); setPhase('submitted'); return; }

      const { data: qData } = await supabase.from('exam_questions').select('*').eq('exam_id', id).order('order_num');
      const shuffled = examData.shuffle_questions ? shuffle(qData || []) : (qData || []);
      setQuestions(shuffled);
      setTimeLeft(examData.duration_minutes * 60);
      setPhase('instructions');
    };
    load();
  }, [id, router]);

  const startExam = async () => {
    const { data: newAttempt } = await supabase.from('exam_attempts').insert({
      exam_id: id, student_id: student.id,
      started_at: new Date().toISOString(),
      question_order: questions.map(q => q.id),
    }).select().single();
    attemptRef.current = newAttempt;
    setAttempt(newAttempt);
    setPhase('exam');

    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          submitExam(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  useEffect(() => () => clearInterval(timerRef.current), []);

  const formatTime = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  const getQStatus = (q) => {
    if (answers[q.id] !== undefined) return 'answered';
    if (questions.indexOf(q) === currentQ) return 'current';
    return 'unanswered';
  };

  const qStatusStyle = (q) => {
    const s = getQStatus(q);
    if (s === 'answered') return { background: '#34d399', color: 'white' };
    if (s === 'current') return { background: '#6366f1', color: 'white' };
    return { background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)' };
  };

  if (phase === 'loading') return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg)' }}>
      <div className="w-14 h-14 rounded-full border-4 border-t-transparent animate-spin" style={{ borderColor: 'rgba(99,102,241,0.3)', borderTopColor: '#6366f1' }} />
    </div>
  );

  if (phase === 'submitted' && result) {
    const passed = result.percentage >= (exam?.pass_score || 50);
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'var(--bg)' }} dir="rtl">
        <div className="rounded-3xl p-10 text-center max-w-md w-full"
          style={{ background: 'var(--bg2)', border: `1px solid ${passed ? 'rgba(52,211,153,0.3)' : 'rgba(248,113,113,0.3)'}` }}>
          {result.force_submitted && (
            <div className="flex items-center gap-2 justify-center px-4 py-2 rounded-xl mb-4 text-sm font-bold"
              style={{ background: 'rgba(248,113,113,0.1)', color: '#f87171' }}>
              <FiAlertTriangle /> انتهى الوقت — تم التسليم تلقائياً
            </div>
          )}
          <div className="text-6xl mb-4">{passed ? '🎉' : '😔'}</div>
          <h1 className="text-2xl font-black mb-2" style={{ color: 'var(--text)' }}>{passed ? 'مبروك! نجحت' : 'للأسف لم تنجح'}</h1>
          <div className="text-6xl font-black my-6" style={{ color: passed ? '#34d399' : '#f87171' }}>
            {Math.round(result.percentage || 0)}%
          </div>
          <p style={{ color: 'var(--text-muted)' }}>درجتك: {result.score} من {result.total_points}</p>
          {result.time_taken_seconds && <p className="mt-1" style={{ color: 'var(--text-muted)' }}>الوقت: {formatTime(result.time_taken_seconds)}</p>}
          <a href="/student" className="mt-6 inline-block px-8 py-3 rounded-xl text-white font-bold"
            style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>رجوع للرئيسية</a>
        </div>
      </div>
    );
  }

  if (phase === 'instructions') return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'var(--bg)' }} dir="rtl">
      <div className="rounded-3xl p-8 max-w-lg w-full" style={{ background: 'var(--bg2)', border: '1px solid var(--border)' }}>
        <h1 className="text-2xl font-black mb-2" style={{ color: 'var(--text)' }}>{exam?.title}</h1>
        <div className="flex flex-wrap gap-3 text-sm mb-6" style={{ color: 'var(--text-muted)' }}>
          <span>⏱️ {exam?.duration_minutes} دقيقة</span>
          <span>❓ {questions.length} سؤال</span>
          <span>🎯 نجاح من {exam?.pass_score}%</span>
          {exam?.shuffle_questions && <span>🔀 الأسئلة مرتبة عشوائياً</span>}
        </div>
        {exam?.instructions && (
          <div className="p-4 rounded-xl mb-5 text-sm" style={{ background: 'var(--surface)', color: 'var(--text-muted)' }}>
            {exam.instructions}
          </div>
        )}
        <div className="p-4 rounded-xl mb-6 text-sm font-bold flex items-center gap-2"
          style={{ background: 'rgba(251,191,36,0.1)', color: '#fbbf24', border: '1px solid rgba(251,191,36,0.2)' }}>
          <FiAlertTriangle /> بمجرد البدء الوقت يجري ولو خلص يتسلم تلقائياً!
        </div>
        <button onClick={startExam} className="w-full py-4 rounded-xl text-white font-black text-lg hover:opacity-90 transition"
          style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
          🚀 ابدأ الامتحان
        </button>
      </div>
    </div>
  );

  const currentQuestion = questions[currentQ];

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }} dir="rtl">
      {/* Header */}
      <div className={`sticky top-0 z-10 px-4 py-3 flex items-center justify-between ${timeLeft < 60 ? 'border-red-400/30' : ''}`}
        style={{ background: 'var(--glass-bg)', backdropFilter: 'blur(16px)', borderBottom: `1px solid ${timeLeft < 60 ? 'rgba(248,113,113,0.3)' : 'var(--border)'}` }}>
        <h2 className="font-black text-sm truncate max-w-xs" style={{ color: 'var(--text)' }}>{exam?.title}</h2>
        <div className={`flex items-center gap-2 font-black text-xl px-4 py-2 rounded-xl ${timeLeft < 60 ? 'animate-pulse' : ''}`}
          style={{ background: timeLeft < 60 ? 'rgba(248,113,113,0.15)' : 'var(--surface)', color: timeLeft < 60 ? '#f87171' : 'var(--text)' }}>
          <FiClock size={18} /> {formatTime(timeLeft)}
        </div>
      </div>

      {/* Question Navigator */}
      <div className="px-4 py-3 overflow-x-auto" style={{ borderBottom: '1px solid var(--border)' }}>
        <div className="flex gap-2">
          {questions.map((q, i) => (
            <button key={q.id} onClick={() => setCurrentQ(i)}
              className="w-9 h-9 rounded-xl text-sm font-bold flex-shrink-0 transition-all"
              style={qStatusStyle(q)}>
              {i + 1}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-4 mt-2 text-xs" style={{ color: 'var(--text-muted)' }}>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded" style={{ background: '#34d399', display: 'inline-block' }} /> تم الإجابة ({Object.keys(answers).length})</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded" style={{ background: '#6366f1', display: 'inline-block' }} /> الحالي</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded" style={{ background: 'rgba(255,255,255,0.1)', display: 'inline-block' }} /> لم يُجب ({questions.length - Object.keys(answers).length})</span>
        </div>
      </div>

      {/* Question */}
      <div className="max-w-3xl mx-auto px-4 py-6">
        {currentQuestion && (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <span className="w-8 h-8 rounded-xl flex items-center justify-center font-bold text-sm text-white"
                style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>{currentQ + 1}</span>
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{currentQuestion.points} درجة • {currentQuestion.type === 'mcq' ? 'اختيار متعدد' : 'نصي'}</span>
            </div>

            <p className="font-bold text-lg mb-4 leading-relaxed" style={{ color: 'var(--text)' }}>{currentQuestion.question}</p>

            {currentQuestion.image_url && (
              <img src={currentQuestion.image_url} alt="" className="rounded-xl mb-4 max-h-64 object-contain w-full" />
            )}

            {currentQuestion.type === 'mcq' ? (
              <div className="space-y-2 mb-6">
                {currentQuestion.options?.map((opt, j) => (
                  <button key={j} onClick={() => setAnswers(prev => ({ ...prev, [currentQuestion.id]: opt }))}
                    className="w-full text-right px-4 py-3 rounded-xl transition-all font-medium"
                    style={{
                      background: answers[currentQuestion.id] === opt ? 'rgba(99,102,241,0.2)' : 'var(--surface)',
                      border: `2px solid ${answers[currentQuestion.id] === opt ? '#6366f1' : 'var(--border)'}`,
                      color: 'var(--text)',
                    }}>
                    {answers[currentQuestion.id] === opt ? '✅' : '○'} {opt}
                  </button>
                ))}
              </div>
            ) : (
              <textarea value={answers[currentQuestion.id] || ''} onChange={e => setAnswers(prev => ({ ...prev, [currentQuestion.id]: e.target.value }))}
                placeholder="اكتب إجابتك هنا..." rows={4}
                className="w-full py-3 px-4 rounded-xl focus:outline-none resize-none mb-6"
                style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)' }} />
            )}

            {/* Navigation */}
            <div className="flex items-center justify-between gap-3">
              <button onClick={() => setCurrentQ(Math.max(0, currentQ - 1))} disabled={currentQ === 0}
                className="px-5 py-2.5 rounded-xl font-bold text-sm disabled:opacity-30 transition"
                style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)' }}>
                ← السابق
              </button>

              <span className="text-sm" style={{ color: 'var(--text-muted)' }}>{currentQ + 1} / {questions.length}</span>

              {currentQ < questions.length - 1
                ? <button onClick={() => setCurrentQ(currentQ + 1)}
                    className="px-5 py-2.5 rounded-xl font-bold text-sm text-white transition hover:opacity-90"
                    style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
                    التالي →
                  </button>
                : <button onClick={() => submitExam(false)}
                    className="px-5 py-2.5 rounded-xl font-bold text-sm text-white transition hover:opacity-90 flex items-center gap-2"
                    style={{ background: 'linear-gradient(135deg, #34d399, #059669)' }}>
                    <FiCheck size={16} /> تسليم
                  </button>
              }
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
