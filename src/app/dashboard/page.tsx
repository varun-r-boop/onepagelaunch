'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { AuthGuard } from '@/components/auth/auth-guard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, Eye } from 'lucide-react';
import Link from 'next/link';
import { SupabaseProject, BlockProjectData } from '@/lib/types';
import { User } from '@supabase/supabase-js';
import { toast } from 'sonner';

export default function Dashboard() {
  const [projects, setProjects] = useState<SupabaseProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const supabase = createClient();

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      if (user) {
        await fetchProjects(user.id);
      }
    };

    getUser();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null);
        if (session?.user) {
          await fetchProjects(session.user.id);
        } else {
          setProjects([]);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const fetchProjects = async (userId: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('Error fetching projects:', error);
      } else {
        // Filter to only show block-based projects
        const blockProjects = (data || []).filter(project => 
          project.data.blocks && Array.isArray(project.data.blocks)
        );
        setProjects(blockProjects);
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteProject = async (projectId: string) => {
    // Use a more elegant confirmation with toast
    toast('Are you sure you want to delete this project?', {
      action: {
        label: 'Delete',
        onClick: async () => {
          try {
            const { error } = await supabase
              .from('projects')
              .delete()
              .eq('id', projectId);

            if (error) {
              console.error('Error deleting project:', error);
              toast.error('Failed to delete project');
            } else {
              setProjects(projects.filter(p => p.id !== projectId));
              toast.success('Project deleted successfully');
            }
          } catch (error) {
            console.error('Error deleting project:', error);
            toast.error('Failed to delete project');
          }
        },
      },
      cancel: {
        label: 'Cancel',
        onClick: () => {},
      },
    });
  };

  const getBlockCount = (project: SupabaseProject) => {
    const blockData = project.data as BlockProjectData;
    return blockData.blocks?.length || 0;
  };

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
              <p className="text-gray-600 mt-2">
                Welcome back, {user?.user_metadata?.full_name || user?.email}!
              </p>
            </div>
            <div className="flex gap-2">
              <Link href="/create">
                <Button size="lg" className="cursor-pointer">
                  <Plus className="h-4 w-4 mr-2" />
                  Create New Project
                </Button>
              </Link>
            </div>
          </div>

          {/* Projects Grid */}
          {loading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader>
                    <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-4 bg-gray-200 rounded w-full"></div>
                  </CardHeader>
                  <CardContent>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : projects.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <div className="text-6xl mb-4">🚀</div>
                <CardTitle className="mb-2">No projects yet</CardTitle>
                <CardDescription className="mb-4">
                  Create your first block-based website to get started!
                </CardDescription>
                <Link href="/create">
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Your First Project
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map((project) => {
                const blockData = project.data as BlockProjectData;
                return (
                  <Card key={project.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <CardTitle className="text-lg">{blockData.projectName}</CardTitle>
                          <CardDescription className="mt-1 line-clamp-2">
                            Block-based project with {getBlockCount(project)} blocks
                          </CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="outline" className="text-xs">
                          {project.slug}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {getBlockCount(project)} blocks
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex gap-2">
                        <Link href={`/${project.slug}`} target="_blank">
                          <Button variant="outline" size="sm" className="cursor-pointer">
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                        </Link>
                        <Link href={`/${project.slug}`}>
                          <Button variant="outline" size="sm" className="cursor-pointer">
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </Button>
                        </Link>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => deleteProject(project.id)}
                          className="cursor-pointer text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </AuthGuard>
  );
} 