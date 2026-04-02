// في الـ state
const [accessRequests, setAccessRequests] = useState([]);

// في الـ load function
const { data: accessReqs } = await supabase
  .from('access_requests')
  .select('*, students(name, email), courses(title)')
  .eq('status', 'pending')
  .order('created_at', { ascending: false });
setAccessRequests(accessReqs || []);

// function للـ approve/reject
const handleAccessRequest = async (id, status) => {
  await supabase.from('access_requests').update({ status }).eq('id', id);
  setAccessRequests(prev => prev.filter(r => r.id !== id));
  toast.success(status === 'approved' ? '✅ تم قبول الطلب' : '❌ تم رفض الطلب');
};

// في الـ JSX — قبل قائمة الطلاب
{accessRequests.length > 0 && (
  <div className="mb-8">
    <h2 className="text-xl font-bold mb-4 text-blue-400 flex items-center gap-2">
      🔑 طلبات الوصول للكورسات
      <span className="bg-blue-400/20 text-blue-400 text-sm px-3 py-1 rounded-full">{accessRequests.length}</span>
    </h2>
    <div className="space-y-3">
      {accessRequests.map(req => (
        <div key={req.id} className="glass rounded-xl p-4 flex items-center justify-between border border-blue-400/20">
          <div>
            <p className="font-bold">{req.students?.name}</p>
            <p className="text-sm text-gray-400">{req.students?.email}</p>
            <p className="text-sm text-blue-400 mt-1">📚 {req.courses?.title}</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => handleAccessRequest(req.id, 'approved')}
              className="bg-green-500/20 text-green-400 px-4 py-2 rounded-lg text-sm font-bold hover:bg-green-500/30">
              ✅ قبول
            </button>
            <button onClick={() => handleAccessRequest(req.id, 'rejected')}
              className="bg-red-500/20 text-red-400 px-4 py-2 rounded-lg text-sm font-bold hover:bg-red-500/30">
              ❌ رفض
            </button>
          </div>
        </div>
      ))}
    </div>
  </div>
)}
