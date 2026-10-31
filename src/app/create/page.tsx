'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Github, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import type { User } from '@supabase/supabase-js';
import type { SupabaseProject } from '@/lib/types';
import { createSiteFromTemplate } from '@/lib/site/templates';
import { clearDraft, loadDraft } from '@/lib/site/draft-storage';
import type { SiteData } from '@/lib/site/types';
import { PAGE_HOST } from '@/lib/slug';
import { AddressForm } from '@/components/address-form';

function CreatePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();
  
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSigningIn, setIsSigningIn] = useState(false);
  
  // Shown instead of the spinner when creating the page fails
  const [problem, setProblem] = useState<{ kind: 'limit'; existingSlug: string } | { kind: 'error'; message: string } | null>(null);
  // Bumped by "Try again" to re-run creation
  const [attempt, setAttempt] = useState(0);

  // Flag to prevent duplicate project creation calls
  const projectCreationInitiated = useRef<string | null>(null);

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


  // Add this effect after user and slug are set
  useEffect(() => {
    if (user && urlSlug && urlSlug.trim() !== '') {
      // Create unique key for this user+slug combination
      const creationKey = `${user.id}-${urlSlug}`;
      
      // Check if we've already initiated project creation for this combination
      if (projectCreationInitiated.current === creationKey) {
        console.log('Project creation already initiated for:', creationKey);
        return;
      }
      
      const checkOrCreateProject = async () => {
        // Add safety checks before starting
        if (!user || !user.id) {
          console.warn('User not properly loaded, skipping project creation');
          setLoading(false);
          return;
        }
        
        if (!urlSlug) {
          console.warn('No URL slug available, skipping project creation');
          setLoading(false);
          return;
        }

        // Mark this combination as initiated
        projectCreationInitiated.current = creationKey;

        setLoading(true);
        console.log('Starting project creation/check process for slug:', urlSlug, 'user:', user.id);
        try {

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

          // A page built in the playground before signing up carries over (and goes
          // live if the user clicked Publish). Otherwise start from a template and
          // open the setup questions in the editor.
          const draft = loadDraft();
          const blankProjectData: SiteData = draft
            ? { ...draft.site, slug: urlSlug, publishedSite: draft.publish ? { ...draft.site, slug: urlSlug } : null }
            : { ...createSiteFromTemplate('launch', `${urlSlug}'s Page`, urlSlug), publishedSite: null };

          let response: Response;
          let result: { success?: boolean; error?: string; existingProject?: { slug: string } };
          try {
            response = await fetch('/api/projects', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ projectData: blankProjectData }),
            });
            result = await response.json().catch(() => ({}));
          } catch (fetchError) {
            console.warn('API request failed:', fetchError);
            setProblem({ kind: 'error', message: 'We couldn’t reach the server. Check your connection and try again.' });
            return;
          }

          if (result.success) {
            clearDraft();
            if (draft?.publish) toast.success('🎉 Your page is live!');
            router.push(draft ? `/${urlSlug}` : `/${urlSlug}?welcome=1`);
          } else if (response.status === 403 && result.existingProject) {
            // One page per account: explain instead of failing silently. The draft stays saved.
            setProblem({ kind: 'limit', existingSlug: result.existingProject.slug });
          } else {
            console.warn('Project creation failed:', result.error);
            setProblem({ kind: 'error', message: result.error || 'Failed to create your page. Please try again.' });
          }
        } catch (error) {
          // Handle any unexpected errors
          console.warn('Unexpected error in checkOrCreateProject:', error);
          toast.error('An unexpected error occurred. Please try again.');
        } finally {
          setLoading(false);
          // Reset the flag so user can try again if needed
          projectCreationInitiated.current = null;
        }
      };
      
      // Call checkOrCreateProject directly (duplicate prevention handled above)
      void checkOrCreateProject();
    }
  }, [user, urlSlug, supabase, router, attempt]);


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

  // No address yet (e.g. "Create New Project" on the dashboard): claim one, then build
  if (!urlSlug) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="w-full max-w-xl text-center">
          <Link href="/" className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-6 cursor-pointer">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Link>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Choose your page address</h1>
          <p className="mt-2 mb-8 text-gray-600">This is the link people will visit. You can build your page right after.</p>
          <AddressForm autoFocus buttonLabel="Start building" onClaim={claimed => router.push(`/templates/launch?slug=${encodeURIComponent(claimed)}`)} />
          {!user && (
            <p className="mt-6 text-sm text-gray-600">
              Already have an account?{' '}
              <Link href="/auth/signin" className="font-medium text-indigo-600 hover:text-indigo-500">Sign in</Link>
            </p>
          )}
        </div>
      </div>
    );
  }

  if (user && problem) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-lg">
          {problem.kind === 'limit' ? (
            <>
              <h1 className="text-xl font-bold text-gray-900">Your account already has a page</h1>
              <p className="mt-2 text-gray-600">
                Each account can have one page for now. Yours is at{' '}
                <span className="font-medium text-gray-900">{PAGE_HOST}/{problem.existingSlug}</span>.
              </p>
              <Link
                href={`/${problem.existingSlug}`}
                className="mt-6 inline-flex w-full items-center justify-center rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white hover:bg-indigo-700"
              >
                Open my page
              </Link>
            </>
          ) : (
            <>
              <h1 className="text-xl font-bold text-gray-900">We couldn’t create your page</h1>
              <p className="mt-2 text-gray-600">{problem.message}</p>
              <button
                type="button"
                onClick={() => { setProblem(null); setAttempt(n => n + 1); }}
                className="mt-6 inline-flex w-full items-center justify-center rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white hover:bg-indigo-700 cursor-pointer"
              >
                Try again
              </button>
            </>
          )}
          <Link href="/" className="mt-3 inline-block text-sm text-gray-500 hover:text-gray-900">Back to home</Link>
        </div>
      </div>
    );
  }

  // Signed in with an address: the page is being created
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
            Ready to create your page at /{urlSlug}
          </p>
        </div>

        <div className="mb-6 p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-700 mb-2">
            <strong>Your page URL will be:</strong>
          </p>
          <p className="font-mono text-blue-800 bg-white px-3 py-2 rounded border">
            {PAGE_HOST}/{urlSlug}
          </p>
        </div>

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