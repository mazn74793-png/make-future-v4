import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function middleware(req) {
  const res = NextResponse.next()

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      global: {
        headers: { cookie: req.headers.get('cookie') || '' }
      }
    }
  )

  const { data: { session } } = await supabase.auth.getSession()

  const isAuth = req.nextUrl.pathname.startsWith('/dashboard')
  const isLogin = req.nextUrl.pathname === '/login'

  // مش logged in وبيحاول يدخل dashboard
  if (isAuth && !session) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  // logged in — نتحقق من نوعه
  if (session && isAuth) {
    // هل هو أدمن؟
    const { data: admin } = await supabase
      .from('admins')
      .select('id')
      .eq('user_id', session.user.id)
      .single()

    if (admin) return res // أدمن — يعدي

    // هل هو طالب؟
    const { data: student } = await supabase
      .from('students')
      .select('status')
      .eq('user_id', session.user.id)
      .single()

    if (student?.status === 'pending') {
      return NextResponse.redirect(new URL('/pending', req.url))
    }
    if (student?.status === 'rejected') {
      return NextResponse.redirect(new URL('/login?rejected=1', req.url))
    }
  }

  // logged in وبيحاول يفتح login → وجهه للـ dashboard
  if (session && isLogin) {
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  return res
}

export const config = {
  matcher: ['/dashboard/:path*', '/login'],
}
