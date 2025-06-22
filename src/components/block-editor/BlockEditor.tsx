'use client';

import React, { useState } from 'react';
import BlockComponent from './Block';
import { BlockProjectData, Block } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface BlockEditorProps {
  data: BlockProjectData;
  onUpdate: (data: BlockProjectData) => void;
}

// --- Helper Functions for Block Manipulation ---

function findAndRemoveBlock(
  blocks: Block[],
  blockId: string
): { newBlocks: Block[]; foundBlock: Block | null } {
  let foundBlock: Block | null = null;

  function remover(bs: Block[]): Block[] {
    // Check current level
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

    // Recurse into children
    return bs.map(b => {
      if (!b.children) return b;
      const newChildren = remover(b.children);
      // This check is important to only return a new object if something changed
      if (b.children.length === newChildren.length) {
        return b;
      }
      return { ...b, children: newChildren };
    });
  }

  const newBlocks = remover(blocks);
  return { newBlocks, foundBlock };
}

function findAndInsertBlock(
  blocks: Block[],
  targetId: string,
  blockToInsert: Block,
  position: 'before' | 'after' | 'inside'
): Block[] {
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
}

// --- BlockEditor Component ---

export default function BlockEditor({ data, onUpdate }: BlockEditorProps) {
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);

  const addBlock = () => {
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

    onUpdate({
      ...data,
      blocks: [...data.blocks, newBlock]
    });
  };

  const updateBlock = (blockId: string, updatedBlock: Block) => {
    const updateBlockRecursive = (blocks: Block[]): Block[] => {
      return blocks.map(block => {
        if (block.id === blockId) {
          return updatedBlock;
        }
        if (block.children) {
          return {
            ...block,
            children: updateBlockRecursive(block.children)
          };
        }
        return block;
      });
    };

    onUpdate({
      ...data,
      blocks: updateBlockRecursive(data.blocks)
    });
  };

  const deleteBlock = (blockId: string) => {
    const deleteBlockRecursive = (blocks: Block[]): Block[] => {
      return blocks.filter(block => {
        if (block.id === blockId) {
          return false;
        }
        if (block.children) {
          return {
            ...block,
            children: deleteBlockRecursive(block.children)
          };
        }
        return true;
      });
    };

    onUpdate({
      ...data,
      blocks: deleteBlockRecursive(data.blocks)
    });
    setSelectedBlockId(null);
  };

  const duplicateBlock = (blockId: string) => {
    const duplicateBlockRecursive = (blocks: Block[]): Block[] => {
      return blocks.map(block => {
        if (block.id === blockId) {
          return {
            ...block,
            id: `block-${Date.now()}`,
            children: block.children ? duplicateBlockRecursive(block.children) : []
          };
        }
        if (block.children) {
          return {
            ...block,
            children: duplicateBlockRecursive(block.children)
          };
        }
        return block;
      });
    };

    onUpdate({
      ...data,
      blocks: duplicateBlockRecursive(data.blocks)
    });
  };
  
  const moveBlock = (draggedId: string, targetId: string, position: 'before' | 'after' | 'inside') => {
    if (draggedId === targetId && position !== 'inside') return;

    const { newBlocks: blocksWithoutDragged, foundBlock: draggedBlock } = findAndRemoveBlock(
      data.blocks,
      draggedId
    );

    if (!draggedBlock) {
      console.error("Couldn't find dragged block");
      return;
    }
    
    // Prevent dropping a block into itself or its own children
    if (position === 'inside') {
      if (draggedId === targetId) return;
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
        return;
      }
    }

    const newBlocks = findAndInsertBlock(blocksWithoutDragged, targetId, draggedBlock, position);
    onUpdate({ ...data, blocks: newBlocks });
  };
  
  const handleRootDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const draggedId = e.dataTransfer.getData('text/plain');
    if (!draggedId) return;

    // This prevents firing when dropping on a block which handles its own drop
    if ((e.target as HTMLElement).closest('.block-component')) {
      return;
    }

    const { newBlocks: blocksWithoutDragged, foundBlock: draggedBlock } = findAndRemoveBlock(data.blocks, draggedId);
    
    if (!draggedBlock) return;

    // Add to the end of the root blocks array
    const newBlocks = [...blocksWithoutDragged, draggedBlock];
    onUpdate({ ...data, blocks: newBlocks });
  };

  return (
    <div 
      className="w-full min-h-screen bg-white"
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleRootDrop}
    >
      {/* Blocks Container */}
      <div className="w-full px-8 py-6">
        {data.blocks.map((block, index) => (
          <BlockComponent
            key={block.id}
            block={block}
            onUpdate={(updatedBlock) => updateBlock(block.id, updatedBlock)}
            onDelete={() => deleteBlock(block.id)}
            onDuplicate={() => duplicateBlock(block.id)}
            onDrop={moveBlock}
            isSelected={selectedBlockId === block.id}
            onSelect={() => setSelectedBlockId(block.id)}
          />
        ))}
      </div>
    </div>
  );
} 