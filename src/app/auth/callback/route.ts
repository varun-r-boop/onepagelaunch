import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  // if "next" is in param, use it as the redirect URL
  let next = searchParams.get('next') ?? '/dashboard'
  
  if (!next.startsWith('/')) {
    // if "next" is not a relative URL, use the default
    next = '/dashboard'
  }

  if (code) {
    const supabase = await createClient()
    const { error, data } = await supabase.auth.exchangeCodeForSession(code)
    if (!error && data.user) {
      // Check if user has existing projects
      const { data: projects, error: projectsError } = await supabase
        .from('projects')
        .select('id, slug, data, updated_at')
        .eq('user_id', data.user.id)
        .order('updated_at', { ascending: false })
        .limit(1)

      // If user has projects and we're redirecting to dashboard or create page, redirect to their most recent project's edit flow
      if (!projectsError && projects && projects.length > 0 && (next === '/dashboard' || next === '/create')) {
        const mostRecentProject = projects[0]
        // Check if it's a block-based project
        if (mostRecentProject.data && mostRecentProject.data.blocks && Array.isArray(mostRecentProject.data.blocks)) {
          next = `/builder?edit=${mostRecentProject.id}`
        }
      }

      const forwardedHost = request.headers.get('x-forwarded-host') // original origin before load balancer
      const isLocalEnv = process.env.NODE_ENV === 'development'
      if (isLocalEnv) {
        // we can be sure that there is no load balancer in between, so no need to watch for X-Forwarded-Host
        return NextResponse.redirect(`${origin}${next}`)
      } else if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${next}`)
      } else {
        return NextResponse.redirect(`${origin}${next}`)
      }
    }
  }

  // return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/auth/auth-code-error`)
} 