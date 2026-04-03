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

  // أضفت الـ tab الخاص بالمنتجات هنا
  const tabs = [
    { key: 'home', label: '🏠 الرئيسية' },
    { key: 'courses', label: `📚 الكورسات${enrolledCourses.length > 0 ? ` (${enrolledCourses.length})` : ''}` },
    { key: 'exams', label: `📝 الامتحانات${exams.length > 0 ? ` (${exams.length})` : ''}` },
    { key: 'products', label: '📦 المنتجات' }, // التعديل هنا
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
            {/* المحتوى الخاص بالصفحة الرئيسية هنا */}
            {/* ... (نفس الكود السابق) ... */}
          </div>
        )}

        {/* ===== COURSES TAB ===== */}
        {activeTab === 'courses' && (
          <div className="space-y-8">
            {/* محتوى الكورسات هنا */}
            {/* ... (نفس الكود السابق) ... */}
          </div>
        )}

        {/* ===== EXAMS TAB ===== */}
        {activeTab === 'exams' && (
          <div>
            {/* محتوى الامتحانات هنا */}
            {/* ... (نفس الكود السابق) ... */}
          </div>
        )}

        {/* ===== المنتجات TAB ===== */}
        {activeTab === 'products' && (
          <StudentProducts student={student} />
        )}

      </div>
    </div>
  );
}
