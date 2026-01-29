'use client';

import { useState, useRef, useEffect } from 'react';
import { MessageSquare, Send, X, Minus, Maximize2, Loader2 } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { logger } from '@/lib/logger';

interface NotionBlock {
  id: string;
  type: string;
  content: string;
  properties?: any;
  children?: NotionBlock[];
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface AIChatProps {
  onRewriteText?: (text: string) => void;
  onRewriteSection?: (sectionId: string, newContent: string) => void;
  blocks?: NotionBlock[];
  outline?: any[];
}

export function AIChat({ onRewriteText, onRewriteSection, blocks, outline }: AIChatProps) {
  const { chatApiKey } = useStore();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentAssistantMessage, setCurrentAssistantMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 解析用户输入中的章节指令
  const parseRewriteCommand = (text: string): { command: string; sectionId?: string } | null => {
    const rewriteRegex = /帮我重写\s*(\d+(?:\.\d+)*)/i;
    const match = text.match(rewriteRegex);

    if (match) {
      const sectionNumber = match[1];
      // 查找对应的章节
      const section = outline?.find((item: any) => item.id === sectionNumber || item.id?.startsWith(sectionNumber));

      if (section) {
        return {
          command: `重写章节 ${sectionNumber}`,
          sectionId: section.id,
        };
      }
    }

    return null;
  };

  // 获取章节当前内容
  const getSectionContent = (sectionId: string): string => {
    const headingBlock = blocks?.find(b => b.id === `heading-${sectionId}`);
    const contentBlock = blocks?.find(b => b.id === `content-${sectionId}`);

    return contentBlock?.content || '';
  };

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
    setCurrentAssistantMessage('');

    // 检查是否是重写章节的命令
    const rewriteCommand = parseRewriteCommand(userMessage.content);

    try {
      let prompt = userMessage.content;
      let sectionContext = '';

      // 如果是重写章节命令,获取当前内容
      if (rewriteCommand && rewriteCommand.sectionId) {
        const currentContent = getSectionContent(rewriteCommand.sectionId);
        const section = outline?.find((item: any) => item.id === rewriteCommand.sectionId);

        sectionContext = `
章节: ${section?.title}
当前内容: ${currentContent || '(空)'}

请根据用户的要求重写这个章节,保持专业风格,内容详实具体。
        `;

        prompt = `请重写以上章节`;
      }

      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: sectionContext ? sectionContext : prompt,
          history: messages,
          appKey: chatApiKey || process.env.NEXT_PUBLIC_DIFY_LLM_KEY || '',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: '未知错误' }));
        logger.error('API 请求失败:', response.status, errorData);
        throw new Error(`API 请求失败: ${errorData.error || response.statusText}`);
      }

      // 处理流式响应
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullContent = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6));
                if (data.content) {
                  fullContent += data.content;
                  setCurrentAssistantMessage(data.fullContent || fullContent);
                }
              } catch (e) {
                // 忽略解析错误
              }
            }
          }
        }
      }

      // 保存完整消息
      const aiMessage: Message = {
        role: 'assistant',
        content: fullContent || '抱歉，我无法回答这个问题。',
      };
      setMessages(prev => [...prev, aiMessage]);
      setCurrentAssistantMessage('');

      // 如果是重写章节命令,调用回调更新内容
      if (rewriteCommand && rewriteCommand.sectionId && onRewriteSection) {
        onRewriteSection(rewriteCommand.sectionId, fullContent);
      }
    } catch (error) {
      logger.error('AI chat error:', error);
      const errorMessage: Message = {
        role: 'assistant',
        content: error instanceof Error ? error.message : '抱歉，连接 AI 服务失败，请稍后重试。',
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      setCurrentAssistantMessage('');
    }
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
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                }}
              >
                {msg.content}
              </div>
            ))}

            {/* 流式显示当前正在生成的消息 */}
            {currentAssistantMessage && (
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
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                }}
              >
                {currentAssistantMessage}
                <span
                  style={{
                    display: 'inline-block',
                    width: '6px',
                    height: '14px',
                    backgroundColor: '#2383E2',
                    marginLeft: '2px',
                    animation: 'blink 1s infinite',
                  }}
                />
              </div>
            )}

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
        @keyframes blink {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}
