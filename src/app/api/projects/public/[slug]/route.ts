import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    if (!slug) {
      return NextResponse.json({ error: 'Slug is required' }, { status: 400 });
    }

    const supabase = await createClient();

    // Fetch project by slug
    const { data: project, error } = await supabase
      .from('projects')
      .select('id')
      .eq('slug', slug)
      .single();

    if (error || !project) {
      // Supabase returns an error if .single() finds no rows, which is what we want for an available slug
      return NextResponse.json({ message: 'Slug is available' }, { status: 404 });
    }

    // If we find a project, the slug is taken
    return NextResponse.json({ message: 'Slug is taken' }, { status: 200 });

  } catch (error) {
    console.error('Error fetching public project:', error);
    return NextResponse.json(
      { error: 'Failed to fetch project information' },
      { status: 500 }
    );
  }
}
