'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { FiBookOpen, FiLogOut, FiLock, FiUnlock, FiClock, FiSend, FiPlay, FiFileText, FiPackage, FiCheck } from 'react-icons/fi';

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

      const { data: studentData } = await supabase
        .from('students').select('*').eq('user_id', user.id).single();
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
    await supabase.from('access_requests').insert({
      student_id: student.id, course_id: courseId,
      message: 'طلب وصول', status: 'pending'
    });
    setRequests(prev => [...prev, { course_id: courseId, status: 'pending' }]);
    setRequesting(null);
  };

  const handleOrder = async (productId) => {
    setOrdering(productId);
    const { error } = await supabase.from('product_orders').insert({
      product_id: productId, student_id: student.id,
      student_name: student.name, student_phone: student.phone,
      notes: notes[productId] || '', status: 'pending',
    });
    if (!error) setMyOrders(prev => [...prev, { product_id: productId, status: 'pending' }]);
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
    <div className="min-h-screen flex items-center justify-center style={{ background: 'var(--glass-bg)', backdropFilter: 'blur(16px)', borderBottom: '1px solid var(--border)' }}">
      <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const enrolledCourses = courses.filter(c => enrollments.includes(c.id) || c.visibility === 'public');
  const availableCourses = courses.filter(c => !enrollments.includes(c.id) && c.visibility !== 'public');

  const tabs = [
    { key: 'home', label: '🏠 الرئيسية' },
    { key: 'courses', label: `📚 الكورسات${enrolledCourses.length > 0 ? ` (${enrolledCourses.length})` : ''}` },
    { key: 'exams', label: `📝 الامتحانات${exams.length > 0 ? ` (${exams.length})` : ''}` },
    { key: 'products', label: `📦 المنتجات${products.length > 0 ? ` (${products.length})` : ''}` },
  ];

  const statusLabel = { pending: '⏳ قيد المراجعة', confirmed: '✅ تم التأكيد', delivered: '📦 تم التسليم', cancelled: '❌ ملغي' };

  return (
    
      {/* Header */}
      <div className="glass border-b border-white/5 px-4 py-3 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 gradient-primary rounded-xl flex items-center justify-center font-bold text-white text-sm">
            {student?.name?.[0]}
          </div>
          <div className="hidden sm:block">
            <p className="font-bold text-sm leading-tight">{student?.name}</p>
            <p className="text-gray-400 text-xs">{student?.stage || 'طالب'}</p>
          </div>
        </div>

        <div className="flex items-center gap-1 overflow-x-auto">
          {tabs.map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${activeTab === tab.key ? 'gradient-primary text-white' : 'text-gray-400 hover:bg-white/10'}`}>
              {tab.label}
            </button>
          ))}
        </div>

        <button onClick={handleLogout} className="text-red-400 p-2 hover:bg-red-400/10 rounded-xl transition flex-shrink-0">
          <FiLogOut />
        </button>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">

        {/* ===== HOME ===== */}
        {activeTab === 'home' && (
          <div className="space-y-6">
            <div className="relative glass rounded-3xl p-6 overflow-hidden">
              <div className="absolute -top-10 -left-10 w-40 h-40 bg-purple-500/20 rounded-full blur-3xl" />
              <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-pink-500/20 rounded-full blur-3xl" />
              <div className="relative z-10">
                <h1 className="text-2xl md:text-3xl font-black mb-1">اهلاً {student?.name?.split(' ')[0]} 👋</h1>
                <p className="text-gray-400 mb-5">استمر في رحلتك التعليمية!</p>
                <div className="flex flex-wrap gap-3">
                  <button onClick={() => setActiveTab('courses')}
                    className="gradient-primary px-5 py-2 rounded-xl text-white font-bold flex items-center gap-2 hover:opacity-90 transition text-sm">
                    <FiPlay /> ابدأ المذاكرة
                  </button>
                  {exams.length > 0 && (
                    <button onClick={() => setActiveTab('exams')}
                      className="glass px-5 py-2 rounded-xl text-white font-bold flex items-center gap-2 hover:bg-white/10 transition text-sm border border-white/10">
                      <FiFileText /> الامتحانات ({exams.length})
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {[
                { icon: <FiBookOpen />, value: enrolledCourses.length, label: 'كورساتي', color: 'text-purple-400', bg: 'bg-purple-500/10' },
                { icon: <FiPlay />, value: stats.videos, label: 'فيديو', color: 'text-pink-400', bg: 'bg-pink-500/10' },
                { icon: <FiFileText />, value: exams.length, label: 'امتحان', color: 'text-blue-400', bg: 'bg-blue-500/10' },
              ].map((s, i) => (
                <div key={i} className="glass rounded-2xl p-4 text-center">
                  <div className={`w-10 h-10 ${s.bg} rounded-xl flex items-center justify-center mx-auto mb-2 ${s.color}`}>{s.icon}</div>
                  <p className="text-2xl font-black">{s.value}</p>
                  <p className="text-gray-400 text-xs">{s.label}</p>
                </div>
              ))}
            </div>

            {enrolledCourses.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="font-black text-lg">📚 كورساتي</h2>
                  <button onClick={() => setActiveTab('courses')} className="text-purple-400 text-sm">عرض الكل ←</button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {enrolledCourses.slice(0, 2).map(course => (
                    <a key={course.id} href={`/student/course/${course.id}`}
                      className="glass rounded-2xl overflow-hidden flex items-center gap-4 p-3 hover:bg-white/5 transition border border-white/5">
                      {course.thumbnail_url
                        ? <img src={course.thumbnail_url} className="w-16 h-16 rounded-xl object-cover flex-shrink-0" />
                        : <div className="w-16 h-16 gradient-primary rounded-xl flex items-center justify-center flex-shrink-0"><FiBookOpen className="text-white text-xl" /></div>}
                      <div className="flex-1 min-w-0">
                        <p className="font-bold truncate">{course.title}</p>
                        <p className="text-green-400 text-xs mt-1">✅ متاح</p>
                      </div>
                      <FiPlay className="text-purple-400 flex-shrink-0" />
                    </a>
                  ))}
                </div>
              </div>
            )}

            {exams.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="font-black text-lg">📝 امتحانات متاحة</h2>
                  <button onClick={() => setActiveTab('exams')} className="text-blue-400 text-sm">عرض الكل ←</button>
                </div>
                <div className="space-y-3">
                  {exams.slice(0, 2).map(exam => {
                    const attempt = getExamAttempt(exam.id);
                    return (
                      <div key={exam.id} className="glass rounded-2xl p-4 flex items-center justify-between border border-blue-400/10">
                        <div>
                          <p className="font-bold">{exam.title}</p>
                          <p className="text-gray-400 text-xs mt-1">⏱️ {exam.duration_minutes} دقيقة • {exam.pass_score}% للنجاح</p>
                        </div>
                        {attempt?.is_submitted
                          ? <span className={`text-sm font-bold px-3 py-1 rounded-full ${attempt.percentage >= exam.pass_score ? 'bg-green-400/20 text-green-400' : 'bg-red-400/20 text-red-400'}`}>
                              {Math.round(attempt.percentage)}%
                            </span>
                          : <a href={`/student/exam/${exam.id}`} className="gradient-primary px-4 py-2 rounded-xl text-white text-sm font-bold hover:opacity-90">ابدأ</a>}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ===== COURSES ===== */}
        {activeTab === 'courses' && (
          <div className="space-y-8">
            {enrolledCourses.length > 0 && (
              <div>
                <h2 className="text-xl font-black mb-4 flex items-center gap-2"><FiUnlock className="text-green-400" /> كورساتي المتاحة</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {enrolledCourses.map(course => (
                    <a key={course.id} href={`/student/course/${course.id}`}
                      className="glass rounded-2xl overflow-hidden hover:border-purple-500/40 border border-white/5 transition-all hover:-translate-y-1 group">
                      {course.thumbnail_url
                        ? <img src={course.thumbnail_url} alt={course.title} className="w-full h-40 object-cover" />
                        : <div className="w-full h-40 gradient-primary flex items-center justify-center"><FiBookOpen className="text-5xl text-white" /></div>}
                      <div className="p-4">
                        <h3 className="font-bold mb-1">{course.title}</h3>
                        {course.description && <p className="text-gray-400 text-sm line-clamp-2 mb-3">{course.description}</p>}
                        <div className="flex items-center justify-between">
                          <span className="text-xs bg-green-400/10 text-green-400 px-3 py-1 rounded-full">✅ متاح</span>
                          <span className="text-purple-400 text-sm flex items-center gap-1"><FiPlay className="text-xs" /> شاهد</span>
                        </div>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {availableCourses.length > 0 && (
              <div>
                <h2 className="text-xl font-black mb-4 flex items-center gap-2"><FiLock className="text-yellow-400" /> كورسات تحتاج إذن</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {availableCourses.map(course => {
                    const reqStatus = getRequestStatus(course.id);
                    return (
                      <div key={course.id} className="glass rounded-2xl overflow-hidden border border-white/5 opacity-80">
                        {course.thumbnail_url
                          ? <img src={course.thumbnail_url} alt={course.title} className="w-full h-40 object-cover opacity-50" />
                          : <div className="w-full h-40 bg-white/5 flex items-center justify-center"><FiLock className="text-4xl text-gray-500" /></div>}
                        <div className="p-4">
                          <h3 className="font-bold mb-3">{course.title}</h3>
                          {!reqStatus && (
                            <button onClick={() => handleRequest(course.id)} disabled={requesting === course.id}
                              className="w-full gradient-primary py-2 rounded-xl text-white text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-50">
                              {requesting === course.id ? '⏳' : <><FiSend /> اطلب الوصول</>}
                            </button>
                          )}
                          {reqStatus === 'pending' && <div className="w-full bg-yellow-400/10 text-yellow-400 py-2 rounded-xl text-sm text-center flex items-center justify-center gap-1"><FiClock /> قيد المراجعة</div>}
                          {reqStatus === 'rejected' && <div className="text-center text-red-400 text-sm py-2">❌ تم رفض الطلب</div>}
                          {reqStatus === 'approved' && (
                            <a href={`/student/course/${course.id}`} className="w-full gradient-primary py-2 rounded-xl text-white text-sm font-bold flex items-center justify-center gap-2">
                              <FiPlay /> ادخل الكورس
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
              <div className="glass rounded-2xl p-16 text-center">
                <FiBookOpen className="text-6xl text-gray-500 mx-auto mb-4" />
                <p className="text-gray-400 text-xl">مفيش كورسات متاحة دلوقتي</p>
              </div>
            )}
          </div>
        )}

        {/* ===== EXAMS ===== */}
        {activeTab === 'exams' && (
          <div>
            <h2 className="text-2xl font-black mb-6">📝 الامتحانات المتاحة</h2>
            {exams.length === 0 ? (
              <div className="glass rounded-2xl p-16 text-center">
                <FiFileText className="text-6xl text-gray-500 mx-auto mb-4" />
                <p className="text-gray-400 text-xl">مفيش امتحانات متاحة دلوقتي</p>
              </div>
            ) : (
              <div className="space-y-4">
                {exams.map(exam => {
                  const attempt = getExamAttempt(exam.id);
                  const submitted = attempt?.is_submitted;
                  const passed = submitted && attempt.percentage >= exam.pass_score;
                  return (
                    <div key={exam.id} className={`glass rounded-2xl p-5 border ${submitted ? (passed ? 'border-green-400/20' : 'border-red-400/20') : 'border-blue-400/20'}`}>
                      <div className="flex items-center justify-between flex-wrap gap-4">
                        <div>
                          <h3 className="font-black text-lg mb-1">{exam.title}</h3>
                          <div className="flex flex-wrap gap-3 text-sm text-gray-400">
                            <span>⏱️ {exam.duration_minutes} دقيقة</span>
                            <span>🎯 نجاح من {exam.pass_score}%</span>
                            <span>🔄 {exam.max_attempts} محاولة</span>
                          </div>
                          {exam.instructions && <p className="text-gray-500 text-xs mt-2">{exam.instructions}</p>}
                        </div>
                        <div>
                          {submitted ? (
                            <div className="text-center">
                              <p className={`text-3xl font-black ${passed ? 'text-green-400' : 'text-red-400'}`}>{Math.round(attempt.percentage)}%</p>
                              <p className={`text-sm font-bold ${passed ? 'text-green-400' : 'text-red-400'}`}>{passed ? '✅ ناجح' : '❌ راسب'}</p>
                            </div>
                          ) : (
                            <a href={`/student/exam/${exam.id}`} className="gradient-primary px-6 py-3 rounded-xl text-white font-bold hover:opacity-90 transition flex items-center gap-2">
                              <FiPlay /> ابدأ الامتحان
                            </a>
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

        {/* ===== PRODUCTS ===== */}
        {activeTab === 'products' && (
          <div>
            <h2 className="text-2xl font-black mb-6">📦 المنتجات المتاحة</h2>
            {products.length === 0 ? (
              <div className="glass rounded-2xl p-16 text-center">
                <FiPackage className="text-6xl text-gray-500 mx-auto mb-4" />
                <p className="text-gray-400 text-xl">مفيش منتجات متاحة دلوقتي</p>
              </div>
            ) : (
              <div className="space-y-4">
                {products.map(product => {
                  const order = getOrder(product.id);
                  return (
                    <div key={product.id} className="glass rounded-2xl p-5 border border-white/5">
                      <div className="flex items-start gap-4">
                        <div className="w-14 h-14 bg-purple-500/20 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0">
                          {product.type === 'book' ? '📗' : product.type === 'summary' ? '📋' : '📦'}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-black text-lg">{product.title}</h3>
                          {product.description && <p className="text-gray-400 text-sm mt-1">{product.description}</p>}
                          <div className="flex items-center gap-3 mt-2">
                            <span className="text-purple-400 font-bold text-lg">{product.price} جنيه</span>
                            {product.available_count && <span className="text-gray-400 text-xs bg-white/5 px-2 py-1 rounded-lg">متاح: {product.available_count}</span>}
                          </div>
                          {!order ? (
                            <div className="mt-3 space-y-2">
                              <input type="text" placeholder="ملاحظة (اختياري)" value={notes[product.id] || ''}
                                onChange={e => setNotes(prev => ({ ...prev, [product.id]: e.target.value }))}
                                className="w-full bg-white/5 border border-white/10 rounded-xl py-2 px-3 text-white text-sm focus:border-purple-500 focus:outline-none" />
                              <button onClick={() => handleOrder(product.id)} disabled={ordering === product.id}
                                className="gradient-primary px-6 py-2 rounded-xl text-white font-bold text-sm hover:opacity-90 disabled:opacity-50 flex items-center gap-2">
                                {ordering === product.id ? '⏳ جاري...' : <><FiCheck /> اطلب الآن</>}
                              </button>
                            </div>
                          ) : (
                            <div className={`mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold ${
                              order.status === 'delivered' ? 'bg-green-400/10 text-green-400' :
                              order.status === 'confirmed' ? 'bg-blue-400/10 text-blue-400' :
                              order.status === 'cancelled' ? 'bg-red-400/10 text-red-400' :
                              'bg-yellow-400/10 text-yellow-400'
                            }`}>
                              {statusLabel[order.status] || '⏳ قيد المراجعة'}
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
