import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { isAppHost } from '@/lib/app-hosts'
import { isPro, type Subscription } from '@/lib/plans'

// Finds the page connected to a custom domain (with or without "www."), and
// only serves it while the owner is on Pro (checked when the secret key is set)
async function slugForDomain(host: string): Promise<string | null> {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SECRET_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  if (!base || !key) return null
  const headers = { apikey: key, Authorization: `Bearer ${key}` }
  const alternate = host.startsWith('www.') ? host.slice(4) : `www.${host}`
  try {
    const res = await fetch(
      `${base}/rest/v1/projects?select=slug,user_id&or=(custom_domain.eq.${encodeURIComponent(host)},custom_domain.eq.${encodeURIComponent(alternate)})&limit=1`,
      { headers, cache: 'no-store' },
    )
    const [project] = res.ok ? ((await res.json()) as { slug: string; user_id: string }[]) : []
    if (!project) return null
    if (process.env.SUPABASE_SECRET_KEY) {
      const sub = await fetch(
        `${base}/rest/v1/subscriptions?select=plan,status,ends_at,renews_at,portal_url&user_id=eq.${project.user_id}&limit=1`,
        { headers, cache: 'no-store' },
      )
      const [subscription] = sub.ok ? ((await sub.json()) as Subscription[]) : []
      if (!isPro(subscription)) return null
    }
    return project.slug
  } catch (error) {
    console.error('Custom domain lookup failed:', error)
    return null
  }
}

export async function proxy(request: NextRequest) {
  // A customer's own domain: show their page. API calls (waitlist, analytics) pass through.
  // The domain the visitor typed (nextUrl may report the server's own host)
  const host = (request.headers.get('x-forwarded-host') ?? request.headers.get('host') ?? request.nextUrl.hostname).split(',')[0].trim().replace(/:\d+$/, '')
  if (!isAppHost(host)) {
    if (request.nextUrl.pathname.startsWith('/api/')) return NextResponse.next()
    const slug = await slugForDomain(host.toLowerCase())
    if (!slug) return new NextResponse('This domain isn’t connected to a page.', { status: 404 })
    const url = request.nextUrl.clone()
    url.pathname = `/${slug}`
    return NextResponse.rewrite(url)
  }

  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANT: Avoid writing any logic between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (
    !user &&
    (
      request.nextUrl.pathname.startsWith('/dashboard') ||
      (
        request.nextUrl.pathname.startsWith('/api/projects') &&
        !request.nextUrl.pathname.startsWith('/api/projects/public/')
      )
    )
  ) {
    // no user, potentially respond by redirecting the user to the login page
    const url = request.nextUrl.clone()
    url.pathname = '/'
    return NextResponse.redirect(url)
  }

  // IMPORTANT: You *must* return the supabaseResponse object as it is. If you're
  // creating a new response object with NextResponse.next() make sure to:
  // 1. Pass the request in it, like so:
  //    const myNewResponse = NextResponse.next({ request })
  // 2. Copy over the cookies, like so:
  //    myNewResponse.cookies.setAll(supabaseResponse.cookies.getAll())

  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
} 