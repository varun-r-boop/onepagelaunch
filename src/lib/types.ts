// Block-based types for the drag-and-drop builder
export interface BlockStyle {
  borderColor?: string;
  bgColor?: string;
  padding?: string;
  margin?: string;
  borderRadius?: string;
  textAlign?: 'left' | 'center' | 'right';
  width?: string;
  layout?: 'row' | 'column';
}

export interface Block {
  id: string;
  type: 'block' | 'inline';
  title?: string;
  content?: string;
  style?: BlockStyle;
  children?: Block[];
}

export interface BlockProjectData {
  id?: string;
  slug?: string;
  projectName: string;
  blocks: Block[];
  createdAt?: Date;
  userId?: string;
  updatedAt?: Date;
}

// Legacy form-based types for backward compatibility
export interface ProjectFormData {
  projectName: string;
  tagline: string;
  features: Array<{
    title: string;
    description: string;
    icon: string;
  }>;
  ctaText: string;
  ctaUrl: string;
  screenshot?: string;
}

export interface ProjectData {
  id: string;
  slug: string;
  projectName: string;
  tagline: string;
  features: Array<{
    title: string;
    description: string;
    icon: string;
  }>;
  ctaText: string;
  ctaUrl: string;
  screenshot?: string;
  createdAt: Date;
  userId: string;
}

// Supabase database types
export interface SupabaseProject {
  id: string;
  user_id: string;
  slug: string;
  data: BlockProjectData;
  created_at: string;
  updated_at: string;
}

export interface UserProfile {
  id: string;
  email: string;
  name?: string;
  avatar_url?: string;
} 