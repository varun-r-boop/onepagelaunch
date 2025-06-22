'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Smile } from 'lucide-react';

interface EmojiPickerProps {
  value: string;
  onChange: (emoji: string) => void;
  className?: string;
}

const commonEmojis = [
  '⭐', '🚀', '⚡', '🎯', '✨', '💡', '🔥', '💎', '🎨', '🔧',
  '🛡️', '📱', '💻', '🌐', '🔒', '📊', '🎮', '🎵', '📚', '🏆',
  '⚙️', '🔍', '📈', '🎪', '🎭', '🎨', '🎬', '🎤', '🎧', '🎼',
  '🏠', '🏢', '🏭', '🏪', '🏫', '🏥', '🏨', '🏰', '⛪', '🕌',
  '🌍', '🌎', '🌏', '🌐', '🌑', '🌒', '🌓', '🌔', '🌕', '🌖'
];

export function EmojiPicker({ value, onChange, className }: EmojiPickerProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={`w-12 h-10 p-0 text-lg ${className}`}
        >
          {value || <Smile className="h-4 w-4" />}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-4" align="start">
        <div className="grid grid-cols-10 gap-2">
          {commonEmojis.map((emoji) => (
            <button
              key={emoji}
              onClick={() => onChange(emoji)}
              className="w-8 h-8 text-lg hover:bg-gray-100 rounded flex items-center justify-center transition-colors"
            >
              {emoji}
            </button>
          ))}
        </div>
        <div className="mt-4 pt-4 border-t">
          <p className="text-sm text-gray-500 mb-2">Or type a custom emoji:</p>
          <input
            type="text"
            placeholder="Enter emoji (e.g., 🎉)"
            className="w-full px-3 py-2 border rounded-md text-sm"
            onChange={(e) => onChange(e.target.value)}
            value={value}
          />
        </div>
      </PopoverContent>
    </Popover>
  );
} 