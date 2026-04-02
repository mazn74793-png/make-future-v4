'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { FiBookOpen, FiLogOut, FiLock, FiUnlock, FiClock, FiSend, FiPlay, FiAward } from 'react-icons/fi';

export default function StudentPage() {
  const [student, setStudent] = useState(null);
  const [courses, setCourses] = useState([]);
  const [requests, setRequests] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [stats, setStats] = useState({ courses: 0, videos: 0 });
  const [loading, setLoading] = useState(true);
  const [requesting, setRequesting] = useState(null);
  const [activeTab, setActiveTab] = useState('home'); // 'home' | 'courses'
  const router = useRouter();

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/login'); return; }

      const { data: studentData } = await supabase
        .from('students').select('*').eq('user_id', user.id).single();
      if (!studentData || studentData.status !== 'approved') { router.push('/pending'); return; }
      setStudent(studentData);

      // الكورسات
      const { data: coursesData } = await supabase
        .from('courses').select('*').eq('is_published', true).order('order');
      setCourses(coursesData || []);

      // طلبات الوصول
      const { data: reqData } = await supabase
        .from('access_requests').select('*').eq('student_id', studentData.id);
      setRequests(reqData || []);

      // الكورسات المشترك فيها
      const { data: enrollData } = await supabase
        .from('enrollments').select('course_id').eq('student_id', studentData.id).eq('is_active', true);
      const enrolledIds = enrollData?.map(e => e.course_id) || [];
      setEnrollments(enrolledIds);

      // الإحصائيات الحقيقية
      const { count: videosCount } = await supabase
        .from('videos').select('*', { count: 'exact', head: true });
      setStats({ courses: coursesData?.length || 0, videos: videosCount || 0 });

      setLoading(false);
    };
    load();
  }, [router]);

  const handleRequest = async (courseId) => {
    setRequesting(courseId);
    const { error } = await supabase.from('access_requests').insert({
      student_id: student.id, course_id: courseId,
      message: 'طلب وصول للكورس', status: 'pending'
    });
    if (!error) setRequests(prev => [...prev, { course_id: courseId, status: 'pending' }]);
    setRequesting(null);
  };

  const getRequestStatus = (courseId) => requests.find(r => r.course_id === courseId)?.status || null;

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center gradient-dark">
      <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const enrolledCourses = courses.filter(c => enrollments.includes(c.id) || c.visibility === 'public');
  const availableCourses = courses.filter(c => !enrollments.includes(c.id) && c.visibility !== 'public');

  return (
    <div className="min-h-screen gradient-dark" dir="rtl">
      {/* Header */}
      <div className="glass border-b border-white/5 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 gradient-primary rounded-xl flex items-center justify-center font-bold text-white text-lg">
            {student?.name?.[0]}
          </div>
          <div>
            <p className="font-bold text-sm">{student?.name}</p>
            <p className="text-gray-400 text-xs">{student?.stage || 'طالب'}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => setActiveTab('home')}
            className={`text-sm px-4 py-2 rounded-xl transition ${activeTab === 'home' ? 'gradient-primary text-white' : 'text-gray-400 hover:text-white'}`}>
            الرئيسية
          </button>
          <button onClick={() => setActiveTab('courses')}
            className={`text-sm px-4 py-2 rounded-xl transition ${activeTab === 'courses' ? 'gradient-primary text-white' : 'text-gray-400 hover:text-white'}`}>
            الكورسات
          </button>
          <button onClick={handleLogout} className="text-red-400 hover:text-red-300 transition p-2">
            <FiLogOut />
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">

        {activeTab === 'home' && (
          <>
            {/* Hero */}
            <div className="glass rounded-3xl p-8 mb-8 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl" />
              <div className="absolute bottom-0 right-0 w-48 h-48 bg-pink-500/10 rounded-full blur-3xl" />
              <div className="relative z-10">
                <h1 className="text-3xl font-black mb-2">اهلاً {student?.name?.split(' ')[0]} 👋</h1>
                <p className="text-gray-400 mb-6">يلا نذاكر! في {enrolledCourses.length} كورس متاح ليك</p>
                <button onClick={() => setActiveTab('courses')}
                  className="gradient-primary px-8 py-3 rounded-xl text-white font-bold flex items-center gap-2 hover:opacity-90 transition">
                  <FiPlay /> ابدأ المذاكرة
                </button>
              </div>
            </div>

            {/* إحصائيات حقيقية */}
            <div className="grid grid-cols-3 gap-4 mb-8">
              <div className="glass rounded-2xl p-5 text-center">
                <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <FiBookOpen className="text-purple-400 text-xl" />
                </div>
                <p className="text-2xl font-black">{stats.courses}</p>
                <p className="text-gray-400 text-sm">كورس متاح</p>
              </div>
              <div className="glass rounded-2xl p-5 text-center">
                <div className="w-12 h-12 bg-pink-500/20 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <FiPlay className="text-pink-400 text-xl" />
                </div>
                <p className="text-2xl font-black">{stats.videos}</p>
                <p className="text-gray-400 text-sm">فيديو</p>
              </div>
              <div className="glass rounded-2xl p-5 text-center">
                <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <FiAward className="text-green-400 text-xl" />
                </div>
                <p className="text-2xl font-black">{enrolledCourses.length}</p>
                <p className="text-gray-400 text-sm">كورس مشترك</p>
              </div>
            </div>

            {/* كورساتي */}
            {enrolledCourses.length > 0 && (
              <div>
                <h2 className="text-xl font-black mb-4 flex items-center gap-2">
                  <FiUnlock className="text-green-400" /> كورساتي
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {enrolledCourses.slice(0, 3).map(course => (
                    <a key={course.id} href={`/student/course/${course.id}`}
                      className="glass rounded-2xl overflow-hidden hover:border-purple-500/50 border border-white/5 transition-all hover:-translate-y-1 cursor-pointer">
                      {course.thumbnail_url
                        ? <img src={course.thumbnail_url} alt={course.title} className="w-full h-36 object-cover" />
                        : <div className="w-full h-36 gradient-primary flex items-center justify-center"><FiBookOpen className="text-4xl text-white" /></div>}
                      <div className="p-4">
                        <h3 className="font-bold">{course.title}</h3>
                        <span className="text-xs bg-green-400/10 text-green-400 px-2 py-1 rounded-full mt-2 inline-block">✅ متاح</span>
                      </div>
                    </a>
                  ))}
                </div>
                {enrolledCourses.length > 3 && (
                  <button onClick={() => setActiveTab('courses')} className="mt-4 text-purple-400 text-sm hover:text-purple-300">
                    شوف كل الكورسات ({enrolledCourses.length}) ←
                  </button>
                )}
              </div>
            )}
          </>
        )}

        {activeTab === 'courses' && (
          <>
            {/* كورسات مشترك فيها */}
            {enrolledCourses.length > 0 && (
              <div className="mb-10">
                <h2 className="text-2xl font-black mb-6 flex items-center gap-2">
                  <FiUnlock className="text-green-400" /> كورساتي
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {enrolledCourses.map(course => (
                    <a key={course.id} href={`/student/course/${course.id}`}
                      className="glass rounded-2xl overflow-hidden hover:border-purple-500/50 border border-white/5 transition-all hover:-translate-y-1 cursor-pointer">
                      {course.thumbnail_url
                        ? <img src={course.thumbnail_url} alt={course.title} className="w-full h-40 object-cover" />
                        : <div className="w-full h-40 gradient-primary flex items-center justify-center"><FiBookOpen className="text-5xl text-white" /></div>}
                      <div className="p-4">
                        <h3 className="font-bold text-lg mb-2">{course.title}</h3>
                        {course.description && <p className="text-gray-400 text-sm line-clamp-2 mb-3">{course.description}</p>}
                        <span className="text-xs bg-green-400/10 text-green-400 px-3 py-1 rounded-full">✅ متاح</span>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* كورسات تحتاج إذن */}
            {availableCourses.length > 0 && (
              <div>
                <h2 className="text-2xl font-black mb-6 flex items-center gap-2">
                  <FiLock className="text-yellow-400" /> كورسات أخرى
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {availableCourses.map(course => {
                    const reqStatus = getRequestStatus(course.id);
                    return (
                      <div key={course.id} className="glass rounded-2xl overflow-hidden border border-white/5">
                        {course.thumbnail_url
                          ? <img src={course.thumbnail_url} alt={course.title} className="w-full h-40 object-cover opacity-50" />
                          : <div className="w-full h-40 bg-white/5 flex items-center justify-center"><FiLock className="text-5xl text-gray-500" /></div>}
                        <div className="p-4">
                          <h3 className="font-bold text-lg mb-1">{course.title}</h3>
                          {course.description && <p className="text-gray-400 text-sm line-clamp-2 mb-3">{course.description}</p>}
                          {!reqStatus && (
                            <button onClick={() => handleRequest(course.id)} disabled={requesting === course.id}
                              className="w-full gradient-primary py-2 rounded-xl text-white text-sm font-bold flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-50">
                              {requesting === course.id ? '⏳ جاري...' : <><FiSend /> اطلب الوصول</>}
                            </button>
                          )}
                          {reqStatus === 'pending' && (
                            <div className="w-full bg-yellow-400/10 text-yellow-400 py-2 rounded-xl text-sm font-bold text-center flex items-center justify-center gap-2">
                              <FiClock /> طلبك قيد المراجعة
                            </div>
                          )}
                          {reqStatus === 'rejected' && (
                            <div className="w-full bg-red-400/10 text-red-400 py-2 rounded-xl text-sm font-bold text-center">❌ تم رفض الطلب</div>
                          )}
                          {reqStatus === 'approved' && (
                            <a href={`/student/course/${course.id}`}
                              className="w-full gradient-primary py-2 rounded-xl text-white text-sm font-bold flex items-center justify-center gap-2">
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
                <p className="text-xl text-gray-400">مفيش كورسات متاحة دلوقتي</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
