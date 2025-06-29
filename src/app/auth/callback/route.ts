import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const error_code = searchParams.get('error')
  const error_description = searchParams.get('error_description')
  
  // if "next" is in param, use it as the redirect URL
  let next = searchParams.get('next') ?? '/user-projects'
  const slug = searchParams.get('slug')
  
  console.log('Auth callback:', { code: !!code, error_code, error_description, next, slug })
  
  if (!next.startsWith('/')) {
    // if "next" is not a relative URL, use the default
    next = '/user-projects'
  }

  // If we have a slug and we're going to create page, append it to the URL
  if (slug && next === '/create') {
    next = `/create?slug=${encodeURIComponent(slug)}`
  }

  // Check for OAuth errors first
  if (error_code) {
    console.error('OAuth error:', { error_code, error_description })
    return NextResponse.redirect(`${origin}/auth/auth-code-error?error=${encodeURIComponent(error_code)}`)
  }

  if (code) {
    const supabase = await createClient()
    const { error, data } = await supabase.auth.exchangeCodeForSession(code)
    
    console.log('Code exchange result:', { success: !error, hasUser: !!data.user, error: error?.message })
    
    if (!error && data.user) {
      // Check if user has existing projects
      const { data: projects, error: projectsError } = await supabase
        .from('projects')
        .select('id, slug, data, updated_at')
        .eq('user_id', data.user.id)
        .order('updated_at', { ascending: false })
        .limit(1)

      // If user has projects and we're redirecting to user-projects, dashboard, or create page, redirect to their most recent project
      if (!projectsError && projects && projects.length > 0 && (next === '/user-projects' || next === '/dashboard' || next.startsWith('/create'))) {
        const mostRecentProject = projects[0]
        // Check if it's a block-based project
        if (mostRecentProject.data && mostRecentProject.data.blocks && Array.isArray(mostRecentProject.data.blocks)) {
          next = `/${mostRecentProject.slug}`
        }
      }
      
      // If no projects found and redirecting to user-projects, redirect to create page instead
      if ((projectsError || !projects || projects.length === 0) && next === '/user-projects') {
        next = '/create'
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

  // Handle case where there's no code (might be email confirmation)
  console.log('No code parameter found, checking for other auth parameters')
  
  // Check for email confirmation or other auth flows
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type')
  
  // Log all parameters for debugging
  console.log('All callback parameters:', {
    code: !!code,
    token_hash: !!token_hash,
    type,
    error_code,
    error_description,
    next,
    slug,
    allParams: Object.fromEntries(searchParams.entries())
  })
  
  if (token_hash && type) {
    console.log('Found token_hash and type parameters:', { type, token_hash: !!token_hash })
    const supabase = await createClient()
    
    const { error } = await supabase.auth.verifyOtp({
      token_hash,
      type: type as 'signup' | 'invite' | 'magiclink' | 'recovery' | 'email_change' | 'email',
    })
    
    if (!error) {
      console.log('Email verification successful, redirecting to verification confirmation page')
      
      // After successful email verification, redirect to email verified page
      // This shows users their email is verified and gives them next steps
      const verifiedRedirect = slug 
        ? `/auth/email-verified?slug=${encodeURIComponent(slug)}`
        : '/auth/email-verified';
      
      console.log('Redirecting verified user to:', verifiedRedirect)
      
      const forwardedHost = request.headers.get('x-forwarded-host')
      const isLocalEnv = process.env.NODE_ENV === 'development'
      if (isLocalEnv) {
        return NextResponse.redirect(`${origin}${verifiedRedirect}`)
      } else if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${verifiedRedirect}`)
      } else {
        return NextResponse.redirect(`${origin}${verifiedRedirect}`)
      }
    } else {
      console.error('Email verification failed:', error)
      // Redirect to error page with more specific error information
      return NextResponse.redirect(`${origin}/auth/auth-code-error?error=${encodeURIComponent(`Email verification failed: ${error.message}`)}`)
    }
  }

  // return the user to an error page with instructions
  console.log('Redirecting to auth-code-error')
  return NextResponse.redirect(`${origin}/auth/auth-code-error`)
} 