'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Code,
  Sparkles,
  Type,
} from 'lucide-react';

interface FormatToolbarProps {
  onBold?: () => void;
  onItalic?: () => void;
  onUnderline?: () => void;
  onStrike?: () => void;
  onCode?: () => void;
  onAI?: () => void;
  onIncreaseSize?: () => void;
  onDecreaseSize?: () => void;
}

export function FormatToolbar({
  onBold,
  onItalic,
  onUnderline,
  onStrike,
  onCode,
  onAI,
  onIncreaseSize,
  onDecreaseSize,
}: FormatToolbarProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const toolbarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleSelection = () => {
      const selection = window.getSelection();
      const text = selection?.toString() || '';

      // Only show if text is selected
      if (text.trim().length > 0) {
        const range = selection?.getRangeAt(0);
        if (range) {
          const rect = range.getBoundingClientRect();
          setPosition({
            x: rect.left + rect.width / 2,
            y: rect.top - 50,
          });
          setIsVisible(true);
        }
      } else {
        setIsVisible(false);
      }
    };

    document.addEventListener('mouseup', handleSelection);
    document.addEventListener('keyup', handleSelection);

    // Hide toolbar when clicking outside
    const handleClickOutside = (event: MouseEvent) => {
      if (toolbarRef.current && !toolbarRef.current.contains(event.target as Node)) {
        const selection = window.getSelection();
        const text = selection?.toString() || '';
        if (text.trim().length === 0) {
          setIsVisible(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('mouseup', handleSelection);
      document.removeEventListener('keyup', handleSelection);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

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
        gap: '2px',
        zIndex: 1000,
        animation: 'fadeIn 150ms ease-out',
      }}
    >
      <ToolbarButton onClick={onDecreaseSize} title="减小字体">
        <Type style={{ width: '14px', height: '14px' }} />
        <span style={{ fontSize: '9px', fontWeight: 600 }}>A-</span>
      </ToolbarButton>

      <ToolbarButton onClick={onIncreaseSize} title="增大字体">
        <Type style={{ width: '14px', height: '14px' }} />
        <span style={{ fontSize: '12px', fontWeight: 600 }}>A+</span>
      </ToolbarButton>

      <Divider />

      <ToolbarButton onClick={onBold} title="加粗 (Ctrl+B)">
        <Bold style={{ width: '14px', height: '14px' }} />
      </ToolbarButton>

      <ToolbarButton onClick={onItalic} title="斜体 (Ctrl+I)">
        <Italic style={{ width: '14px', height: '14px' }} />
      </ToolbarButton>

      <ToolbarButton onClick={onUnderline} title="下划线 (Ctrl+U)">
        <Underline style={{ width: '14px', height: '14px' }} />
      </ToolbarButton>

      <ToolbarButton onClick={onStrike} title="删除线">
        <Strikethrough style={{ width: '14px', height: '14px' }} />
      </ToolbarButton>

      <ToolbarButton onClick={onCode} title="代码">
        <Code style={{ width: '14px', height: '14px' }} />
      </ToolbarButton>

      <Divider />

      <ToolbarButton
        onClick={onAI}
        title="AI 重写"
        isPrimary
      >
        <Sparkles style={{ width: '14px', height: '14px' }} />
        <span style={{ fontSize: '12px', fontWeight: 500 }}>AI</span>
      </ToolbarButton>

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

interface ToolbarButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  title?: string;
  isPrimary?: boolean;
}

function ToolbarButton({ children, onClick, title, isPrimary }: ToolbarButtonProps) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: isPrimary ? '4px' : '0',
        padding: isPrimary ? '0 10px' : '0',
        width: isPrimary ? 'auto' : '28px',
        height: '28px',
        borderRadius: '6px',
        backgroundColor: isPrimary ? 'linear-gradient(135deg, #2383E2 0%, #1A6FC4 100%)' : 'transparent',
        color: isPrimary ? 'white' : 'rgba(55, 53, 47, 0.6)',
        border: 'none',
        cursor: 'pointer',
        transition: 'background 100ms ease-in-out, opacity 100ms ease-in-out',
        fontSize: isPrimary ? '12px' : 'inherit',
        fontWeight: isPrimary ? 500 : 'inherit',
      }}
      onMouseEnter={(e) => {
        if (!isPrimary) {
          e.currentTarget.style.backgroundColor = 'rgba(55, 53, 47, 0.08)';
        } else {
          e.currentTarget.style.opacity = '0.9';
        }
      }}
      onMouseLeave={(e) => {
        if (!isPrimary) {
          e.currentTarget.style.backgroundColor = 'transparent';
        } else {
          e.currentTarget.style.opacity = '1';
        }
      }}
      title={title}
    >
      {children}
    </button>
  );
}

function Divider() {
  return (
    <div
      style={{
        width: '1px',
        height: '18px',
        backgroundColor: 'rgba(55, 53, 47, 0.15)',
        margin: '0 2px',
      }}
    />
  );
}
