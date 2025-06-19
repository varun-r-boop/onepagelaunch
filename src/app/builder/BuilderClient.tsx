'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ProjectFormData } from '@/lib/types';
import { ProjectPreview } from '@/components/project-preview';
import { Plus, Trash2, ArrowLeft, Rocket, Save, User as UserIcon, LayoutGrid } from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';
import { toast } from 'sonner';

export default function BuilderClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get('edit');
  const supabase = createClient();

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<ProjectFormData>({
    projectName: '',
    tagline: '',
    features: [],
    ctaText: 'Get Started',
    ctaUrl: '',
  });

  const [newFeature, setNewFeature] = useState({
    title: '',
    description: '',
    icon: 'Star'
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
        setFormData(data.project.data);
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

  const addFeature = () => {
    if (newFeature.title && newFeature.description) {
      setFormData(prev => ({
        ...prev,
        features: [...prev.features, { ...newFeature }]
      }));
      setNewFeature({ title: '', description: '', icon: 'Star' });
    }
  };

  const removeFeature = (index: number) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index)
    }));
  };

  const [isPublishing, setIsPublishing] = useState(false);

  const handleSave = async () => {
    if (!formData.projectName || !formData.tagline) {
      toast.error('Please fill in at least the project name and tagline');
      return;
    }
    if (!user) {
      toast.error('Please sign in to save your project');
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
          projectData: formData,
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
            <h1 className="text-3xl font-bold text-gray-900">Page Builder</h1>
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

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Form Editor */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Project Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="projectName">Project Name</Label>
                  <Input
                    className="mt-2"
                    id="projectName"
                    value={formData.projectName}
                    onChange={(e) => setFormData(prev => ({ ...prev, projectName: e.target.value }))}
                    placeholder="My Awesome Project"
                  />
                </div>
                <div>
                  <Label htmlFor="tagline">Tagline</Label>
                  <Textarea
                    className="mt-2"
                    id="tagline"
                    value={formData.tagline}
                    onChange={(e) => setFormData(prev => ({ ...prev, tagline: e.target.value }))}
                    placeholder="A brief description of what your project does..."
                    rows={3}
                  />
                </div>
                <div>
                  <Label htmlFor="screenshot">Screenshot URL (optional)</Label>
                  <Input
                    className="mt-2"
                    id="screenshot"
                    value={formData.screenshot || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, screenshot: e.target.value }))}
                    placeholder="https://example.com/screenshot.png"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Features Section */}
            <Card>
              <CardHeader>
                <CardTitle>Features</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Existing Features */}
                {formData.features.map((feature, index) => (
                  <div key={index} className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-medium">{feature.title}</h4>
                      <p className="text-sm text-gray-600">{feature.description}</p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeFeature(index)}
                      className="cursor-pointer"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}

                {/* Add New Feature */}
                <div className="space-y-3 p-4 border-2 border-dashed border-gray-300 rounded-lg">
                  <div>
                    <Label htmlFor="featureTitle">Feature Title</Label>
                    <Input
                      className="mt-2"
                      id="featureTitle"
                      value={newFeature.title}
                      onChange={(e) => setNewFeature(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="Fast Performance"
                    />
                  </div>
                  <div>
                    <Label htmlFor="featureDescription">Feature Description</Label>
                    <Textarea
                      className="mt-2"
                      id="featureDescription"
                      value={newFeature.description}
                      onChange={(e) => setNewFeature(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Lightning-fast loading times..."
                      rows={2}
                    />
                  </div>
                  <Button onClick={addFeature} className="w-full cursor-pointer">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Feature
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* CTA Section */}
            <Card>
              <CardHeader>
                <CardTitle>Call to Action</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="ctaText">Button Text</Label>
                  <Input
                    className="mt-2"
                    id="ctaText"
                    value={formData.ctaText}
                    onChange={(e) => setFormData(prev => ({ ...prev, ctaText: e.target.value }))}
                    placeholder="Get Started"
                  />
                </div>
                <div>
                  <Label htmlFor="ctaUrl">Button URL</Label>
                  <Input
                    className="mt-2"
                    id="ctaUrl"
                    value={formData.ctaUrl}
                    onChange={(e) => setFormData(prev => ({ ...prev, ctaUrl: e.target.value }))}
                    placeholder="https://yourproject.com"
                  />
                </div>
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
                  <ProjectPreview data={formData} />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
} 