'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Github, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import type { User } from '@supabase/supabase-js';
import type { SupabaseProject } from '@/lib/types';

function CreatePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();
  
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSigningIn, setIsSigningIn] = useState(false);
  
  const [slug, setSlug] = useState('');
  const [isSlugAvailable, setIsSlugAvailable] = useState<boolean | null>(null);
  const [isCheckingSlug, setIsCheckingSlug] = useState(false);

  // Get slug from URL parameters
  const urlSlug = searchParams.get('slug');

  // Load user on mount with faster initial check
  useEffect(() => {
    const getUser = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error) {
          console.warn('Unable to get user:', error.message);
        } else {
          setUser(user);
        }
      } catch (error) {
        console.warn('Error loading user:', error);
      } finally {
        setLoading(false);
      }
    };

    getUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, [supabase.auth]);

  // Set slug from URL parameter if available
  useEffect(() => {
    if (urlSlug) {
      setSlug(urlSlug);
    }
  }, [urlSlug]);

  // Add this effect after user and slug are set
  useEffect(() => {
    if (user && urlSlug && urlSlug.trim() !== '') {
      const checkOrCreateProject = async () => {
        setLoading(true);
        console.log('Starting project creation/check process for slug:', urlSlug, 'user:', user.id);
        try {
          // Validate user is properly authenticated
          if (!user.id) {
            console.warn('User ID not available, skipping project creation');
            setLoading(false);
            return;
          }

          // Fetch all projects for this user with error handling
          const { data: projects, error: projectsError } = await supabase
            .from('projects')
            .select('*')
            .eq('user_id', user.id)
            .order('updated_at', { ascending: false });
          
          if (projectsError) {
            console.warn('Error fetching projects:', projectsError.message);
            // Continue with project creation even if we can't fetch existing projects
          } else if (projects && projects.length > 0) {
            // Check if a project with the entered slug exists
            const match = (projects as SupabaseProject[]).find((p) => p.slug === urlSlug);
            if (match) {
              // Project with this slug already exists, redirect to it
              router.push(`/${urlSlug}`);
              return;
            }
            // If no project with this slug exists, continue to create a new one
            // (don't redirect to existing projects when user specifically wants this slug)
          }

          // Create project with API
          const blankProjectData = {
            "projectName": `${urlSlug}'s Page`,
            "blocks": [
              {
                "id": "hero-1",
                "type": "hero",
                "data": {
                  "title": "Welcome to my page",
                  "subtitle": "I'm building something amazing. Stay tuned!",
                  "primaryButton": {
                    "text": "Get Started",
                    "url": "#"
                  },
                  "secondaryButton": {
                    "text": "Learn More",
                    "url": "#"
                  }
                },
                "style": {
                  "backgroundColor": "#ffffff",
                  "textColor": "#1f2937",
                  "primaryButtonColor": "#3b82f6",
                  "secondaryButtonColor": "#6b7280"
                }
              }
            ],
            "globalStyles": {
              "fontFamily": "Inter",
              "primaryColor": "#3b82f6",
              "backgroundColor": "#ffffff"
            },
            "metadata": {
              "title": `${urlSlug}'s Page`,
              "description": "Built with OnePageLaunch",
              "favicon": "/favicon.svg"
            },
            "slug": urlSlug
          };

          let response;
          let result;
          
          try {
            console.log('Making API request to create project with data:', blankProjectData);
            response = await fetch('/api/projects', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                projectData: blankProjectData
              }),
            });

            console.log('API response status:', response.status);
            
            if (!response.ok) {
              const errorText = await response.text();
              console.error('API error response:', errorText);
              throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);
            }

            result = await response.json();
            console.log('API response result:', result);
          } catch (fetchError) {
            console.warn('API request failed:', fetchError);
            toast.error('Failed to create project. Please try again.');
            return;
          }
          
          if (result.success) {
            router.push(`/${urlSlug}`);
          } else if (response.status === 403 && result.existingProject) {
            // User already has a project, redirect to it without showing error
            router.push(`/${result.existingProject.slug}`);
          } else {
            // Handle API errors gracefully
            const errorMessage = result.error || 'Failed to create project. Please try again.';
            console.warn('Project creation failed:', errorMessage);
            toast.error(errorMessage);
          }
        } catch (error) {
          // Handle any unexpected errors
          console.warn('Unexpected error in checkOrCreateProject:', error);
          toast.error('An unexpected error occurred. Please try again.');
        } finally {
          setLoading(false);
        }
      };
      
      // Add a small delay to ensure user is properly loaded
      const timeoutId = setTimeout(checkOrCreateProject, 100);
      return () => clearTimeout(timeoutId);
    }
  }, [user, urlSlug, supabase, router]);

  const checkSlugAvailability = async (slugToCheck: string) => {
    if (!slugToCheck.trim()) {
      setIsSlugAvailable(null);
      return;
    }
    
    setIsCheckingSlug(true);
    try {
      const response = await fetch(`/api/projects/public/${encodeURIComponent(slugToCheck)}`);
      const data = await response.json();
      setIsSlugAvailable(!data.exists);
    } catch (error) {
      console.warn('Error checking slug availability:', error);
      setIsSlugAvailable(null);
    } finally {
      setIsCheckingSlug(false);
    }
  };

  // Debounce slug check
  useEffect(() => {
    const handler = setTimeout(() => {
      checkSlugAvailability(slug);
    }, 300);

    return () => {
      clearTimeout(handler);
    };
  }, [slug]);

  const handleSlugSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (slug && isSlugAvailable) {
      // Redirect to signup with slug as parameter
      router.push(`/auth/signup?slug=${encodeURIComponent(slug)}`);
    }
  };

  const handleGitHubSignIn = async () => {
    setIsSigningIn(true);
    try {
      const redirectTo = `${window.location.origin}/auth/callback${urlSlug ? `?slug=${encodeURIComponent(urlSlug)}` : ''}`;
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

  // If user is authenticated, they shouldn't see this page unless there was an error
  if (user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Setting up your project...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4 cursor-pointer">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Create Your Page</h1>
          <p className="text-gray-600">
            {urlSlug ? `Ready to create your page at /${urlSlug}` : 'Get started by signing in'}
          </p>
        </div>

        {urlSlug && (
          <div className="mb-6 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-700 mb-2">
              <strong>Your page URL will be:</strong>
            </p>
            <p className="font-mono text-blue-800 bg-white px-3 py-2 rounded border">
              onepagelaunch.vercel.app/{urlSlug}
            </p>
          </div>
        )}

        <div className="space-y-4">
          <button
            onClick={handleGitHubSignIn}
            disabled={isSigningIn}
            className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg shadow-sm bg-white text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            <Github className="h-5 w-5 mr-3" />
            {isSigningIn ? 'Signing in...' : 'Continue with GitHub'}
          </button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">or</span>
            </div>
          </div>

          <Link 
            href={`/auth/signup${urlSlug ? `?slug=${encodeURIComponent(urlSlug)}` : ''}`}
            className="w-full flex items-center justify-center px-4 py-3 border border-transparent rounded-lg shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 cursor-pointer"
          >
            Sign up with Email
          </Link>
        </div>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Already have an account?{' '}
            <Link 
              href={`/auth/signin${urlSlug ? `?slug=${encodeURIComponent(urlSlug)}` : ''}`}
              className="font-medium text-blue-600 hover:text-blue-500 cursor-pointer"
            >
              Sign in
            </Link>
          </p>
        </div>

        {!urlSlug && (
          <div className="mt-8 pt-8 border-t border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Or choose a custom URL</h3>
            <form onSubmit={handleSlugSubmit} className="space-y-4">
              <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden focus-within:border-blue-500">
                <span className="px-3 py-3 text-gray-500 bg-gray-50 text-sm border-r border-gray-300">
                  onepagelaunch.vercel.app/
                </span>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                  placeholder="your-name"
                  className="flex-1 px-3 py-3 outline-none"
                  required
                />
              </div>
              
              {slug && (
                <div className="text-sm">
                  {isCheckingSlug ? (
                    <span className="text-gray-500">Checking availability...</span>
                  ) : isSlugAvailable === true ? (
                    <span className="text-green-600">✓ Available</span>
                  ) : isSlugAvailable === false ? (
                    <span className="text-red-600">✗ Already taken</span>
                  ) : null}
                </div>
              )}

              <button
                type="submit"
                disabled={!slug || !isSlugAvailable || isCheckingSlug}
                className="w-full px-4 py-3 border border-transparent rounded-lg shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                Continue with this URL
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

export default function CreatePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <CreatePageContent />
    </Suspense>
  );
} 