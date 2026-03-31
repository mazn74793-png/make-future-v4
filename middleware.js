import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'

export async function middleware(req) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })
  const { data: { session } } = await supabase.auth.getSession()

  const isAuth = req.nextUrl.pathname.startsWith('/dashboard')
  const isLogin = req.nextUrl.pathname === '/login'
  const isPending = req.nextUrl.pathname === '/pending'

  if (isAuth && !session) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  if (session && isAuth) {
    const { data: student } = await supabase
      .from('students')
      .select('status')
      .eq('user_id', session.user.id)
      .single()

    if (student?.status === 'pending') {
      return NextResponse.redirect(new URL('/pending', req.url))
    }
    if (student?.status === 'rejected') {
      await supabase.auth.signOut()
      return NextResponse.redirect(new URL('/login?rejected=1', req.url))
    }
  }

  if (session && isLogin) {
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  return res
}

export const config = {
  matcher: ['/dashboard/:path*', '/login'],
}
