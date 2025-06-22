'use client';

import * as React from 'react';
import { Block } from '@/lib/types';

interface BlockPreviewProps {
  block: Block;
}

export default function BlockPreview({ block }: BlockPreviewProps) {
  const getBlockStyles = () => {
    const styles: React.CSSProperties = {
      padding: block.style?.padding || '1rem',
      backgroundColor: block.style?.bgColor || 'transparent',
      border: block.style?.borderColor ? `2px solid ${block.style.borderColor}` : 'none',
      borderRadius: block.style?.borderRadius || '0.5rem',
      margin: block.style?.margin || '0.5rem 0',
      textAlign: block.style?.textAlign || 'left',
      width: block.style?.width || '100%',
    };

    if (block.type === 'inline') {
      styles.display = 'inline-block';
      styles.width = 'auto';
      styles.margin = '0.25rem';
    }

    return styles;
  };

  return (
    <div className="block-preview" style={getBlockStyles()}>
      {block.title && (
        <div className="block-title font-semibold text-lg mb-2">
          {block.title}
        </div>
      )}
      
      {block.content && (
        <div 
          className="block-content"
          dangerouslySetInnerHTML={{ __html: block.content }}
        />
      )}

      {/* Children Blocks */}
      {block.children && block.children.length > 0 && (
        <div className={`block-children mt-2 ${block.style?.layout === 'row' ? 'flex flex-row flex-wrap gap-2' : 'space-y-2'}`}>
          {block.children.map((childBlock) => (
            <BlockPreview key={childBlock.id} block={childBlock} />
          ))}
        </div>
      )}
    </div>
  );
} 