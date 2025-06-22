import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { ProjectPageClient } from '@/components/project-page-client';
import { BlockProjectData } from '@/lib/types';

interface ProjectPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const { slug } = await params;
  
  // Fetch project data from Supabase
  const supabase = await createClient();
  const { data: project, error } = await supabase
    .from('projects')
    .select('*')
    .eq('slug', slug)
    .single();

  if (error || !project) {
    notFound();
  }

  // Check if it's a block-based project
  if (!project.data.blocks) {
    notFound(); // Old form-based projects are not supported
  }

  const blockProject = project.data as BlockProjectData;
  
  return <ProjectPageClient project={blockProject} />;
} 