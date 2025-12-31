'use client';

import { useState } from 'react';
import { useStore } from '@/store/useStore';
import { generateOutline } from '@/store/useDocumentActions';
import { Sparkles, Play, Lock } from 'lucide-react';
import { OutlineTree } from './OutlineTree';

export function OutlinePanel() {
  const [prompt, setPrompt] = useState('');
  const [isGeneratingOutline, setIsGeneratingOutline] = useState(false);
  const { outline, isGenerating, setIsGenerating } = useStore();

  const handleGenerateOutline = async () => {
    if (!prompt.trim()) return;
    setIsGeneratingOutline(true);
    try {
      await generateOutline(prompt);
    } catch (error) {
      console.error('Failed to generate outline:', error);
      alert('Failed to generate outline. Please check your API key.');
    }
    setIsGeneratingOutline(false);
  };

  const handleStartWriting = async () => {
    if (outline.length === 0) {
      alert('Please generate an outline first.');
      return;
    }
    setIsGenerating(true);
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b" style={{ borderColor: 'var(--notion-border)' }}>
        <h2 className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: 'var(--notion-text-secondary)' }}>
          Outline
        </h2>

        {/* Prompt Input */}
        <div className="relative">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe what you want to write..."
            className="w-full p-3 pr-10 text-sm bg-white border rounded-md focus:outline-none resize-none transition-all placeholder-[var(--notion-text-secondary)]"
            style={{
              color: 'var(--notion-text)',
              borderColor: 'var(--notion-border)'
            }}
            rows={3}
            disabled={isGeneratingOutline || isGenerating}
          />
          <button
            onClick={handleGenerateOutline}
            disabled={!prompt.trim() || isGeneratingOutline || isGenerating}
            className="absolute right-2 bottom-2 p-2 bg-[var(--notion-text)] text-white rounded-md hover:opacity-80 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
            title="Generate Outline"
          >
            <Sparkles className={`w-4 h-4 ${isGeneratingOutline ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Outline Tree */}
      <div className="flex-1 overflow-y-auto p-3">
        <OutlineTree />
      </div>

      {/* Footer */}
      <div className="p-4 border-t" style={{ borderColor: 'var(--notion-border)' }}>
        <button
          onClick={handleStartWriting}
          disabled={outline.length === 0 || isGenerating}
          className="w-full py-2.5 px-4 rounded-md font-medium flex items-center justify-center gap-2 transition-opacity bg-[var(--notion-text)] text-white hover:opacity-80 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {isGenerating ? (
            <>
              <Lock className="w-4 h-4" />
              Writing...
            </>
          ) : (
            <>
              <Play className="w-4 h-4 fill-current" />
              Start Writing
            </>
          )}
        </button>
      </div>
    </div>
  );
}
