'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { FiBookOpen, FiLogOut, FiLock, FiUnlock, FiClock, FiSend } from 'react-icons/fi';

export default function StudentPage() {
  const [student, setStudent] = useState(null);
  const [courses, setCourses] = useState([]);
  const [requests, setRequests] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [requesting, setRequesting] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/login'); return; }

      const { data: studentData } = await supabase
        .from('students').select('*').eq('user_id', user.id).single();

      if (!studentData || studentData.status !== 'approved') {
        router.push('/pending'); return;
      }
      setStudent(studentData);

      // الكورسات المتاحة
      const { data: coursesData } = await supabase
        .from('courses').select('*').eq('is_published', true).order('order');
      setCourses(coursesData || []);

      // طلبات الوصول الخاصة بالطالب
      const { data: reqData } = await supabase
        .from('access_requests').select('*').eq('student_id', studentData.id);
      setRequests(reqData || []);

      // الكورسات المشترك فيها
      const { data: enrollData } = await supabase
        .from('enrollments').select('course_id').eq('student_id', studentData.id).eq('is_active', true);
      setEnrollments(enrollData?.map(e => e.course_id) || []);

      setLoading(false);
    };
    load();
  }, [router]);

  const handleRequest = async (courseId) => {
    setRequesting(courseId);
    await supabase.from('access_requests').insert({
      student_id: student.id,
      course_id: courseId,
      message: 'طلب وصول للكورس',
      status: 'pending'
    });
    setRequests(prev => [...prev, { course_id: courseId, status: 'pending' }]);
    setRequesting(null);
  };

  const getRequestStatus = (courseId) => {
    const req = requests.find(r => r.course_id === courseId);
    return req?.status || null;
  };

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
  const availableCourses = courses.filter(c => !enrollments.includes(c.id) && c.visibility === 'private');

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
        <button onClick={handleLogout} className="flex items-center gap-2 text-red-400 hover:text-red-300 transition text-sm">
          <FiLogOut /> خروج
        </button>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">

        {/* كورساتي */}
        {enrolledCourses.length > 0 && (
          <div className="mb-10">
            <h2 className="text-2xl font-black mb-6 flex items-center gap-2">
              <FiUnlock className="text-green-400" /> كورساتي
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {enrolledCourses.map(course => (
                <a key={course.id} href={`/student/course/${course.id}`}
                  className="glass rounded-2xl overflow-hidden hover:border-purple-500/50 border border-white/5 transition-all hover:-translate-y-1 cursor-pointer">
                  {course.thumbnail_url ? (
                    <img src={course.thumbnail_url} alt={course.title} className="w-full h-40 object-cover" />
                  ) : (
                    <div className="w-full h-40 gradient-primary flex items-center justify-center">
                      <FiBookOpen className="text-5xl text-white" />
                    </div>
                  )}
                  <div className="p-4">
                    <h3 className="font-bold text-lg mb-1">{course.title}</h3>
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
                    {course.thumbnail_url ? (
                      <img src={course.thumbnail_url} alt={course.title} className="w-full h-40 object-cover opacity-60" />
                    ) : (
                      <div className="w-full h-40 bg-white/5 flex items-center justify-center">
                        <FiLock className="text-5xl text-gray-500" />
                      </div>
                    )}
                    <div className="p-4">
                      <h3 className="font-bold text-lg mb-1">{course.title}</h3>
                      {course.description && <p className="text-gray-400 text-sm line-clamp-2 mb-3">{course.description}</p>}

                      {!reqStatus && (
                        <button onClick={() => handleRequest(course.id)} disabled={requesting === course.id}
                          className="w-full gradient-primary py-2 rounded-xl text-white text-sm font-bold flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-50">
                          {requesting === course.id ? '⏳ جاري الطلب...' : <><FiSend /> اطلب الوصول</>}
                        </button>
                      )}
                      {reqStatus === 'pending' && (
                        <div className="w-full bg-yellow-400/10 text-yellow-400 py-2 rounded-xl text-sm font-bold text-center flex items-center justify-center gap-2">
                          <FiClock /> طلبك قيد المراجعة
                        </div>
                      )}
                      {reqStatus === 'rejected' && (
                        <div className="w-full bg-red-400/10 text-red-400 py-2 rounded-xl text-sm font-bold text-center">
                          ❌ تم رفض الطلب
                        </div>
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
      </div>
    </div>
  );
}
