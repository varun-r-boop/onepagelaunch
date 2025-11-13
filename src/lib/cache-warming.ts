import { createClient } from '@/lib/supabase/server';
import { cacheProject } from './redis';

// Cache warming utility to pre-populate Redis with popular projects
export async function warmCache() {
  try {
    const supabase = await createClient();
    
    // Fetch recent projects to warm the cache
    const { data: projects, error } = await supabase
      .from('projects')
      .select('*')
      .order('updated_at', { ascending: false })
      .limit(50); // Warm cache with 50 most recent projects

    if (error) {
      console.error('Error warming cache:', error);
      return;
    }

    if (!projects) {
      console.log('No projects found for cache warming');
      return;
    }

    // Cache each project
    const cachePromises = projects.map(async (project) => {
      try {
        await cacheProject(project.slug, project.data);
        console.log(`Warmed cache for project: ${project.slug}`);
      } catch (error) {
        console.error(`Failed to warm cache for project ${project.slug}:`, error);
      }
    });

    await Promise.allSettled(cachePromises);
    console.log(`Cache warming completed for ${projects.length} projects`);

  } catch (error) {
    console.error('Error in cache warming:', error);
  }
}

// Function to warm cache for a specific project
export async function warmCacheForProject(slug: string) {
  try {
    const supabase = await createClient();
    
    const { data: project, error } = await supabase
      .from('projects')
      .select('*')
      .eq('slug', slug)
      .single();

    if (error || !project) {
      console.error(`Project not found for cache warming: ${slug}`);
      return;
    }

    await cacheProject(slug, project.data);
    console.log(`Cache warmed for project: ${slug}`);

  } catch (error) {
    console.error(`Error warming cache for project ${slug}:`, error);
  }
} 