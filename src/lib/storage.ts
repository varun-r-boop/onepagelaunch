import { ProjectData, ProjectFormData } from './types';
import { getCachedProject } from './redis';

// Client-side function to publish a project via API
export const publishProject = async (formData: ProjectFormData): Promise<{ success: boolean; slug?: string; url?: string; error?: string }> => {
  try {
    const response = await fetch('/api/publish', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(formData),
    });

    const result = await response.json();

    if (!response.ok) {
      return { success: false, error: result.error || 'Failed to publish project' };
    }

    return { success: true, slug: result.slug, url: result.url };
  } catch (error) {
    console.error('Failed to publish project:', error);
    return { success: false, error: 'Network error occurred' };
  }
};

// Server-side function to get project from Redis (updated to use new utility)
export const getProjectFromKV = async (slug: string): Promise<ProjectData | null> => {
  try {
    const projectData = await getCachedProject(slug);
    
    if (!projectData) return null;
    
    // Convert BlockProjectData to ProjectData format if needed
    // This maintains backward compatibility
    return {
      id: projectData.id || '',
      slug: projectData.slug || '',
      projectName: projectData.projectName,
      tagline: '', // Default value for old format
      features: [], // Default value for old format
      ctaText: '', // Default value for old format
      ctaUrl: '', // Default value for old format
      createdAt: projectData.createdAt || new Date(),
      userId: projectData.userId || ''
    };
  } catch (error) {
    console.error('Failed to get project from Redis:', error);
    return null;
  }
};

// Legacy localStorage functions for backward compatibility during development
export const getProject = (slug: string): ProjectData | null => {
  if (typeof window === 'undefined') return null;
  
  try {
    const projects = getProjects();
    return projects.find(p => p.slug === slug) || null;
  } catch (error) {
    console.error('Failed to get project:', error);
    return null;
  }
};

export const getProjects = (): ProjectData[] => {
  if (typeof window === 'undefined') return [];
  
  try {
    const stored = localStorage.getItem('onepage-projects');
    if (!stored) return [];
    
    const projects = JSON.parse(stored) as (Omit<ProjectData, 'createdAt'> & { createdAt: string })[];
    return projects.map((p) => ({
      ...p,
      createdAt: new Date(p.createdAt)
    }));
  } catch (error) {
    console.error('Failed to get projects:', error);
    return [];
  }
}; 