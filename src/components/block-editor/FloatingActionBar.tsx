'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Type, MousePointer, ChevronUp } from 'lucide-react';
import { Block, CTAButton } from '@/lib/types';

interface FloatingActionBarProps {
  onAddBlock: (block: Block) => void;
}

export default function FloatingActionBar({ onAddBlock }: FloatingActionBarProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const generateUniqueId = () => {
    return `block-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  };

  const generateButtonId = () => {
    return `button-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  };

  const addTextBlock = () => {
    const newBlock: Block = {
      id: generateUniqueId(),
      type: 'block',
      blockType: 'text',
      title: 'New Text Block',
      content: 'Add your content here...',
      style: {
        bgColor: '#ffffff',
        padding: '2rem',
        borderColor: '#e2e8f0',
        textAlign: 'left'
      }
    };
    onAddBlock(newBlock);
    setIsExpanded(false);
  };

  const addCTABlock = () => {
    const defaultButton: CTAButton = {
      id: generateButtonId(),
      text: 'Click Here',
      url: '#',
      variant: 'primary',
      style: {
        bgColor: '#3b82f6',
        textColor: '#ffffff'
      }
    };

    const newBlock: Block = {
      id: generateUniqueId(),
      type: 'block',
      blockType: 'cta',
      style: {
        bgColor: 'transparent',
        padding: '1rem',
        textAlign: 'center'
      },
      ctaButtons: [defaultButton]
    };
    onAddBlock(newBlock);
    setIsExpanded(false);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Expanded Menu */}
      {isExpanded && (
        <div className="absolute bottom-16 right-0 mb-2 bg-white rounded-lg shadow-lg border border-gray-200 p-2 min-w-[200px]">
          <div className="space-y-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={addTextBlock}
              className="w-full justify-start text-sm"
            >
              <Type className="h-4 w-4 mr-2" />
              Text Block
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={addCTABlock}
              className="w-full justify-start text-sm"
            >
              <MousePointer className="h-4 w-4 mr-2" />
              CTA Block
            </Button>
          </div>
        </div>
      )}

      {/* Main Floating Button */}
      <Button
        onClick={() => setIsExpanded(!isExpanded)}
        className={`h-12 w-12 rounded-full shadow-lg bg-blue-600 hover:bg-blue-700 cursor-pointer transition-all duration-200 ${
          isExpanded ? 'rotate-45' : ''
        }`}
        title="Add New Block"
      >
        {isExpanded ? <ChevronUp className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
      </Button>
    </div>
  );
} 