# AI Document Generator

A modern AI-powered document generation tool built with Next.js, featuring Notion-style design, drag-and-drop block management, and real-time AI content generation. Supports exporting to Word documents with multiple professional templates.

## ✨ Features

### 🤖 Core Functionality
- **AI Outline Generation**: Automatically generate structured document outlines from simple prompts
- **Block-Based Editing**: Support for multiple block types (paragraphs, headings, lists, code, quotes, etc.)
- **Slash Commands**: Type `/` to quickly insert different block types
- **Drag-and-Drop Reordering**: Intuitive block-level content management
- **Real-time Content Expansion**: Use AI to expand and enrich content

### 🎨 User Interface
- **Notion-Inspired Design**: Clean, minimalist interface focused on content creation
- **Block-Level Editor**: Notion-like block editing experience
- **Cover Image Support**: Drag-and-drop upload or select cover images
- **Responsive Layout**: Works seamlessly on desktop and tablet devices
- **Dark Mode**: Complete dark theme support

### 📄 Template System
- **5 Preset Templates**:
  - Simple White
  - Simple Dark
  - Business Blue
  - Simple Green
  - Report Gray
- **Template Customization**: Header, footer, background color, fonts, etc.
- **Live Preview**: Instant preview of template effects

### 💾 Export Options
- **Word Export**: Generate `.docx` format documents with template styles
- **Markdown Export**: Save as `.md` files
- **PDF Export**: Generate professional PDF documents
- **Copy to Clipboard**: Quick content sharing

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ installed
- Dify API keys (for AI features, optional)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yuyangzheng-git/Documenton-NewVersionWebTextAIGenerator.git
cd ai-document-generator
```

2. Install dependencies:
```bash
npm install
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3001](http://localhost:3001) in your browser

### Configuration

Before using the AI features, you need to configure your Dify API keys:

1. Click the "Get Started" button on the home page
2. Click the settings icon in the top right corner
3. Enter your Planner API Key and Worker API Key
4. Click "Save API Keys" to apply

## 📖 Usage Guide

### Creating a New Document

1. **Enter Your Idea**: Type your document topic or idea in the search box on the home page
2. **Generate Outline**: Click the arrow button to let AI create an outline for you
3. **Edit Content**: Add, edit, or delete blocks in the Word editor
4. **Press Enter**: Split text at cursor position - content after cursor moves to next block
5. **Drag to Reorder**: Use drag handles to reorder content blocks
6. **Apply Template**: Click the template button to select and apply a Word template
7. **Export Document**: Use the export button to save as Word or PDF

### Block Types

- **Paragraph**: Basic text content
- **Heading**: H1/H2/H3 multi-level headings
- **Bullet List**: Bulleted list
- **Numbered List**: Numbered list
- **Quote**: Quote block style
- **Code**: Code block
- **Divider**: Content separator

### Slash Commands

Type `/` in an empty block to open the command menu and quickly insert different block types.

### Cover Images

1. Click the "Add Cover" button
2. Choose a local image or use an Unsplash random image
3. Drag to adjust image position
4. Click "Remove Cover" to delete the image

## 📁 Project Structure

```
ai-document-generator/
├── app/                      # Next.js app directory
│   ├── word-editor/         # Word editor page
│   │   └── page.tsx
│   └── page.tsx             # Home page
├── components/               # React components
│   ├── NotionBlock.tsx      # Block component with Enter key split functionality
│   └── NotionEditor.tsx     # Editor main component
├── lib/                      # Utility functions
│   ├── export-utils.ts      # Export functionality
│   ├── word-templates.ts    # Word template definitions
│   └── dify-api.ts          # Dify API integration
└── store/                    # Zustand state management
```

## 🛠 Technology Stack

- **Frontend Framework**: Next.js 16, React 19, TypeScript
- **Styling**: Tailwind CSS 4
- **Drag & Drop**: DnD Kit
- **State Management**: Zustand
- **Icons**: Lucide React
- **Export**: docx, html-docx-js-typescript, jsPDF
- **AI Integration**: Dify Workflow API

## 🔐 API Keys Security

⚠️ **Important**: API keys are stored in `localStorage` for development purposes. For production deployment, implement proper backend API proxying and secure key management.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is open source and available under the MIT License.

## 🚀 Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import your repository to Vercel
3. Deploy with default settings

### Other Platforms

This Next.js application can be deployed to any platform that supports Node.js, including:
- Vercel
- Netlify
- Railway
- AWS
- DigitalOcean

## 📝 Changelog

### v0.1.0 (Latest)
- ✅ Complete Notion-style Word editor
- ✅ Implement block-level editor (paragraphs, headings, lists, code, quotes, etc.)
- ✅ Implement Word-like Enter key behavior (split text at cursor position)
- ✅ Auto-resize textareas for multi-line content display
- ✅ Implement Word template system (5 preset templates)
- ✅ Add Slash command menu
- ✅ Implement drag-and-drop sorting
- ✅ Unified design style between home page and editor
- ✅ Support Word document export
- ✅ Optimize button styles (referencing Notion design)
- ✅ Complete dark mode support
