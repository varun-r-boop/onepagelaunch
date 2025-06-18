import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { ProjectPageClient } from '@/components/project-page-client';

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

  return <ProjectPageClient project={project.data} />;
} 