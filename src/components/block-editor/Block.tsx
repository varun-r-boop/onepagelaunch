'use client';

import * as React from 'react';
import { Block, BlockStyle } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { HexColorPicker } from 'react-colorful';
import { 
  Copy, 
  Trash2, 
  Palette,
  Minus,
  Square,
  RectangleHorizontal,
  RectangleVertical,
  Cuboid,
  BrickWall,
  Square as BorderIcon,
} from 'lucide-react';

interface BlockProps {
  block: Block;
  onUpdate: (updatedBlock: Block) => void;
  onDelete: () => void;
  onDuplicate: () => void;
  isSelected?: boolean;
  onSelect?: () => void;
  onDrop?: (draggedId: string, targetId: string, position: 'before' | 'after' | 'inside') => void;
  depth?: number;
}

export default function BlockComponent({
  block,
  onUpdate,
  onDelete,
  onDuplicate,
  isSelected = false,
  onSelect,
  onDrop,
  depth = 0
}: BlockProps) {
  const [showBubbleMenu, setShowBubbleMenu] = React.useState(false);
  const [isDragging, setIsDragging] = React.useState(false);
  const [isDragOver, setIsDragOver] = React.useState(false);
  const [dropPosition, setDropPosition] = React.useState<'before' | 'after' | 'inside' | null>(null);
  const [showColorPicker, setShowColorPicker] = React.useState(false);
  const [showBorderColorPicker, setShowBorderColorPicker] = React.useState(false);
  const [currentSize, setCurrentSize] = React.useState<'small' | 'medium' | 'large'>('large');
  const blockRef = React.useRef<HTMLDivElement>(null);
  const titleRef = React.useRef<HTMLDivElement>(null);
  const contentRef = React.useRef<HTMLDivElement>(null);

  // Set current size based on block width
  React.useEffect(() => {
    const width = block.style?.width || '100%';
    if (width === '25%') setCurrentSize('small');
    else if (width === '50%') setCurrentSize('medium');
    else setCurrentSize('large');
  }, [block.style?.width]);

  // Close color pickers when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showColorPicker || showBorderColorPicker) {
        const target = event.target as HTMLElement;
        if (!target.closest('.color-picker-container')) {
          setShowColorPicker(false);
          setShowBorderColorPicker(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showColorPicker, showBorderColorPicker]);

  const handleTitleEdit = () => {
    if (titleRef.current) {
      titleRef.current.contentEditable = 'true';
      titleRef.current.focus();
    }
  };

  const handleContentEdit = () => {
    if (contentRef.current) {
      contentRef.current.contentEditable = 'true';
      contentRef.current.focus();
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

  const cycleSize = () => {
    const sizeOrder = ['small', 'medium', 'large'] as const;
    const currentIndex = sizeOrder.indexOf(currentSize);
    const nextIndex = (currentIndex + 1) % sizeOrder.length;
    const nextSize = sizeOrder[nextIndex];
    
    const widthMap = {
      small: '25%',
      medium: '50%',
      large: '100%'
    };
    setCurrentSize(nextSize);
    updateStyle({ width: widthMap[nextSize] });
  };

  const changeBackgroundColor = (color: string) => {
    updateStyle({ bgColor: color });
    // Don't close the picker immediately for better UX
  };

  const changeBorderColor = (color: string) => {
    if (color === 'transparent') {
      updateStyle({ borderColor: undefined });
    } else {
      updateStyle({ borderColor: color });
    }
    // Don't close the picker immediately for better UX
  };

  const getBlockStyles = () => {
    const styles: React.CSSProperties = {
      padding: block.style?.padding || '1rem',
      backgroundColor: block.style?.bgColor || 'transparent',
      border: block.style?.borderColor ? `2px solid ${block.style.borderColor}` : 'none',
      borderRadius: block.style?.borderRadius || '1rem',
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
    e.stopPropagation();
    setIsDragging(true);
    e.dataTransfer.setData('text/plain', block.id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = (e: React.DragEvent) => {
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    setDropPosition(null);

    const draggedId = e.dataTransfer.getData('text/plain');
    if (draggedId && draggedId !== block.id && onDrop && dropPosition) {
      onDrop(draggedId, block.id, dropPosition);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'move';
    
    if (!blockRef.current) return;

    setIsDragOver(true);

    const dropTarget = blockRef.current.getBoundingClientRect();
    const dropPos = e.clientY;
    const dropZoneHeight = dropTarget.height;
    const dropZoneMargin = dropZoneHeight * 0.3; // 30% margin top/bottom

    if (dropPos < dropTarget.top + dropZoneMargin) {
      setDropPosition('before');
    } else if (dropPos > dropTarget.bottom - dropZoneMargin) {
      setDropPosition('after');
    } else {
      setDropPosition('inside');
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    setDropPosition(null);
  };

  const predefinedColors = [
    '#ffffff', '#f8fafc', '#f1f5f9', '#e2e8f0', 
    '#fef2f2', '#fef3c7', '#ecfdf5', '#eff6ff',
    '#fdf4ff', '#fef7ff', '#fffbeb', '#f0fdf4'
  ];

  return (
    <div
      ref={blockRef}
      className={`block-component relative transition-all duration-200 ${isDragging ? 'opacity-30' : ''}`}
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
      {isDragOver && (
        <>
          {dropPosition === 'before' && <div className="absolute -top-1 left-0 right-0 h-1.5 bg-blue-500 rounded-full z-20" />}
          {dropPosition === 'after' && <div className="absolute -bottom-1 left-0 right-0 h-1.5 bg-blue-500 rounded-full z-20" />}
          {dropPosition === 'inside' && <div className="absolute inset-0 border-2 border-blue-500 bg-blue-100/50 rounded-lg z-10" />}
        </>
      )}

      {/* Minimalistic Bubble Menu */}
      {showBubbleMenu && (
        <div className="absolute -bottom-12 left-1/2 transform -translate-x-1/2 z-10 bg-white/90 backdrop-blur-sm border border-gray-200 rounded-lg shadow-lg p-2">
          <div className="flex items-center gap-1">
            {/* Block/Inline Toggle */}
            <Button
              size="sm"
              variant="ghost"
              onClick={toggleBlockType}
              title={`Change to ${block.type === 'block' ? 'inline' : 'block'}`}
              className="h-7 w-7 p-0 rounded-md hover:bg-gray-100 transition-colors"
            >
              {block.type === 'block' ? (
                <Cuboid className="h-3.5 w-3.5" />
              ) : (
                <BrickWall className="h-3.5 w-3.5" />
              )}
            </Button>

            {/* Size Control - Box Icons */}
            <Button
              size="sm"
              variant="ghost"
              onClick={cycleSize}
              title={`Size: ${currentSize} (click to cycle)`}
              className="h-7 w-7 p-0 rounded-md hover:bg-gray-100 transition-colors"
            >
              {currentSize === 'small' && <Square className="h-3.5 w-3.5" />}
              {currentSize === 'medium' && <RectangleVertical className="h-3.5 w-3.5" />}
              {currentSize === 'large' && <RectangleHorizontal className="h-3.5 w-3.5" />}
            </Button>

            {/* Background Color */}
            <div className="relative">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowColorPicker(!showColorPicker)}
                title="Background color"
                className="h-7 w-7 p-0 rounded-md hover:bg-gray-100 transition-colors"
              >
                <Palette className="h-3.5 w-3.5" />
              </Button>
              
              {showColorPicker && (
                <div className="absolute top-8 left-1/2 transform -translate-x-1/2 bg-white border border-gray-200 rounded-lg shadow-lg p-3 z-20 color-picker-container">
                  <HexColorPicker
                    color={block.style?.bgColor || '#ffffff'}
                    onChange={changeBackgroundColor}
                    className="w-32 h-32"
                  />
                  <div className="mt-2 flex gap-1">
                    {predefinedColors.slice(0, 6).map((color) => (
                      <button
                        key={color}
                        onClick={() => changeBackgroundColor(color)}
                        className="w-6 h-6 rounded border border-gray-200 hover:scale-110 transition-transform"
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
                className="h-7 w-7 p-0 rounded-md hover:bg-gray-100 transition-colors"
              >
                <BorderIcon className="h-3.5 w-3.5" />
              </Button>
              
              {showBorderColorPicker && (
                <div className="absolute top-8 left-1/2 transform -translate-x-1/2 bg-white border border-gray-200 rounded-lg shadow-lg p-3 z-20 color-picker-container">
                  <HexColorPicker
                    color={block.style?.borderColor || '#000000'}
                    onChange={changeBorderColor}
                    className="w-32 h-32"
                  />
                  <div className="mt-2 flex gap-1">
                    <button
                      onClick={() => changeBorderColor('transparent')}
                      className="w-6 h-6 rounded border border-gray-200 hover:scale-110 transition-transform bg-white flex items-center justify-center"
                      title="No border"
                    >
                      <Minus className="h-3 w-3 text-gray-400" />
                    </button>
                    {predefinedColors.slice(0, 5).map((color) => (
                      <button
                        key={color}
                        onClick={() => changeBorderColor(color)}
                        className="w-6 h-6 rounded border border-gray-200 hover:scale-110 transition-transform"
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
              title="Duplicate"
              className="h-7 w-7 p-0 rounded-md hover:bg-gray-100 transition-colors"
            >
              <Copy className="h-3.5 w-3.5" />
            </Button>

            {/* Delete */}
            <Button
              size="sm"
              variant="ghost"
              onClick={onDelete}
              title="Delete"
              className="h-7 w-7 p-0 rounded-md hover:bg-red-50 hover:text-red-600 transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5" />
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
          <div className={`block-children mt-2 ${block.style?.layout === 'row' ? 'flex flex-row flex-wrap gap-2' : 'space-y-2'}`}>
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