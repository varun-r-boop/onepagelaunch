'use client';

import * as React from 'react';
import { Block, BlockStyle } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  MoreHorizontal, 
  Copy, 
  Trash2, 
  Type, 
  Palette,
  Move,
  Edit3
} from 'lucide-react';

interface BlockProps {
  block: Block;
  onUpdate: (updatedBlock: Block) => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  isSelected?: boolean;
  onSelect?: () => void;
  depth?: number;
}

export default function BlockComponent({
  block,
  onUpdate,
  onDelete,
  onDuplicate,
  onMoveUp,
  onMoveDown,
  isSelected = false,
  onSelect,
  depth = 0
}: BlockProps) {
  const [isEditing, setIsEditing] = React.useState(false);
  const [showBubbleMenu, setShowBubbleMenu] = React.useState(false);
  const [isDragging, setIsDragging] = React.useState(false);
  const blockRef = React.useRef<HTMLDivElement>(null);
  const titleRef = React.useRef<HTMLDivElement>(null);
  const contentRef = React.useRef<HTMLDivElement>(null);

  const handleTitleEdit = () => {
    if (titleRef.current) {
      titleRef.current.contentEditable = true;
      titleRef.current.focus();
      setIsEditing(true);
    }
  };

  const handleContentEdit = () => {
    if (contentRef.current) {
      contentRef.current.contentEditable = true;
      contentRef.current.focus();
      setIsEditing(true);
    }
  };

  const handleBlur = () => {
    setIsEditing(false);
    if (titleRef.current) {
      titleRef.current.contentEditable = false;
      const newTitle = titleRef.current.textContent || '';
      if (newTitle !== block.title) {
        onUpdate({ ...block, title: newTitle });
      }
    }
    if (contentRef.current) {
      contentRef.current.contentEditable = false;
      const newContent = contentRef.current.innerHTML || '';
      if (newContent !== block.content) {
        onUpdate({ ...block, content: newContent });
      }
    }
  };

  const toggleBlockType = () => {
    const newType = block.type === 'block' ? 'inline' : 'block';
    onUpdate({ ...block, type: newType });
  };

  const updateStyle = (styleUpdate: Partial<BlockStyle>) => {
    onUpdate({
      ...block,
      style: { ...block.style, ...styleUpdate }
    });
  };

  const getBlockStyles = () => {
    const styles: React.CSSProperties = {
      padding: block.style?.padding || '1rem',
      backgroundColor: block.style?.bgColor || 'transparent',
      border: block.style?.borderColor ? `2px solid ${block.style.borderColor}` : 'none',
      borderRadius: block.style?.borderRadius || '0.5rem',
      margin: block.style?.margin || '0.5rem 0',
      textAlign: block.style?.textAlign || 'left',
      position: 'relative',
      minHeight: '2rem',
      cursor: isSelected ? 'default' : 'pointer',
      outline: isSelected ? '2px solid #3b82f6' : 'none',
      outlineOffset: '2px',
    };

    if (block.type === 'inline') {
      styles.display = 'inline-block';
      styles.width = 'auto';
      styles.margin = '0.25rem';
    }

    return styles;
  };

  const handleDragStart = (e: React.DragEvent) => {
    setIsDragging(true);
    e.dataTransfer.setData('text/plain', block.id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const draggedId = e.dataTransfer.getData('text/plain');
    if (draggedId !== block.id) {
      // Handle drop logic here - would need to be implemented in parent
      console.log(`Dropped ${draggedId} into ${block.id}`);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  return (
    <div
      ref={blockRef}
      className={`block-component ${isDragging ? 'opacity-50' : ''}`}
      style={getBlockStyles()}
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onClick={onSelect}
      onMouseEnter={() => setShowBubbleMenu(true)}
      onMouseLeave={() => setShowBubbleMenu(false)}
    >
      {/* Bubble Menu */}
      {showBubbleMenu && (
        <div className="absolute -top-2 -right-2 z-10 bg-white border border-gray-200 rounded-lg shadow-lg p-1 flex gap-1">
          <Button
            size="sm"
            variant="ghost"
            onClick={handleTitleEdit}
            title="Edit title"
          >
            <Edit3 className="h-3 w-3" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={toggleBlockType}
            title={`Change to ${block.type === 'block' ? 'inline' : 'block'}`}
          >
            <Type className="h-3 w-3" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {/* TODO: Open style panel */}}
            title="Style block"
          >
            <Palette className="h-3 w-3" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={onDuplicate}
            title="Duplicate block"
          >
            <Copy className="h-3 w-3" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={onDelete}
            title="Delete block"
            className="text-red-600 hover:text-red-700"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      )}

      {/* Drag Handle */}
      <div className="absolute -left-6 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
        <Move className="h-4 w-4 text-gray-400 cursor-move" />
      </div>

      {/* Block Content */}
      <div className="block-content">
        {block.title && (
          <div
            ref={titleRef}
            className="block-title font-semibold text-lg mb-2"
            onBlur={handleBlur}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleBlur();
              }
            }}
          >
            {block.title}
          </div>
        )}
        
        {block.content && (
          <div
            ref={contentRef}
            className="block-content"
            onBlur={handleBlur}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && e.shiftKey) {
                e.preventDefault();
                handleBlur();
              }
            }}
            dangerouslySetInnerHTML={{ __html: block.content }}
          />
        )}

        {/* Children Blocks */}
        {block.children && block.children.length > 0 && (
          <div className={`block-children ${block.type === 'inline' ? 'flex flex-wrap gap-2' : 'space-y-2'}`}>
            {block.children.map((childBlock) => (
              <BlockComponent
                key={childBlock.id}
                block={childBlock}
                onUpdate={(updatedChild) => {
                  const updatedChildren = block.children?.map(child =>
                    child.id === childBlock.id ? updatedChild : child
                  );
                  onUpdate({ ...block, children: updatedChildren });
                }}
                onDelete={() => {
                  const updatedChildren = block.children?.filter(child => child.id !== childBlock.id);
                  onUpdate({ ...block, children: updatedChildren });
                }}
                onDuplicate={() => {
                  const duplicatedChild = {
                    ...childBlock,
                    id: `${childBlock.id}-copy-${Date.now()}`
                  };
                  const updatedChildren = [...(block.children || []), duplicatedChild];
                  onUpdate({ ...block, children: updatedChildren });
                }}
                isSelected={isSelected}
                onSelect={onSelect}
                depth={depth + 1}
              />
            ))}
          </div>
        )}

        {/* Empty state for blocks without content */}
        {!block.title && !block.content && (!block.children || block.children.length === 0) && (
          <div className="text-gray-400 italic text-sm">
            Click to edit this block
          </div>
        )}
      </div>
    </div>
  );
} 