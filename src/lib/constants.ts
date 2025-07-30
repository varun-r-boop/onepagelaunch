/**
 * Application Constants
 */

// Timing constants
export const DEBOUNCE_DELAY = 2000; // 2 seconds for auto-save
export const TOAST_DELAY = 100; // Delay before showing toast
export const ANIMATION_DURATION = 0.8; // Animation duration in seconds

// UI constants
export const MAX_PROJECTS_PER_USER = 1; // Current limit on projects per user
export const ID_GENERATION_LENGTH = 9; // Length of random part in IDs

// Error messages
export const ERROR_MESSAGES = {
  PROJECT_NAME_REQUIRED: 'Project name and slug are required.',
  AUTHENTICATION_REQUIRED: 'Authentication required',
  PROJECT_NOT_FOUND: 'Project not found or access denied',
  SLUG_TAKEN: 'This URL slug is already taken.',
  PROJECT_LIMIT_REACHED: 'You already have a project. Please edit your existing page instead.',
  SAVE_FAILED: 'Failed to save changes',
  DELETE_FAILED: 'Failed to delete project',
  UNEXPECTED_ERROR: 'An unexpected error occurred.',
  INVALID_DROP_SELF: 'Cannot drop a block on itself',
  INVALID_DROP_INTO_SELF: 'Cannot drop a block into itself',
  INVALID_DROP_INTO_CHILD: 'Cannot drop a block into one of its own children'
} as const;

// Success messages
export const SUCCESS_MESSAGES = {
  PROJECT_SAVED: 'Project saved successfully',
  PROJECT_DELETED: 'Project deleted successfully',
  PROJECT_PUBLISHED: 'Project published successfully'
} as const;

// Default block styles
export const DEFAULT_BLOCK_STYLES = {
  TEXT_BLOCK: {
    bgColor: '#ffffff',
    padding: '2rem',
    borderColor: '#e2e8f0',
    textAlign: 'left' as const
  },
  CTA_BLOCK: {
    bgColor: 'transparent',
    padding: '1rem',
    textAlign: 'center' as const
  },
  HERO_BLOCK: {
    bgColor: '#f8fafc',
    padding: '4rem',
    textAlign: 'center' as const
  },
  FEATURE_BLOCK: {
    bgColor: '#ffffff',
    padding: '2rem',
    textAlign: 'left' as const
  }
} as const;

// Default CTA button styles
export const DEFAULT_CTA_STYLES = {
  PRIMARY: {
    bgColor: '#3b82f6',
    textColor: '#ffffff'
  },
  SECONDARY: {
    bgColor: '#6b7280',
    textColor: '#ffffff'
  },
  OUTLINE: {
    bgColor: 'transparent',
    textColor: '#3b82f6',
    borderColor: '#3b82f6'
  }
} as const;

// API endpoints
export const API_ENDPOINTS = {
  PROJECTS: '/api/projects',
  PROJECTS_PUBLIC: '/api/projects/public'
} as const;

// Feature limits
export const LIMITS = {
  MAX_FEATURES_PER_PROJECT: 6,
  MAX_BLOCKS_PER_PROJECT: 50, // Reasonable limit to prevent performance issues
  MAX_PROJECT_NAME_LENGTH: 100,
  MAX_TAGLINE_LENGTH: 200
} as const;

// Keyboard shortcuts
export const KEYBOARD_SHORTCUTS = {
  UNDO: ['ctrl+z', 'cmd+z'],
  REDO: ['ctrl+y', 'ctrl+shift+z', 'cmd+y', 'cmd+shift+z']
} as const; 