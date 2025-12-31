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
      <header className="border-b px-6 py-3" style={{ borderColor: 'var(--notion-border)' }}>
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="text-xl">📄</div>
            <span className="text-base font-semibold" style={{ color: 'var(--notion-text)' }}>AI Document Generator</span>
          </div>
          <button
            onClick={() => router.push('/editor')}
            className="px-3 py-1.5 text-sm rounded-md hover:bg-[var(--notion-hover)] transition-colors"
            style={{ color: 'var(--notion-text-secondary)' }}
          >
            Open Editor
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-6 py-24">
        {/* Hero Section */}
        <div className="text-center mb-20">
          <h1 className="text-6xl font-bold mb-5" style={{ color: 'var(--notion-text)' }}>
            Transform Ideas Into Documents
          </h1>
          <p className="text-xl" style={{ color: 'var(--notion-text-secondary)' }}>
            Generate structured outlines and content with AI
          </p>
        </div>

        {/* Input Section */}
        <div className="mb-24">
          <div className="mx-auto max-w-2xl flex gap-3 p-3 rounded-full" style={{ borderColor: 'var(--notion-border)' }}>
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleGenerate();
              }}
              placeholder="Describe what you want to write..."
              className="flex-1 px-5 py-3 text-base bg-transparent focus:outline-none"
              style={{ color: 'var(--notion-text)' }}
            />
            <button
              onClick={handleGenerate}
              disabled={!prompt.trim()}
              className="w-12 h-12 rounded-full flex items-center justify-center transition-opacity disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-80"
              style={{ backgroundColor: 'var(--notion-text)', color: 'white' }}
            >
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Templates */}
        <div className="mb-16">
          <h2 className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: 'var(--notion-text-secondary)' }}>
            Templates
          </h2>
          <div className="grid grid-cols-3 gap-4">
            {templates.map((template, index) => (
              <button
                key={index}
                onClick={() => {
                  setPrompt(`Write a ${template.title.toLowerCase()}`);
                }}
                className="p-5 text-left hover:bg-[var(--notion-hover)] transition-all group rounded-xl"
              >
                <template.icon className="w-7 h-7 mb-3 transition-transform group-hover:scale-110" style={{ color: 'var(--notion-text-secondary)' }} />
                <h3 className="font-semibold mb-1.5" style={{ color: 'var(--notion-text)' }}>{template.title}</h3>
                <p className="text-sm" style={{ color: 'var(--notion-text-secondary)' }}>{template.description}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Example Prompts */}
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: 'var(--notion-text-secondary)' }}>
            Examples
          </h2>
          <div className="space-y-2">
            {examplePrompts.map((example, index) => (
              <button
                key={index}
                onClick={() => setPrompt(example)}
                className="w-full flex items-center justify-between p-4 rounded-xl hover:bg-[var(--notion-hover)] transition-all text-left group"
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
