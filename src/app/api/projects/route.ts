import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { BlockProjectData } from '@/lib/types';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { projectData, editId } = body as { projectData: BlockProjectData; editId?: string };
    const { slug, projectName, ...restOfData } = projectData;

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
      const { data: userProjects } = await supabase
        .from('projects')
        .select('id')
        .eq('user_id', user.id)
        .limit(1);

      if (userProjects && userProjects.length > 0) {
        return NextResponse.json(
          { error: 'You can only create one page. Please edit your existing page.' },
          { status: 403 }
        );
      }

      // 2. Check slug uniqueness
      const { data: slugCheck } = await supabase.from('projects').select('id').eq('slug', slug).single();
      if (slugCheck) {
        return NextResponse.json({ error: 'This URL slug is already taken.' }, { status: 409 });
      }

      // 3. Insert new project
      const projectId = uuidv4();
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
        return NextResponse.json({ error: 'Failed to create project.' }, { status: 500 });
      }
    }

    // --- RETURN SUCCESS ---
    return NextResponse.json({ 
      success: true, 
      slug: slug,
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