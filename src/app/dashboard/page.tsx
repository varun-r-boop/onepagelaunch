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
import { isSiteData, type SiteData } from '@/lib/site/types';
import { sameContent } from '@/lib/site/publish';
import { User } from '@supabase/supabase-js';
import { toast } from 'sonner';
import { UpgradeButton, usePlan } from '@/components/billing';

export default function Dashboard() {
  const [projects, setProjects] = useState<SupabaseProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const supabase = createClient();
  const plan = usePlan();

  // Back from the Lemon Squeezy checkout
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get('upgraded') !== '1') return;
    // Wait a tick: the toaster mounts after this page's first effects run
    const timer = setTimeout(() => toast.success('Welcome to Pro! It can take a few seconds to activate.'), 300);
    return () => clearTimeout(timer);
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
        // Pages from the site builder, plus older block-based ones
        const pages = (data || []).filter(project =>
          isSiteData(project.data) || (project.data?.blocks && Array.isArray(project.data.blocks))
        );
        setProjects(pages);
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const getUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);
        if (user) {
          await fetchProjects(user.id);
        } else {
          setLoading(false);
        }
      } catch (error) {
        console.error('Error loading user:', error);
        setLoading(false);
      }
    };

    getUser();

    // Listen for sign-in/out. Supabase calls must not be awaited inside this
    // callback (it runs while the auth client holds a lock and can deadlock),
    // so the reload is deferred. The initial load is handled by getUser above.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      if (event === 'SIGNED_IN' && session?.user) {
        const userId = session.user.id;
        setTimeout(() => { void fetchProjects(userId); }, 0);
      } else if (event === 'SIGNED_OUT') {
        setProjects([]);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

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

  // Whether visitors see the latest edits
  const publishStatus = (site: SiteData) => {
    if (site.publishedSite === undefined) return 'Live';
    if (site.publishedSite === null) return 'Not published';
    return sameContent(site, site.publishedSite) ? 'Live' : 'Unpublished changes';
  };

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
              <p className="text-gray-600 mt-2 flex flex-wrap items-center gap-2">
                Welcome back, {user?.user_metadata?.full_name || user?.email}!
                {!plan.loading && (
                  <Badge variant="outline" className={plan.plan === 'pro' ? 'border-indigo-200 bg-indigo-50 text-indigo-700' : 'text-gray-500'}>
                    {plan.plan === 'pro' ? 'Pro' : 'Free plan'}
                  </Badge>
                )}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {!plan.loading && (plan.plan === 'pro' ? (
                plan.portalUrl && (
                  <a href={plan.portalUrl} target="_blank" rel="noopener noreferrer">
                    <Button size="lg" variant="outline">Manage billing</Button>
                  </a>
                )
              ) : (
                <UpgradeButton className="inline-flex h-10 items-center gap-2 rounded-md bg-indigo-600 px-6 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60 cursor-pointer" />
              ))}
              <Link href="/create">
                <Button size="lg">
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
                  Create your first page to get started!
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
                const site = isSiteData(project.data) ? project.data : null;
                const hero = site?.sections.find(section => section.type === 'hero');
                const status = site ? publishStatus(site) : null;
                return (
                  <Card key={project.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <CardTitle className="text-lg">{project.data.projectName}</CardTitle>
                          <CardDescription className="mt-1 line-clamp-2">
                            {site
                              ? (hero?.type === 'hero' ? hero.title : `${site.sections.length} sections`)
                              : `Block-based project with ${getBlockCount(project)} blocks`}
                          </CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="outline" className="text-xs">
                          /{project.slug}
                        </Badge>
                        {status ? (
                          <Badge
                            variant="outline"
                            className={`text-xs ${status === 'Live' ? 'border-green-200 bg-green-50 text-green-700' : status === 'Not published' ? 'text-gray-500' : 'border-amber-200 bg-amber-50 text-amber-700'}`}
                          >
                            {status}
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs">
                            {getBlockCount(project)} blocks
                          </Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex gap-2">
                        <Link href={site ? `/${project.slug}?view=1` : `/${project.slug}`} target="_blank">
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                        </Link>
                        <Link href={`/${project.slug}`}>
                          <Button variant="outline" size="sm">
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </Button>
                        </Link>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => deleteProject(project.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
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