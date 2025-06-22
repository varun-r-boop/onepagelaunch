'use client';

import * as React from 'react';
import { Block, BlockStyle } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { 
  Copy, 
  Trash2, 
  Type, 
  Palette,
  Move,
  Edit3,
  Square,
  Minus,
  Maximize2,
  Square as BorderIcon
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
  onDrop?: (draggedId: string) => void;
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
  onDrop,
  depth = 0
}: BlockProps) {
  const [isEditing, setIsEditing] = React.useState(false);
  const [showBubbleMenu, setShowBubbleMenu] = React.useState(false);
  const [isDragging, setIsDragging] = React.useState(false);
  const [isDragOver, setIsDragOver] = React.useState(false);
  const [showColorPicker, setShowColorPicker] = React.useState(false);
  const [showBorderColorPicker, setShowBorderColorPicker] = React.useState(false);
  const blockRef = React.useRef<HTMLDivElement>(null);
  const titleRef = React.useRef<HTMLDivElement>(null);
  const contentRef = React.useRef<HTMLDivElement>(null);

  const handleTitleEdit = () => {
    if (titleRef.current) {
      titleRef.current.contentEditable = 'true';
      titleRef.current.focus();
      setIsEditing(true);
    }
  };

  const handleContentEdit = () => {
    if (contentRef.current) {
      contentRef.current.contentEditable = 'true';
      contentRef.current.focus();
      setIsEditing(true);
      // Select all text if it's the default content
      if (contentRef.current.textContent === 'Add your content here...') {
        const range = document.createRange();
        range.selectNodeContents(contentRef.current);
        const selection = window.getSelection();
        if (selection) {
          selection.removeAllRanges();
          selection.addRange(range);
        }
      }
    }
  };

  const handleBlur = () => {
    setIsEditing(false);
    if (titleRef.current) {
      titleRef.current.contentEditable = 'false';
      const newTitle = titleRef.current.textContent || '';
      if (newTitle !== block.title) {
        onUpdate({ ...block, title: newTitle });
      }
    }
    if (contentRef.current) {
      contentRef.current.contentEditable = 'false';
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

  const changeSize = (size: 'small' | 'medium' | 'large') => {
    const widthMap = {
      small: '25%',
      medium: '50%',
      large: '100%'
    };
    updateStyle({ width: widthMap[size] });
  };

  const changeBackgroundColor = (color: string) => {
    updateStyle({ bgColor: color });
    setShowColorPicker(false);
  };

  const changeBorderColor = (color: string) => {
    if (color === 'transparent') {
      updateStyle({ borderColor: undefined });
    } else {
      updateStyle({ borderColor: color });
    }
    setShowBorderColorPicker(false);
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
      width: block.style?.width || '100%',
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
    e.stopPropagation();
    setIsDragOver(false);
    const draggedId = e.dataTransfer.getData('text/plain');
    if (draggedId && draggedId !== block.id && onDrop) {
      onDrop(draggedId);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'move';
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const predefinedColors = [
    '#ffffff', '#f8fafc', '#f1f5f9', '#e2e8f0', 
    '#fef2f2', '#fef3c7', '#ecfdf5', '#eff6ff',
    '#fdf4ff', '#fef7ff', '#fffbeb', '#f0fdf4'
  ];

  const predefinedBorderColors = [
    '#000000', '#374151', '#6b7280', '#9ca3af',
    '#dc2626', '#ea580c', '#d97706', '#65a30d',
    '#059669', '#0891b2', '#2563eb', '#7c3aed',
    '#db2777', '#be185d', '#be123c', '#881337'
  ];

  return (
    <div
      ref={blockRef}
      className={`block-component ${isDragging ? 'opacity-50' : ''} ${isDragOver ? 'bg-blue-100 border-blue-400' : ''}`}
      style={getBlockStyles()}
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onClick={onSelect}
      onMouseEnter={() => setShowBubbleMenu(true)}
      onMouseLeave={() => setShowBubbleMenu(false)}
    >
      {/* Enhanced Bubble Menu */}
      {showBubbleMenu && (
        <div className="absolute -bottom-15 left-1/2 transform -translate-x-1/2 z-10 bg-white/95 backdrop-blur-sm border border-gray-200/50 rounded-2xl shadow-2xl p-3 opacity-95">
          <div className="flex gap-3">
            {/* Size Controls */}
            <div className="flex gap-1 bg-gray-50/80 rounded-lg p-1">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => changeSize('small')}
                title="Small width (25%)"
                className="h-7 w-7 p-0 rounded-md hover:bg-white hover:shadow-sm transition-all duration-200"
              >
                <Minus className="h-3 w-3" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => changeSize('medium')}
                title="Medium width (50%)"
                className="h-7 w-7 p-0 rounded-md hover:bg-white hover:shadow-sm transition-all duration-200"
              >
                <Square className="h-3 w-3" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => changeSize('large')}
                title="Full width (100%)"
                className="h-7 w-7 p-0 rounded-md hover:bg-white hover:shadow-sm transition-all duration-200"
              >
                <Maximize2 className="h-3 w-3" />
              </Button>
            </div>

            {/* Block/Inline Toggle */}
            <Button
              size="sm"
              variant="ghost"
              onClick={toggleBlockType}
              title={`Change to ${block.type === 'block' ? 'inline' : 'block'}`}
              className="h-8 w-8 p-0 rounded-xl hover:bg-gray-50 hover:shadow-sm transition-all duration-200"
            >
              <Type className="h-4 w-4" />
            </Button>

            {/* Edit Content */}
            <Button
              size="sm"
              variant="ghost"
              onClick={handleContentEdit}
              title="Edit content"
              className="h-8 w-8 p-0 rounded-xl hover:bg-gray-50 hover:shadow-sm transition-all duration-200"
            >
              <Edit3 className="h-4 w-4" />
            </Button>

            {/* Background Color */}
            <div className="relative">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowColorPicker(!showColorPicker)}
                title="Background color"
                className="h-8 w-8 p-0 rounded-xl hover:bg-gray-50 hover:shadow-sm transition-all duration-200"
              >
                <Palette className="h-4 w-4" />
              </Button>
              
              {showColorPicker && (
                <div className="absolute top-10 left-1/2 transform -translate-x-1/2 bg-white/95 backdrop-blur-sm border border-gray-200/50 rounded-2xl shadow-2xl p-3 z-20">
                  <div className="grid grid-cols-4 gap-2">
                    {predefinedColors.map((color) => (
                      <button
                        key={color}
                        onClick={() => changeBackgroundColor(color)}
                        className="w-7 h-7 rounded-xl border-2 border-gray-200 hover:scale-110 hover:border-gray-400 transition-all duration-200 shadow-sm"
                        style={{ backgroundColor: color }}
                        title={color}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Border Color */}
            <div className="relative">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowBorderColorPicker(!showBorderColorPicker)}
                title="Border color"
                className="h-8 w-8 p-0 rounded-xl hover:bg-gray-50 hover:shadow-sm transition-all duration-200"
              >
                <BorderIcon className="h-4 w-4" />
              </Button>
              
              {showBorderColorPicker && (
                <div className="absolute top-10 left-1/2 transform -translate-x-1/2 bg-white/95 backdrop-blur-sm border border-gray-200/50 rounded-2xl shadow-2xl p-3 z-20">
                  <div className="grid grid-cols-4 gap-2">
                    {/* Remove Border Option */}
                    <button
                      onClick={() => changeBorderColor('transparent')}
                      className="w-7 h-7 rounded-xl border-2 border-gray-200 hover:scale-110 hover:border-gray-400 transition-all duration-200 shadow-sm bg-white flex items-center justify-center"
                      title="Remove border"
                    >
                      <Minus className="h-3 w-3 text-gray-400" />
                    </button>
                    {predefinedBorderColors.map((color) => (
                      <button
                        key={color}
                        onClick={() => changeBorderColor(color)}
                        className="w-7 h-7 rounded-xl border-2 border-gray-200 hover:scale-110 hover:border-gray-400 transition-all duration-200 shadow-sm"
                        style={{ backgroundColor: color }}
                        title={color}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Duplicate */}
            <Button
              size="sm"
              variant="ghost"
              onClick={onDuplicate}
              title="Duplicate block"
              className="h-8 w-8 p-0 rounded-xl hover:bg-gray-50 hover:shadow-sm transition-all duration-200"
            >
              <Copy className="h-4 w-4" />
            </Button>

            {/* Delete */}
            <Button
              size="sm"
              variant="ghost"
              onClick={onDelete}
              title="Delete block"
              className="h-8 w-8 p-0 rounded-xl hover:bg-red-50 hover:text-red-600 transition-all duration-200"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Block Content - Renders exactly like final site */}
      <div className="block-content">
        {block.title && (
          <div
            ref={titleRef}
            className="block-title font-semibold text-lg mb-2 cursor-text hover:bg-gray-50/50 rounded px-1 -mx-1 transition-colors focus:outline-none"
            onClick={handleTitleEdit}
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
            className="block-content cursor-text hover:bg-gray-50/50 rounded px-1 -mx-1 transition-colors focus:outline-none"
            onClick={handleContentEdit}
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
                onDrop={onDrop}
                depth={depth + 1}
              />
            ))}
          </div>
        )}

        {/* Empty state for blocks without content */}
        {!block.title && !block.content && (!block.children || block.children.length === 0) && (
          <div 
            className="text-gray-400 italic text-sm cursor-text hover:bg-gray-50/50 rounded px-1 -mx-1 transition-colors focus:outline-none"
            onClick={handleContentEdit}
          >
            Click to edit this block
          </div>
        )}
      </div>
    </div>
  );
} 