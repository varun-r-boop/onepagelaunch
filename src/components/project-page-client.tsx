'use client';

import { BlockProjectData } from '@/lib/types';
//import { Button } from '@/components/ui/button';
//import { Download, Share2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
//import { toast } from 'sonner';
import ProjectBlockPreview from '@/components/block-editor/ProjectBlockPreview';

interface ProjectPageClientProps {
  project: BlockProjectData;
}

export function ProjectPageClient({ project }: ProjectPageClientProps) {
  // const handleDownload = () => {
  //   const html = generateStaticHTML(project);
  //   const blob = new Blob([html], { type: 'text/html' });
  //   const url = URL.createObjectURL(blob);
  //   const a = document.createElement('a');
  //   a.href = url;
  //   a.download = `${project.slug || 'project'}.html`;
  //   document.body.appendChild(a);
  //   a.click();
  //   document.body.removeChild(a);
  //   URL.revokeObjectURL(url);
  // };

  // const handleShare = () => {
  //   if (navigator.share) {
  //     navigator.share({
  //       title: project.projectName,
  //       text: 'Check out this project!',
  //       url: window.location.href,
  //     });
  //   } else {
  //     navigator.clipboard.writeText(window.location.href);
  //     toast.success('URL copied to clipboard!');
  //   }
  // };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      <div className="pt-20 pb-16">
        <ProjectBlockPreview data={project} />
        
        {/* Footer */}
        <div className="text-center mt-16 pt-12 border-t border-white/20">
          <p className="text-gray-500">
            Built with{' '}
            <Link href="/" className="text-blue-600 hover:text-blue-700 font-medium">
              OnePageLaunch
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

// function generateStaticHTML(project: BlockProjectData): string {
//   // Generate HTML for block-based project
//   const blocksHTML = project.blocks.map(block => {
//     const style = block.style ? `style="${Object.entries(block.style).map(([key, value]) => {
//       const cssKey = key.replace(/([A-Z])/g, '-$1').toLowerCase();
//       if (key === 'bgColor') return `background-color: ${value}`;
//       if (key === 'borderColor') return `border: 2px solid ${value}`;
//       return `${cssKey}: ${value}`;
//     }).join('; ')}"` : '';
    
//     const childrenHTML = block.children?.map(child => {
//       const childStyle = child.style ? `style="${Object.entries(child.style).map(([key, value]) => {
//         const cssKey = key.replace(/([A-Z])/g, '-$1').toLowerCase();
//         if (key === 'bgColor') return `background-color: ${value}`;
//         if (key === 'borderColor') return `border: 2px solid ${value}`;
//         return `${cssKey}: ${value}`;
//       }).join('; ')}"` : '';
      
//       return `
//         <div class="block ${child.type}" ${childStyle}>
//           ${child.title ? `<h3>${child.title}</h3>` : ''}
//           ${child.content ? `<div>${child.content}</div>` : ''}
//         </div>
//       `;
//     }).join('') || '';
    
//     return `
//       <div class="block ${block.type}" ${style}>
//         ${block.title ? `<h2>${block.title}</h2>` : ''}
//         ${block.content ? `<div>${block.content}</div>` : ''}
//         ${childrenHTML ? `<div class="children ${block.style?.layout || 'column'}">${childrenHTML}</div>` : ''}
//       </div>
//     `;
//   }).join('');

//   return `<!DOCTYPE html>
// <html lang="en">
// <head>
//   <meta charset="UTF-8">
//   <meta name="viewport" content="width=device-width, initial-scale=1.0">
//   <title>${project.projectName}</title>
//   <style>
//     * { margin: 0; padding: 0; box-sizing: border-box; }
//     body { 
//       font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
//       background: linear-gradient(135deg, #f3e8ff 0%, #e0f2fe 100%);
//       min-height: 100vh;
//       padding: 2rem;
//     }
//     .container { max-width: 1200px; margin: 0 auto; }
//     .header { text-align: center; margin-bottom: 4rem; }
//     .header h1 { font-size: 3.5rem; color: #1f2937; margin-bottom: 1rem; }
//     .block { margin: 1rem 0; }
//     .block.block { display: block; }
//     .block.inline { display: inline-block; margin: 0.25rem; width: auto; }
//     .children { display: flex; flex-wrap: wrap; gap: 0.5rem; }
//     .children.row { flex-direction: row; }
//     .children.column { flex-direction: column; }
//     .children .block.block { width: 100%; }
//     .children .block.inline { width: auto; }
//   </style>
// </head>
// <body>
//   <div class="container">
//     <div class="header">
//       <h1>${project.projectName}</h1>
//     </div>
//     <div class="blocks">
//       ${blocksHTML}
//     </div>
//   </div>
// </body>
// </html>`;
// } 