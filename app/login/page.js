const handleLogin = async (e) => {
  e.preventDefault();
  setLoading(true);
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    toast.error('❌ إيميل أو باسورد غلط');
    setLoading(false);
    return;
  }

  // تحقق نوع الـ user
  const user = data.user;

  // هل أدمن؟
  const { data: admin } = await supabase
    .from('admins')
    .select('id')
    .eq('email', user.email)
    .single();

  if (admin) {
    window.location.href = '/dashboard';
    return;
  }

  // هل طالب؟
  const { data: student } = await supabase
    .from('students')
    .select('status')
    .eq('user_id', user.id)
    .single();

  if (student?.status === 'approved') {
    window.location.href = '/student';
  } else if (student?.status === 'pending') {
    window.location.href = '/pending';
  } else if (student?.status === 'rejected') {
    await supabase.auth.signOut();
    toast.error('❌ تم رفض طلبك');
    setLoading(false);
  } else {
    window.location.href = '/';
  }
};
