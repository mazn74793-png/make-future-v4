'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { FiBookOpen, FiLogOut, FiLock, FiUnlock, FiClock, FiSend, FiPlay, FiAward, FiFileText } from 'react-icons/fi';

export default function StudentPage() {
  const [student, setStudent] = useState(null);
  const [courses, setCourses] = useState([]);
  const [requests, setRequests] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [exams, setExams] = useState([]);
  const [attempts, setAttempts] = useState([]);
  const [stats, setStats] = useState({ courses: 0, videos: 0, exams: 0 });
  const [loading, setLoading] = useState(true);
  const [requesting, setRequesting] = useState(null);
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
      ] = await Promise.all([
        supabase.from('courses').select('*').eq('is_published', true).order('order'),
        supabase.from('access_requests').select('*').eq('student_id', studentData.id),
        supabase.from('enrollments').select('course_id').eq('student_id', studentData.id).eq('is_active', true),
        supabase.from('exams').select('*').eq('is_active', true),
        supabase.from('exam_attempts').select('exam_id, is_submitted, percentage').eq('student_id', studentData.id),
        supabase.from('videos').select('id'),
      ]);

      setCourses(coursesData || []);
      setRequests(reqData || []);
      setEnrollments(enrollData?.map(e => e.course_id) || []);
      setExams(examsData || []);
      setAttempts(attemptsData || []);
      setStats({
        courses: coursesData?.length || 0,
        videos: videosData?.length || 0,
        exams: examsData?.length || 0,
      });
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

  const getRequestStatus = (courseId) => requests.find(r => r.course_id === courseId)?.status || null;
  const getExamAttempt = (examId) => attempts.find(a => a.exam_id === examId);

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

  const tabs = [
    { key: 'home', label: '🏠 الرئيسية' },
    { key: 'courses', label: `📚 الكورسات${enrolledCourses.length > 0 ? ` (${enrolledCourses.length})` : ''}` },
    { key: 'exams', label: `📝 الامتحانات${exams.length > 0 ? ` (${exams.length})` : ''}` },
    { key: 'products', label: '📦 المنتجات' },
  ];

  return (
    <div className="min-h-screen gradient-dark" dir="rtl">
      {/* Header */}
      <div className="glass border-b border-white/5 px-4 py-3 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 gradient-primary rounded-xl flex items-center justify-center font-bold text-white">
            {student?.name?.[0]}
          </div>
          <div className="hidden sm:block">
            <p className="font-bold text-sm leading-tight">{student?.name}</p>
            <p className="text-gray-400 text-xs">{student?.stage || 'طالب'}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1">
          {tabs.map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition ${activeTab === tab.key ? 'gradient-primary text-white' : 'text-gray-400 hover:bg-white/10'}`}>
              {tab.label}
            </button>
          ))}
        </div>

        <button onClick={handleLogout} className="text-red-400 p-2 hover:bg-red-400/10 rounded-xl transition">
          <FiLogOut />
        </button>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* ===== HOME TAB ===== */}
        {activeTab === 'home' && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold mb-4">مرحبا بك {student?.name}</h2>
            {/* محتوى الصفحة الرئيسية */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white p-4 rounded shadow">
                <div className="flex items-center space-x-2 mb-2">
                  <FiBookOpen className="text-xl" />
                  <h3 className="font-bold">الكورسات</h3>
                </div>
                <p>عدد الكورسات: {stats.courses}</p>
              </div>
              <div className="bg-white p-4 rounded shadow">
                <div className="flex items-center space-x-2 mb-2">
                  <FiFileText className="text-xl" />
                  <h3 className="font-bold">الامتحانات</h3>
                </div>
                <p>عدد الامتحانات: {stats.exams}</p>
              </div>
              <div className="bg-white p-4 rounded shadow">
                <div className="flex items-center space-x-2 mb-2">
                  <FiPlay className="text-xl" />
                  <h3 className="font-bold">الفيديوهات</h3>
                </div>
                <p>عدد الفيديوهات: {stats.videos}</p>
              </div>
            </div>
          </div>
        )}

        {/* ===== COURSES TAB ===== */}
        {activeTab === 'courses' && (
          <div className="space-y-8">
            <h2 className="text-xl font-bold mb-4">الكورسات المتاحة</h2>
            {enrolledCourses.length === 0 ? (
              <p>ليس لديك كورسات حالياً.</p>
            ) : (
              enrolledCourses.map(course => (
                <div key={course.id} className="bg-white p-4 rounded shadow mb-4">
                  <h3 className="font-bold mb-2">{course.title}</h3>
                  <p>{course.description}</p>
                </div>
              ))
            )}
            {availableCourses.length > 0 && (
              <>
                <h2 className="text-xl font-bold mb-4">كورسات جديدة</h2>
                {availableCourses.map(course => (
                  <div key={course.id} className="bg-white p-4 rounded shadow mb-4 flex justify-between items-center">
                    <div>
                      <h3 className="font-bold mb-2">{course.title}</h3>
                      <p>{course.description}</p>
                    </div>
                    <button
                      disabled={getRequestStatus(course.id) === 'pending'}
                      onClick={() => handleRequest(course.id)}
                      className={`px-4 py-2 rounded ${getRequestStatus(course.id) === 'pending' ? 'bg-gray-400' : 'bg-blue-500 hover:bg-blue-600'} text-white`}>
                      {getRequestStatus(course.id) === 'pending' ? 'قيد الانتظار' : 'طلب وصول'}
                    </button>
                  </div>
                ))}
              </>
            )}
          </div>
        )}

        {/* ===== EXAMS TAB ===== */}
        {activeTab === 'exams' && (
          <div>
            <h2 className="text-xl font-bold mb-4">الامتحانات</h2>
            {exams.length === 0 ? (
              <p>لا توجد امتحانات حالياً.</p>
            ) : (
              exams.map(exam => {
                const attempt = getExamAttempt(exam.id);
                return (
                  <div key={exam.id} className="bg-white p-4 rounded shadow mb-4">
                    <h3 className="font-bold mb-2">{exam.title}</h3>
                    <p>الدرجة: {attempt?.percentage ?? 0}%</p>
                    <button className="mt-2 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600">
                      ابدأ الامتحان
                    </button>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* ===== المنتجات TAB ===== */}
        {activeTab === 'products' && (
          <div>
            {/* استبدل بـ مكون المنتجات الخاص بك أو المحتوى المناسب */}
            <h2 className="text-xl font-bold mb-4">منتجات الطلاب</h2>
            <p>هنا يمكنك عرض منتجات الطلاب أو الطلبات.</p>
          </div>
        )}
      </div>
    </div>
  );
}
