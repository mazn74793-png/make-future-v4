'use client';
import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import {
  FiBookOpen, FiLogOut, FiLock, FiUnlock, FiClock,
  FiSend, FiPlay, FiFileText, FiPackage, FiCheck,
  FiHome, FiAward, FiSun, FiMoon, FiShoppingBag, FiUser
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
  const [isDark, setIsDark] = useState(true);
  const router = useRouter();

  // --- إدارة الثيم متوافق مع الموقع كله ---
  useEffect(() => {
    const saved = localStorage.getItem('theme') || 'dark';
    setIsDark(saved === 'dark');
    document.documentElement.classList.toggle('dark', saved === 'dark');
  }, []);

  const toggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    const themeStr = next ? 'dark' : 'light';
    document.documentElement.classList.toggle('dark', next);
    document.documentElement.classList.toggle('light', !next);
    localStorage.setItem('theme', themeStr);
  };

  // --- جلب البيانات ---
  useEffect(() => {
    const loadData = async () => {
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
    loadData();
  }, [router]);

  const handleOrder = async (productId) => {
    setOrdering(productId);
    const { data, error } = await supabase.from('product_orders').insert({
      product_id: productId, student_id: student.id,
      student_name: student.name, student_phone: student.phone,
      notes: notes[productId] || '', status: 'pending'
    }).select().single();
    if (!error) setMyOrders(prev => [...prev, data]);
    setOrdering(null);
  };

  const getExamAttempt = (examId) => attempts.find(a => a.exam_id === examId);
  const getOrder = (productId) => myOrders.find(o => o.product_id === productId);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#09090b]">
      <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
    </div>
  );

  const enrolledCourses = courses.filter(c => enrollments.includes(c.id) || c.visibility === 'public');
  const statusLabel = { pending: '⏳ معلق', confirmed: '✅ مؤكد', delivered: '📦 تم التوصيل', cancelled: '❌ ملغي' };

  const tabs = [
    { key: 'home', icon: <FiHome />, label: 'الرئيسية' },
    { key: 'courses', icon: <FiBookOpen />, label: 'كورساتي' },
    { key: 'exams', icon: <FiFileText />, label: 'الامتحانات' },
    { key: 'products', icon: <FiShoppingBag />, label: 'المتجر' },
  ];

  return (
    <div className="min-h-screen transition-colors duration-300 pb-24 md:pb-8">
      
      {/* Navbar العلوي */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-white/5 px-6 h-20">
        <div className="max-w-7xl mx-auto h-full flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-2xl gradient-primary flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
              <FiUser size={20} />
            </div>
            <div className="hidden sm:block">
              <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest">الطالب</p>
              <h2 className="font-bold text-sm">{student?.name}</h2>
            </div>
          </div>

          <div className="hidden md:flex bg-white/5 p-1 rounded-2xl gap-1 border border-white/5">
            {tabs.map(tab => (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                className={`px-6 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all ${activeTab === tab.key ? 'bg-indigo-500 text-white shadow-lg' : 'hover:bg-white/5 text-gray-400'}`}>
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <button onClick={toggleTheme} className="w-10 h-10 glass-card flex items-center justify-center rounded-2xl hover:scale-105 active:scale-95 transition-all">
              {isDark ? <FiSun className="text-amber-400" /> : <FiMoon className="text-indigo-500" />}
            </button>
            <button onClick={() => supabase.auth.signOut()} className="w-10 h-10 rounded-2xl bg-red-500/10 text-red-500 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all">
              <FiLogOut size={18} />
            </button>
          </div>
        </div>
      </nav>

      <div className="h-24" />

      {/* المحتوى الرئيسي */}
      <main className="max-w-7xl mx-auto px-6 relative z-10">
        
        {activeTab === 'home' && (
          <div className="space-y-8 animate-fade-in">
            {/* بطاقة الترحيب الفخمة */}
            <div className="relative glass-card p-8 md:p-12 overflow-hidden border-none bg-gradient-to-br from-indigo-600/20 to-purple-600/10">
              <div className="relative z-10 max-w-2xl">
                <span className="bg-indigo-500 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest mb-4 inline-block">لوحة التحكم</span>
                <h1 className="text-3xl md:text-5xl font-black mb-4 leading-tight">أهلاً بك مجدداً، <br/><span className="text-indigo-400">{student?.name?.split(' ')[0]}</span>!</h1>
                <p className="text-gray-400 text-lg mb-8 leading-relaxed">لديك {enrolledCourses.length} كورسات نشطة و {exams.length} اختبارات في انتظارك. ابدأ الآن واستكمل مسيرتك التعليمية.</p>
                <div className="flex flex-wrap gap-4">
                   <button onClick={() => setActiveTab('courses')} className="gradient-primary text-white px-10 py-4 rounded-2xl font-bold shadow-xl shadow-indigo-500/20 hover:scale-105 transition-transform flex items-center gap-2">
                    <FiPlay /> استكمال التعلم
                  </button>
                  <div className="glass-card px-6 py-4 flex items-center gap-3">
                    <span className="text-gray-500 text-xs font-bold">كود الطالب:</span>
                    <span className="font-mono font-black text-indigo-500 tracking-tighter">{student?.student_code}</span>
                  </div>
                </div>
              </div>
              <FiAward className="absolute -bottom-10 -right-10 text-white/5 rotate-12" size={300} />
            </div>

            {/* الإحصائيات */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'كورس مشترك', value: enrolledCourses.length, icon: <FiUnlock />, color: 'text-blue-500' },
                { label: 'فيديو متاح', value: stats.videos, icon: <FiPlay />, color: 'text-purple-500' },
                { label: 'اختبار متاح', value: stats.exams, icon: <FiFileText />, color: 'text-amber-500' },
                { label: 'طلب شراء', value: myOrders.length, icon: <FiPackage />, color: 'text-emerald-500' },
              ].map((s, i) => (
                <div key={i} className="glass-card p-6 flex flex-col items-center justify-center text-center">
                  <div className={`text-2xl mb-2 ${s.color}`}>{s.icon}</div>
                  <div className="text-3xl font-black mb-1">{s.value}</div>
                  <div className="text-[10px] uppercase font-bold text-gray-500">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'courses' && (
          <div className="space-y-6 animate-fade-in">
            <h2 className="text-2xl font-black flex items-center gap-3">كورساتك <span className="text-gray-500 text-sm font-normal">({enrolledCourses.length})</span></h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {enrolledCourses.map(course => (
                <a key={course.id} href={`/student/course/${course.id}`} className="glass-card overflow-hidden group hover:border-indigo-500/30 transition-all">
                  <div className="aspect-video relative overflow-hidden bg-gray-900">
                    <img src={course.thumbnail_url || '/placeholder.png'} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="w-12 h-12 rounded-full bg-white text-black flex items-center justify-center shadow-2xl">
                        <FiPlay fill="currentColor" />
                      </div>
                    </div>
                  </div>
                  <div className="p-6">
                    <h3 className="font-bold mb-4 line-clamp-1 group-hover:text-indigo-400 transition-colors">{course.title}</h3>
                    <div className="flex items-center justify-between">
                       <span className="text-[10px] font-black uppercase text-indigo-500 bg-indigo-500/10 px-3 py-1 rounded-lg flex items-center gap-2">
                        <FiUnlock size={12}/> مفتوح الآن
                       </span>
                       <FiCheck className="text-green-500" />
                    </div>
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'exams' && (
          <div className="max-w-3xl mx-auto space-y-4 animate-fade-in">
            <h2 className="text-2xl font-black mb-6">الاختبارات المتاحة</h2>
            {exams.map(ex => {
              const att = getExamAttempt(ex.id);
              return (
                <div key={ex.id} className="glass-card p-6 flex items-center justify-between border-r-4 border-r-indigo-500">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl ${att ? 'bg-green-500/10 text-green-500' : 'bg-indigo-500/10 text-indigo-500'}`}>
                      <FiFileText />
                    </div>
                    <div>
                      <h3 className="font-bold">{ex.title}</h3>
                      <p className="text-xs text-gray-500 mt-1">{ex.duration_minutes} دقيقة • {ex.pass_score}% للنجاح</p>
                    </div>
                  </div>
                  {att ? (
                    <div className="bg-white/5 px-6 py-2 rounded-2xl text-center">
                      <div className="text-xl font-black text-indigo-400">{att.percentage}%</div>
                      <span className="text-[8px] font-bold text-gray-500 uppercase">النتيجة</span>
                    </div>
                  ) : (
                    <a href={`/student/exam/${ex.id}`} className="gradient-primary text-white px-8 py-3 rounded-xl text-sm font-bold shadow-lg">ابدأ</a>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {activeTab === 'products' && (
          <div className="space-y-8 animate-fade-in">
            <div className="flex items-center justify-between">
               <h2 className="text-2xl font-black">المتجر التعليمي</h2>
               <div className="text-xs text-gray-500 font-bold bg-white/5 px-4 py-2 rounded-full">توصيل سريع لكل المحافظات</div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map(product => {
                const order = getOrder(product.id);
                return (
                  <div key={product.id} className="glass-card overflow-hidden flex flex-col">
                    <div className="h-48 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 flex items-center justify-center text-6xl group-hover:scale-110 transition-transform">
                      {product.type === 'book' ? '📚' : '🎁'}
                    </div>
                    <div className="p-6 flex flex-col flex-1">
                      <h3 className="font-bold text-lg mb-2">{product.title}</h3>
                      <div className="text-2xl font-black text-indigo-500 mb-6">{product.price} <span className="text-xs font-normal text-gray-500 uppercase tracking-widest">ج.م</span></div>
                      
                      <div className="mt-auto">
                        {order ? (
                          <div className="w-full py-4 text-center rounded-2xl font-bold text-xs bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                             {statusLabel[order.status]}
                          </div>
                        ) : (
                          <div className="space-y-3">
                            <input 
                              type="text" 
                              placeholder="العنوان بالتفصيل..." 
                              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-indigo-500 outline-none transition-all"
                              onChange={e => setNotes(prev => ({ ...prev, [product.id]: e.target.value }))}
                            />
                            <button 
                              onClick={() => handleOrder(product.id)}
                              disabled={ordering === product.id}
                              className="w-full gradient-primary text-white py-4 rounded-2xl text-sm font-bold shadow-xl shadow-indigo-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                            >
                              {ordering === product.id ? 'جاري معالجة الطلب...' : 'إتمام الطلب الآن'}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>

      {/* موبايل ناف - Glassmorphism */}
      <div className="fixed bottom-6 left-6 right-6 z-50 md:hidden">
        <div className="glass h-20 rounded-[2.5rem] flex justify-around items-center px-4 border border-white/10 shadow-2xl">
          {tabs.map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className={`flex flex-col items-center gap-1.5 transition-all ${activeTab === tab.key ? 'text-indigo-500 scale-110' : 'text-gray-500 hover:text-gray-300'}`}>
              <span className="text-2xl">{tab.icon}</span>
              <span className="text-[8px] font-black uppercase tracking-widest">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
