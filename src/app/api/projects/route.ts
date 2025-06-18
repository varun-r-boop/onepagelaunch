import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { ProjectFormData } from '@/lib/types';
import slugify from 'slugify';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { projectData, editId } = body as { projectData: ProjectFormData; editId?: string };

    // Validate required fields
    if (!projectData.projectName || !projectData.tagline) {
      return NextResponse.json(
        { error: 'Project name and tagline are required' },
        { status: 400 }
      );
    }

    // Get authenticated user
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Generate or use existing slug
    let slug: string;
    let projectId: string;

    if (editId) {
      // Editing existing project - fetch current data
      const { data: existingProject, error: fetchError } = await supabase
        .from('projects')
        .select('slug, id')
        .eq('id', editId)
        .eq('user_id', user.id)
        .single();

      if (fetchError || !existingProject) {
        return NextResponse.json(
          { error: 'Project not found or access denied' },
          { status: 404 }
        );
      }

      slug = existingProject.slug;
      projectId = existingProject.id;
    } else {
      // Creating new project
      projectId = uuidv4();
      const baseSlug = slugify(projectData.projectName, {
        lower: true,
        strict: true,
        remove: /[*+~.()'"!:@]/g,
      });
      
      const timestamp = Date.now().toString(36);
      slug = `${baseSlug}-${timestamp}`;
    }

    // Save to Supabase
    const supabaseData = {
      id: projectId,
      user_id: user.id,
      slug,
      data: projectData,
      updated_at: new Date().toISOString(),
      ...(editId ? {} : { created_at: new Date().toISOString() })
    };

    const { error: dbError } = editId 
      ? await supabase
          .from('projects')
          .update({
            data: projectData,
            updated_at: new Date().toISOString()
          })
          .eq('id', editId)
          .eq('user_id', user.id)
      : await supabase
          .from('projects')
          .insert(supabaseData);

    if (dbError) {
      console.error('Database error:', dbError);
      return NextResponse.json(
        { error: 'Failed to save project to database' },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      slug,
      projectId,
      url: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/${slug}`,
      isEdit: !!editId
    });

  } catch (error) {
    console.error('Error saving project:', error);
    return NextResponse.json(
      { error: 'Failed to save project' },
      { status: 500 }
    );
  }
}

// GET route to fetch a single project for editing
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const projectId = url.searchParams.get('id');

    if (!projectId) {
      return NextResponse.json(
        { error: 'Project ID is required' },
        { status: 400 }
      );
    }

    // Get authenticated user
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Fetch project
    const { data: project, error } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .eq('user_id', user.id)
      .single();

    if (error || !project) {
      return NextResponse.json(
        { error: 'Project not found or access denied' },
        { status: 404 }
      );
    }

    return NextResponse.json({ project });

  } catch (error) {
    console.error('Error fetching project:', error);
    return NextResponse.json(
      { error: 'Failed to fetch project' },
      { status: 500 }
    );
  }
} 