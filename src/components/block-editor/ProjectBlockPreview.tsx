'use client';

import * as React from 'react';
import { BlockProjectData } from '@/lib/types';
import BlockPreview from './BlockPreview';

interface ProjectBlockPreviewProps {
  data: BlockProjectData;
}

export default function ProjectBlockPreview({ data }: ProjectBlockPreviewProps) {
  return (
    <div className="project-block-preview">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold text-center mb-8">{data.projectName}</h1>
        
        <div className="blocks-container space-y-4">
          {data.blocks.map((block) => (
            <BlockPreview key={block.id} block={block} />
          ))}
        </div>
      </div>
    </div>
  );
} 