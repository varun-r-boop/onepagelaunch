'use client';

import * as React from 'react';
import { BlockStyle } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { X } from 'lucide-react';

interface StylePanelProps {
  style: BlockStyle;
  onUpdate: (style: BlockStyle) => void;
  onClose: () => void;
}

export default function StylePanel({ style, onUpdate, onClose }: StylePanelProps) {
  const updateStyle = (key: keyof BlockStyle, value: string) => {
    onUpdate({ ...style, [key]: value });
  };

  return (
    <Card className="w-80">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Block Styles</CardTitle>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="bgColor">Background Color</Label>
          <div className="flex gap-2 mt-1">
            <Input
              id="bgColor"
              value={style.bgColor || ''}
              onChange={(e) => updateStyle('bgColor', e.target.value)}
              placeholder="#ffffff"
            />
            <input
              type="color"
              value={style.bgColor || '#ffffff'}
              onChange={(e) => updateStyle('bgColor', e.target.value)}
              className="w-10 h-10 rounded border"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="borderColor">Border Color</Label>
          <div className="flex gap-2 mt-1">
            <Input
              id="borderColor"
              value={style.borderColor || ''}
              onChange={(e) => updateStyle('borderColor', e.target.value)}
              placeholder="#e2e8f0"
            />
            <input
              type="color"
              value={style.borderColor || '#e2e8f0'}
              onChange={(e) => updateStyle('borderColor', e.target.value)}
              className="w-10 h-10 rounded border"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="padding">Padding</Label>
          <Input
            id="padding"
            value={style.padding || ''}
            onChange={(e) => updateStyle('padding', e.target.value)}
            placeholder="1rem"
          />
        </div>

        <div>
          <Label htmlFor="margin">Margin</Label>
          <Input
            id="margin"
            value={style.margin || ''}
            onChange={(e) => updateStyle('margin', e.target.value)}
            placeholder="0.5rem 0"
          />
        </div>

        <div>
          <Label htmlFor="borderRadius">Border Radius</Label>
          <Input
            id="borderRadius"
            value={style.borderRadius || ''}
            onChange={(e) => updateStyle('borderRadius', e.target.value)}
            placeholder="0.5rem"
          />
        </div>

        <div>
          <Label htmlFor="width">Width</Label>
          <div className="flex gap-2 mt-1">
            <Input
              id="width"
              value={style.width || ''}
              onChange={(e) => updateStyle('width', e.target.value)}
              placeholder="100% or 300px or auto"
            />
            <select
              value={style.width || '100%'}
              onChange={(e) => updateStyle('width', e.target.value)}
              className="p-2 border rounded-md text-sm min-w-20"
            >
              <option value="auto">Auto</option>
              <option value="25%">25%</option>
              <option value="50%">50%</option>
              <option value="75%">75%</option>
              <option value="100%">100%</option>
            </select>
          </div>
        </div>

        <div>
          <Label htmlFor="textAlign">Text Align</Label>
          <select
            id="textAlign"
            value={style.textAlign || 'left'}
            onChange={(e) => updateStyle('textAlign', e.target.value as 'left' | 'center' | 'right')}
            className="w-full p-2 border rounded-md"
          >
            <option value="left">Left</option>
            <option value="center">Center</option>
            <option value="right">Right</option>
          </select>
        </div>
      </CardContent>
    </Card>
  );
} 