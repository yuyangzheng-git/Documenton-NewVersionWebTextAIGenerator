'use client';

import { useState, useEffect, useRef } from 'react';
import { Type, Sparkles } from 'lucide-react';

interface TextSelectionToolbarProps {
  onRewrite: (text: string) => void;
  onFormat: (text: string, format: { bold?: boolean; italic?: boolean; size?: number }) => void;
}

export function TextSelectionToolbar({ onRewrite, onFormat }: TextSelectionToolbarProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [selectedText, setSelectedText] = useState('');
  const toolbarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleSelection = () => {
      const selection = window.getSelection();
      const text = selection?.toString() || '';

      if (text.trim().length > 0) {
        const range = selection?.getRangeAt(0);
        if (range) {
          const rect = range.getBoundingClientRect();
          setPosition({
            x: rect.left + rect.width / 2,
            y: rect.top - 50,
          });
          setSelectedText(text);
          setIsVisible(true);
        }
      } else {
        setIsVisible(false);
      }
    };

    document.addEventListener('mouseup', handleSelection);
    document.addEventListener('keyup', handleSelection);

    return () => {
      document.removeEventListener('mouseup', handleSelection);
      document.removeEventListener('keyup', handleSelection);
    };
  }, []);

  const handleBold = () => {
    onFormat(selectedText, { bold: true });
    setIsVisible(false);
  };

  const handleItalic = () => {
    onFormat(selectedText, { italic: true });
    setIsVisible(false);
  };

  const handleSizeIncrease = () => {
    onFormat(selectedText, { size: 18 });
    setIsVisible(false);
  };

  const handleSizeDecrease = () => {
    onFormat(selectedText, { size: 12 });
    setIsVisible(false);
  };

  const handleRewrite = () => {
    onRewrite(selectedText);
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div
      ref={toolbarRef}
      style={{
        position: 'fixed',
        left: `${position.x}px`,
        top: `${position.y}px`,
        transform: 'translateX(-50%)',
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        border: '1px solid rgba(55, 53, 47, 0.09)',
        padding: '4px',
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        zIndex: 1000,
        animation: 'fadeIn 150ms ease-out',
      }}
    >
      <button
        onClick={handleSizeDecrease}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '32px',
          height: '32px',
          borderRadius: '6px',
          backgroundColor: 'transparent',
          border: 'none',
          cursor: 'pointer',
          color: 'rgba(55, 53, 47, 0.6)',
          transition: 'background 100ms ease-in-out',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = 'rgba(55, 53, 47, 0.08)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'transparent';
        }}
        title="减小字体"
      >
        <Type style={{ width: '16px', height: '16px' }} />
        <span style={{ fontSize: '10px', fontWeight: 600 }}>A-</span>
      </button>

      <button
        onClick={handleSizeIncrease}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '32px',
          height: '32px',
          borderRadius: '6px',
          backgroundColor: 'transparent',
          border: 'none',
          cursor: 'pointer',
          color: 'rgba(55, 53, 47, 0.6)',
          transition: 'background 100ms ease-in-out',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = 'rgba(55, 53, 47, 0.08)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'transparent';
        }}
        title="增大字体"
      >
        <Type style={{ width: '16px', height: '16px' }} />
        <span style={{ fontSize: '14px', fontWeight: 600 }}>A+</span>
      </button>

      <div
        style={{
          width: '1px',
          height: '20px',
          backgroundColor: 'rgba(55, 53, 47, 0.15)',
          margin: '0 4px',
        }}
      />

      <button
        onClick={handleBold}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '32px',
          height: '32px',
          borderRadius: '6px',
          backgroundColor: 'transparent',
          border: 'none',
          cursor: 'pointer',
          color: 'rgba(55, 53, 47, 0.6)',
          transition: 'background 100ms ease-in-out',
          fontWeight: 600,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = 'rgba(55, 53, 47, 0.08)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'transparent';
        }}
        title="加粗"
      >
        B
      </button>

      <button
        onClick={handleItalic}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '32px',
          height: '32px',
          borderRadius: '6px',
          backgroundColor: 'transparent',
          border: 'none',
          cursor: 'pointer',
          color: 'rgba(55, 53, 47, 0.6)',
          transition: 'background 100ms ease-in-out',
          fontStyle: 'italic',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = 'rgba(55, 53, 47, 0.08)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'transparent';
        }}
        title="斜体"
      >
        I
      </button>

      <div
        style={{
          width: '1px',
          height: '20px',
          backgroundColor: 'rgba(55, 53, 47, 0.15)',
          margin: '0 4px',
        }}
      />

      <button
        onClick={handleRewrite}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '6px',
          padding: '0 12px',
          height: '32px',
          borderRadius: '6px',
          background: 'linear-gradient(135deg, #2383E2 0%, #1A6FC4 100%)',
          color: 'white',
          border: 'none',
          cursor: 'pointer',
          fontSize: '13px',
          fontWeight: 500,
          transition: 'opacity 100ms ease-in-out',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.opacity = '0.9';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.opacity = '1';
        }}
        title="AI 重写"
      >
        <Sparkles style={{ width: '14px', height: '14px' }} />
        <span>AI 重写</span>
      </button>

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateX(-50%) translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
