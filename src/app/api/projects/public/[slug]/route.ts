import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getCachedProject, cacheProject } from '@/lib/redis';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    if (!slug) {
      return NextResponse.json({ error: 'Slug is required' }, { status: 400 });
    }

    // Try to get project data from Redis cache first
    let projectData = await getCachedProject(slug);

    if (!projectData) {
      // Cache miss - fetch from Supabase
      const supabase = await createClient();
      const { data: project, error } = await supabase
        .from('projects')
        .select('*')
        .eq('slug', slug)
        .single();

      if (error || !project) {
        // Supabase returns an error if .single() finds no rows, which is what we want for an available slug
        return NextResponse.json({ message: 'Slug is available' }, { status: 404 });
      }

      // Cache the project data for future requests
      projectData = project.data;
      if (projectData) {
        await cacheProject(slug, projectData);
      }
    }

    // Return the project data
    return NextResponse.json({ 
      message: 'Slug is taken',
      project: projectData 
    }, { status: 200 });

  } catch (error) {
    console.error('Error fetching public project:', error);
    return NextResponse.json(
      { error: 'Failed to fetch project information' },
      { status: 500 }
    );
  }
}
