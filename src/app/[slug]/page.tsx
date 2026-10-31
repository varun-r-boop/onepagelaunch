import type { Metadata } from 'next';
import { cache } from 'react';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { ProjectPageClient } from '@/components/project-page-client';
import { SiteProjectClient } from '@/components/site/SiteProjectClient';
import { BlockProjectData } from '@/lib/types';
import Link from 'next/link';
import { isSiteData, type Section } from '@/lib/site/types';
import { liveSiteOf } from '@/lib/site/publish';

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
    const live = liveSiteOf(project.data);
    if (!live) return { title: `${project.data.projectName} – coming soon`, robots: { index: false } };
    const hero = live.sections.find((s: Section) => s.type === 'hero');
    return {
      title: hero?.type === 'hero' ? `${live.projectName} – ${hero.title}` : live.projectName,
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
    // ?view=1 lets owners see the page exactly as visitors do
    if (isOwner && view !== '1') {
      return (
        <SiteProjectClient
          site={{ ...project.data, slug: project.slug }}
          isOwner
          projectId={project.id}
          welcome={welcome === '1'}
        />
      );
    }

    // Visitors only ever receive the published version, never the draft
    const live = liveSiteOf(project.data);
    if (!live) return <ComingSoon name={project.data.projectName} isOwner={isOwner} slug={project.slug} />;
    return (
      <SiteProjectClient
        site={{ ...live, slug: project.slug, publishedSite: undefined }}
        isOwner={false}
        projectId={project.id}
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

function ComingSoon({ name, isOwner, slug }: { name: string; isOwner: boolean; slug: string }) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-3 bg-gray-50 px-6 text-center">
      <p className="text-4xl">🧱</p>
      <h1 className="text-2xl font-bold text-gray-900">{name} is coming soon</h1>
      <p className="max-w-sm text-gray-500">
        {isOwner ? 'Your page isn’t published yet. Open the editor and click Publish.' : 'This page hasn’t been published yet. Check back soon!'}
      </p>
      {isOwner ? (
        <Link href={`/${slug}`} className="mt-4 rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800">Open the editor</Link>
      ) : (
        <Link href="/" className="mt-4 text-sm text-gray-400 hover:text-gray-600">Made with OnePageLaunch</Link>
      )}
    </main>
  );
}
