'use client';

import { useState, useRef, useEffect } from 'react';
import { MessageSquare, Send, X, Minus, Maximize2, Loader2 } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface AIChatProps {
  onRewriteText?: (text: string) => void;
}

export function AIChat({ onRewriteText }: AIChatProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    // Simulate AI response (replace with actual API call)
    setTimeout(() => {
      const aiMessage: Message = {
        role: 'assistant',
        content: `I understand you want: "${userMessage.content}". This is a simulated response. Connect to an actual AI API to get real responses.`
      };
      setMessages(prev => [...prev, aiMessage]);
      setIsLoading(false);
    }, 1000);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #2383E2 0%, #1A6FC4 100%)',
          color: 'white',
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 12px rgba(35, 131, 226, 0.4)',
          transition: 'transform 150ms ease-in-out, box-shadow 150ms ease-in-out',
          zIndex: 100,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'scale(1.05)';
          e.currentTarget.style.boxShadow = '0 6px 16px rgba(35, 131, 226, 0.5)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
          e.currentTarget.style.boxShadow = '0 4px 12px rgba(35, 131, 226, 0.4)';
        }}
      >
        <MessageSquare style={{ width: '24px', height: '24px' }} />
      </button>
    );
  }

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        width: isMinimized ? '300px' : '400px',
        height: isMinimized ? 'auto' : '500px',
        backgroundColor: 'white',
        borderRadius: '16px',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
        border: '1px solid rgba(55, 53, 47, 0.09)',
        zIndex: 100,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        animation: 'slideUp 200ms ease-out',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px',
          borderBottom: '1px solid rgba(55, 53, 47, 0.09)',
          background: 'linear-gradient(135deg, #2383E2 0%, #1A6FC4 100%)',
          color: 'white',
        }}
      >
        <span style={{ fontSize: '14px', fontWeight: 600 }}>AI 助手</span>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '24px',
              height: '24px',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: 'white',
              padding: 0,
            }}
          >
            {isMinimized ? (
              <Maximize2 style={{ width: '16px', height: '16px' }} />
            ) : (
              <Minus style={{ width: '16px', height: '16px' }} />
            )}
          </button>
          <button
            onClick={() => setIsOpen(false)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '24px',
              height: '24px',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: 'white',
              padding: 0,
            }}
          >
            <X style={{ width: '16px', height: '16px' }} />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Messages */}
          <div
            style={{
              flex: 1,
              padding: '16px',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}
          >
            {messages.length === 0 && (
              <div
                style={{
                  textAlign: 'center',
                  color: 'rgba(55, 53, 47, 0.4)',
                  fontSize: '14px',
                  marginTop: '100px',
                }}
              >
                <MessageSquare style={{ width: '48px', height: '48px', margin: '0 auto 16px', opacity: 0.5 }} />
                <p>开始与 AI 对话</p>
              </div>
            )}

            {messages.map((msg, idx) => (
              <div
                key={idx}
                style={{
                  maxWidth: '80%',
                  padding: '10px 14px',
                  borderRadius: '12px',
                  fontSize: '14px',
                  lineHeight: 1.5,
                  alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                  backgroundColor:
                    msg.role === 'user'
                      ? '#2383E2'
                      : 'rgba(55, 53, 47, 0.06)',
                  color: msg.role === 'user' ? 'white' : 'rgba(55, 53, 47, 1)',
                }}
              >
                {msg.content}
              </div>
            ))}

            {isLoading && (
              <div
                style={{
                  maxWidth: '80%',
                  padding: '10px 14px',
                  borderRadius: '12px',
                  fontSize: '14px',
                  lineHeight: 1.5,
                  alignSelf: 'flex-start',
                  backgroundColor: 'rgba(55, 53, 47, 0.06)',
                  color: 'rgba(55, 53, 47, 1)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <Loader2 className="animate-spin" style={{ width: '16px', height: '16px' }} />
                <span>思考中...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div
            style={{
              padding: '12px',
              borderTop: '1px solid rgba(55, 53, 47, 0.09)',
            }}
          >
            <div
              style={{
                display: 'flex',
                gap: '8px',
              }}
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="输入消息..."
                disabled={isLoading}
                style={{
                  flex: 1,
                  padding: '10px 14px',
                  borderRadius: '8px',
                  border: '1px solid rgba(55, 53, 47, 0.15)',
                  outline: 'none',
                  fontSize: '14px',
                  transition: 'border-color 150ms ease-in-out',
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = '#2383E2';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(55, 53, 47, 0.15)';
                }}
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '8px',
                  background: 'linear-gradient(135deg, #2383E2 0%, #1A6FC4 100%)',
                  color: 'white',
                  border: 'none',
                  cursor: input.trim() && !isLoading ? 'pointer' : 'not-allowed',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: input.trim() && !isLoading ? 1 : 0.5,
                  transition: 'opacity 150ms ease-in-out',
                }}
              >
                <Send style={{ width: '18px', height: '18px' }} />
              </button>
            </div>
          </div>
        </>
      )}

      <style>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
