import { ProjectFormData } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Star, Zap, Target, Sparkles, Rocket, Heart } from 'lucide-react';

interface ProjectPreviewProps {
  data: ProjectFormData;
}

const iconMap = {
  Star,
  Zap,
  Target,
  Sparkles,
  Rocket,
  Heart,
};

export function ProjectPreview({ data }: ProjectPreviewProps) {
  const { projectName, tagline, features, ctaText, ctaUrl, screenshot } = data;

  return (
    <div className="w-full bg-gradient-to-br from-purple-50 to-blue-50 p-8 min-h-[600px]">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            {projectName || 'Your Project Name'}
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
            {tagline || 'A compelling tagline that describes what your project does and why people should care about it.'}
          </p>
        </div>

        {/* Screenshot */}
        {screenshot && (
          <div className="mb-12">
            <div className="relative rounded-lg overflow-hidden shadow-2xl">
              <img 
                src={screenshot} 
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
        {features.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-center mb-8">Features</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((feature, index) => {
                const IconComponent = iconMap[feature.icon as keyof typeof iconMap] || Star;
                return (
                  <Card key={index} className="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-shadow">
                    <CardHeader>
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
                          <IconComponent className="h-5 w-5 text-white" />
                        </div>
                        <CardTitle className="text-lg">{feature.title}</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <CardDescription className="text-gray-600">
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
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg">
            <h3 className="text-2xl font-bold mb-4">Ready to get started?</h3>
            <p className="text-gray-600 mb-6">
              Join thousands of users who are already using our platform.
            </p>
            <Button 
              size="lg" 
              className="text-lg px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              asChild
            >
              <a href={ctaUrl || '#'} target="_blank" rel="noopener noreferrer">
                {ctaText || 'Get Started'}
              </a>
            </Button>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-12 pt-8 border-t border-gray-200">
          <p className="text-sm text-gray-500">
            Built with 🧱 OnePageLaunch
          </p>
        </div>
      </div>
    </div>
  );
} 