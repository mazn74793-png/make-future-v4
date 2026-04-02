'use client';
import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useParams, useRouter } from 'next/navigation';
import { FiClock, FiCheck } from 'react-icons/fi';

export default function StudentExamPage() {
  const { id } = useParams();
  const router = useRouter();
  const [exam, setExam] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [student, setStudent] = useState(null);
  const [attempt, setAttempt] = useState(null);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [phase, setPhase] = useState('loading'); // loading | instructions | exam | submitted
  const [result, setResult] = useState(null);
  const timerRef = useRef(null);

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

      // هل سبق وعمل الامتحان؟
      const { data: existingAttempt } = await supabase.from('exam_attempts')
        .select('*').eq('exam_id', id).eq('student_id', studentData.id).eq('is_submitted', true).single();

      if (existingAttempt) {
        setResult(existingAttempt);
        setPhase('submitted');
        return;
      }

      const { data: qData } = await supabase.from('exam_questions').select('*').eq('exam_id', id).order('order_num');
      setQuestions(qData || []);
      setTimeLeft(examData.duration_minutes * 60);
      setPhase('instructions');
    };
    load();
  }, [id, router]);

  const startExam = async () => {
    const { data: newAttempt } = await supabase.from('exam_attempts').insert({
      exam_id: id, student_id: student.id, started_at: new Date().toISOString()
    }).select().single();
    setAttempt(newAttempt);
    setPhase('exam');

    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) { clearInterval(timerRef.current); submitExam(); return 0; }
        return prev - 1;
      });
    }, 1000);
  };

  const submitExam = async () => {
    clearInterval(timerRef.current);
    if (!attempt) return;

    const totalPoints = questions.reduce((sum, q) => sum + q.points, 0);
    let score = 0;

    questions.forEach(q => {
      if (q.type === 'mcq' && answers[q.id] === q.correct_answer) {
        score += q.points;
      }
    });

    const percentage = totalPoints > 0 ? (score / totalPoints) * 100 : 0;
    const timeTaken = (exam.duration_minutes * 60) - timeLeft;

    const { data: updatedAttempt } = await supabase.from('exam_attempts').update({
      answers, score, total_points: totalPoints, percentage,
      time_taken_seconds: timeTaken,
      submitted_at: new Date().toISOString(),
      is_submitted: true,
    }).eq('id', attempt.id).select().single();

    setResult(updatedAttempt);
    setPhase('submitted');
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  if (phase === 'loading') return (
    <div className="min-h-screen flex items-center justify-center gradient-dark">
      <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (phase === 'submitted' && result) {
    const passed = result.percentage >= (exam?.pass_score || 50);
    return (
      <div className="min-h-screen flex items-center justify-center gradient-dark px-4" dir="rtl">
        <div className="glass rounded-3xl p-10 text-center max-w-md w-full">
          <div className="text-6xl mb-4">{passed ? '🎉' : '😔'}</div>
          <h1 className="text-3xl font-black mb-2">{passed ? 'مبروك! نجحت' : 'للأسف لم تنجح'}</h1>
          <div className={`text-6xl font-black my-6 ${passed ? 'text-green-400' : 'text-red-400'}`}>
            {Math.round(result.percentage || 0)}%
          </div>
          <p className="text-gray-400 mb-2">درجتك: {result.score} من {result.total_points}</p>
          {result.time_taken_seconds && (
            <p className="text-gray-400 mb-6">الوقت: {formatTime(result.time_taken_seconds)}</p>
          )}
          <a href="/student" className="gradient-primary px-8 py-3 rounded-xl text-white font-bold inline-block">
            رجوع للرئيسية
          </a>
        </div>
      </div>
    );
  }

  if (phase === 'instructions') return (
    <div className="min-h-screen flex items-center justify-center gradient-dark px-4" dir="rtl">
      <div className="glass rounded-3xl p-10 max-w-lg w-full">
        <h1 className="text-2xl font-black mb-2">{exam?.title}</h1>
        <div className="flex gap-4 text-sm text-gray-400 mb-6">
          <span>⏱️ {exam?.duration_minutes} دقيقة</span>
          <span>❓ {questions.length} سؤال</span>
          <span>🎯 نجاح من {exam?.pass_score}%</span>
        </div>
        {exam?.instructions && (
          <div className="bg-white/5 rounded-xl p-4 mb-6">
            <p className="text-gray-300 text-sm leading-relaxed">{exam.instructions}</p>
          </div>
        )}
        <div className="bg-yellow-400/10 border border-yellow-400/20 rounded-xl p-4 mb-6">
          <p className="text-yellow-400 text-sm font-bold">⚠️ تنبيه: بمجرد ما تبدأ، الوقت هيبدأ يجري ومتقدرش توقفه!</p>
        </div>
        <button onClick={startExam} className="w-full gradient-primary py-4 rounded-xl text-white font-black text-lg hover:opacity-90 transition">
          🚀 ابدأ الامتحان
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen gradient-dark" dir="rtl">
      {/* Header ثابت مع الوقت */}
      <div className={`sticky top-0 z-10 glass border-b px-6 py-3 flex items-center justify-between ${timeLeft < 60 ? 'border-red-400/30' : 'border-white/5'}`}>
        <h2 className="font-black">{exam?.title}</h2>
        <div className={`flex items-center gap-2 font-black text-xl px-4 py-2 rounded-xl ${timeLeft < 60 ? 'bg-red-500/20 text-red-400 animate-pulse' : 'bg-white/5 text-white'}`}>
          <FiClock /> {formatTime(timeLeft)}
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        {questions.map((q, i) => (
          <div key={q.id} className="glass rounded-2xl p-6">
            <div className="flex items-start gap-3 mb-4">
              <span className="w-8 h-8 gradient-primary rounded-lg flex items-center justify-center font-bold text-sm text-white flex-shrink-0">{i + 1}</span>
              <div className="flex-1">
                <p className="font-semibold text-lg">{q.question}</p>
                <p className="text-gray-400 text-xs mt-1">{q.points} درجة</p>
              </div>
            </div>

            {q.image_url && <img src={q.image_url} alt="" className="rounded-xl mb-4 max-h-64 object-cover w-full" />}

            {q.type === 'mcq' ? (
              <div className="space-y-2">
                {q.options?.map((opt, j) => (
                  <button key={j} onClick={() => setAnswers(prev => ({ ...prev, [q.id]: opt }))}
                    className={`w-full text-right px-4 py-3 rounded-xl transition font-medium ${
                      answers[q.id] === opt
                        ? 'gradient-primary text-white'
                        : 'bg-white/5 hover:bg-white/10 text-gray-300'
                    }`}>
                    {answers[q.id] === opt ? '✅' : '○'} {opt}
                  </button>
                ))}
              </div>
            ) : (
              <textarea value={answers[q.id] || ''} onChange={e => setAnswers(prev => ({ ...prev, [q.id]: e.target.value }))}
                placeholder="اكتب إجابتك هنا..."
                rows={4}
                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white focus:border-purple-500 focus:outline-none resize-none" />
            )}
          </div>
        ))}

        <button onClick={submitExam}
          className="w-full gradient-primary py-4 rounded-xl text-white font-black text-lg hover:opacity-90 transition flex items-center justify-center gap-2">
          <FiCheck /> تسليم الامتحان
        </button>
      </div>
    </div>
  );
}
