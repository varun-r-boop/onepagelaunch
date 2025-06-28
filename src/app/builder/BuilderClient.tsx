'use client';

import * as React from 'react';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, UserIcon } from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';
import { toast } from 'sonner';
import { BlockProjectData } from '@/lib/types';
import BlockEditor from '@/components/block-editor/BlockEditor';
import FloatingActionBar from '@/components/block-editor/FloatingActionBar';

export default function BuilderClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get('edit');
  const supabase = createClient();

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [slug, setSlug] = useState('');
  const [isSlugAvailable, setIsSlugAvailable] = useState<boolean | null>(null);
  const [isCheckingSlug, setIsCheckingSlug] = useState(false);

  // Block-based data
  const [blockData, setBlockData] = useState<BlockProjectData>({
    projectName: '',
    slug: '',
    blocks: []
  });

  // Load user and project data
  useEffect(() => {
    const getUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);
        // If editing an existing project (not 'new'), load project data
        if (editId && editId !== 'new' && user) {
          await loadProject(editId);
        } else {
          setLoading(false);
        }
      } catch (error) {
        console.error('Error getting user:', error);
        setLoading(false);
      }
    };

    getUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null);
        if (!editId || editId === 'new') {
          setLoading(false);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [editId]);

  const loadProject = async (projectId: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/projects?id=${projectId}`);
      const data = await response.json();
      if (data.project) {
        // Check if it's block-based data
        if (data.project.data.blocks) {
          setBlockData(data.project.data as BlockProjectData);
          setSlug(data.project.slug);
          setIsSlugAvailable(true);
        } else {
          toast.error('This project was created with the old form builder and cannot be edited in the block builder');
          router.push('/dashboard');
        }
      } else {
        toast.error('Project not found or access denied');
        router.push('/dashboard');
      }
    } catch (error) {
      console.error('Error loading project:', error);
      toast.error('Failed to load project');
    } finally {
      setLoading(false);
    }
  };

  const [isPublishing, setIsPublishing] = useState(false);

  const handleSave = async () => {
    if (!user) {
      toast.error('Please sign in to save your project');
      return;
    }

    if (!blockData.projectName) {
      toast.error('Please enter a project name');
      return;
    }
    if (!slug) {
      toast.error('Please enter a URL slug');
      return;
    }
    if ((!editId || editId === 'new') && !isSlugAvailable) {
      toast.error('This URL slug is already taken');
      return;
    }

    setIsPublishing(true);
    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectData: { ...blockData, slug },
          editId: editId && editId !== 'new' ? editId : undefined
        }),
      });
      const result = await response.json();
      if (result.success) {
        // Show success message and copy link
        if (result.url && navigator.clipboard) {
          await navigator.clipboard.writeText(result.url);
          toast.success(`Project ${result.isEdit ? 'updated' : 'saved'} successfully! Link copied to clipboard`, {
            description: result.url,
            duration: 5000,
          });
        } else {
          toast.success(`Project ${result.isEdit ? 'updated' : 'saved'} successfully!`);
        }
        router.push(`/${result.slug}`);
      } else {
        toast.error(result.error || 'Failed to save project. Please try again.');
      }
    } catch (error) {
      console.error('Error saving project:', error);
      toast.error('An unexpected error occurred. Please try again.');
    } finally {
      setIsPublishing(false);
    }
  };

  const handleSignInPrompt = async () => {
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
      // Cautiously assume it's not available on error
      setIsSlugAvailable(false);
    } finally {
      setIsCheckingSlug(false);
    }
  };
  
  // Debounce slug check
  useEffect(() => {
    const handler = setTimeout(() => {
      // Skip slug checking if we are editing an existing project (not 'new')
      if (editId && editId !== 'new') {
        setIsSlugAvailable(true);
        return;
      }
      checkSlugAvailability(slug);
    }, 300);

    return () => {
      clearTimeout(handler);
    };
  }, [slug, editId]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header Bar */}
      <div className="flex justify-between items-center p-4 bg-white border-b border-gray-200">
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="text-sm font-medium text-gray-600 hover:text-black">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="w-64">
            <Input
              placeholder="Project Name"
              value={blockData.projectName}
              onChange={(e) => setBlockData(prev => ({ ...prev, projectName: e.target.value }))}
              className="font-semibold text-lg"
            />
          </div>
          <div className="w-64">
            <div className="relative">
              <Input
                placeholder="url-slug"
                value={slug}
                disabled={!!(editId && editId !== 'new')}
                onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                title={editId && editId !== 'new' ? "URL cannot be changed for published projects" : "Enter a unique URL for your project"}
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 text-xs">
                {editId && editId !== 'new' ? (
                  <span className="text-gray-500">Locked</span>
                ) : isCheckingSlug ? (
                  <span className="text-gray-500">Checking...</span>
                ) : isSlugAvailable === true ? (
                  <span className="text-green-500">Available</span>
                ) : isSlugAvailable === false ? (
                  <span className="text-red-500">Taken</span>
                ) : null}
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {user ? (
            <>
              <Button
                onClick={handleSave}
                disabled={isPublishing || loading || (!editId || editId === 'new') && !isSlugAvailable}
              >
                {isPublishing ? (editId && editId !== 'new' ? 'Updating...' : 'Publishing...') : (editId && editId !== 'new' ? 'Update' : 'Publish')}
              </Button>
            </>
          ) : (
            <Button onClick={handleSignInPrompt}>
              <UserIcon className="h-4 w-4 mr-2" />
              Sign in to Publish
            </Button>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-grow pt-0">
        <BlockEditor
          data={blockData}
          onUpdate={setBlockData}
        />
      </div>

      {/* Floating Action Bar */}
      <FloatingActionBar
        onAddBlock={(newBlock) => {
          setBlockData((prev: BlockProjectData) => ({
            ...prev,
            blocks: [...prev.blocks, newBlock]
          }));
        }}
      />
    </div>
  );
} 