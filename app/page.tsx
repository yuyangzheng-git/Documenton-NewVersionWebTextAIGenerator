'use client';

import { useState } from 'react';
import { ArrowRight, FileText, BookOpen, Zap } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();
  const [prompt, setPrompt] = useState('');

  const handleGenerate = () => {
    if (!prompt.trim()) return;
    localStorage.setItem('documentPrompt', prompt);
    router.push('/editor');
  };

  const templates = [
    { icon: FileText, title: 'Article', description: 'Write a blog post or article' },
    { icon: BookOpen, title: 'Report', description: 'Create a professional report' },
    { icon: Zap, title: 'Tutorial', description: 'Step-by-step guide' },
  ];

  const examplePrompts = [
    'Write an introduction to artificial intelligence',
    'Create a product launch announcement',
    'Explain the benefits of remote work',
  ];

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--notion-bg)' }}>
      {/* Header - Minimal Notion style */}
      <header className="px-8 py-4" style={{ borderBottom: '1px solid var(--notion-border)' }}>
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="text-lg">📄</div>
            <span className="text-sm font-medium" style={{ color: 'var(--notion-text)' }}>AI Document Generator</span>
          </div>
          <button
            onClick={() => router.push('/editor')}
            className="px-3 py-1.5 text-sm rounded hover:bg-[var(--notion-gray-hover)] transition-colors"
            style={{ color: 'var(--notion-text-secondary)' }}
          >
            New page
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-8 py-20">
        {/* Hero Section - Notion page style */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4" style={{ color: 'var(--notion-text)' }}>
            Transform Ideas Into Documents
          </h1>
          <p className="text-base" style={{ color: 'var(--notion-text-secondary)', lineHeight: '1.7' }}>
            Generate structured outlines and content with AI
          </p>
        </div>

        {/* Input Section - Notion style */}
        <div className="mb-16">
          <div
            className="w-full px-4 py-2.5 border rounded-sm"
            style={{
              borderColor: 'transparent',
              transition: 'all 0.15s ease'
            }}
          >
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleGenerate();
              }}
              placeholder="Describe what you want to write..."
              className="w-full text-base bg-transparent focus:outline-none"
              style={{
                color: 'var(--notion-text)',
                caretColor: 'var(--notion-blue)'
              }}
            />
          </div>
          {prompt && (
            <div className="mt-2 flex items-center gap-2">
              <button
                onClick={handleGenerate}
                className="px-3 py-1.5 text-sm rounded hover:bg-[var(--notion-gray-hover)] transition-colors"
                style={{ color: 'var(--notion-blue)' }}
              >
                Generate
              </button>
              <button
                onClick={() => setPrompt('')}
                className="px-3 py-1.5 text-sm rounded hover:bg-[var(--notion-gray-hover)] transition-colors"
                style={{ color: 'var(--notion-text-secondary)' }}
              >
                Cancel
              </button>
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="my-12" style={{ borderTop: '1px solid var(--notion-border)' }} />

        {/* Templates - Notion list style */}
        <div className="mb-12">
          <h2 className="text-sm font-medium mb-4" style={{ color: 'var(--notion-text)' }}>
            Templates
          </h2>
          <div className="space-y-1">
            {templates.map((template, index) => (
              <button
                key={index}
                onClick={() => {
                  setPrompt(`Write a ${template.title.toLowerCase()}`);
                }}
                className="w-full flex items-center gap-3 px-3 py-2 rounded hover:bg-[var(--notion-gray-hover)] transition-colors group text-left"
              >
                <template.icon className="w-4 h-4 transition-transform group-hover:scale-110" style={{ color: 'var(--notion-text-secondary)' }} />
                <span className="text-sm" style={{ color: 'var(--notion-text)' }}>{template.title}</span>
                <span className="text-xs" style={{ color: 'var(--notion-text-secondary)' }}>{template.description}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Example Prompts - Notion list style */}
        <div>
          <h2 className="text-sm font-medium mb-4" style={{ color: 'var(--notion-text)' }}>
            Example prompts
          </h2>
          <div className="space-y-1">
            {examplePrompts.map((example, index) => (
              <button
                key={index}
                onClick={() => setPrompt(example)}
                className="w-full flex items-center justify-between px-3 py-2 rounded hover:bg-[var(--notion-gray-hover)] transition-colors group text-left"
              >
                <span className="text-sm" style={{ color: 'var(--notion-text)' }}>{example}</span>
                <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: 'var(--notion-text-secondary)' }} />
              </button>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
