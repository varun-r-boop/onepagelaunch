'use client';

import React, { useState } from 'react';
import BlockComponent from './Block';
import { BlockProjectData, Block } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Plus, Trash2 } from 'lucide-react';

interface BlockEditorProps {
  data: BlockProjectData;
  onUpdate: (data: BlockProjectData) => void;
}

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

  const moveBlock = (blockId: string, direction: 'up' | 'down') => {
    const blocks = [...data.blocks];
    const currentIndex = blocks.findIndex(block => block.id === blockId);
    
    if (currentIndex === -1) return;
    
    if (direction === 'up' && currentIndex > 0) {
      [blocks[currentIndex], blocks[currentIndex - 1]] = [blocks[currentIndex - 1], blocks[currentIndex]];
    } else if (direction === 'down' && currentIndex < blocks.length - 1) {
      [blocks[currentIndex], blocks[currentIndex + 1]] = [blocks[currentIndex + 1], blocks[currentIndex]];
    }
    
    onUpdate({
      ...data,
      blocks
    });
  };

  const moveBlockToNewParent = (draggedId: string, targetId: string) => {
    let draggedBlock: Block | null = null;

    // Find and remove the dragged block
    const findAndRemove = (blocks: Block[]): Block[] => {
      return blocks.reduce((acc, block) => {
        if (block.id === draggedId) {
          draggedBlock = { ...block };
          return acc;
        }
        if (block.children) {
          const newChildren = findAndRemove(block.children);
          if (newChildren.length !== block.children.length) {
            acc.push({ ...block, children: newChildren });
            return acc;
          }
        }
        acc.push(block);
        return acc;
      }, [] as Block[]);
    };

    let newBlocks = findAndRemove(data.blocks);

    if (!draggedBlock) return;

    // Add the dragged block to the target
    const findAndAdd = (blocks: Block[]): Block[] => {
      return blocks.map(block => {
        if (block.id === targetId) {
          const newChildren = [...(block.children || []), draggedBlock as Block];
          return { ...block, children: newChildren };
        }
        if (block.children) {
          return { ...block, children: findAndAdd(block.children) };
        }
        return block;
      });
    };
    
    newBlocks = findAndAdd(newBlocks);
    
    onUpdate({ ...data, blocks: newBlocks });
  };

  return (
    <div className="w-full min-h-screen bg-white">
      {/* Blocks Container */}
      <div className="w-full px-8 py-6">
        {data.blocks.map((block, index) => (
          <div key={block.id} className="relative">
            <BlockComponent
              block={block}
              onUpdate={(updatedBlock) => updateBlock(block.id, updatedBlock)}
              onDelete={() => deleteBlock(block.id)}
              onDuplicate={() => duplicateBlock(block.id)}
              onMoveUp={() => moveBlock(block.id, 'up')}
              onMoveDown={() => moveBlock(block.id, 'down')}
              onDrop={(draggedId) => moveBlockToNewParent(draggedId, block.id)}
              isSelected={selectedBlockId === block.id}
              onSelect={() => setSelectedBlockId(block.id)}
            />
          </div>
        ))}
      </div>
    </div>
  );
} 