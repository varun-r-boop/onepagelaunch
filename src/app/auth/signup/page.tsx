'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Github, Mail, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

function SignupPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();
  
  const [loading, setLoading] = useState(true);
  const [isSigningUp, setIsSigningUp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const slug = searchParams.get('slug');

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

  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setIsSigningUp(true);

    try {
      // TEMPORARY: Email verification disabled for easier signup flow
      // TODO: Uncomment the lines below to re-enable email verification
      // const redirectTo = `${window.location.origin}/auth/callback${slug ? `?slug=${encodeURIComponent(slug)}` : ''}`;
      
      // TEMPORARY: Try to create user without email confirmation requirement
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            // Any additional user metadata can go here
          }
          // TODO: When re-enabling email verification, uncomment the line below:
          // emailRedirectTo: redirectTo,
        }
      });

      // TEMPORARY: Log the response to debug any issues
      console.log('Signup response:', { data, error });

      if (error) {
        toast.error(error.message);
      } else {
        // TEMPORARY: Updated success message for immediate signup (no email verification)
        // TODO: Change back to 'Check your email for the confirmation link!' when re-enabling verification
        toast.success('Account created successfully! You can now sign in.');
      }
    } catch (error) {
      console.error('Sign up error:', error);
      toast.error('An unexpected error occurred');
    } finally {
      setIsSigningUp(false);
    }
  };

  const handleGitHubSignUp = async () => {
    setIsSigningUp(true);
    try {
      const redirectTo = `${window.location.origin}/auth/callback${slug ? `?slug=${encodeURIComponent(slug)}` : ''}`;
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'github',
        options: {
          redirectTo
        }
      });
      
      if (error) {
        console.error('GitHub sign up error:', error);
        toast.error(error.message || 'Failed to sign up with GitHub');
      }
    } catch (error) {
      console.error('Unexpected error during GitHub sign up:', error);
      toast.error('An unexpected error occurred');
    } finally {
      setIsSigningUp(false);
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
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Create your account</h1>
          <p className="text-gray-600">Get started with your OnePageLaunch</p>
        </div>

        {slug && (
          <div className="mb-6 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-700 mb-2">
              <strong>Your page URL will be:</strong>
            </p>
            <p className="font-mono text-blue-800 bg-white px-3 py-2 rounded border">
              onepagelaunch.vercel.app/{slug}
            </p>
          </div>
        )}

        <form onSubmit={handleEmailSignUp} className="space-y-4 mb-6">
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
                placeholder="Create a password"
                className="w-full pr-10 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
                minLength={6}
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

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
              Confirm Password
            </label>
            <div className="relative">
              <input
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm your password"
                className="w-full pr-10 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSigningUp}
            className="w-full px-4 py-3 border border-transparent rounded-lg shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {isSigningUp ? 'Creating account...' : 'Create account'}
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
          onClick={handleGitHubSignUp}
          disabled={isSigningUp}
          className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg shadow-sm bg-white text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          <Github className="h-5 w-5 mr-3" />
          {isSigningUp ? 'Signing up...' : 'Continue with GitHub'}
        </button>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Already have an account?{' '}
            <Link 
              href={`/auth/signin${slug ? `?slug=${encodeURIComponent(slug)}` : ''}`}
              className="font-medium text-blue-600 hover:text-blue-500"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <SignupPageContent />
    </Suspense>
  );
} 