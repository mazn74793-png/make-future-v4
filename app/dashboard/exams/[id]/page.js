'use client';
import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';
import { useParams } from 'next/navigation';
import { FiPlus, FiTrash2, FiImage, FiArrowRight } from 'react-icons/fi';

export default function ExamDetailPage() {
  const { id } = useParams();
  const [exam, setExam] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [attempts, setAttempts] = useState([]);
  const [activeTab, setActiveTab] = useState('questions');
  const [showForm, setShowForm] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({
    question: '', type: 'mcq', points: 1, image_url: '',
    options: ['', '', '', ''], correct_answer: ''
  });

  const load = async () => {
    const { data: examData } = await supabase.from('exams').select('*, courses(title)').eq('id', id).single();
    setExam(examData);
    const { data: qData } = await supabase.from('exam_questions').select('*').eq('exam_id', id).order('order_num');
    setQuestions(qData || []);
    const { data: aData } = await supabase.from('exam_attempts')
      .select('*, students(name, email)').eq('exam_id', id).eq('is_submitted', true).order('submitted_at', { ascending: false });
    setAttempts(aData || []);
  };

  useEffect(() => { load(); }, [id]);

  const handleImageUpload = async (file) => {
    setUploading(true);
    const res = await fetch('/api/presign', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fileName: file.name, contentType: file.type, title: 'exam-img', courseId: 'exam', isFree: true, fileSize: file.size })
    });
    const { uploadUrl, videoUrl } = await res.json();
    await fetch(uploadUrl, { method: 'PUT', headers: { 'Content-Type': file.type }, body: file });
    setForm(f => ({ ...f, image_url: videoUrl }));
    setUploading(false);
    toast.success('✅ الصورة اترفعت');
  };

  const handleAddQuestion = async () => {
    if (!form.question) { toast.error('اكتب السؤال'); return; }
    if (form.type === 'mcq' && !form.correct_answer) { toast.error('اختار الإجابة الصحيحة'); return; }

    const { error } = await supabase.from('exam_questions').insert({
      exam_id: id,
      question: form.question,
      type: form.type,
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
      setForm({ question: '', type: 'mcq', points: 1, image_url: '', options: ['', '', '', ''], correct_answer: '' });
      load();
    }
  };

  const handleDeleteQuestion = async (qId) => {
    await supabase.from('exam_questions').delete().eq('id', qId);
    toast.success('اتمسح'); load();
  };

  if (!exam) return (
    <div className="flex items-center justify-center py-20">
      <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div dir="rtl">
      <div className="flex items-center gap-4 mb-8">
        <a href="/dashboard/exams" className="p-2 rounded-xl bg-white/5 hover:bg-white/10 transition text-white">←</a>
        <div>
          <h1 className="text-2xl font-black">{exam.title}</h1>
          <p className="text-gray-400 text-sm">{exam.duration_minutes} دقيقة • {questions.length} سؤال • نجاح من {exam.pass_score}%</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-3 mb-6">
        {[
          { key: 'questions', label: `الأسئلة (${questions.length})` },
          { key: 'results', label: `النتائج (${attempts.length})` },
        ].map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className={`px-6 py-2 rounded-xl font-bold transition ${activeTab === tab.key ? 'gradient-primary text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}>
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'questions' && (
        <div>
          <button onClick={() => setShowForm(!showForm)}
            className="gradient-primary px-6 py-3 rounded-xl text-white font-bold flex items-center gap-2 mb-6">
            <FiPlus /> {showForm ? 'إلغاء' : 'سؤال جديد'}
          </button>

          {showForm && (
            <div className="glass rounded-2xl p-6 mb-6 space-y-4 animate-fade-in">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-400 mb-1 block">نوع السؤال</label>
                  <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white focus:border-purple-500 focus:outline-none">
                    <option value="mcq">اختيار من متعدد</option>
                    <option value="text">إجابة نصية</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm text-gray-400 mb-1 block">الدرجة</label>
                  <input type="number" value={form.points} onChange={e => setForm({ ...form, points: parseInt(e.target.value) })} min="1"
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white focus:border-purple-500 focus:outline-none" />
                </div>
              </div>

              <div>
                <label className="text-sm text-gray-400 mb-1 block">نص السؤال *</label>
                <textarea value={form.question} onChange={e => setForm({ ...form, question: e.target.value })}
                  rows={3} placeholder="اكتب السؤال هنا..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white focus:border-purple-500 focus:outline-none resize-none" />
              </div>

              {/* رفع صورة */}
              <div>
                <label className="text-sm text-gray-400 mb-1 block">صورة مع السؤال (اختياري)</label>
                <div className="flex items-center gap-3">
                  <input type="file" accept="image/*" onChange={e => e.target.files[0] && handleImageUpload(e.target.files[0])}
                    className="hidden" id="imgUpload" />
                  <label htmlFor="imgUpload"
                    className="flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-2 rounded-xl cursor-pointer hover:bg-white/10 transition text-sm">
                    <FiImage /> {uploading ? 'جاري الرفع...' : 'رفع صورة'}
                  </label>
                  {form.image_url && <img src={form.image_url} alt="preview" className="w-16 h-16 rounded-xl object-cover" />}
                </div>
              </div>

              {form.type === 'mcq' && (
                <div>
                  <label className="text-sm text-gray-400 mb-2 block">الاختيارات</label>
                  <div className="space-y-2">
                    {form.options.map((opt, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <input type="radio" name="correct" value={opt}
                          checked={form.correct_answer === opt}
                          onChange={() => form.options[i] && setForm({ ...form, correct_answer: form.options[i] })}
                          className="accent-purple-500 w-4 h-4" />
                        <input type="text" value={opt}
                          onChange={e => {
                            const newOpts = [...form.options];
                            newOpts[i] = e.target.value;
                            setForm({ ...form, options: newOpts });
                          }}
                          placeholder={`الاختيار ${i + 1}`}
                          className="flex-1 bg-white/5 border border-white/10 rounded-xl py-2 px-3 text-white focus:border-purple-500 focus:outline-none text-sm" />
                      </div>
                    ))}
                    <p className="text-xs text-gray-500">اضغط على الدائرة بجانب الإجابة الصحيحة</p>
                  </div>
                </div>
              )}

              <button onClick={handleAddQuestion} className="gradient-primary px-8 py-3 rounded-xl text-white font-bold">
                إضافة السؤال
              </button>
            </div>
          )}

          <div className="space-y-4">
            {questions.map((q, i) => (
              <div key={q.id} className="glass rounded-xl p-5 border border-white/5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="w-7 h-7 gradient-primary rounded-lg flex items-center justify-center text-sm font-bold text-white">{i + 1}</span>
                      <span className="text-xs text-gray-400 bg-white/5 px-2 py-1 rounded-full">
                        {q.type === 'mcq' ? 'اختيار متعدد' : 'نصي'} • {q.points} درجة
                      </span>
                    </div>
                    <p className="font-semibold mb-3">{q.question}</p>
                    {q.image_url && <img src={q.image_url} alt="" className="rounded-xl mb-3 max-h-48 object-cover" />}
                    {q.options && (
                      <div className="space-y-1">
                        {q.options.map((opt, j) => (
                          <div key={j} className={`text-sm px-3 py-2 rounded-lg ${opt === q.correct_answer ? 'bg-green-500/20 text-green-400 font-bold' : 'bg-white/5 text-gray-300'}`}>
                            {opt === q.correct_answer ? '✅' : '○'} {opt}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <button onClick={() => handleDeleteQuestion(q.id)}
                    className="p-2 rounded-xl bg-red-500/20 text-red-400 hover:bg-red-500/30 transition flex-shrink-0">
                    <FiTrash2 />
                  </button>
                </div>
              </div>
            ))}
            {questions.length === 0 && (
              <div className="glass rounded-2xl p-10 text-center">
                <p className="text-gray-400">ضيف أسئلة للامتحان</p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'results' && (
        <div>
          <div className="space-y-4">
            {attempts.map(attempt => {
              const passed = attempt.percentage >= exam.pass_score;
              return (
                <div key={attempt.id} className="glass rounded-xl p-5 border border-white/5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 gradient-primary rounded-full flex items-center justify-center font-bold text-white">
                        {attempt.students?.name?.[0]}
                      </div>
                      <div>
                        <p className="font-bold">{attempt.students?.name}</p>
                        <p className="text-gray-400 text-xs">{attempt.students?.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-center">
                        <p className={`text-2xl font-black ${passed ? 'text-green-400' : 'text-red-400'}`}>
                          {Math.round(attempt.percentage || 0)}%
                        </p>
                        <p className="text-xs text-gray-400">{attempt.score}/{attempt.total_points} درجة</p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-gray-400">
                          ⏱️ {attempt.time_taken_seconds ? `${Math.floor(attempt.time_taken_seconds / 60)}:${String(attempt.time_taken_seconds % 60).padStart(2, '0')}` : '-'}
                        </p>
                        <p className="text-xs text-gray-500">
                          {attempt.submitted_at ? new Date(attempt.submitted_at).toLocaleDateString('ar-EG') : ''}
                        </p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-sm font-bold ${passed ? 'bg-green-400/20 text-green-400' : 'bg-red-400/20 text-red-400'}`}>
                        {passed ? '✅ ناجح' : '❌ راسب'}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
            {attempts.length === 0 && (
              <div className="glass rounded-2xl p-10 text-center">
                <p className="text-gray-400">مفيش نتائج لسه</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
