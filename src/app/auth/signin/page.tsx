'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Github, Mail, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

function SigninPageContent() {
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
        const user = session?.user ?? null;
        
        if (user) {
          if (slug) {
            router.push(`/create?slug=${encodeURIComponent(slug)}`);
          } else {
            // Check if user has existing projects
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
            
            // Fallback: redirect to create page
            router.push('/create');
          }
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [supabase, router, slug]);

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSigningIn(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        toast.error(error.message);
      }
      // Success will be handled by the auth state change listener
    } catch (error) {
      console.error('Sign in error:', error);
      toast.error('An unexpected error occurred');
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleGitHubSignIn = async () => {
    setIsSigningIn(true);
    try {
      const redirectTo = `${window.location.origin}/auth/callback${slug ? `?slug=${encodeURIComponent(slug)}` : ''}`;
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'github',
        options: {
          redirectTo
        }
      });
      
      if (error) {
        console.error('GitHub sign in error:', error);
        toast.error(error.message || 'Failed to sign in with GitHub');
      }
    } catch (error) {
      console.error('Unexpected error during GitHub sign in:', error);
      toast.error('An unexpected error occurred');
    } finally {
      setIsSigningIn(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Welcome back</h1>
          <p className="text-gray-600">Sign in to your account</p>
        </div>

        {slug && (
          <div className="mb-6 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-700 mb-2">
              <strong>You&apos;ll be taken to:</strong>
            </p>
            <p className="font-mono text-blue-800 bg-white px-3 py-2 rounded border">
              onepagelaunch.vercel.app/{slug}
            </p>
          </div>
        )}

        <form onSubmit={handleEmailSignIn} className="space-y-4 mb-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Your password"
                className="w-full pr-10 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSigningIn}
            className="w-full px-4 py-3 border border-transparent rounded-lg shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {isSigningIn ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">or</span>
          </div>
        </div>

        <button
          onClick={handleGitHubSignIn}
          disabled={isSigningIn}
          className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg shadow-sm bg-white text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          <Github className="h-5 w-5 mr-3" />
          {isSigningIn ? 'Signing in...' : 'Continue with GitHub'}
        </button>

        <div className="mt-6 text-center">
                       <p className="text-sm text-gray-600">
               Don&apos;t have an account?{' '}
            <Link 
              href={`/auth/signup${slug ? `?slug=${encodeURIComponent(slug)}` : ''}`}
              className="font-medium text-blue-600 hover:text-blue-500"
            >
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function SigninPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <SigninPageContent />
    </Suspense>
  );
} 