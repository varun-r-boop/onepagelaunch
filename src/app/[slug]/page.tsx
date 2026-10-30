import type { Metadata } from 'next';
import { cache } from 'react';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { ProjectPageClient } from '@/components/project-page-client';
import { SiteProjectClient } from '@/components/site/SiteProjectClient';
import { BlockProjectData } from '@/lib/types';
import { isSiteData, type Section } from '@/lib/site/types';

interface ProjectPageProps {
  params: Promise<{
    slug: string;
  }>;
  searchParams: Promise<{
    welcome?: string;
    view?: string;
  }>;
}

// Cached so metadata and the page share one query per request
const getProject = cache(async (slug: string) => {
  const supabase = await createClient();
  const { data: project, error } = await supabase
    .from('projects')
    .select('*')
    .eq('slug', slug)
    .single();
  return { supabase, project: error ? null : project };
});

export async function generateMetadata({ params }: ProjectPageProps): Promise<Metadata> {
  const { slug } = await params;
  const { project } = await getProject(slug);
  if (!project) return {};

  if (isSiteData(project.data)) {
    const hero = project.data.sections.find((s: Section) => s.type === 'hero');
    return {
      title: hero?.type === 'hero' ? `${project.data.projectName} – ${hero.title}` : project.data.projectName,
      description: hero?.type === 'hero' ? hero.subtitle : undefined,
    };
  }
  return { title: project.data.projectName };
}

export default async function ProjectPage({ params, searchParams }: ProjectPageProps) {
  const { slug } = await params;
  const { welcome, view } = await searchParams;

  const { supabase, project } = await getProject(slug);

  if (!project) {
    notFound();
  }

  // Check if current user is the owner
  const { data: { user } } = await supabase.auth.getUser();
  const isOwner = user?.id === project.user_id;

  if (isSiteData(project.data)) {
    const site = { ...project.data, slug: project.slug };
    return (
      <SiteProjectClient
        site={site}
        // ?view=1 lets owners see the page exactly as visitors do
        isOwner={isOwner && view !== '1'}
        projectId={project.id}
        welcome={welcome === '1'}
      />
    );
  }

  // Check if it's a block-based project
  if (!project.data.blocks) {
    notFound(); // Old form-based projects are not supported
  }

  const blockProject = project.data as BlockProjectData;
  // Add the slug to the project data for auto-save validation
  blockProject.slug = project.slug;

  return <ProjectPageClient project={blockProject} isOwner={isOwner} projectId={project.id} />;
}
