'use client';

import { ProjectData } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Star, Zap, Target, Sparkles, Rocket, Heart, Download, Share2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

const iconMap = {
  Star,
  Zap,
  Target,
  Sparkles,
  Rocket,
  Heart,
};

interface ProjectPageClientProps {
  project: ProjectData;
}

export function ProjectPageClient({ project }: ProjectPageClientProps) {
  const handleDownload = () => {
    const html = generateStaticHTML(project);
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${project.slug}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: project.projectName,
        text: project.tagline,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('URL copied to clipboard!');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      {/* Floating Action Bar */}
      <div className="fixed top-4 left-4 right-4 z-50 flex justify-between items-center">
        <Link href="/">
          <Button variant="outline" size="sm" className="bg-white/80 backdrop-blur-sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Home
          </Button>
        </Link>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleShare}
            className="bg-white/80 backdrop-blur-sm"
          >
            <Share2 className="h-4 w-4 mr-2" />
            Share
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleDownload}
            className="bg-white/80 backdrop-blur-sm"
          >
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
        </div>
      </div>

      <div className="pt-20 pb-16 px-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-16">
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
              {project.projectName}
            </h1>
            <p className="text-2xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              {project.tagline}
            </p>
          </div>

          {/* Screenshot */}
          {project.screenshot && (
            <div className="mb-16">
              <div className="relative rounded-2xl overflow-hidden shadow-2xl max-w-4xl mx-auto">
                <img 
                  src={project.screenshot} 
                  alt="Project Screenshot" 
                  className="w-full h-auto"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                  }}
                />
              </div>
            </div>
          )}

          {/* Features Bento Grid */}
          {project.features.length > 0 && (
            <div className="mb-16">
              <h2 className="text-3xl font-bold text-center mb-12">Features</h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {project.features.map((feature) => {
                  const IconComponent = iconMap[feature.icon as keyof typeof iconMap] || Star;
                  return (
                    <Card key={feature.id} className="bg-white/90 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
                      <CardHeader>
                        <div className="flex items-center gap-4">
                          <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl">
                            <IconComponent className="h-6 w-6 text-white" />
                          </div>
                          <CardTitle className="text-xl">{feature.title}</CardTitle>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <CardDescription className="text-gray-700 text-base leading-relaxed">
                          {feature.description}
                        </CardDescription>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}

          {/* CTA Section */}
          <div className="text-center">
            <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-12 shadow-2xl max-w-2xl mx-auto">
              <h3 className="text-3xl font-bold mb-6">Ready to get started?</h3>
              <p className="text-gray-700 mb-8 text-lg">
                Join thousands of users who are already transforming their workflow.
              </p>
              <Button 
                size="lg" 
                className="text-xl px-12 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all"
                asChild
              >
                <a href={project.ctaUrl || '#'} target="_blank" rel="noopener noreferrer">
                  {project.ctaText}
                </a>
              </Button>
            </div>
          </div>

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
    </div>
  );
}

function generateStaticHTML(project: ProjectData): string {
  const featuresHTML = project.features.map(feature => `
    <div class="feature-card">
      <div class="feature-icon">⭐</div>
      <h3>${feature.title}</h3>
      <p>${feature.description}</p>
    </div>
  `).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${project.projectName}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, #f3e8ff 0%, #e0f2fe 100%);
      min-height: 100vh;
      padding: 2rem;
    }
    .container { max-width: 1200px; margin: 0 auto; }
    .header { text-align: center; margin-bottom: 4rem; }
    .header h1 { font-size: 3.5rem; color: #1f2937; margin-bottom: 1rem; }
    .header p { font-size: 1.25rem; color: #6b7280; max-width: 800px; margin: 0 auto; }
    .screenshot { margin-bottom: 4rem; text-align: center; }
    .screenshot img { 
      max-width: 100%; height: auto; border-radius: 1rem; 
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
    }
    .features { margin-bottom: 4rem; }
    .features h2 { text-align: center; font-size: 2rem; margin-bottom: 2rem; }
    .features-grid { 
      display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); 
      gap: 2rem; 
    }
    .feature-card { 
      background: rgba(255, 255, 255, 0.9); padding: 2rem; border-radius: 1rem;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
    }
    .feature-icon { font-size: 2rem; margin-bottom: 1rem; }
    .feature-card h3 { font-size: 1.25rem; margin-bottom: 0.5rem; }
    .cta { text-align: center; }
    .cta-card { 
      background: rgba(255, 255, 255, 0.9); padding: 3rem; border-radius: 2rem;
      box-shadow: 0 25px 50px rgba(0, 0, 0, 0.1); max-width: 600px; margin: 0 auto;
    }
    .cta h3 { font-size: 2rem; margin-bottom: 1rem; }
    .cta p { color: #6b7280; margin-bottom: 2rem; }
    .cta-button { 
      display: inline-block; padding: 1rem 2rem; background: linear-gradient(135deg, #3b82f6, #8b5cf6);
      color: white; text-decoration: none; border-radius: 0.5rem; font-weight: 600;
    }
    .footer { text-align: center; margin-top: 4rem; padding-top: 2rem; border-top: 1px solid rgba(255, 255, 255, 0.2); }
  </style>
</head>
<body>
  <div class="container">
    <header class="header">
      <h1>${project.projectName}</h1>
      <p>${project.tagline}</p>
    </header>
    
    ${project.screenshot ? `
    <div class="screenshot">
      <img src="${project.screenshot}" alt="Project Screenshot" />
    </div>
    ` : ''}
    
    ${project.features.length > 0 ? `
    <div class="features">
      <h2>Features</h2>
      <div class="features-grid">
        ${featuresHTML}
      </div>
    </div>
    ` : ''}
    
    <div class="cta">
      <div class="cta-card">
        <h3>Ready to get started?</h3>
        <p>Join thousands of users who are already transforming their workflow.</p>
        <a href="${project.ctaUrl || '#'}" class="cta-button">${project.ctaText}</a>
      </div>
    </div>
    
    <footer class="footer">
      <p>Built with OnePageLaunch</p>
    </footer>
  </div>
</body>
</html>`;
} 