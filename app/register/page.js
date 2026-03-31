'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function RegisterPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', phone: '', parent_phone: '', stage: '', school: '', password: '' })

  const handleRegister = async () => {
    if (!form.name || !form.email || !form.password) {
      setError('من فضلك اكمل الاسم والايميل وكلمة المرور')
      return
    }
    setLoading(true)
    setError('')

    const { data, error: signUpError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
    })

    if (signUpError) {
      setError(signUpError.message)
      setLoading(false)
      return
    }

    const { error: insertError } = await supabase
      .from('students')
      .insert({
        user_id: data.user?.id,
        name: form.name,
        email: form.email,
        phone: form.phone,
        parent_phone: form.parent_phone,
        stage: form.stage,
        school: form.school,
        status: 'pending',
      })

    if (insertError) {
      setError(insertError.message)
      setLoading(false)
      return
    }

    await supabase.auth.signOut()
    setSuccess(true)
    setLoading(false)
  }

  if (success) return (
    <div className="min-h-screen flex items-center justify-center" dir="rtl">
      <div className="glass rounded-2xl p-10 text-center max-w-md">
        <div className="text-6xl mb-4">⏳</div>
        <h2 className="text-2xl font-black mb-2">طلبك اتبعت!</h2>
        <p className="text-gray-400">الأدمن هيراجع طلبك وهيتواصل معاك قريباً</p>
        <a href="/login" className="mt-6 inline-block text-blue-400 underline">رجوع لتسجيل الدخول</a>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950" dir="rtl">
      <div className="glass rounded-2xl p-8 w-full max-w-md">
        <h1 className="text-2xl font-black mb-6 text-center">إنشاء حساب جديد</h1>

        {error && <div className="bg-red-500/20 text-red-400 p-3 rounded-xl mb-4 text-sm">{error}</div>}

        <div className="space-y-4">
          <input type="text" placeholder="الاسم الكامل *" className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white focus:border-purple-500 focus:outline-none"
            value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
          <input type="email" placeholder="البريد الإلكتروني *" className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white focus:border-purple-500 focus:outline-none"
            value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
          <input type="password" placeholder="كلمة المرور *" className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white focus:border-purple-500 focus:outline-none"
            value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
          <input type="tel" placeholder="رقم الموبايل" className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white focus:border-purple-500 focus:outline-none"
            value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
          <input type="tel" placeholder="رقم ولي الأمر" className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white focus:border-purple-500 focus:outline-none"
            value={form.parent_phone} onChange={e => setForm({ ...form, parent_phone: e.target.value })} />
          <input type="text" placeholder="المرحلة الدراسية" className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white focus:border-purple-500 focus:outline-none"
            value={form.stage} onChange={e => setForm({ ...form, stage: e.target.value })} />
          <input type="text" placeholder="المدرسة" className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white focus:border-purple-500 focus:outline-none"
            value={form.school} onChange={e => setForm({ ...form, school: e.target.value })} />

          <button onClick={handleRegister} disabled={loading}
            className="w-full gradient-primary py-3 rounded-xl text-white font-bold hover:opacity-90 disabled:opacity-50">
            {loading ? 'جارٍ الإرسال...' : 'إرسال طلب التسجيل'}
          </button>
        </div>

        <p className="text-center text-sm text-gray-400 mt-4">
          عندك حساب؟ <a href="/login" className="text-purple-400 font-semibold">سجل دخول</a>
        </p>
      </div>
    </div>
  )
}
