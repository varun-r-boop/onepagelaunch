import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { BlockProjectData } from '@/lib/types';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { projectData, editId } = body as { projectData: BlockProjectData; editId?: string };
    const { slug, projectName, ...restOfData } = projectData;
    let projectId: string | undefined;

    // --- Validate input ---
    if (!projectName || !slug) {
      return NextResponse.json(
        { error: 'Project name and slug are required.' },
        { status: 400 }
      );
    }

    // --- Authenticate user ---
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    if (editId) {
      // --- UPDATE EXISTING PROJECT ---
      projectId = editId;
      const { data: existingProject } = await supabase
        .from('projects')
        .select('slug')
        .eq('id', editId)
        .eq('user_id', user.id)
        .single();

      if (!existingProject) {
        return NextResponse.json({ error: 'Project not found or access denied.' }, { status: 404 });
      }

      // If slug has changed, check for uniqueness
      if (slug !== existingProject.slug) {
        const { data: slugCheck } = await supabase
          .from('projects')
          .select('id')
          .eq('slug', slug)
          .neq('id', editId)
          .single();
        if (slugCheck) {
          return NextResponse.json({ error: 'This URL slug is already taken.' }, { status: 409 });
        }
      }

      // Update project
      const { error: updateError } = await supabase
          .from('projects')
          .update({ 
            data: { projectName, ...restOfData }, 
            slug, 
            updated_at: new Date().toISOString() 
          })
          .eq('id', editId);
      
      if (updateError) {
        console.error('Error updating project:', updateError);
        return NextResponse.json({ error: 'Failed to update project.' }, { status: 500 });
      }

    } else {
      // --- CREATE NEW PROJECT ---
      // 1. Check if user already has a project
      const { data: userProjects, error: projectsError } = await supabase
        .from('projects')
        .select('id, slug')
        .eq('user_id', user.id)
        .limit(1);

      if (projectsError) {
        console.error('Error checking user projects:', projectsError);
        return NextResponse.json({ error: 'Failed to check existing projects.' }, { status: 500 });
      }

      if (userProjects && userProjects.length > 0) {
        return NextResponse.json(
          { 
            error: 'You already have a project. Please edit your existing page instead.', 
            existingProject: userProjects[0] 
          },
          { status: 403 }
        );
      }

      // 2. Check slug uniqueness
      const { data: slugCheck, error: slugError } = await supabase
        .from('projects')
        .select('id')
        .eq('slug', slug)
        .single();
      
      // If no error and we found data, slug is taken
      if (!slugError && slugCheck) {
        return NextResponse.json({ error: 'This URL slug is already taken.' }, { status: 409 });
      }
      
      // If error is not "PGRST116" (no rows), then it's a real error
      if (slugError && slugError.code !== 'PGRST116') {
        console.error('Error checking slug uniqueness:', slugError);
        return NextResponse.json({ error: 'Failed to validate slug availability.' }, { status: 500 });
      }

      // 3. Insert new project
      projectId = uuidv4();
      const supabaseData = {
        id: projectId,
        user_id: user.id,
        slug,
        data: { projectName, ...restOfData },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      
      const { error: insertError } = await supabase.from('projects').insert(supabaseData);

      if (insertError) {
        console.error('Error inserting project:', insertError);
        console.error('Project data:', supabaseData);
        return NextResponse.json({ 
          error: 'Failed to create project. Please try again.',
          details: process.env.NODE_ENV === 'development' ? insertError.message : undefined
        }, { status: 500 });
      }
    }

    // --- RETURN SUCCESS ---
    return NextResponse.json({ 
      success: true, 
      slug: slug,
      projectId: projectId,
      url: `${process.env.NEXT_PUBLIC_BASE_URL}/${slug}`,
      isEdit: !!editId
    });

  } catch (error) {
    console.error('Error in POST /api/projects:', error);
    return NextResponse.json({ error: 'An unexpected error occurred.' }, { status: 500 });
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