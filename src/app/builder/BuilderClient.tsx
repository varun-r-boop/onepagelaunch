'use client';

import * as React from 'react';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { BlockProjectData } from '@/lib/types';
import { ArrowLeft, Rocket, Save, User as UserIcon, LayoutGrid, Plus } from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';
import { toast } from 'sonner';
import BlockEditor from '@/components/block-editor/BlockEditor';

export default function BuilderClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get('edit');
  const supabase = createClient();

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  
  // Block-based data
  const [blockData, setBlockData] = useState<BlockProjectData>({
    projectName: 'My Awesome Project',
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
  });

  // Load user and project data
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      // If editing, load project data
      if (editId && user) {
        await loadProject(editId);
      }
    };

    getUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null);
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

    setIsPublishing(true);
    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectData: blockData,
          editId: editId || undefined
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
          redirectTo: `${window.location.origin}/builder`,
        },
      });
    } catch (error) {
      console.error('Error signing in:', error);
      toast.error('Failed to sign in. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Main Content - Takes full page */}
      <div className="pt-0">
        <BlockEditor
          data={blockData}
          onUpdate={setBlockData}
        />
      </div>

      {/* Floating Toolbar */}
      <div className="fixed bottom-6 right-6 z-50">
        <div className="flex flex-col gap-3">
          {user ? (
            <Button
              onClick={handleSave}
              disabled={isPublishing || loading}
              className="h-12 w-12 rounded-full shadow-lg cursor-pointer"
              title={isPublishing ? (editId ? 'Updating...' : 'Saving...') : (editId ? 'Update' : 'Save & Publish')}
            >
              <Save className="h-5 w-5" />
            </Button>
          ) : (
            <Button
              onClick={handleSignInPrompt}
              className="h-12 w-12 rounded-full shadow-lg bg-green-600 hover:bg-green-700 cursor-pointer"
              title="Sign In to Publish"
            >
              <Rocket className="h-5 w-5" />
            </Button>
          )}
          <Button
            onClick={() => {
              const newBlock = {
                id: `block-${Date.now()}`,
                type: 'block' as const,
                title: 'New Block',
                content: 'Add your content here...',
                style: {
                  bgColor: '#ffffff',
                  padding: '2rem',
                  borderColor: '#e2e8f0',
                  textAlign: 'left' as const
                }
              };
              setBlockData(prev => ({
                ...prev,
                blocks: [...prev.blocks, newBlock]
              }));
            }}
            className="h-12 w-12 rounded-full shadow-lg bg-blue-600 hover:bg-blue-700 cursor-pointer"
            title="Add New Block"
          >
            <Plus className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
} 