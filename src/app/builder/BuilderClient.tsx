'use client';

import * as React from 'react';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { BlockProjectData } from '@/lib/types';
import { ArrowLeft, Rocket, Save, User as UserIcon, LayoutGrid } from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';
import { toast } from 'sonner';
import BlockEditor from '@/components/block-editor/BlockEditor';
import ProjectBlockPreview from '@/components/block-editor/ProjectBlockPreview';

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
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            {user ? (
              <Link href="/dashboard">
                <Button variant="outline" size="sm" className="cursor-pointer">
                  <LayoutGrid className="h-4 w-4 mr-2" />
                  Dashboard
                </Button>
              </Link>
            ) : (
              <Link href="/">
                <Button variant="outline" size="sm" className="cursor-pointer">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Home
                </Button>
              </Link>
            )}
            <h1 className="text-3xl font-bold text-gray-900">Block Builder</h1>
          </div>
          <div className="flex gap-2">
            {user ? (
              <Button onClick={handleSave} size="lg" disabled={isPublishing || loading} className="cursor-pointer">
                <Save className="h-4 w-4 mr-2" />
                {isPublishing ? (editId ? 'Updating...' : 'Saving...') : (editId ? 'Update' : 'Save & Publish')}
              </Button>
            ) : (
              <Button onClick={handleSignInPrompt} size="lg" variant="outline" className="cursor-pointer">
                <Rocket className="h-4 w-4 mr-2" />
                Sign In to Publish
              </Button>
            )}
          </div>
        </div>

        {/* Sign-in prompt for non-authenticated users */}
        {!user && (
          <Card className="mb-8 border-blue-200 bg-blue-50">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="text-blue-600">
                  <UserIcon className="h-8 w-8" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-blue-900">Sign In Required</h3>
                  <p className="text-blue-700 text-sm">
                    You must sign in to save and publish your projects. Your projects will be saved to your account and remain editable.
                  </p>
                </div>
                <Button onClick={handleSignInPrompt} variant="outline" className="border-blue-300 text-blue-700 hover:bg-blue-100 cursor-pointer">
                  Sign In with GitHub
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Block Builder */}
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Block Editor */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Block Editor</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <Label htmlFor="blockProjectName">Project Name</Label>
                  <Input
                    className="mt-2"
                    id="blockProjectName"
                    value={blockData.projectName}
                    onChange={(e) => setBlockData(prev => ({ ...prev, projectName: e.target.value }))}
                    placeholder="My Awesome Project"
                  />
                </div>
                <BlockEditor
                  data={blockData}
                  onUpdate={setBlockData}
                />
              </CardContent>
            </Card>
          </div>

          {/* Live Preview */}
          <div className="lg:sticky lg:top-8">
            <Card className="h-fit">
              <CardHeader>
                <CardTitle>Live Preview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="border rounded-lg overflow-hidden">
                  <ProjectBlockPreview data={blockData} />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
} 