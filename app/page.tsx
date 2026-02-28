'use client';

import { useState, useEffect } from 'react';
import { ArrowUp, Loader2, FileText, Sparkles, LayoutList, BookOpen } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { generateOutline } from '@/store/useDocumentActions';
import { useStore } from '@/store/useStore';

export default function Home() {
  const router = useRouter();
  const [prompt, setPrompt] = useState('');
  const [showQuickStart, setShowQuickStart] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isComposing, setIsComposing] = useState(false);
  const [windowWidth, setWindowWidth] = useState(1200);
  const setDocumentTitle = useStore((state) => state.setDocumentTitle);

  useEffect(() => {
    setWindowWidth(window.innerWidth);
  }, []);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    setIsGenerating(true);

    try {
      console.log('[handleGenerate] Starting generation with prompt:', prompt.slice(0, 50));
      const title = prompt.slice(0, 50) + (prompt.length > 50 ? '...' : '');
      setDocumentTitle(title);

      console.log('[handleGenerate] Calling generateOutline...');
      const generatedOutline = await generateOutline(prompt);
      console.log('[handleGenerate] generateOutline completed, result:', { count: generatedOutline.length });

      // Verify the outline was saved to the store
      const storeState = useStore.getState();
      console.log('[handleGenerate] Verifying state:', { storedCount: storeState.outline.length });

      if (storeState.outline.length === 0) {
        console.error('[handleGenerate] Outline was not saved to store!');
        throw new Error('Failed to save outline to store');
      }

      // 🔥 新增：打开子窗口/iframe 并通过 postMessage 传递数据
      console.log('[handleGenerate] Opening child window and sending data via postMessage...');

      // 方案A: 打开新窗口
      const childWindow = window.open('http://10.23.22.37:3001/word-editor', '_blank');

      // 等待子窗口加载完成后发送数据
      const sendDataToChild = () => {
        if (childWindow && !childWindow.closed) {
          childWindow.postMessage(
            {
              type: 'INIT_WORD_EDITOR',
              payload: {
                outline: storeState.outline,
                documentTitle: storeState.documentTitle,
              },
            },
            'http://10.23.22.37:3001' // 目标源，确保安全
          );
          console.log('[handleGenerate] Data sent to child window via postMessage');
        }
      };

      // 延迟发送，确保子窗口已加载
      setTimeout(sendDataToChild, 1000);

      // 也可以监听子窗口的 ready 消息（更可靠）
      const handleChildReady = (event: MessageEvent) => {
        if (event.origin !== 'http://10.23.22.37:3001') return;
        if (event.data.type === 'CHILD_READY') {
          console.log('[handleGenerate] Child window ready, sending data...');
          sendDataToChild();
          window.removeEventListener('message', handleChildReady);
        }
      };
      window.addEventListener('message', handleChildReady);

      console.log('[handleGenerate] Outline verified, child window opened');
      // router.push('/word-editor'); // 不再本页跳转
    } catch (error: any) {
      console.error('[handleGenerate] Error generating outline:', error);

      let errorMessage = '大纲生成失败。';

      if (error.message.includes('fetch')) {
        errorMessage += '\n\n网络错误:无法连接到 Dify 服务器。\n请检查:\n1. API URL 是否正确\n2. 网络连接是否正常\n3. 服务器是否可访问';
      } else if (error.message.includes('401') || error.message.includes('403')) {
        errorMessage += '\n\n认证错误:API Key 无效或已过期。\n请在设置中更新 Workflow API Key。';
      } else if (error.message.includes('404')) {
        errorMessage += '\n\n端点错误:API URL 不正确。\n请检查 Dify API Base URL 是否以 /v1 结尾。';
      } else if (error.message.includes('timeout')) {
        errorMessage += '\n\n请求超时:服务器响应时间过长。\n请稍后重试。';
      } else {
        errorMessage += `\n\n详细信息:${error.message}`;
      }

      alert(errorMessage);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div
      className="min-h-screen"
      style={{
        backgroundColor: '#fff',
        fontFamily: 'ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI Variable Display", "Segoe UI", Helvetica, "PingFang SC", "Microsoft YaHei", Helvetica, "Apple Color Emoji", Arial, sans-serif, "Segoe UI Emoji", "Segoe UI Symbol"',
        WebkitFontSmoothing: 'auto',
        color: 'rgba(55, 53, 47, 1)',
        lineHeight: 1.5
      }}
    >
      {/* Top Navigation Bar */}
      <nav
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          height: '60px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '0 24px',
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(55, 53, 47, 0.08)',
          zIndex: 100,
        }}
      >
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #2383E2 0%, #1A6FC4 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 8px rgba(35, 131, 226, 0.2)'
            }}
          >
            <FileText style={{ width: '20px', height: '20px', color: 'white' }} />
          </div>
          <div>
            <h1
              style={{
                fontSize: '16px',
                fontWeight: 700,
                margin: 0,
                background: 'linear-gradient(135deg, #2383E2 0%, #1A6FC4 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}
            >
              超长文本生成器
            </h1>
          </div>
        </div>

      </nav>

      {/* Main Content Area */}
      <div
        style={{
          minHeight: '100vh',
          paddingTop: '60px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          background: 'linear-gradient(180deg, #ffffff 0%, #fafafa 100%)'
        }}
      >
        {/* Hero Section */}
        <div
          className="homepage-hero"
          style={{
            width: '100%',
            maxWidth: '1000px',
            padding: '80px 24px 60px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center'
          }}
        >
          {/* Main Heading */}
          <h1
            style={{
              fontSize: Math.min(56, Math.max(40, windowWidth * 0.05)),
              fontWeight: 700,
              margin: '0 0 20px 0',
              background: 'linear-gradient(135deg, #2383E2 0%, #1A6FC4 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              letterSpacing: '-0.02em',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              justifyContent: 'center'
            }}
          >
            {isGenerating ? (
              <>
                <Loader2 className="animate-spin" style={{ width: '32px', height: '32px', color: '#2383E2' }} />
                <span>正在为您生成文档大纲...</span>
              </>
            ) : (
              'AI 驱动的超长文本生成器'
            )}
          </h1>

          <p
            style={{
              fontSize: '18px',
              lineHeight: 1.6,
              color: 'rgba(55, 53, 47, 0.7)',
              maxWidth: '640px',
              margin: '0 0 60px 0'
            }}
          >
            通过智能大纲生成和逐章节内容创作,快速打造高质量的专业文档
          </p>

          {/* Input Area */}
          <div
            className="homepage-input-area"
            style={{
              width: '100%',
              maxWidth: '800px',
              marginBottom: '60px'
            }}
          >
            <div
              style={{
                borderRadius: '16px',
                backgroundColor: '#ffffff',
                boxShadow: '0 4px 24px rgba(0, 0, 0, 0.06)',
                border: '1px solid rgba(55, 53, 47, 0.08)',
                overflow: 'hidden',
                transition: 'all 300ms ease-in-out',
              }}
            >
              <div style={{ padding: '8px' }}>
                <div style={{ pointerEvents: 'auto', opacity: 1 }}>
                  <div>

                    {/* Input Field */}
                    <div style={{ color: 'rgba(55, 53, 47, 1)', fontSize: '15px', lineHeight: '1.6', fontWeight: 400, position: 'relative' }}>
                      <div
                        contentEditable={true}
                        spellCheck={true}
                        data-placeholder="描述您想要创建的文档主题,例如:人工智能的发展历程与未来趋势"
                        data-content-editable-leaf={true}
                        tabIndex={0}
                        role="textbox"
                        aria-label="开始输入以编辑文本"
                        onInput={(e) => {
                          const text = e.currentTarget.textContent || '';
                          setPrompt(text);
                        }}
                        onCompositionStart={() => setIsComposing(true)}
                        onCompositionEnd={() => setIsComposing(false)}
                        onKeyDown={(e) => {
                          // 如果正在使用输入法，Enter 键用于确认输入，不触发生成
                          if (isComposing) return;
                          // 普通情况下，Enter 键触发生成
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleGenerate();
                          }
                        }}
                        className={!prompt ? 'empty-placeholder' : ''}
                        style={{
                          maxWidth: '100%',
                          width: '100%',
                          whiteSpace: 'break-spaces',
                          wordBreak: 'break-word',
                          caretColor: 'rgba(55, 53, 47, 1)',
                          flexGrow: 1,
                          padding: '16px 20px',
                          minHeight: '72px',
                          maxHeight: '200px',
                          overflow: 'auto',
                          pointerEvents: 'auto',
                          textAlign: 'left',
                          color: prompt ? 'rgba(55, 53, 47, 1)' : 'transparent',
                          cursor: 'text',
                          outline: 'none',
                          border: 'none',
                          background: 'transparent',
                          fontSize: '15px',
                          lineHeight: '1.6'
                        }}
                      ></div>
                    </div>

                    {/* Bottom Controls */}
                    <div
                      style={{
                        padding: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'flex-end'
                      }}
                    >
                      <button
                        className="homepage-generate-btn"
                        aria-disabled={!prompt.trim() || isGenerating}
                        role="button"
                        tabIndex={!prompt.trim() || isGenerating ? -1 : 0}
                        aria-label="生成文档大纲"
                        onClick={handleGenerate}
                        disabled={!prompt.trim() || isGenerating}
                        style={{
                          userSelect: 'none',
                          transition: 'all 200ms ease-in-out',
                          cursor: !prompt.trim() || isGenerating ? 'default' : 'pointer',
                          opacity: !prompt.trim() || isGenerating ? 0.5 : 1,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '8px',
                          height: '44px',
                          paddingInline: '32px',
                          borderRadius: '12px',
                          whiteSpace: 'nowrap',
                          fontSize: '15px',
                          fontWeight: 600,
                          lineHeight: 1.2,
                          color: 'white',
                          background: !prompt.trim() || isGenerating ? 'rgba(35, 131, 226, 0.5)' : 'linear-gradient(135deg, #2383E2 0%, #1A6FC4 100%)',
                          boxShadow: !prompt.trim() || isGenerating ? 'none' : '0 2px 12px rgba(35, 131, 226, 0.3)',
                          border: 'none',
                        }}
                        onMouseEnter={(e) => {
                          if (prompt.trim() && !isGenerating) {
                            e.currentTarget.style.transform = 'translateY(-2px)';
                            e.currentTarget.style.boxShadow = '0 4px 16px rgba(35, 131, 226, 0.4)';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (prompt.trim() && !isGenerating) {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = '0 2px 12px rgba(35, 131, 226, 0.3)';
                          }
                        }}
                      >
                        {isGenerating ? (
                          <>
                            <Loader2 className="animate-spin" style={{ width: '18px', height: '18px' }} />
                            <span>生成中...</span>
                          </>
                        ) : (
                          <>
                            <ArrowUp style={{ width: '18px', height: '18px' }} />
                            <span>生成大纲</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Process Steps */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '32px',
              marginBottom: '80px',
              maxWidth: '600px',
              width: '100%'
            }}
          >
            {[
              { icon: LayoutList, title: '生成大纲', desc: 'AI 智能分析主题,生成文档结构框架' },
              { icon: BookOpen, title: '撰写内容', desc: '基于大纲逐章节生成专业内容' },
              { icon: Sparkles, title: '完善文档', desc: '使用 AI 助手润色、扩展、优化' }
            ].map((step, idx) => {
              const Icon = step.icon;
              return (
                <div
                  key={idx}
                  className="process-step"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                    padding: '20px',
                    borderRadius: '12px',
                    backgroundColor: '#ffffff',
                    border: '1px solid rgba(55, 53, 47, 0.08)',
                    transition: 'all 200ms ease-in-out'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(35, 131, 226, 0.2)';
                    e.currentTarget.style.backgroundColor = 'rgba(35, 131, 226, 0.02)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(55, 53, 47, 0.08)';
                    e.currentTarget.style.backgroundColor = '#ffffff';
                  }}
                >
                  <div
                    className="process-step-icon"
                    style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '10px',
                      background: 'linear-gradient(135deg, rgba(35, 131, 226, 0.1) 0%, rgba(26, 111, 196, 0.1) 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}
                  >
                    <Icon style={{ width: '24px', height: '24px', color: '#2383E2' }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ fontSize: '16px', fontWeight: 600, margin: '0 0 6px 0', color: 'rgba(55, 53, 47, 1)' }}>
                      {step.title}
                    </h3>
                    <p style={{ fontSize: '14px', color: 'rgba(55, 53, 47, 0.6)', margin: 0, lineHeight: 1.5 }}>
                      {step.desc}
                    </p>
                  </div>
                  <div
                    style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '50%',
                      background: 'rgba(55, 53, 47, 0.06)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      color: 'rgba(55, 53, 47, 0.4)',
                      fontSize: '14px',
                      fontWeight: 600
                    }}
                  >
                    {idx + 1}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Quick Start Section */}
        <div
          className="quick-start-section"
          style={{
            width: '100%',
            maxWidth: '1000px',
            padding: '0 24px 80px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center'
          }}
        >
          {showQuickStart && (
            <div
              style={{
                width: '100%',
                opacity: 1,
                transition: 'all 400ms ease-out'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '32px' }}>
                <div style={{ height: '1px', flex: 1, background: 'linear-gradient(to right, transparent, rgba(55, 53, 47, 0.15))' }} />
                <span style={{ fontSize: '13px', color: 'rgba(55, 53, 47, 0.5)', fontWeight: 500, letterSpacing: '0.02em' }}>
                  快速开始
                </span>
                <div style={{ height: '1px', flex: 1, background: 'linear-gradient(to left, transparent, rgba(55, 53, 47, 0.15))' }} />
              </div>

              <div
                className="quick-start-grid"
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: '20px',
                  marginBottom: '24px'
                }}
              >
                {[
                  {
                    id: 'tech-report',
                    icon: FileText,
                    title: '技术报告',
                    desc: '项目技术文档'
                  },
                  {
                    id: 'research-paper',
                    icon: BookOpen,
                    title: '研究论文',
                    desc: '学术研究报告'
                  },
                  {
                    id: 'product-docs',
                    icon: Sparkles,
                    title: '产品文档',
                    desc: '产品说明文档'
                  }
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      className="quick-start-card"
                      role="button"
                      tabIndex={0}
                      onClick={() => {
                        setPrompt(`创建一份${item.title}: ${item.desc}`);
                        setShowQuickStart(false);
                      }}
                      style={{
                        userSelect: 'none',
                        transition: 'all 200ms ease-in-out',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '16px',
                        padding: '32px 24px',
                        borderRadius: '16px',
                        whiteSpace: 'nowrap',
                        backgroundColor: '#ffffff',
                        border: '1px solid rgba(55, 53, 47, 0.08)',
                        textAlign: 'center',
                        flexBasis: 0,
                        flexGrow: 1,
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'rgba(35, 131, 226, 0.04)';
                        e.currentTarget.style.borderColor = 'rgba(35, 131, 226, 0.2)';
                        e.currentTarget.style.transform = 'translateY(-2px)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = '#ffffff';
                        e.currentTarget.style.borderColor = 'rgba(55, 53, 47, 0.08)';
                        e.currentTarget.style.transform = 'translateY(0)';
                      }}
                    >
                      <div
                        style={{
                          width: '56px',
                          height: '56px',
                          borderRadius: '14px',
                          background: 'linear-gradient(135deg, rgba(35, 131, 226, 0.1) 0%, rgba(26, 111, 196, 0.1) 100%)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        <Icon style={{ width: '28px', height: '28px', color: '#2383E2' }} />
                      </div>
                      <div>
                        <div style={{ fontSize: '16px', fontWeight: 600, marginBottom: '6px', color: 'rgba(55, 53, 47, 1)' }}>
                          {item.title}
                        </div>
                        <div style={{ fontSize: '13px', color: 'rgba(55, 53, 47, 0.5)' }}>
                          {item.desc}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Loading Overlay */}
      {isGenerating && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(255, 255, 255, 0.98)',
            backdropFilter: 'blur(12px)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            animation: 'fadeIn 0.3s ease-in-out'
          }}
        >
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '24px',
            padding: '48px',
            borderRadius: '24px',
            backgroundColor: 'white',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)',
            maxWidth: '480px',
            textAlign: 'center'
          }}>
            <Loader2 className="animate-spin" style={{ width: '64px', height: '64px', color: '#2383E2' }} />
            <div>
              <h2
                style={{
                  fontSize: '24px',
                  fontWeight: 600,
                  color: 'rgba(55, 53, 47, 0.9)',
                  margin: '0 0 12px 0'
                }}
              >
                正在为您生成文档大纲...
              </h2>
              <p
                style={{
                  fontSize: '16px',
                  color: 'rgba(55, 53, 47, 0.6)',
                  margin: 0,
                  lineHeight: '1.6'
                }}
              >
                AI 正在分析您的需求，这可能需要一点时间
              </p>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        .empty-placeholder:empty:before {
          content: attr(data-placeholder);
          color: rgba(55, 53, 47, 0.4);
          cursor: text;
        }
        .empty-placeholder:focus:before {
          content: attr(data-placeholder);
        }
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
        .animate-spin {
          animation: spin 1s linear infinite;
        }
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
