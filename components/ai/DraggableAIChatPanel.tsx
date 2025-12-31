'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Bot, User, Loader2, GripHorizontal, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DraggableAIChatPanelProps {
  onClose: () => void;
}

interface Position {
  x: number;
  y: number;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

export function DraggableAIChatPanel({ onClose }: DraggableAIChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Hi! I\'m your AI writing assistant. How can I help you today?',
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [position, setPosition] = useState<Position>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // Initialize position to bottom right
  useEffect(() => {
    setPosition({ x: window.innerWidth - 400, y: window.innerHeight - 650 });
  }, []);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.no-drag')) return;
    setIsDragging(true);
    const rect = panelRef.current?.getBoundingClientRect();
    if (rect) {
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    }
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (isDragging) {
      const newX = e.clientX - dragOffset.x;
      const newY = e.clientY - dragOffset.y;

      // Keep panel within viewport bounds
      const maxX = window.innerWidth - 384;
      const maxY = window.innerHeight - 50;

      setPosition({
        x: Math.max(0, Math.min(newX, maxX)),
        y: Math.max(0, Math.min(newY, maxY)),
      });
    }
  }, [isDragging, dragOffset]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    } else {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    // Simulate AI response
    setTimeout(() => {
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'I\'m here to help! Let me know what you need assistance with - whether it\'s brainstorming ideas, refining your content, or answering questions about your document.',
      };
      setMessages((prev) => [...prev, aiMessage]);
      setIsLoading(false);
    }, 1000);
  };

  return (
    <div
      ref={panelRef}
      className="fixed z-50 flex flex-col transition-shadow duration-200"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: '384px',
        height: '600px',
      }}
      onMouseDown={handleMouseDown}
    >
      <div className={cn(
        'bg-white rounded shadow-xl flex flex-col h-full',
        isDragging && 'shadow-2xl scale-105'
      )} style={{ border: '1px solid var(--notion-border)' }}>
        {/* Draggable Header */}
        <div className="px-3 py-2 flex items-center justify-between cursor-move" style={{ borderBottom: '1px solid var(--notion-border)' }}>
          <div className="flex items-center gap-2">
            <GripHorizontal className="w-4 h-4" style={{ color: 'var(--notion-text-tertiary)' }} />
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded flex items-center justify-center" style={{ backgroundColor: 'var(--notion-blue)' }}>
                <Bot className="w-3 h-3 text-white" />
              </div>
              <span className="text-xs font-medium" style={{ color: 'var(--notion-text)' }}>AI Assistant</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-[var(--notion-gray-hover)] transition-colors no-drag"
            style={{ color: 'var(--notion-text-secondary)' }}
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-3 space-y-3">
          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                'flex gap-2',
                message.role === 'user' && 'flex-row-reverse'
              )}
            >
              <div
                className={cn(
                  'w-5 h-5 rounded flex items-center justify-center flex-shrink-0',
                  message.role === 'user' ? 'bg-gray-300' : '',
                  message.role === 'assistant' ? '' : 'bg-transparent'
                )}
                style={message.role === 'assistant' ? { backgroundColor: 'var(--notion-blue)' } : {}}
              >
                {message.role === 'user' ? (
                  <User className="w-3 h-3" style={{ color: 'var(--notion-text)' }} />
                ) : (
                  <Bot className="w-3 h-3 text-white" />
                )}
              </div>
              <div
                className={cn(
                  'max-w-[80%] px-2.5 py-1.5 text-sm leading-relaxed',
                  message.role === 'user'
                    ? 'bg-gray-200 rounded'
                    : 'bg-[var(--notion-bg-secondary)] rounded'
                )}
                style={{
                  color: 'var(--notion-text)',
                  boxShadow: message.role === 'assistant' ? '0 1px 2px rgba(0,0,0,0.04)' : 'none'
                }}
              >
                <p>{message.content}</p>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex gap-2">
              <div className="w-5 h-5 rounded flex items-center justify-center" style={{ backgroundColor: 'var(--notion-blue)' }}>
                <Bot className="w-3 h-3 text-white" />
              </div>
              <div className="px-2.5 py-1.5 rounded" style={{ backgroundColor: 'var(--notion-bg-secondary)' }}>
                <Loader2 className="w-3.5 h-3.5 animate-spin" style={{ color: 'var(--notion-text-secondary)' }} />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-2 no-drag" style={{ borderTop: '1px solid var(--notion-border)' }}>
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Ask AI..."
              className="flex-1 px-3 py-1.5 bg-transparent text-sm focus:outline-none rounded"
              style={{
                color: 'var(--notion-text)',
                caretColor: 'var(--notion-blue)'
              }}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className="p-1.5 rounded hover:bg-[var(--notion-gray-hover)] transition-colors no-drag"
              style={{ color: !input.trim() || isLoading ? 'var(--notion-text-tertiary)' : 'var(--notion-blue)' }}
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
