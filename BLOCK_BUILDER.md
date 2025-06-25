# Block-Based Page Builder

This project now uses a modern drag-and-drop block-based builder for creating one-page websites.

## 🏗️ Block System Overview

### Key Concepts
- **Everything is a Block**: All content is structured as blocks
- **Block Types**: 
  - `block`: Full-width, vertical stacking
  - `inline`: Side-by-side layout within containers
- **Nested Blocks**: Blocks can contain other blocks (children)
- **Drag & Drop**: Reorder and nest blocks visually

### Block Properties
```typescript
interface Block {
  id: string;                    // Unique identifier
  type: 'block' | 'inline';      // Layout type
  title?: string;                // Optional title
  content?: string;              // HTML content
  style?: BlockStyle;            // Visual styling
  children?: Block[];            // Nested blocks
}
```

### Block Styles
```typescript
interface BlockStyle {
  borderColor?: string;          // Border color
  bgColor?: string;              // Background color
  padding?: string;              // CSS padding
  margin?: string;               // CSS margin
  borderRadius?: string;         // Border radius
  textAlign?: 'left' | 'center' | 'right';
}
```

## 🎯 Usage

### Getting Started
1. Open the page builder at `/builder`
2. The interface is now exclusively block-based
3. Start building by adding blocks and customizing them

### Block Builder Features

#### Adding Blocks
- Click "Add Block" for full-width blocks
- Click "Add Inline" for side-by-side blocks
- Blocks are added to the end of the current list

#### Editing Blocks
- **Inline Editing**: Click on titles or content to edit directly
- **Bubble Menu**: Hover over blocks to see action buttons:
  - ✏️ Edit title/content
  - 🔄 Toggle block type (block/inline)
  - 🎨 Style block
  - 📋 Duplicate block
  - 🗑️ Delete block

#### Drag & Drop
- Drag blocks to reorder them
- Drop zones appear when dragging:
  - **Blue zones**: Insert before/after
  - **Green zones**: Nest inside (make child)

#### Styling Blocks
- Use the style panel to customize:
  - Background colors
  - Border colors and radius
  - Padding and margins
  - Text alignment

### Example Block Structure
```typescript
{
  projectName: "My Awesome Project",
  blocks: [
    {
      id: "hero-block",
      type: "block",
      title: "🚀 Welcome to My Project",
      content: "This is a powerful tool that helps you build amazing things.",
      style: {
        bgColor: "#f8fafc",
        padding: "2rem",
        textAlign: "center"
      }
    },
    {
      id: "features-block",
      type: "block",
      title: "💡 Key Features",
      style: {
        bgColor: "#ffffff",
        padding: "2rem",
        borderColor: "#e2e8f0"
      },
      children: [
        {
          id: "feature-1",
          type: "inline",
          title: "⚡ Fast Performance",
          content: "Lightning-fast loading times"
        },
        {
          id: "feature-2",
          type: "inline",
          title: "🧱 Modular Design",
          content: "Build with reusable components"
        }
      ]
    }
  ]
}
```

## 🔧 Technical Implementation

### Components
- `Block.tsx`: Individual block component with editing capabilities
- `BlockEditor.tsx`: Main editor with drag-and-drop functionality
- `BlockPreview.tsx`: Read-only block rendering
- `ProjectBlockPreview.tsx`: Full project preview
- `StylePanel.tsx`: Block styling interface

### Data Flow
1. **BuilderClient.tsx**: Manages block-based projects
2. **BlockEditor.tsx**: Handles block operations (add, edit, delete, move)
3. **Block.tsx**: Individual block rendering and interactions
4. **API**: Saves block data to Supabase

### Migration from Form Builder
- The old form-based builder has been completely removed
- All new projects use the block-based system
- Existing form-based projects are no longer supported for editing
- The dashboard only shows block-based projects

## 🎨 Styling

### Block Layout
- **Block type**: `display: block; width: 100%`
- **Inline type**: `display: inline-block; width: auto`
- **Children**: Flex layout with wrapping for inline blocks

### Visual Feedback
- **Hover states**: Show bubble menus and drag handles
- **Selection**: Blue outline for selected blocks
- **Drag states**: Opacity changes during drag operations
- **Drop zones**: Color-coded areas for different drop actions

## 🚀 Future Enhancements

### Planned Features
- [ ] Block templates and presets
- [ ] Advanced styling options (gradients, shadows)
- [ ] Block animations and transitions
- [ ] Media blocks (images, videos, embeds)
- [ ] Code blocks with syntax highlighting
- [ ] Block import/export functionality
- [ ] Collaborative editing
- [ ] Version history and undo/redo

### Potential Improvements
- [ ] Keyboard shortcuts for common actions
- [ ] Block search and filtering
- [ ] Responsive design preview modes
- [ ] Custom block types and components
- [ ] Integration with external design systems 