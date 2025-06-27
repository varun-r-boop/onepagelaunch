'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Github, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import type { User } from '@supabase/supabase-js';

export default function CreatePage() {
  const router = useRouter();
  const supabase = createClient();
  
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  
  const [slug, setSlug] = useState('');
  const [isSlugAvailable, setIsSlugAvailable] = useState<boolean | null>(null);
  const [isCheckingSlug, setIsCheckingSlug] = useState(false);

  // Load user on mount
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setLoading(false);
    };

    getUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const handleSignIn = async () => {
    setIsSigningIn(true);
    try {
      await supabase.auth.signInWithOAuth({
        provider: 'github',
        options: {
          redirectTo: `${window.location.protocol}//${window.location.host}/auth/callback?next=/create`,
        },
      });
    } catch (error) {
      console.error('Error signing in:', error);
      toast.error('Failed to sign in. Please try again.');
      setIsSigningIn(false);
    }
  };

  const checkSlugAvailability = async (currentSlug: string) => {
    if (!currentSlug) {
      setIsSlugAvailable(null);
      return;
    }
    setIsCheckingSlug(true);
    try {
      const response = await fetch(`/api/projects/public/${currentSlug}`);
      setIsSlugAvailable(!response.ok);
    } catch (error) {
      console.error('Error checking slug', error);
      setIsSlugAvailable(false);
    } finally {
      setIsCheckingSlug(false);
    }
  };

  // Debounce slug check
  useEffect(() => {
    const handler = setTimeout(() => {
      checkSlugAvailability(slug);
    }, 500);

    return () => {
      clearTimeout(handler);
    };
  }, [slug]);

  const handleCreatePage = async () => {
    if (!user) {
      toast.error('Please sign in first');
      return;
    }

    if (!slug) {
      toast.error('Please enter a URL slug');
      return;
    }

    if (!isSlugAvailable) {
      toast.error('This URL slug is already taken');
      return;
    }

    setIsCreating(true);
    try {
      // Create a blank page with default content
      const blankProjectData = {
        projectName: 'My New Project',
        slug,
        blocks: [
          {
            id: 'hero-block',
            type: 'block',
            title: '🚀 Welcome to My Project',
            content: 'This is a powerful tool that helps you build amazing things.',
            style: {
              bgColor: '#f8fafc',
              padding: '2rem',
              textAlign: 'center'
            }
          },
          {
            id: 'features-block',
            type: 'block',
            title: '💡 Key Features',
            style: {
              bgColor: '#ffffff',
              padding: '2rem',
              borderColor: '#e2e8f0'
            },
            children: [
              {
                id: 'feature-1',
                type: 'inline',
                title: '⚡ Fast Performance',
                content: 'Lightning-fast loading times'
              },
              {
                id: 'feature-2',
                type: 'inline',
                title: '🧱 Modular Design',
                content: 'Build with reusable components'
              },
              {
                id: 'feature-3',
                type: 'inline',
                title: '🎨 Beautiful UI',
                content: 'Modern and responsive design'
              }
            ]
          }
        ]
      };

      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectData: blankProjectData
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        toast.success('Page created successfully! Redirecting to your live page...');
        // Redirect to the live page where they can edit
        router.push(`/${result.slug}`);
      } else {
        toast.error(result.error || 'Failed to create page. Please try again.');
      }
    } catch (error) {
      console.error('Error creating page:', error);
      toast.error('An unexpected error occurred. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

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
      <div className="max-w-lg w-full bg-white border border-gray-200 rounded-2xl p-8 md:p-10 text-center shadow-xl">
        <div className="text-3xl mb-4">🧱</div>
        <h1 className="text-2xl font-semibold mb-2">Build Your Site, Brick by Brick</h1>
        <p className="text-gray-500 mb-6 text-sm">Launch your product site in minutes using modular blocks — no code required.</p>

        {/* Back button */}
        <div className="mb-6">
          <Link href="/" className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Home
          </Link>
        </div>

        {/* Sign-in section */}
        {!user && (
          <div className="transition-opacity duration-300 ease-in mb-6">
            <button 
              onClick={handleSignIn}
              disabled={isSigningIn}
              className="w-full bg-black text-white py-3 rounded-lg hover:opacity-90 transition flex justify-center items-center gap-2 disabled:opacity-50"
            >
              <Github className="w-5 h-5" />
              {isSigningIn ? 'Signing in...' : 'Continue with GitHub'}
            </button>
          </div>
        )}

        {/* Slug form - only show if user is signed in */}
        {user && (
          <form 
            className="space-y-4 transition-all duration-500 ease-in" 
            onSubmit={(e) => {
              e.preventDefault();
              handleCreatePage();
            }}
          >
            <label className="block text-left text-sm font-medium text-gray-700">
              Choose your site link
            </label>
            <div className="flex items-center border rounded-lg overflow-hidden">
              <span className="px-3 text-gray-500 bg-gray-100">onepagelaunch.com/</span>
              <input 
                name="slug" 
                id="slug-input" 
                type="text" 
                className="flex-1 px-3 py-2 outline-none" 
                placeholder="yourname" 
                value={slug}
                onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                required 
              />
            </div>

            <p className="text-sm text-gray-500 text-left">
              Your site will be: 
              <span className="font-mono bg-gray-100 px-2 py-1 rounded ml-1">
                onepagelaunch.com/{slug || 'yourname'}
              </span>
            </p>

            {/* Slug availability indicator */}
            {slug && (
              <div className="text-left">
                {isCheckingSlug ? (
                  <span className="text-sm text-gray-500">Checking availability...</span>
                ) : isSlugAvailable === true ? (
                  <span className="text-sm text-green-600">✓ This URL is available</span>
                ) : isSlugAvailable === false ? (
                  <span className="text-sm text-red-600">✗ This URL is already taken</span>
                ) : null}
              </div>
            )}

            <button 
              type="submit" 
              disabled={isCreating || !isSlugAvailable || !slug}
              className="w-full bg-indigo-600 text-white py-3 rounded-lg hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isCreating ? 'Creating...' : '🚀 Launch My Page'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
} 