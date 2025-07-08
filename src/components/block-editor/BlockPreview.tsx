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
  Link,
} from 'lucide-react';

interface BlockPreviewProps {
  block: Block;
  isEditable?: boolean;
  onUpdate?: (updatedBlock: Block) => void;
  onDelete?: () => void;
  onDuplicate?: () => void;
  isSelected?: boolean;
  onSelect?: () => void;
  onDrop?: (draggedId: string, targetId: string, position: 'before' | 'after' | 'inside') => void;
  depth?: number;
  hoveredBlockId?: string | null;
  setHoveredBlockId?: (id: string | null) => void;
}

export default function BlockPreview({ 
  block, 
  isEditable = false,
  onUpdate,
  onDelete,
  onDuplicate,
  isSelected = false,
  onSelect,
  onDrop,
  depth = 0,
  hoveredBlockId,
  setHoveredBlockId
}: BlockPreviewProps) {
  const [isDragging, setIsDragging] = React.useState(false);
  const [isDragOver, setIsDragOver] = React.useState(false);
  const [dropPosition, setDropPosition] = React.useState<'before' | 'after' | 'inside' | null>(null);
  const [showColorPicker, setShowColorPicker] = React.useState(false);
  const [showBorderColorPicker, setShowBorderColorPicker] = React.useState(false);
  const [currentSize, setCurrentSize] = React.useState<'small' | 'medium' | 'large'>('large');
  const blockRef = React.useRef<HTMLDivElement>(null);
  const titleRef = React.useRef<HTMLDivElement>(null);
  const contentRef = React.useRef<HTMLDivElement>(null);

  // Generate unique IDs
  const generateUniqueId = () => {
    return `block-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  };

  // Set current size based on block width
  React.useEffect(() => {
    const width = block.style?.width || '100%';
    if (width === '25%') setCurrentSize('small');
    else if (width === '50%') setCurrentSize('medium');
    else setCurrentSize('large');
  }, [block.style?.width]);

  // Close color pickers when clicking outside
  React.useEffect(() => {
    if (!isEditable) return;
    
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
  }, [showColorPicker, showBorderColorPicker, isEditable]);

  const handleTitleEdit = () => {
    if (!isEditable || !titleRef.current) return;
    titleRef.current.contentEditable = 'true';
    titleRef.current.focus();
  };

  const handleContentEdit = () => {
    if (!isEditable || !contentRef.current) return;
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
  };

  const handleBlur = () => {
    if (!isEditable || !onUpdate) return;
    
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
    if (!isEditable || !onUpdate) return;
    const newType = block.type === 'block' ? 'inline' : 'block';
    onUpdate({ ...block, type: newType });
  };

  const updateStyle = (styleUpdate: Partial<BlockStyle>) => {
    if (!isEditable || !onUpdate) return;
    onUpdate({
      ...block,
      style: { ...block.style, ...styleUpdate }
    });
  };

  const cycleSize = () => {
    if (!isEditable || !onUpdate) return;
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
    if (!isEditable) return;
    updateStyle({ bgColor: color });
  };

  const changeBorderColor = (color: string) => {
    if (!isEditable) return;
    if (color === 'transparent') {
      updateStyle({ borderColor: undefined });
    } else {
      updateStyle({ borderColor: color });
    }
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
      cursor: isEditable ? 'grab' : 'default',
      width: block.style?.width || '100%',
    };

    if (block.type === 'inline') {
      styles.display = 'inline-block';
      // Only override width if no specific width is set
      if (!block.style?.width || block.style.width === '100%') {
        styles.width = 'auto';
      }
      styles.margin = '0.25rem';
    }

    return styles;
  };

  const handleDragStart = (e: React.DragEvent) => {
    if (!isEditable) return;
    e.stopPropagation();
    setIsDragging(true);
    e.dataTransfer.setData('text/plain', block.id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = (e: React.DragEvent) => {
    if (!isEditable) return;
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    if (!isEditable) return;
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
    if (!isEditable) return;
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'move';
    
    if (!blockRef.current) return;

    setIsDragOver(true);

    const dropTarget = blockRef.current.getBoundingClientRect();
    const dropPos = e.clientY;
    const dropZoneHeight = dropTarget.height;
    const dropZoneMargin = dropZoneHeight * 0.3; // 30% margin top/bottom

    let newDropPosition: 'before' | 'after' | 'inside' | null = null;
    if (dropPos < dropTarget.top + dropZoneMargin) {
      newDropPosition = 'before';
    } else if (dropPos > dropTarget.bottom - dropZoneMargin) {
      newDropPosition = 'after';
    } else {
      newDropPosition = 'inside';
    }

    if (newDropPosition !== dropPosition) {
      setDropPosition(newDropPosition);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    if (!isEditable) return;
    e.preventDefault();
    e.stopPropagation();
    
    // Only clear if we're actually leaving the element
    if (!blockRef.current?.contains(e.relatedTarget as Node)) {
      setIsDragOver(false);
      setDropPosition(null);
    }
  };

  const predefinedColors = [
    '#ffffff', '#f8fafc', '#f1f5f9', '#e2e8f0', 
    '#fef2f2', '#fef3c7', '#ecfdf5', '#eff6ff',
    '#fdf4ff', '#fef7ff', '#fffbeb', '#f0fdf4'
  ];

  return (
    <div
      ref={blockRef}
      className={`block-preview relative transition-all duration-200 hover:shadow-lg hover:bg-gray-50 hover:border-blue-400 hover:border ${isDragging ? 'opacity-30' : ''}`}
      style={getBlockStyles()}
      draggable={isEditable}
      onDragStart={isEditable ? handleDragStart : undefined}
      onDragEnd={isEditable ? handleDragEnd : undefined}
      onDrop={isEditable ? handleDrop : undefined}
      onDragOver={isEditable ? handleDragOver : undefined}
      onDragLeave={isEditable ? handleDragLeave : undefined}
      onClick={isEditable ? onSelect : undefined}
      onMouseEnter={isEditable && setHoveredBlockId ? () => setHoveredBlockId(block.id) : undefined}
      onMouseLeave={isEditable && setHoveredBlockId ? () => setHoveredBlockId(null) : undefined}
    >
      {/* Drag and drop indicators - only show when editing */}
      {isEditable && isDragOver && (
        <>
          {dropPosition === 'before' && <div className="absolute -top-1 left-0 right-0 h-1.5 bg-blue-500 rounded-full z-20" />}
          {dropPosition === 'after' && <div className="absolute -bottom-1 left-0 right-0 h-1.5 bg-blue-500 rounded-full z-20" />}
          {dropPosition === 'inside' && <div className="absolute inset-0 border-2 border-blue-500 bg-blue-100/50 rounded-lg z-10" />}
        </>
      )}

      {/* Drag Handle - only show when editing */}
      {isEditable && (
        <div 
          className="absolute top-2 left-2 w-4 h-4 bg-gray-300 rounded cursor-move opacity-0 hover:opacity-100 transition-opacity z-30"
          onMouseDown={(e) => {
            e.stopPropagation();
            // This helps ensure the drag starts from the handle
          }}
        />
      )}

      {/* Bubble Menu - only show when editing and hovered */}
      {isEditable && hoveredBlockId === block.id && (
        <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 z-10 bg-white/90 backdrop-blur-sm border border-gray-200 rounded-lg shadow-lg p-2">
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

            {/* Edit Link - Only show for CTA blocks */}
            {block.blockType === 'cta' && block.ctaButtons && block.ctaButtons.length > 0 && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  const button = block.ctaButtons![0];
                  const newUrl = prompt('Enter URL for this button:', button.url);
                  if (newUrl !== null && onUpdate) {
                    // Auto-add https:// if no protocol is specified and it's not a relative link
                    let processedUrl = newUrl;
                    if (newUrl && !newUrl.startsWith('http://') && !newUrl.startsWith('https://') && !newUrl.startsWith('#') && !newUrl.startsWith('/')) {
                      processedUrl = `https://${newUrl}`;
                    }
                    
                    const updatedButtons = block.ctaButtons?.map(b =>
                      b.id === button.id ? { ...b, url: processedUrl } : b
                    );
                    onUpdate({ ...block, ctaButtons: updatedButtons });
                  }
                }}
                title="Edit link"
                className="h-7 w-7 p-0 rounded-md hover:bg-gray-100 transition-colors"
              >
                <Link className="h-3.5 w-3.5" />
              </Button>
            )}

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

      {/* Block Content */}
      <div 
        className="block-content"
        onMouseDown={(e) => {
          // Prevent drag from starting when clicking on content
          if (isEditable) {
            e.stopPropagation();
          }
        }}
      >
        {block.title && (
          <div
            ref={titleRef}
            className={`block-title font-semibold text-lg mb-2 ${
              isEditable 
                ? 'cursor-text hover:bg-gray-50/50 rounded px-1 -mx-1 transition-colors focus:outline-none' 
                : ''
            }`}
            onClick={isEditable ? handleTitleEdit : undefined}
            onBlur={isEditable ? handleBlur : undefined}
            onKeyDown={isEditable ? (e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleBlur();
              }
            } : undefined}
          >
            {block.title}
          </div>
        )}
        
        {block.content && (
          <div
            ref={contentRef}
            className={`block-content ${
              isEditable 
                ? 'cursor-text hover:bg-gray-50/50 rounded px-1 -mx-1 transition-colors focus:outline-none' 
                : ''
            }`}
            onClick={isEditable ? handleContentEdit : undefined}
            onBlur={isEditable ? handleBlur : undefined}
            onKeyDown={isEditable ? (e) => {
              if (e.key === 'Enter' && e.shiftKey) {
                e.preventDefault();
                handleBlur();
              }
            } : undefined}
            dangerouslySetInnerHTML={{ __html: block.content }}
          />
        )}

        {/* Children Blocks */}
        {block.children && block.children.length > 0 && (
          <div className={`block-children mt-2 ${block.style?.layout === 'row' ? 'flex flex-row flex-wrap gap-2' : 'space-y-2'}`}>
            {block.children.map((childBlock) => (
              <BlockPreview
                key={childBlock.id}
                block={childBlock}
                isEditable={isEditable}
                onUpdate={isEditable && onUpdate ? (updatedChild) => {
                  const updatedChildren = block.children?.map(child =>
                    child.id === childBlock.id ? updatedChild : child
                  );
                  onUpdate({ ...block, children: updatedChildren });
                } : undefined}
                onDelete={isEditable && onUpdate ? () => {
                  const updatedChildren = block.children?.filter(child => child.id !== childBlock.id);
                  onUpdate({ ...block, children: updatedChildren });
                } : undefined}
                onDuplicate={isEditable && onUpdate ? () => {
                  const duplicatedChild = {
                    ...childBlock,
                    id: generateUniqueId()
                  };
                  const updatedChildren = [...(block.children || []), duplicatedChild];
                  onUpdate({ ...block, children: updatedChildren });
                } : undefined}
                isSelected={isSelected}
                onSelect={onSelect}
                onDrop={onDrop}
                depth={depth + 1}
                hoveredBlockId={hoveredBlockId}
                setHoveredBlockId={setHoveredBlockId}
              />
            ))}
          </div>
        )}

        {/* CTA Buttons */}
        {block.ctaButtons && block.ctaButtons.length > 0 && (
          <div className="cta-buttons mt-4 flex flex-wrap gap-3 justify-center">
            {block.ctaButtons.map((button) => (
              <div key={button.id} className="relative">
                <a
                  href={button.url}
                  target={button.url.startsWith('http') ? '_blank' : '_self'}
                  rel={button.url.startsWith('http') ? 'noopener noreferrer' : undefined}
                  onClick={(e) => {
                    // Prevent navigation when editing
                    if (isEditable) {
                      e.preventDefault();
                    }
                  }}
                  className={`inline-flex items-center px-6 py-3 rounded-lg font-medium text-sm transition-all duration-200 hover:scale-105 ${
                    button.variant === 'primary' 
                      ? 'bg-blue-600 text-white hover:bg-blue-700' 
                      : button.variant === 'secondary'
                      ? 'bg-gray-600 text-white hover:bg-gray-700'
                      : 'bg-transparent border-2 border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                  style={{
                    backgroundColor: button.style?.bgColor,
                    color: button.style?.textColor,
                    borderColor: button.style?.borderColor,
                  }}
                >
                  {button.text}
                </a>
              </div>
            ))}
          </div>
        )}

        {/* Empty state for blocks without content - only show when editing */}
        {/* {isEditable && !block.title && !block.content && (!block.children || block.children.length === 0) && (!block.ctaButtons || block.ctaButtons.length === 0) && (
          <div 
            className="text-gray-400 italic text-sm cursor-text hover:bg-gray-50/50 rounded px-1 -mx-1 transition-colors focus:outline-none"
            onClick={handleContentEdit}
          >
            Click to edit this block
          </div>
        )} */}
      </div>
    </div>
  );
} 