# AI Document Generator

A modern AI-powered document generation tool built with Next.js, featuring Notion-style design, drag-and-drop outline management, and real-time AI content generation.

## Features

### Core Functionality
- **AI-Powered Outline Generation**: Automatically generate structured document outlines from simple prompts
- **Hierarchical Content Creation**: Support for multiple heading levels with automatic numbering
- **Real-time Content Expansion**: Expand sections with AI-generated content
- **Drag-and-Drop Reordering**: Intuitive outline management using DnD Kit

### User Interface
- **Notion-Inspired Design**: Clean, minimalist interface with focus on content
- **Rich Text Editor**: Powered by Tiptap for advanced editing capabilities
- **Draggable AI Chat Panel**: Floating AI assistant that can be moved around the screen
- **Responsive Layout**: Works seamlessly on desktop and tablet devices

### Export Options
- **Markdown Export**: Save documents as `.md` files
- **PDF Export**: Generate professional PDF documents
- **Copy to Clipboard**: Quick content sharing

## Getting Started

### Prerequisites
- Node.js 18+ installed
- Dify API keys (Planner and Worker)

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
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

4. Open [http://localhost:3000](http://localhost:3000) in your browser

### Configuration

Before using the AI features, you need to configure your Dify API keys:

1. Click the "Open Editor" button on the home page
2. Click the settings icon in the top right corner
3. Enter your Planner API Key and Worker API Key
4. Click "Save API Keys" to apply

## Usage

### Creating a New Document

1. **Enter Your Idea**: Type your document topic or idea in the search box on the home page
2. **Generate Outline**: Click the arrow button to let AI create an outline for you
3. **Customize Structure**: Add, edit, or delete outline sections as needed
4. **Drag to Reorder**: Use the grip handles to drag and reorder sections
5. **Generate Content**: Click the "Generate" button on any section to expand it with AI content
6. **Export**: Use the export button to save your document as Markdown or PDF

### Using the AI Chat Panel

- Click the AI button in the bottom right corner to open the chat panel
- Drag the header to reposition the panel anywhere on screen
- Ask questions about your document or get writing assistance
- Close the panel by clicking the X button

## Project Structure

```
ai-document-generator/
├── app/                 # Next.js app directory
│   ├── editor/         # Main editor page
│   └── page.tsx        # Home page
├── components/         # React components
│   ├── ai/            # AI chat components
│   ├── editor/        # Rich text editor components
│   ├── outline/       # Outline tree components
│   └── settings/      # API key settings
├── lib/               # Utility functions
│   ├── dify-api.ts    # Dify API integration
│   └── export-utils.ts # Export functionality
├── store/             # Zustand state management
└── types/             # TypeScript type definitions
```

## Technology Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS
- **Editor**: Tiptap
- **Drag & Drop**: DnD Kit
- **State Management**: Zustand
- **Icons**: Lucide React
- **AI Integration**: Dify Workflow API

## API Keys Security

⚠️ **Important**: API keys are stored in `localStorage` for development purposes. For production deployment, implement proper backend API proxying and secure key management.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is open source and available under the MIT License.

## Deployment

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
