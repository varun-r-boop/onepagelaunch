'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Github, Mail, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

export default function SignupPage() {
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
        
        // If user is already signed in, redirect to create page with slug
        if (user && slug) {
          router.push(`/create?slug=${encodeURIComponent(slug)}`);
        } else if (user) {
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
        
        // If user signs up, redirect to appropriate page
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
  }, [slug, router, supabase.auth]);

  const handleGitHubSignUp = async () => {
    setIsSigningUp(true);
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
      console.error('Error signing up with GitHub:', error);
      toast.error('Failed to sign up with GitHub. Please try again.');
      setIsSigningUp(false);
    }
  };

  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate passwords match
    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    // Validate password length
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return;
    }

    setIsSigningUp(true);
    try {
      const emailRedirectTo = slug 
        ? `${window.location.protocol}//${window.location.host}/auth/callback?next=/auth/email-verified&slug=${encodeURIComponent(slug)}`
        : `${window.location.protocol}//${window.location.host}/auth/callback?next=/auth/email-verified`;

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo,
        },
      });

      if (error) {
        toast.error(error.message);
      } else if (data.user) {
        if (data.user.email_confirmed_at) {
          // User is already confirmed, redirect immediately
          toast.success('Account created successfully!');
          if (slug) {
            router.push(`/create?slug=${encodeURIComponent(slug)}`);
          } else {
            // Fallback: redirect to create page for new users
            router.push('/create');
          }
        } else {
          // User needs to confirm email
          toast.success('Please check your email to confirm your account before signing in.');
          router.push('/auth/signin' + (slug ? `?slug=${encodeURIComponent(slug)}` : ''));
        }
      }
    } catch (error) {
      console.error('Error signing up:', error);
      toast.error('An unexpected error occurred. Please try again.');
    } finally {
      setIsSigningUp(false);
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
        <h1 className="text-2xl font-semibold mb-2">Create Your Account</h1>
        <p className="text-gray-500 mb-6 text-sm">
          {slug ? `Ready to start building onepagelaunch.vercel.app/${slug}?` : 'Join OnePageLaunch and start building your one-page website'}
        </p>

        {/* Back button */}
        <div className="mb-6">
          <Link href="/" className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Home
          </Link>
        </div>

        {/* GitHub Sign Up */}
        <div className="mb-6">
          <button 
            onClick={handleGitHubSignUp}
            disabled={isSigningUp}
            className="w-full bg-black text-white py-3 rounded-lg hover:opacity-90 transition flex justify-center items-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            <Github className="w-5 h-5" />
            {isSigningUp ? 'Creating account...' : 'Continue with GitHub'}
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

        {/* Email Sign Up Form */}
        <form onSubmit={handleEmailSignUp} className="space-y-4">
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
                minLength={6}
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
            <p className="text-xs text-gray-500 mt-1">Must be at least 6 characters</p>
          </div>

          <div className="text-left">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Confirm Password
            </label>
            <div className="relative">
              <input 
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                required
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-4 w-4 text-gray-400" />
                ) : (
                  <Eye className="h-4 w-4 text-gray-400" />
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSigningUp || !email || !password || !confirmPassword}
            className="w-full bg-indigo-600 text-white py-3 rounded-lg hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
          >
            <Mail className="w-4 h-4" />
            {isSigningUp ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        {/* Sign in link */}
        <div className="mt-6 text-sm text-gray-500">
          Already have an account?{' '}
          <Link href={`/auth/signin${slug ? `?slug=${encodeURIComponent(slug)}` : ''}`} className="text-indigo-600 hover:text-indigo-500">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
} 