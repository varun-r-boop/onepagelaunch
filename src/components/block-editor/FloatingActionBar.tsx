'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Type, MousePointer, ChevronUp, Star, Grid3X3, DollarSign, MessageSquare, HelpCircle } from 'lucide-react';
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

  const addHeroBlock = () => {
    const defaultButton: CTAButton = {
      id: generateButtonId(),
      text: 'Get Started',
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
      blockType: 'hero',
      title: '🚀 Hero Title',
      content: 'Compelling hero description that captures attention and explains your value proposition.',
      style: {
        bgColor: '#f8fafc',
        padding: '4rem',
        textAlign: 'center'
      },
      ctaButtons: [defaultButton]
    };
    onAddBlock(newBlock);
    setIsExpanded(false);
  };

  const addFeatureBlock = () => {
    const featureCard1: Block = {
      id: generateUniqueId(),
      type: 'block',
      blockType: 'text',
      title: '⚡ Plug & Play',
      content: 'Add a single JS snippet to enable glossary tooltips across your site.',
      style: {
        bgColor: '#eff6ff',
        padding: '2rem',
        borderRadius: '0.75rem',
        textAlign: 'center'
      }
    };

    const featureCard2: Block = {
      id: generateUniqueId(),
      type: 'block',
      blockType: 'text',
      title: '🧠 AI-Powered',
      content: 'Uses OpenAI to auto-generate human-friendly definitions.',
      style: {
        bgColor: '#fdf2f8',
        padding: '2rem',
        borderRadius: '0.75rem',
        textAlign: 'center'
      }
    };

    const featureCard3: Block = {
      id: generateUniqueId(),
      type: 'block',
      blockType: 'text',
      title: '🎨 Customizable',
      content: 'Style your tooltips to match your brand and UX perfectly.',
      style: {
        bgColor: '#fef3f2',
        padding: '2rem',
        borderRadius: '0.75rem',
        textAlign: 'center'
      }
    };

    const newBlock: Block = {
      id: generateUniqueId(),
      type: 'block',
      blockType: 'features',
      title: '🧱 Features',
      content: 'Discover what makes us different',
      style: {
        bgColor: '#ffffff',
        padding: '3rem',
        textAlign: 'center',
        layout: 'column'
      },
      children: [featureCard1, featureCard2, featureCard3]
    };
    onAddBlock(newBlock);
    setIsExpanded(false);
  };

  const addPricingBlock = () => {
    const freeCard: Block = {
      id: generateUniqueId(),
      type: 'block',
      blockType: 'text',
      title: 'Free',
      content: '1 domain, Word Wizard branding',
      style: {
        bgColor: '#f8fafc',
        padding: '2rem',
        borderRadius: '0.75rem',
        borderColor: '#e2e8f0',
        textAlign: 'center'
      }
    };

    const proButton: CTAButton = {
      id: generateButtonId(),
      text: 'Get Started',
      url: '#',
      variant: 'primary',
      style: {
        bgColor: '#8b5cf6',
        textColor: '#ffffff'
      }
    };

    const proCard: Block = {
      id: generateUniqueId(),
      type: 'block',
      blockType: 'text',
      title: 'Pro – $5/site',
      content: 'No branding, full customization, analytics',
      style: {
        bgColor: '#faf5ff',
        padding: '2rem',
        borderRadius: '0.75rem',
        borderColor: '#8b5cf6',
        textAlign: 'center'
      },
      ctaButtons: [proButton]
    };

    const newBlock: Block = {
      id: generateUniqueId(),
      type: 'block',
      blockType: 'pricing',
      title: '💰 Pricing',
      content: 'Choose the perfect plan for your needs',
      style: {
        bgColor: '#ffffff',
        padding: '3rem',
        textAlign: 'center',
        layout: 'row'
      },
      children: [freeCard, proCard]
    };
    onAddBlock(newBlock);
    setIsExpanded(false);
  };

  const addTestimonialBlock = () => {
    const testimonial1: Block = {
      id: generateUniqueId(),
      type: 'block',
      blockType: 'text',
      title: '',
      content: '"This helped my users understand our API docs without leaving the page."\n\n– Dev at DocuWave',
      style: {
        bgColor: '#f8fafc',
        padding: '2rem',
        borderRadius: '0.75rem',
        textAlign: 'left'
      }
    };

    const testimonial2: Block = {
      id: generateUniqueId(),
      type: 'block',
      blockType: 'text',
      title: '',
      content: '"I just dropped in one line of JS and boom – instant glossary on our blog!"\n\n– Indie Hacker B',
      style: {
        bgColor: '#f8fafc',
        padding: '2rem',
        borderRadius: '0.75rem',
        textAlign: 'left'
      }
    };

    const newBlock: Block = {
      id: generateUniqueId(),
      type: 'block',
      blockType: 'testimonial',
      title: '💬 Testimonials',
      content: 'What our customers say',
      style: {
        bgColor: '#ffffff',
        padding: '3rem',
        textAlign: 'center',
        layout: 'row'
      },
      children: [testimonial1, testimonial2]
    };
    onAddBlock(newBlock);
    setIsExpanded(false);
  };

  const addFaqBlock = () => {
    const faq1: Block = {
      id: generateUniqueId(),
      type: 'block',
      blockType: 'text',
      title: 'How easy is it to set up?',
      content: 'Simply add one line of JavaScript to your website and you\'re ready to go. No complex configuration required.',
      style: {
        bgColor: '#f8fafc',
        padding: '1.5rem',
        borderRadius: '0.5rem',
        borderColor: '#e2e8f0',
        textAlign: 'left'
      }
    };

    const faq2: Block = {
      id: generateUniqueId(),
      type: 'block',
      blockType: 'text',
      title: 'Can I customize the appearance?',
      content: 'Yes! You can fully customize colors, fonts, positioning, and animations to match your brand perfectly.',
      style: {
        bgColor: '#f8fafc',
        padding: '1.5rem',
        borderRadius: '0.5rem',
        borderColor: '#e2e8f0',
        textAlign: 'left'
      }
    };

    const faq3: Block = {
      id: generateUniqueId(),
      type: 'block',
      blockType: 'text',
      title: 'What about performance impact?',
      content: 'Our lightweight script has minimal impact on your site\'s performance. It loads asynchronously and uses smart caching.',
      style: {
        bgColor: '#f8fafc',
        padding: '1.5rem',
        borderRadius: '0.5rem',
        borderColor: '#e2e8f0',
        textAlign: 'left'
      }
    };

    const faq4: Block = {
      id: generateUniqueId(),
      type: 'block',
      blockType: 'text',
      title: 'Do you offer support?',
      content: 'Absolutely! We provide email support for all users, with priority support for Pro subscribers.',
      style: {
        bgColor: '#f8fafc',
        padding: '1.5rem',
        borderRadius: '0.5rem',
        borderColor: '#e2e8f0',
        textAlign: 'left'
      }
    };

    const newBlock: Block = {
      id: generateUniqueId(),
      type: 'block',
      blockType: 'faq',
      title: '❓ Frequently Asked Questions',
      content: 'Find answers to common questions about our product',
      style: {
        bgColor: '#ffffff',
        padding: '3rem',
        textAlign: 'left',
        layout: 'column'
      },
      children: [faq1, faq2, faq3, faq4]
    };
    onAddBlock(newBlock);
    setIsExpanded(false);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Expanded Menu */}
      {isExpanded && (
        <div className="absolute bottom-16 right-0 mb-2 bg-white rounded-lg shadow-lg border border-gray-200 p-2 min-w-[200px] max-h-[400px] overflow-y-auto">
          <div className="space-y-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={addHeroBlock}
              className="w-full justify-start text-sm"
            >
              <Star className="h-4 w-4 mr-2" />
              Hero Block
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={addFeatureBlock}
              className="w-full justify-start text-sm"
            >
              <Grid3X3 className="h-4 w-4 mr-2" />
              Feature Block
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={addPricingBlock}
              className="w-full justify-start text-sm"
            >
              <DollarSign className="h-4 w-4 mr-2" />
              Pricing Block
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={addTestimonialBlock}
              className="w-full justify-start text-sm"
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              Testimonial Block
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={addFaqBlock}
              className="w-full justify-start text-sm"
            >
              <HelpCircle className="h-4 w-4 mr-2" />
              FAQ Block
            </Button>
            <div className="border-t border-gray-200 my-1"></div>
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
        className={`h-12 w-12 rounded-full shadow-lg bg-blue-600 hover:bg-blue-700 transition-all duration-200 ${
          isExpanded ? 'rotate-45' : ''
        }`}
        title="Add New Block"
      >
        {isExpanded ? <ChevronUp className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
      </Button>
    </div>
  );
} 