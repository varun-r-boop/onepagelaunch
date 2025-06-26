'use client';

import { useState, useEffect, useCallback } from 'react';
import { BlockProjectData, Block } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import Link from 'next/link';
import ProjectBlockPreview from '@/components/block-editor/ProjectBlockPreview';
import BlockEditor from '@/components/block-editor/BlockEditor';
import { toast } from 'sonner';

interface ProjectPageClientProps {
  project: BlockProjectData;
  isOwner: boolean;
  projectId: string;
}

export function ProjectPageClient({ project, isOwner, projectId }: ProjectPageClientProps) {
  // Ensure the project has all required fields including slug
  const initialProject = {
    ...project,
    slug: project.slug || ''
  };
  
  const [editedProject, setEditedProject] = useState<BlockProjectData>(initialProject);
  const [lastSavedProject, setLastSavedProject] = useState<BlockProjectData>(initialProject);

  // Debounced save function
  const debouncedSave = useCallback(
    (() => {
      let timeoutId: NodeJS.Timeout;
      return (projectData: BlockProjectData) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(async () => {
          // Only save if the project has actually changed and has required fields
          if (JSON.stringify(projectData) !== JSON.stringify(lastSavedProject) && 
              projectData.projectName && 
              projectData.slug) {
            try {
              const response = await fetch('/api/projects', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  projectData,
                  editId: projectId
                }),
              });
              
              const result = await response.json();
              
              if (result.success) {
                setLastSavedProject(projectData);
              } else {
                toast.error(result.error || 'Failed to save changes');
              }
            } catch (error) {
              console.error('Error saving project:', error);
              toast.error('Failed to save changes');
            }
          }
        }, 2000); // 2 second debounce
      };
    })(),
    [projectId, lastSavedProject]
  );

  // Auto-save when project changes
  useEffect(() => {
    if (isOwner && editedProject !== lastSavedProject) {
      debouncedSave(editedProject);
    }
  }, [editedProject, debouncedSave, isOwner, lastSavedProject]);

  const addNewBlock = () => {
    const newBlock: Block = {
      id: `block-${Date.now()}`,
      type: 'block',
      title: 'New Block',
      content: 'Add your content here...',
      style: {
        bgColor: '#ffffff',
        padding: '2rem',
        textAlign: 'left'
      }
    };

    setEditedProject(prev => ({
      ...prev,
      blocks: [...prev.blocks, newBlock]
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      <div className="pt-20 pb-16">
        {isOwner ? (
          <div className="bg-white min-h-screen">
            {/* Editable Project Title */}
            <div className="border-b border-gray-200 px-8 py-6">
              <input
                type="text"
                value={editedProject.projectName}
                onChange={(e) => setEditedProject(prev => ({ ...prev, projectName: e.target.value }))}
                className="text-3xl font-bold text-center w-full bg-transparent border-none outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 py-1"
                placeholder="Enter project name..."
              />
            </div>
            
            <BlockEditor 
              data={editedProject} 
              onUpdate={setEditedProject}
            />
          </div>
        ) : (
          <ProjectBlockPreview data={editedProject} />
        )}
        
        {/* Footer - Only show for visitors */}
        {!isOwner && (
          <div className="text-center mt-16 pt-12 border-t border-white/20">
            <p className="text-gray-500">
              Built with{' '}
              <Link href="/" className="text-blue-600 hover:text-blue-700 font-medium">
                OnePageLaunch
              </Link>
            </p>
          </div>
        )}
      </div>

      {/* Floating Action Button - Only show for owners */}
      {isOwner && (
        <div className="fixed bottom-6 right-6 z-50">
          <Button
            onClick={addNewBlock}
            className="h-12 w-12 rounded-full shadow-lg bg-blue-600 hover:bg-blue-700 cursor-pointer"
            title="Add New Block"
          >
            <Plus className="h-5 w-5" />
          </Button>
        </div>
      )}
    </div>
  );
} 