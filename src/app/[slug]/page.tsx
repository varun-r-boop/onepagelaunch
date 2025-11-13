import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { ProjectPageClient } from '@/components/project-page-client';
import { BlockProjectData, SupabaseProject } from '@/lib/types';
import { getCachedProject, cacheProject } from '@/lib/redis';

interface ProjectPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const { slug } = await params;
  
  // Try to get project data from Redis cache first
  let projectData: BlockProjectData | null = await getCachedProject(slug);
  let project: SupabaseProject | null = null;
  let isOwner = false;

  if (projectData) {
    // Cache hit - use cached data
    console.log(`Cache hit for slug: ${slug}`);
  } else {
    // Cache miss - fetch from Supabase
    console.log(`Cache miss for slug: ${slug}, fetching from Supabase`);
    const supabase = await createClient();
    const { data: supabaseProject, error } = await supabase
      .from('projects')
      .select('*')
      .eq('slug', slug)
      .single();

    if (error || !supabaseProject) {
      notFound();
    }

    // Check if it's a block-based project
    if (!supabaseProject.data.blocks) {
      notFound(); // Old form-based projects are not supported
    }

    // Check if current user is the owner
    const { data: { user } } = await supabase.auth.getUser();
    isOwner = user?.id === supabaseProject.user_id;

    projectData = supabaseProject.data as BlockProjectData;
    project = supabaseProject;

    // Cache the project data for future requests
    await cacheProject(slug, projectData);
  }

  // Add the slug to the project data for auto-save validation
  projectData.slug = slug;
  
  return <ProjectPageClient project={projectData} isOwner={isOwner} projectId={project?.id || ''} />;
} 