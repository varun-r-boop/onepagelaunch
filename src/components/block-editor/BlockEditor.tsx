'use client';

import * as React from 'react';
import { Block, BlockProjectData } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Save, Eye } from 'lucide-react';
import BlockComponent from './Block';

interface BlockEditorProps {
  data: BlockProjectData;
  onUpdate: (data: BlockProjectData) => void;
  onPreview?: () => void;
  onSave?: () => void;
}

export default function BlockEditor({ data, onUpdate, onPreview, onSave }: BlockEditorProps) {
  const [selectedBlockId, setSelectedBlockId] = React.useState<string | null>(null);
  const [draggedBlockId, setDraggedBlockId] = React.useState<string | null>(null);

  const generateBlockId = () => `block-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  const createNewBlock = (type: 'block' | 'inline' = 'block'): Block => ({
    id: generateBlockId(),
    type,
    title: '',
    content: '',
    children: []
  });

  const addBlock = (type: 'block' | 'inline' = 'block') => {
    const newBlock = createNewBlock(type);
    const updatedBlocks = [...data.blocks, newBlock];
    onUpdate({ ...data, blocks: updatedBlocks });
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

    const updatedBlocks = updateBlockRecursive(data.blocks);
    onUpdate({ ...data, blocks: updatedBlocks });
  };

  const deleteBlock = (blockId: string) => {
    const deleteBlockRecursive = (blocks: Block[]): Block[] => {
      return blocks.filter(block => {
        if (block.id === blockId) {
          return false;
        }
        if (block.children) {
          block.children = deleteBlockRecursive(block.children);
        }
        return true;
      });
    };

    const updatedBlocks = deleteBlockRecursive(data.blocks);
    onUpdate({ ...data, blocks: updatedBlocks });
    if (selectedBlockId === blockId) {
      setSelectedBlockId(null);
    }
  };

  const duplicateBlock = (blockId: string) => {
    const duplicateBlockRecursive = (blocks: Block[]): Block[] => {
      return blocks.map(block => {
        if (block.id === blockId) {
          const duplicatedBlock = {
            ...block,
            id: generateBlockId(),
            children: block.children ? duplicateBlockRecursive(block.children) : []
          };
          return duplicatedBlock;
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

    const updatedBlocks = duplicateBlockRecursive(data.blocks);
    onUpdate({ ...data, blocks: updatedBlocks });
  };

  const handleDragStart = (blockId: string) => {
    setDraggedBlockId(blockId);
  };

  const handleDragEnd = () => {
    setDraggedBlockId(null);
  };

  const handleDrop = (targetBlockId: string, position: 'before' | 'after' | 'inside') => {
    if (!draggedBlockId || draggedBlockId === targetBlockId) return;

    const moveBlock = (blocks: Block[], fromId: string, toId: string, pos: 'before' | 'after' | 'inside'): Block[] => {
      let draggedBlock: Block | null = null;
      let newBlocks = blocks.filter(block => {
        if (block.id === fromId) {
          draggedBlock = block;
          return false;
        }
        if (block.children) {
          block.children = moveBlock(block.children, fromId, toId, pos);
        }
        return true;
      });

      if (!draggedBlock) return blocks;

      if (pos === 'inside') {
        // Add as child of target block
        newBlocks = newBlocks.map(block => {
          if (block.id === toId) {
            return {
              ...block,
              children: [...(block.children || []), draggedBlock!]
            };
          }
          return block;
        });
      } else {
        // Add before or after target block
        const targetIndex = newBlocks.findIndex(block => block.id === toId);
        if (targetIndex !== -1) {
          const insertIndex = pos === 'after' ? targetIndex + 1 : targetIndex;
          newBlocks.splice(insertIndex, 0, draggedBlock);
        }
      }

      return newBlocks;
    };

    const updatedBlocks = moveBlock(data.blocks, draggedBlockId, targetBlockId, position);
    onUpdate({ ...data, blocks: updatedBlocks });
  };

  const renderBlock = (block: Block, index: number): React.ReactNode => {
    return (
      <div key={block.id} className="relative group">
        <BlockComponent
          block={block}
          onUpdate={(updatedBlock) => updateBlock(block.id, updatedBlock)}
          onDelete={() => deleteBlock(block.id)}
          onDuplicate={() => duplicateBlock(block.id)}
          isSelected={selectedBlockId === block.id}
          onSelect={() => setSelectedBlockId(block.id)}
        />
        
        {/* Drop zones */}
        <div className="drop-zones">
          <div
            className="drop-zone-before h-2 bg-blue-200 opacity-0 hover:opacity-100 transition-opacity"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              handleDrop(block.id, 'before');
            }}
          />
          <div
            className="drop-zone-inside min-h-4 bg-green-200 opacity-0 hover:opacity-100 transition-opacity"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              handleDrop(block.id, 'inside');
            }}
          />
          <div
            className="drop-zone-after h-2 bg-blue-200 opacity-0 hover:opacity-100 transition-opacity"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              handleDrop(block.id, 'after');
            }}
          />
        </div>
      </div>
    );
  };

  return (
    <div className="block-editor">
      {/* Toolbar */}
      <div className="flex items-center justify-between mb-6 p-4 bg-white border rounded-lg shadow-sm">
        <div className="flex items-center gap-2">
          <Button
            onClick={() => addBlock('block')}
            variant="outline"
            size="sm"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Block
          </Button>
          <Button
            onClick={() => addBlock('inline')}
            variant="outline"
            size="sm"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Inline
          </Button>
        </div>
        
        <div className="flex items-center gap-2">
          {onPreview && (
            <Button onClick={onPreview} variant="outline" size="sm">
              <Eye className="h-4 w-4 mr-2" />
              Preview
            </Button>
          )}
          {onSave && (
            <Button onClick={onSave} size="sm">
              <Save className="h-4 w-4 mr-2" />
              Save
            </Button>
          )}
        </div>
      </div>

      {/* Blocks Container */}
      <div className="blocks-container space-y-4 min-h-[400px] p-4 bg-gray-50 rounded-lg">
        {data.blocks.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <Plus className="h-12 w-12 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No blocks yet</h3>
            <p className="text-gray-600 mb-4">Start building your page by adding some blocks</p>
            <Button onClick={() => addBlock('block')}>
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Block
            </Button>
          </div>
        ) : (
          data.blocks.map((block, index) => renderBlock(block, index))
        )}
      </div>
    </div>
  );
} 