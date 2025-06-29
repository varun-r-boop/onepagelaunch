'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Github, Mail, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

export default function SigninPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();
  
  const [loading, setLoading] = useState(true);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const slug = searchParams.get('slug');
  const verified = searchParams.get('verified');

  // Show success message when email is verified
  useEffect(() => {
    if (verified === 'true') {
      toast.success('Email confirmed successfully! You can now sign in.');
    }
  }, [verified]);

  // Load user on mount
  useEffect(() => {
    const getUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        // If user is already signed in
        if (user) {
          if (slug) {
            router.push(`/create?slug=${encodeURIComponent(slug)}`);
          } else {
            // Check if user has existing projects and redirect to most recent one
            try {
              const { data: projects } = await supabase
                .from('projects')
                .select('slug, data, updated_at')
                .eq('user_id', user.id)
                .order('updated_at', { ascending: false })
                .limit(1);

              if (projects && projects.length > 0) {
                const mostRecentProject = projects[0];
                // Check if it's a block-based project
                if (mostRecentProject.data && mostRecentProject.data.blocks && Array.isArray(mostRecentProject.data.blocks)) {
                  router.push(`/${mostRecentProject.slug}`);
                  return;
                }
              }
            } catch (projectError) {
              console.warn('Unable to fetch user projects:', projectError);
            }
            
            // Fallback: redirect to create page if no projects found
            router.push('/create');
          }
        }
      } catch (error) {
        console.error('Error getting user:', error);
      } finally {
        setLoading(false);
      }
    };

    getUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setLoading(false);
        
        // If user signs in
        if (event === 'SIGNED_IN' && session?.user) {
          if (slug) {
            router.push(`/create?slug=${encodeURIComponent(slug)}`);
          } else {
            // Check if user has existing projects and redirect to most recent one
            try {
              const { data: projects } = await supabase
                .from('projects')
                .select('slug, data, updated_at')
                .eq('user_id', session.user.id)
                .order('updated_at', { ascending: false })
                .limit(1);

              if (projects && projects.length > 0) {
                const mostRecentProject = projects[0];
                // Check if it's a block-based project
                if (mostRecentProject.data && mostRecentProject.data.blocks && Array.isArray(mostRecentProject.data.blocks)) {
                  router.push(`/${mostRecentProject.slug}`);
                  return;
                }
              }
            } catch (projectError) {
              console.warn('Unable to fetch user projects:', projectError);
            }
            
            // Fallback: redirect to create page if no projects found
            router.push('/create');
          }
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [slug, router, supabase]);

  const handleGitHubSignIn = async () => {
    setIsSigningIn(true);
    try {
      const redirectTo = slug 
        ? `${window.location.protocol}//${window.location.host}/auth/callback?next=/create&slug=${encodeURIComponent(slug)}`
        : `${window.location.protocol}//${window.location.host}/auth/callback?next=/user-projects`;
        
      await supabase.auth.signInWithOAuth({
        provider: 'github',
        options: {
          redirectTo,
        },
      });
    } catch (error) {
      console.error('Error signing in with GitHub:', error);
      toast.error('Failed to sign in with GitHub. Please try again.');
      setIsSigningIn(false);
    }
  };

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setIsSigningIn(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        toast.error(error.message);
      } else if (data.user) {
        toast.success('Signed in successfully!');
        if (slug) {
          router.push(`/create?slug=${encodeURIComponent(slug)}`);
        } else {
          // Check if user has existing projects and redirect to most recent one
          try {
            const { data: projects } = await supabase
              .from('projects')
              .select('slug, data, updated_at')
              .eq('user_id', data.user.id)
              .order('updated_at', { ascending: false })
              .limit(1);

            if (projects && projects.length > 0) {
              const mostRecentProject = projects[0];
              // Check if it's a block-based project
              if (mostRecentProject.data && mostRecentProject.data.blocks && Array.isArray(mostRecentProject.data.blocks)) {
                router.push(`/${mostRecentProject.slug}`);
                return;
              }
            }
          } catch (projectError) {
            console.warn('Unable to fetch user projects:', projectError);
          }
          
          // Fallback: redirect to create page if no projects found
          router.push('/create');
        }
      }
    } catch (error) {
      console.error('Error signing in:', error);
      toast.error('An unexpected error occurred. Please try again.');
    } finally {
      setIsSigningIn(false);
    }
  };

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-gray-800 font-sans flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white border border-gray-200 rounded-2xl p-8 md:p-10 text-center shadow-xl">
        <div className="text-3xl mb-4">🧱</div>
        <h1 className="text-2xl font-semibold mb-2">Welcome Back</h1>
        <p className="text-gray-500 mb-6 text-sm">
          {slug ? `Ready to continue building onepagelaunch.vercel.app/${slug}?` : 'Sign in to your OnePageLaunch account'}
        </p>

        {/* Back button */}
        <div className="mb-6">
          <Link href="/" className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Home
          </Link>
        </div>

        {/* GitHub Sign In */}
        <div className="mb-6">
          <button 
            onClick={handleGitHubSignIn}
            disabled={isSigningIn}
            className="w-full bg-black text-white py-3 rounded-lg hover:opacity-90 transition flex justify-center items-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            <Github className="w-5 h-5" />
            {isSigningIn ? 'Signing in...' : 'Continue with GitHub'}
          </button>
        </div>

        {/* Divider */}
        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">Or continue with email</span>
          </div>
        </div>

        {/* Email Sign In Form */}
        <form onSubmit={handleEmailSignIn} className="space-y-4">
          <div className="text-left">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
              required
            />
          </div>

          <div className="text-left">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <div className="relative">
              <input 
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4 text-gray-400" />
                ) : (
                  <Eye className="h-4 w-4 text-gray-400" />
                )}
              </button>
            </div>
          </div>

          <button 
            type="submit"
            disabled={isSigningIn || !email || !password}
            className="w-full bg-indigo-600 text-white py-3 rounded-lg hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
          >
            <Mail className="w-4 h-4" />
            {isSigningIn ? 'Signing in...' : 'Sign in with Email'}
          </button>
        </form>

        {/* Sign up link */}
        <div className="mt-6 text-sm text-gray-500">
          Don&apos;t have an account?{' '}
          <Link href={`/auth/signup${slug ? `?slug=${encodeURIComponent(slug)}` : ''}`} className="text-indigo-600 hover:text-indigo-500">
            Sign up
          </Link>
        </div>
      </div>
    </div>
  );
} 