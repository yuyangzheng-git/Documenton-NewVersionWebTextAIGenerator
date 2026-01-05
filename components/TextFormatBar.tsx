'use client';

import { useRef, useEffect } from 'react';
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Code2,
  AlignLeft,
  AlignCenter,
  AlignRight,
  List,
  ListOrdered,
  Quote,
  Minus,
  Link2,
  Highlighter,
  Eraser,
  Palette,
} from 'lucide-react';

interface TextFormatBarProps {
  x: number;
  y: number;
  visible: boolean;
  onClose: () => void;
  onFormat: (format: string) => void;
}

const formatGroups = [
  {
    items: [
      { icon: Bold, label: '粗体', format: 'bold' },
      { icon: Italic, label: '斜体', format: 'italic' },
      { icon: Underline, label: '下划线', format: 'underline' },
      { icon: Strikethrough, label: '删除线', format: 'strike' },
    ],
  },
  {
    items: [
      { icon: Code2, label: '代码', format: 'code' },
      { icon: Link2, label: '链接', format: 'link' },
    ],
  },
  {
    items: [
      { icon: AlignLeft, label: '左对齐', format: 'align-left' },
      { icon: AlignCenter, label: '居中', format: 'align-center' },
      { icon: AlignRight, label: '右对齐', format: 'align-right' },
    ],
  },
  {
    items: [
      { icon: List, label: '无序列表', format: 'bullet' },
      { icon: ListOrdered, label: '有序列表', format: 'numbered' },
      { icon: Quote, label: '引用', format: 'quote' },
      { icon: Minus, label: '分割线', format: 'divider' },
    ],
  },
  {
    items: [
      { icon: Highlighter, label: '高亮', format: 'highlight' },
      { icon: Palette, label: '颜色', format: 'color' },
      { icon: Eraser, label: '清除格式', format: 'clear' },
    ],
  },
];

export function TextFormatBar({ x, y, visible, onClose, onFormat }: TextFormatBarProps) {
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (barRef.current && !barRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (visible) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [visible, onClose]);

  if (!visible) return null;

  return (
    <div
      ref={barRef}
      className="fixed bg-white rounded-xl shadow-2xl border overflow-hidden z-50 transform transition-all duration-150 ease-out"
      style={{
        left: `${x}px`,
        top: `${y - 10}px`,
        transform: 'translateY(-100%)',
        backgroundColor: 'var(--notion-bg-secondary)',
        borderColor: 'var(--notion-border)',
      }}
    >
      <div className="p-1">
        {formatGroups.map((group, groupIndex) => (
          <div
            key={groupIndex}
            className="flex gap-0.5"
            style={
              groupIndex > 0 ? { marginTop: '4px', paddingTop: '4px', borderTop: '1px solid var(--notion-border)' } : {}
            }
          >
            {group.items.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.format}
                  onClick={() => onFormat(item.format)}
                  className="p-2 rounded-lg transition-all hover:bg-[rgba(55,53,47,0.08)] group/btn"
                  style={{ color: 'var(--notion-text)' }}
                  title={item.label}
                >
                  <Icon className="w-4 h-4" />
                  <span className="sr-only">{item.label}</span>
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
