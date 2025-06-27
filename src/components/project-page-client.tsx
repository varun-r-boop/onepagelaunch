'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { BlockProjectData, Block } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import Link from 'next/link';
import BlockPreview from '@/components/block-editor/BlockPreview';
import { toast } from 'sonner';

interface ProjectPageClientProps {
  project: BlockProjectData;
  isOwner: boolean;
  projectId: string;
}

// Utility: Deep clone a block and all its children with new unique IDs
function deepCloneBlockWithNewIds(block: Block): Block {
  const generateUniqueId = () => `block-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  return {
    ...block,
    id: generateUniqueId(),
    children: block.children ? block.children.map(deepCloneBlockWithNewIds) : [],
  };
}

// Utility: Insert duplicate below original
function insertDuplicateBelow(blocks: Block[], blockId: string): Block[] {
  return blocks.flatMap(block => {
    if (block.id === blockId) {
      const duplicate = deepCloneBlockWithNewIds(block);
      return [block, duplicate];
    }
    if (block.children) {
      return [{ ...block, children: insertDuplicateBelow(block.children, blockId) }];
    }
    return [block];
  });
}

export function ProjectPageClient({ project, isOwner, projectId }: ProjectPageClientProps) {
  // Ensure the project has all required fields including slug
  const initialProject = {
    ...project,
    slug: project.slug || ''
  };
  
  const [editedProject, setEditedProject] = useState<BlockProjectData>(initialProject);
  const [lastSavedProject, setLastSavedProject] = useState<BlockProjectData>(initialProject);
  const [hoveredBlockId, setHoveredBlockId] = useState<string | null>(null);

  // Undo/Redo stacks
  const historyRef = useRef<BlockProjectData[]>([]);
  const futureRef = useRef<BlockProjectData[]>([]);
  const isUndoRedo = useRef(false);

  // Push to history on every edit (except undo/redo)
  useEffect(() => {
    if (!isUndoRedo.current) {
      historyRef.current = [...historyRef.current, editedProject];
      futureRef.current = [];
    }
    isUndoRedo.current = false;
  }, [editedProject]);

  // Undo function
  const undo = () => {
    if (historyRef.current.length <= 1) return;
    futureRef.current = [historyRef.current[historyRef.current.length - 1], ...futureRef.current];
    isUndoRedo.current = true;
    setEditedProject(historyRef.current[historyRef.current.length - 2]);
    historyRef.current = historyRef.current.slice(0, -1);
  };

  // Redo function
  const redo = () => {
    if (futureRef.current.length === 0) return;
    isUndoRedo.current = true;
    setEditedProject(futureRef.current[0]);
    historyRef.current = [...historyRef.current, futureRef.current[0]];
    futureRef.current = futureRef.current.slice(1);
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        undo();
      } else if ((e.ctrlKey || e.metaKey) && (e.key.toLowerCase() === 'y' || (e.shiftKey && e.key.toLowerCase() === 'z'))) {
        e.preventDefault();
        redo();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo]);

  // Generate unique IDs
  const generateUniqueId = () => {
    return `block-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  };

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
      id: generateUniqueId(),
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

  // Helper function to find and remove a block by ID (recursive)
  const findAndRemoveBlock = (blocks: Block[], blockId: string): { newBlocks: Block[]; foundBlock: Block | null } => {
    let foundBlock: Block | null = null;

    const remover = (bs: Block[]): Block[] => {
      const filtered = bs.filter(b => {
        if (b.id === blockId) {
          foundBlock = b;
          return false;
        }
        return true;
      });

      if (foundBlock) {
        return filtered;
      }

      return bs.map(b => {
        if (!b.children) return b;
        const newChildren = remover(b.children);
        if (b.children.length === newChildren.length) {
          return b;
        }
        return { ...b, children: newChildren };
      });
    };

    const newBlocks = remover(blocks);
    return { newBlocks, foundBlock };
  };

  // Helper function to find and insert a block (recursive)
  const findAndInsertBlock = (
    blocks: Block[],
    targetId: string,
    blockToInsert: Block,
    position: 'before' | 'after' | 'inside'
  ): Block[] => {
    if (position === 'inside') {
      return blocks.map(b => {
        if (b.id === targetId) {
          return { ...b, children: [...(b.children || []), blockToInsert] };
        }
        if (b.children) {
          return { ...b, children: findAndInsertBlock(b.children, targetId, blockToInsert, position) };
        }
        return b;
      });
    }

    const newBlocks: Block[] = [];
    let inserted = false;
    for (const b of blocks) {
      if (b.id === targetId) {
        if (position === 'before') newBlocks.push(blockToInsert);
        newBlocks.push(b);
        if (position === 'after') newBlocks.push(blockToInsert);
        inserted = true;
      } else {
        newBlocks.push(b);
      }
    }

    if (inserted) {
      return newBlocks;
    }

    return blocks.map(b => {
      if (!b.children) return b;
      return { ...b, children: findAndInsertBlock(b.children, targetId, blockToInsert, position) };
    });
  };

  // Recursive block update function
  const updateBlockRecursive = (blocks: Block[], blockId: string, updatedBlock: Block): Block[] => {
    return blocks.map(block => {
      if (block.id === blockId) {
        return updatedBlock;
      }
      if (block.children) {
        return {
          ...block,
          children: updateBlockRecursive(block.children, blockId, updatedBlock)
        };
      }
      return block;
    });
  };

  // Recursive block delete function
  const deleteBlockRecursive = (blocks: Block[], blockId: string): Block[] => {
    return blocks.filter(block => {
      if (block.id === blockId) {
        return false;
      }
      if (block.children) {
        return {
          ...block,
          children: deleteBlockRecursive(block.children, blockId)
        };
      }
      return true;
    });
  };

  const handleBlockUpdate = (blockId: string, updatedBlock: Block) => {
    setEditedProject(prev => ({
      ...prev,
      blocks: updateBlockRecursive(prev.blocks, blockId, updatedBlock)
    }));
  };

  const handleBlockDelete = (blockId: string) => {
    setEditedProject(prev => ({
      ...prev,
      blocks: deleteBlockRecursive(prev.blocks, blockId)
    }));
  };

  const handleBlockDuplicate = (blockId: string) => {
    setEditedProject(prev => ({
      ...prev,
      blocks: insertDuplicateBelow(prev.blocks, blockId)
    }));
  };

  const handleBlockDrop = (draggedId: string, targetId: string, position: 'before' | 'after' | 'inside') => {
    if (draggedId === targetId && position !== 'inside') return;

    setEditedProject(prev => {
      const { newBlocks: blocksWithoutDragged, foundBlock: draggedBlock } = findAndRemoveBlock(
        prev.blocks,
        draggedId
      );

      if (!draggedBlock) {
        console.error("Couldn't find dragged block");
        return prev;
      }
      
      // Prevent dropping a block into itself or its own children
      if (position === 'inside') {
        if (draggedId === targetId) return prev;
        let isDescendant = false;
        const checkDescendants = (children: Block[]) => {
          for (const child of children) {
            if (child.id === targetId) isDescendant = true;
            if (isDescendant) return;
            if (child.children) checkDescendants(child.children);
          }
        };
        if (draggedBlock.children) checkDescendants(draggedBlock.children);
        if (isDescendant) {
          toast.error("Cannot drop a block into one of its own children.");
          return prev;
        }
      }

      const newBlocks = findAndInsertBlock(blocksWithoutDragged, targetId, draggedBlock, position);
      return { ...prev, blocks: newBlocks };
    });
  };

  const handleRootDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const draggedId = e.dataTransfer.getData('text/plain');
    if (!draggedId) return;

    // This prevents firing when dropping on a block which handles its own drop
    if ((e.target as HTMLElement).closest('.block-preview')) {
      return;
    }

    setEditedProject(prev => {
      const { newBlocks: blocksWithoutDragged, foundBlock: draggedBlock } = findAndRemoveBlock(prev.blocks, draggedId);
      
      if (!draggedBlock) return prev;

      // Add to the end of the root blocks array
      const newBlocks = [...blocksWithoutDragged, draggedBlock];
      return { ...prev, blocks: newBlocks };
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      <div className="pt-20 pb-16">
        <div className="project-block-preview">
          <div className="container mx-auto px-4 py-8">
            {/* Project Title - Editable for owners, static for visitors */}
            {isOwner ? (
              <input
                type="text"
                value={editedProject.projectName}
                onChange={(e) => setEditedProject(prev => ({ ...prev, projectName: e.target.value }))}
                className="text-4xl font-bold text-center mb-8 w-full bg-transparent border-none outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 py-1"
                placeholder="Enter project name..."
              />
            ) : (
              <h1 className="text-4xl font-bold text-center mb-8">{editedProject.projectName}</h1>
            )}
            
            {/* Blocks - Use unified BlockPreview component for both owners and visitors */}
            <div 
              className="blocks-container space-y-4"
              onDragOver={(e) => e.preventDefault()}
              onDrop={isOwner ? handleRootDrop : undefined}
            >
              {editedProject.blocks.map((block) => (
                <BlockPreview
                  key={block.id}
                  block={block}
                  isEditable={isOwner}
                  onUpdate={isOwner ? (updatedBlock) => handleBlockUpdate(block.id, updatedBlock) : undefined}
                  onDelete={isOwner ? () => handleBlockDelete(block.id) : undefined}
                  onDuplicate={isOwner ? () => handleBlockDuplicate(block.id) : undefined}
                  onDrop={isOwner ? handleBlockDrop : undefined}
                  hoveredBlockId={hoveredBlockId}
                  setHoveredBlockId={setHoveredBlockId}
                />
              ))}
            </div>
          </div>
        </div>
        
        {/* Footer - Show for everyone */}
        <div className="text-center mt-16 pt-12 border-t border-white/20">
          <p className="text-gray-500">
            Built with{' '}
            <Link href="/" className="text-blue-600 hover:text-blue-700 font-medium">
            🧱 OnePageLaunch
            </Link>
          </p>
        </div>
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