export interface ProjectData {
  id: string;
  slug: string;
  projectName: string;
  tagline: string;
  features: Feature[];
  ctaText: string;
  ctaUrl: string;
  screenshot?: string;
  createdAt: Date;
  userId?: string; // Optional for backward compatibility
  updatedAt?: Date;
}

export interface Feature {
  id: string;
  title: string;
  description: string;
  icon: string;
}

export interface ProjectFormData {
  projectName: string;
  tagline: string;
  features: Omit<Feature, 'id'>[];
  ctaText: string;
  ctaUrl: string;
  screenshot?: string;
}

// Supabase database types
export interface SupabaseProject {
  id: string;
  user_id: string;
  slug: string;
  data: ProjectFormData;
  created_at: string;
  updated_at: string;
}

export interface UserProfile {
  id: string;
  email: string;
  name?: string;
  avatar_url?: string;
} 