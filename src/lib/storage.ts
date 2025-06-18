import { ProjectData, ProjectFormData } from './types';

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

// Server-side function to get project from Redis
export const getProjectFromKV = async (slug: string): Promise<ProjectData | null> => {
  try {
    const { createClient } = await import('redis');
    const redis = createClient({ 
      url: process.env.REDIS_URL,
      socket: {
        connectTimeout: 10000 // 10 seconds
      }
    });
    
    await redis.connect();
    
    try {
      const projectData = await redis.get(`project:${slug}`);
      
      if (!projectData) return null;
      
      const project = JSON.parse(projectData) as ProjectData;
        
      // Convert createdAt string back to Date object
      return {
        ...project,
        createdAt: new Date(project.createdAt)
      };
    } finally {
      await redis.disconnect();
    }
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