'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import {
  FiBookOpen, FiLogOut, FiLock, FiUnlock, FiClock,
  FiSend, FiPlay, FiFileText, FiPackage, FiCheck,
  FiHome, FiAward
} from 'react-icons/fi';

export default function StudentPage() {
  const [student, setStudent] = useState(null);
  const [courses, setCourses] = useState([]);
  const [requests, setRequests] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [exams, setExams] = useState([]);
  const [attempts, setAttempts] = useState([]);
  const [products, setProducts] = useState([]);
  const [myOrders, setMyOrders] = useState([]);
  const [stats, setStats] = useState({ videos: 0, exams: 0 });
  const [loading, setLoading] = useState(true);
  const [requesting, setRequesting] = useState(null);
  const [ordering, setOrdering] = useState(null);
  const [notes, setNotes] = useState({});
  const [activeTab, setActiveTab] = useState('home');
  const router = useRouter();

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/login'); return; }
      const { data: studentData } = await supabase.from('students').select('*').eq('user_id', user.id).single();
      if (!studentData || studentData.status !== 'approved') { router.push('/pending'); return; }
      setStudent(studentData);
      const [
        { data: coursesData },
        { data: reqData },
        { data: enrollData },
        { data: examsData },
        { data: attemptsData },
        { data: videosData },
        { data: productsData },
        { data: ordersData },
      ] = await Promise.all([
        supabase.from('courses').select('*').eq('is_published', true).order('order'),
        supabase.from('access_requests').select('*').eq('student_id', studentData.id),
        supabase.from('enrollments').select('course_id').eq('student_id', studentData.id).eq('is_active', true),
        supabase.from('exams').select('*').eq('is_active', true),
        supabase.from('exam_attempts').select('exam_id, is_submitted, percentage').eq('student_id', studentData.id),
        supabase.from('videos').select('id'),
        supabase.from('products').select('*').eq('is_active', true).order('created_at', { ascending: false }),
        supabase.from('product_orders').select('*, products(title)').eq('student_id', studentData.id),
      ]);
      setCourses(coursesData || []);
      setRequests(reqData || []);
      setEnrollments(enrollData?.map(e => e.course_id) || []);
      setExams(examsData || []);
      setAttempts(attemptsData || []);
      setProducts(productsData || []);
      setMyOrders(ordersData || []);
      setStats({ videos: videosData?.length || 0, exams: examsData?.length || 0 });
      setLoading(false);
    };
    load();
  }, [router]);

  const handleRequest = async (courseId) => {
    setRequesting(courseId);
    await supabase.from('access_requests').insert({ student_id: student.id, course_id: courseId, message: 'طلب وصول', status: 'pending' });
    setRequests(prev => [...prev, { course_id: courseId, status: 'pending' }]);
    setRequesting(null);
  };

  const handleOrder = async (productId) => {
    setOrdering(productId);
    await supabase.from('product_orders').insert({ product_id: productId, student_id: student.id, student_name: student.name, student_phone: student.phone, notes: notes[productId] || '', status: 'pending' });
    setMyOrders(prev => [...prev, { product_id: productId, status: 'pending' }]);
    setOrdering(null);
  };

  const getRequestStatus = (courseId) => requests.find(r => r.course_id === courseId)?.status || null;
  const getExamAttempt = (examId) => attempts.find(a => a.exam_id === examId);
  const getOrder = (productId) => myOrders.find(o => o.product_id === productId);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg)' }}>
      <div className="w-14 h-14 rounded-full border-4 border-t-transparent animate-spin"
        style={{ borderColor: 'rgba(99,102,241,0.3)', borderTopColor: '#6366f1' }} />
    </div>
  );

  const enrolledCourses = courses.filter(c => enrollments.includes(c.id) || c.visibility === 'public');
  const availableCourses = courses.filter(c => !enrollments.includes(c.id) && c.visibility !== 'public');
  const statusLabel = { pending: '⏳ قيد المراجعة', confirmed: '✅ تم التأكيد', delivered: '📦 تم التسليم', cancelled: '❌ ملغي' };

  const tabs = [
    { key: 'home', icon: <FiHome size={18} />, label: 'الرئيسية' },
    { key: 'courses', icon: <FiBookOpen size={18} />, label: `الكورسات${enrolledCourses.length > 0 ? ` (${enrolledCourses.length})` : ''}` },
    { key: 'exams', icon: <FiFileText size={18} />, label: `الامتحانات${exams.length > 0 ? ` (${exams.length})` : ''}` },
    { key: 'products', icon: <FiPackage size={18} />, label: 'المنتجات' },
  ];

  return (
    <div className="min-h-screen pb-24 md:pb-0 md:pt-16" dir="rtl"
      style={{ background: 'var(--bg)', color: 'var(--text)' }}>

      {/* ===== Header للموبايل فقط ===== */}
      <div className="sticky top-0 z-30 md:hidden"
        style={{
          background: 'var(--glass-bg)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          borderBottom: '1px solid var(--border)',
        }}>
        {/* User info */}
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-white text-sm flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #6366f1, #f472b6)' }}>
              {student?.name?.[0]}
            </div>
            <div>
              <p className="font-bold text-sm leading-tight" style={{ color: 'var(--text)' }}>
                {student?.name?.split(' ')[0]}
              </p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{student?.stage || 'طالب'}</p>
            </div>
          </div>
          <button onClick={handleLogout}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl"
            style={{ color: '#f87171', background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)' }}>
            <FiLogOut size={14} /> خروج
          </button>
        </div>

        {/* Tabs scrollable */}
        <div className="flex gap-1 px-4 pb-2 overflow-x-auto"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          {tabs.map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap flex-shrink-0 transition-all"
              style={activeTab === tab.key
                ? { background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: 'white' }
                : { background: 'var(--surface)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ===== Desktop Sidebar Tabs ===== */}
      <div className="hidden md:flex max-w-7xl mx-auto px-6 pt-6 gap-2 mb-6">
        {tabs.map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all"
            style={activeTab === tab.key
              ? { background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: 'white' }
              : { background: 'var(--surface)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* ===== Content ===== */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 md:py-0">

        {/* HOME */}
        {activeTab === 'home' && (
          <div className="space-y-5">
            {/* Hero Card */}
            <div className="relative rounded-2xl p-6 overflow-hidden"
              style={{
                background: 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(244,114,182,0.08))',
                border: '1px solid rgba(99,102,241,0.2)',
              }}>
              <div className="absolute -top-8 -left-8 w-32 h-32 rounded-full"
                style={{ background: 'rgba(99,102,241,0.1)', filter: 'blur(30px)' }} />
              <div className="relative z-10">
                <h1 className="text-2xl font-black mb-1" style={{ color: 'var(--text)' }}>
                  اهلاً {student?.name?.split(' ')[0]} 👋
                </h1>
                <p className="text-sm mb-5" style={{ color: 'var(--text-muted)' }}>استمر في رحلتك التعليمية!</p>
                <div className="flex flex-wrap gap-2">
                  <button onClick={() => setActiveTab('courses')}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-bold transition hover:opacity-90"
                    style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', boxShadow: '0 4px 16px rgba(99,102,241,0.3)' }}>
                    <FiPlay size={14} /> ابدأ المذاكرة
                  </button>
                  {exams.length > 0 && (
                    <button onClick={() => setActiveTab('exams')}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition hover:opacity-80"
                      style={{ background: 'var(--surface)', color: 'var(--text)', border: '1px solid var(--border)' }}>
                      <FiFileText size={14} /> الامتحانات ({exams.length})
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* كود الطالب */}
<div className="rounded-2xl p-4 flex items-center justify-between"
  style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)' }}>
  <div>
    <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>كود الطالب الخاص بك</p>
    <p className="text-2xl font-black font-mono tracking-widest" style={{ color: '#818cf8' }}>
      {student?.student_code || '----'}
    </p>
  </div>
  <div className="text-4xl">🎫</div>
</div>
            {/* Stats */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { icon: <FiBookOpen size={18} />, value: enrolledCourses.length, label: 'كورساتي', color: '#818cf8' },
                { icon: <FiPlay size={18} />, value: stats.videos, label: 'فيديو', color: '#f472b6' },
                { icon: <FiAward size={18} />, value: exams.length, label: 'امتحان', color: '#34d399' },
              ].map((s, i) => (
                <div key={i} className="rounded-2xl p-4 text-center"
                  style={{ background: 'var(--bg2)', border: '1px solid var(--border)' }}>
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center mx-auto mb-2"
                    style={{ background: `${s.color}18`, color: s.color }}>
                    {s.icon}
                  </div>
                  <p className="text-xl font-black" style={{ color: 'var(--text)' }}>{s.value}</p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{s.label}</p>
                </div>
              ))}
            </div>

            {/* Latest Courses */}
            {enrolledCourses.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="font-black" style={{ color: 'var(--text)' }}>📚 كورساتي</h2>
                  <button onClick={() => setActiveTab('courses')} className="text-sm" style={{ color: '#818cf8' }}>عرض الكل ←</button>
                </div>
                <div className="space-y-2">
                  {enrolledCourses.slice(0, 2).map(course => (
                    <a key={course.id} href={`/student/course/${course.id}`}
                      className="flex items-center gap-3 p-3 rounded-xl transition hover:opacity-90"
                      style={{ background: 'var(--bg2)', border: '1px solid var(--border)' }}>
                      {course.thumbnail_url
                        ? <img src={course.thumbnail_url} className="w-14 h-14 rounded-xl object-cover flex-shrink-0" />
                        : <div className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0"
                            style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
                            <FiBookOpen className="text-white" />
                          </div>}
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm truncate" style={{ color: 'var(--text)' }}>{course.title}</p>
                        <p className="text-xs mt-0.5" style={{ color: '#34d399' }}>✅ متاح</p>
                      </div>
                      <FiPlay size={16} style={{ color: '#818cf8', flexShrink: 0 }} />
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Latest Exams */}
            {exams.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="font-black" style={{ color: 'var(--text)' }}>📝 امتحانات متاحة</h2>
                  <button onClick={() => setActiveTab('exams')} className="text-sm" style={{ color: '#818cf8' }}>عرض الكل ←</button>
                </div>
                <div className="space-y-2">
                  {exams.slice(0, 2).map(exam => {
                    const attempt = getExamAttempt(exam.id);
                    return (
                      <div key={exam.id} className="flex items-center justify-between p-3 rounded-xl"
                        style={{ background: 'var(--bg2)', border: '1px solid rgba(99,102,241,0.15)' }}>
                        <div>
                          <p className="font-bold text-sm" style={{ color: 'var(--text)' }}>{exam.title}</p>
                          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                            ⏱️ {exam.duration_minutes} دقيقة • {exam.pass_score}% للنجاح
                          </p>
                        </div>
                        {attempt?.is_submitted
                          ? <span className="text-sm font-bold px-3 py-1 rounded-full"
                              style={attempt.percentage >= exam.pass_score
                                ? { background: 'rgba(52,211,153,0.15)', color: '#34d399' }
                                : { background: 'rgba(248,113,113,0.15)', color: '#f87171' }}>
                              {Math.round(attempt.percentage)}%
                            </span>
                          : <a href={`/student/exam/${exam.id}`}
                              className="px-4 py-1.5 rounded-xl text-white text-sm font-bold"
                              style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
                              ابدأ
                            </a>}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* COURSES */}
        {activeTab === 'courses' && (
          <div className="space-y-6">
            {enrolledCourses.length > 0 && (
              <div>
                <h2 className="font-black mb-4 flex items-center gap-2" style={{ color: 'var(--text)' }}>
                  <FiUnlock style={{ color: '#34d399' }} /> كورساتي المتاحة
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {enrolledCourses.map(course => (
                    <a key={course.id} href={`/student/course/${course.id}`}
                      className="rounded-2xl overflow-hidden transition hover:-translate-y-1"
                      style={{ background: 'var(--bg2)', border: '1px solid var(--border)', display: 'block' }}>
                      {course.thumbnail_url
                        ? <img src={course.thumbnail_url} alt={course.title} className="w-full h-36 object-cover" />
                        : <div className="w-full h-36 flex items-center justify-center"
                            style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
                            <FiBookOpen className="text-white" style={{ fontSize: '2rem' }} />
                          </div>}
                      <div className="p-4">
                        <h3 className="font-bold text-sm mb-2" style={{ color: 'var(--text)' }}>{course.title}</h3>
                        <span className="text-xs px-2 py-1 rounded-full"
                          style={{ background: 'rgba(52,211,153,0.12)', color: '#34d399' }}>✅ متاح</span>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {availableCourses.length > 0 && (
              <div>
                <h2 className="font-black mb-4 flex items-center gap-2" style={{ color: 'var(--text)' }}>
                  <FiLock style={{ color: '#fbbf24' }} /> كورسات تحتاج إذن
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {availableCourses.map(course => {
                    const reqStatus = getRequestStatus(course.id);
                    return (
                      <div key={course.id} className="rounded-2xl overflow-hidden"
                        style={{ background: 'var(--bg2)', border: '1px solid var(--border)', opacity: 0.85 }}>
                        {course.thumbnail_url
                          ? <img src={course.thumbnail_url} alt={course.title} className="w-full h-36 object-cover" style={{ opacity: 0.6 }} />
                          : <div className="w-full h-36 flex items-center justify-center"
                              style={{ background: 'var(--bg3)' }}>
                              <FiLock style={{ fontSize: '2rem', color: 'var(--text-faint)' }} />
                            </div>}
                        <div className="p-4">
                          <h3 className="font-bold text-sm mb-3" style={{ color: 'var(--text)' }}>{course.title}</h3>
                          {!reqStatus && (
                            <button onClick={() => handleRequest(course.id)} disabled={requesting === course.id}
                              className="w-full py-2 rounded-xl text-white text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-50"
                              style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
                              {requesting === course.id ? '⏳' : <><FiSend size={14} /> اطلب الوصول</>}
                            </button>
                          )}
                          {reqStatus === 'pending' && (
                            <div className="w-full py-2 rounded-xl text-xs font-bold text-center flex items-center justify-center gap-1"
                              style={{ background: 'rgba(251,191,36,0.1)', color: '#fbbf24' }}>
                              <FiClock size={12} /> قيد المراجعة
                            </div>
                          )}
                          {reqStatus === 'rejected' && (
                            <p className="text-center text-xs py-2" style={{ color: '#f87171' }}>❌ تم رفض الطلب</p>
                          )}
                          {reqStatus === 'approved' && (
                            <a href={`/student/course/${course.id}`}
                              className="w-full py-2 rounded-xl text-white text-sm font-bold flex items-center justify-center gap-2"
                              style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', display: 'flex' }}>
                              <FiPlay size={14} /> ادخل الكورس
                            </a>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {courses.length === 0 && (
              <div className="rounded-2xl p-16 text-center" style={{ background: 'var(--bg2)', border: '1px solid var(--border)' }}>
                <FiBookOpen style={{ fontSize: '3rem', color: 'var(--text-faint)', margin: '0 auto 1rem' }} />
                <p style={{ color: 'var(--text-muted)' }}>مفيش كورسات متاحة دلوقتي</p>
              </div>
            )}
          </div>
        )}

        {/* EXAMS */}
        {activeTab === 'exams' && (
          <div>
            <h2 className="font-black mb-5" style={{ fontSize: '1.25rem', color: 'var(--text)' }}>📝 الامتحانات المتاحة</h2>
            {exams.length === 0 ? (
              <div className="rounded-2xl p-16 text-center" style={{ background: 'var(--bg2)', border: '1px solid var(--border)' }}>
                <FiFileText style={{ fontSize: '3rem', color: 'var(--text-faint)', margin: '0 auto 1rem' }} />
                <p style={{ color: 'var(--text-muted)' }}>مفيش امتحانات متاحة دلوقتي</p>
              </div>
            ) : (
              <div className="space-y-3">
                {exams.map(exam => {
                  const attempt = getExamAttempt(exam.id);
                  const submitted = attempt?.is_submitted;
                  const passed = submitted && attempt.percentage >= exam.pass_score;
                  return (
                    <div key={exam.id} className="p-5 rounded-2xl"
                      style={{
                        background: 'var(--bg2)',
                        border: `1px solid ${submitted ? (passed ? 'rgba(52,211,153,0.2)' : 'rgba(248,113,113,0.2)') : 'rgba(99,102,241,0.15)'}`,
                      }}>
                      <div className="flex items-center justify-between flex-wrap gap-4">
                        <div>
                          <h3 className="font-black mb-1" style={{ color: 'var(--text)' }}>{exam.title}</h3>
                          <div className="flex flex-wrap gap-3 text-xs" style={{ color: 'var(--text-muted)' }}>
                            <span>⏱️ {exam.duration_minutes} دقيقة</span>
                            <span>🎯 نجاح من {exam.pass_score}%</span>
                          </div>
                          {exam.instructions && (
                            <p className="text-xs mt-2 line-clamp-2" style={{ color: 'var(--text-faint)' }}>{exam.instructions}</p>
                          )}
                        </div>
                        {submitted
                          ? <div className="text-center">
                              <p className="text-3xl font-black" style={{ color: passed ? '#34d399' : '#f87171' }}>
                                {Math.round(attempt.percentage)}%
                              </p>
                              <p className="text-xs font-bold" style={{ color: passed ? '#34d399' : '#f87171' }}>
                                {passed ? '✅ ناجح' : '❌ راسب'}
                              </p>
                            </div>
                          : <a href={`/student/exam/${exam.id}`}
                              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white font-bold text-sm transition hover:opacity-90"
                              style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
                              <FiPlay size={14} /> ابدأ الامتحان
                            </a>}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* PRODUCTS */}
        {activeTab === 'products' && (
          <div>
            <h2 className="font-black mb-5" style={{ fontSize: '1.25rem', color: 'var(--text)' }}>📦 المنتجات المتاحة</h2>
            {products.length === 0 ? (
              <div className="rounded-2xl p-16 text-center" style={{ background: 'var(--bg2)', border: '1px solid var(--border)' }}>
                <FiPackage style={{ fontSize: '3rem', color: 'var(--text-faint)', margin: '0 auto 1rem' }} />
                <p style={{ color: 'var(--text-muted)' }}>مفيش منتجات متاحة دلوقتي</p>
              </div>
            ) : (
              <div className="space-y-3">
                {products.map(product => {
                  const order = getOrder(product.id);
                  return (
                    <div key={product.id} className="p-5 rounded-2xl"
                      style={{ background: 'var(--bg2)', border: '1px solid var(--border)' }}>
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
                          style={{ background: 'rgba(99,102,241,0.1)' }}>
                          {product.type === 'book' ? '📗' : product.type === 'summary' ? '📋' : '📦'}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-black mb-1" style={{ color: 'var(--text)' }}>{product.title}</h3>
                          {product.description && (
                            <p className="text-sm mb-2" style={{ color: 'var(--text-muted)' }}>{product.description}</p>
                          )}
                          <div className="flex items-center gap-3 mb-3">
                            <span className="font-bold" style={{ color: '#818cf8' }}>{product.price} جنيه</span>
                            {product.available_count && (
                              <span className="text-xs px-2 py-0.5 rounded-full"
                                style={{ background: 'var(--surface)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>
                                متاح: {product.available_count}
                              </span>
                            )}
                          </div>
                          {!order ? (
                            <div className="space-y-2">
                              <input type="text" placeholder="ملاحظة (اختياري)"
                                value={notes[product.id] || ''}
                                onChange={e => setNotes(prev => ({ ...prev, [product.id]: e.target.value }))}
                                className="w-full text-sm px-3 py-2 rounded-xl"
                                style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)', outline: 'none' }} />
                              <button onClick={() => handleOrder(product.id)} disabled={ordering === product.id}
                                className="flex items-center gap-2 px-5 py-2 rounded-xl text-white text-sm font-bold disabled:opacity-50"
                                style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
                                {ordering === product.id ? '⏳ جاري...' : <><FiCheck size={14} /> اطلب الآن</>}
                              </button>
                            </div>
                          ) : (
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold"
                              style={order.status === 'delivered'
                                ? { background: 'rgba(52,211,153,0.1)', color: '#34d399' }
                                : order.status === 'confirmed'
                                ? { background: 'rgba(99,102,241,0.1)', color: '#818cf8' }
                                : order.status === 'cancelled'
                                ? { background: 'rgba(248,113,113,0.1)', color: '#f87171' }
                                : { background: 'rgba(251,191,36,0.1)', color: '#fbbf24' }}>
                              {statusLabel[order.status]}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
