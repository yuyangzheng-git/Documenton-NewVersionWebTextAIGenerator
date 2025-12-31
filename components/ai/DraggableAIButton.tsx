'use client';

import { useState, useRef, useEffect } from 'react';
import { Sparkles, X } from 'lucide-react';

interface DraggableAIButtonProps {
  onGenerate: () => void;
  isGenerating: boolean;
}

export function DraggableAIButton({ onGenerate, isGenerating }: DraggableAIButtonProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isOpen, setIsOpen] = useState(false);
  const buttonRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef({ startX: 0, startY: 0, isDragging: false });

  // Initialize position at bottom-right corner
  useEffect(() => {
    const updatePosition = () => {
      setPosition({
        x: window.innerWidth - 80,
        y: window.innerHeight - 80
      });
    };
    updatePosition();
    window.addEventListener('resize', updatePosition);
    return () => window.removeEventListener('resize', updatePosition);
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button')) {
      return; // Don't drag when clicking buttons
    }
    e.preventDefault();
    dragRef.current = {
      startX: e.clientX - position.x,
      startY: e.clientY - position.y,
      isDragging: true
    };
    setIsDragging(true);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!dragRef.current.isDragging) return;

    const newX = e.clientX - dragRef.current.startX;
    const newY = e.clientY - dragRef.current.startY;

    // Keep within viewport bounds
    const maxX = window.innerWidth - 60;
    const maxY = window.innerHeight - 60;

    setPosition({
      x: Math.max(0, Math.min(newX, maxX)),
      y: Math.max(0, Math.min(newY, maxY))
    });
  };

  const handleMouseUp = () => {
    dragRef.current.isDragging = false;
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging]);

  return (
    <div
      ref={buttonRef}
      className="fixed z-50"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        cursor: isDragging ? 'grabbing' : 'grab',
      }}
      onMouseDown={handleMouseDown}
    >
      {isOpen ? (
        // Expanded panel
        <div
          className="bg-white rounded-xl shadow-2xl border p-4 min-w-[280px]"
          style={{
            borderColor: 'var(--notion-border)',
            cursor: 'default'
          }}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4" style={{ color: 'var(--notion-blue)' }} />
              <span className="text-sm font-medium" style={{ color: 'var(--notion-text)' }}>
                AI Assistant
              </span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 rounded hover:bg-[var(--notion-hover)] transition-colors"
              style={{ color: 'var(--notion-text-secondary)' }}
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <p className="text-sm mb-3" style={{ color: 'var(--notion-text-secondary)' }}>
            Click to generate content for all outline blocks
          </p>

          <button
            onClick={() => {
              onGenerate();
              setIsOpen(false);
            }}
            disabled={isGenerating}
            className="w-full px-4 py-2.5 rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              backgroundColor: 'var(--notion-text)',
              color: 'white'
            }}
          >
            {isGenerating ? (
              <span className="flex items-center justify-center gap-2">
                <Sparkles className="w-4 h-4 animate-spin" />
                Generating...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <Sparkles className="w-4 h-4" />
                Generate Content
              </span>
            )}
          </button>
        </div>
      ) : (
        // Collapsed button
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsOpen(true);
          }}
          disabled={isGenerating}
          className="p-4 rounded-full shadow-2xl transition-all hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            backgroundColor: 'var(--notion-text)',
            cursor: 'pointer'
          }}
          title="AI Assistant"
        >
          <Sparkles className={`w-6 h-6 text-white ${isGenerating ? 'animate-spin' : ''}`} />
        </button>
      )}
    </div>
  );
}
