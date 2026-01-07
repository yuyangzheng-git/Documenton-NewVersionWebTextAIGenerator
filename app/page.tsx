'use client';

import { useState, useEffect } from 'react';
import { Clock, Paperclip, Globe, ArrowUp, X, Sparkles, ListChecks, FileText, CheckCircle2, AtSign, Eye, Loader2, Settings } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { generateOutline } from '@/store/useDocumentActions';
import { useStore } from '@/store/useStore';

export default function Home() {
  const router = useRouter();
  const [prompt, setPrompt] = useState('');
  const [showGetStarted, setShowGetStarted] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [apiUrl, setApiUrl] = useState('');
  const [lastEnterTime, setLastEnterTime] = useState(0);
  const { setDocumentTitle, apiKey: storedApiKey, setApiKey: saveApiKey, apiUrl: storedApiUrl, setApiUrl: saveApiUrl } = useStore();

  useEffect(() => {
    if (storedApiKey) {
      setApiKey(storedApiKey);
    }
    if (storedApiUrl) {
      setApiUrl(storedApiUrl);
    }
  }, [storedApiKey, storedApiUrl]);

  const handleQuickAction = async (actionId: string) => {
    setIsGenerating(true);
    try {
      switch (actionId) {
        case 'whats-new':
          // 智能文档生成 - 显示产品功能
          alert('智能文档生成器功能：\n\n• AI 驱动的文档大纲自动生成\n• 支持多种文档模板\n• 实时智能编辑辅助\n• 一键导出 Word 文档');
          setIsGenerating(false);
          return;

        case 'meeting-agenda':
          // 撰写会议纪要 - 生成会议纪要模板
          setDocumentTitle('会议纪要');
          const meetingOutline = [
            { id: '1', title: '会议信息', level: 1 as const, status: 'idle' as const, content: '' },
            { id: '2', title: '会议主题', level: 2 as const, status: 'idle' as const, content: '本次会议讨论的核心议题' },
            { id: '3', title: '会议时间', level: 2 as const, status: 'idle' as const, content: 'YYYY年MM月DD日 HH:MM' },
            { id: '4', title: '参会人员', level: 2 as const, status: 'idle' as const, content: '列出所有参会人员名单' },
            { id: '5', title: '会议内容', level: 1 as const, status: 'idle' as const, content: '' },
            { id: '6', title: '议题讨论', level: 2 as const, status: 'idle' as const, content: '详细记录各项议题的讨论过程和要点' },
            { id: '7', title: '决议事项', level: 2 as const, status: 'idle' as const, content: '记录会议达成的共识和决议' },
            { id: '8', title: '后续行动', level: 2 as const, status: 'idle' as const, content: '明确下一步行动计划和责任人' },
            { id: '9', title: '下次会议', level: 1 as const, status: 'idle' as const, content: '预定下次会议的时间地点' },
          ];
          useStore.getState().setOutline(meetingOutline);
          router.push('/word-editor');
          return;

        case 'analyze-pdf':
          // 智能文档分析 - 提示功能
          alert('智能文档分析功能：\n\n• 支持上传 PDF、Word、图片等文件\n• AI 自动提取关键信息和摘要\n• 智能生成文档大纲\n• 识别文档中的重点内容\n\n请先创建文档，然后在编辑器中使用 AI 助手进行分析。');
          setIsGenerating(false);
          return;

        case 'task-tracker':
          // 项目管理模板 - 生成项目管理模板
          setDocumentTitle('项目管理');
          const taskOutline = [
            { id: '1', title: '项目概况', level: 1 as const, status: 'idle' as const, content: '' },
            { id: '2', title: '项目背景', level: 2 as const, status: 'idle' as const, content: '简要描述项目的背景和目标' },
            { id: '3', title: '项目范围', level: 2 as const, status: 'idle' as const, content: '界定项目的边界和交付成果' },
            { id: '4', title: '时间规划', level: 1 as const, status: 'idle' as const, content: '' },
            { id: '5', title: '里程碑节点', level: 2 as const, status: 'idle' as const, content: '列出关键的时间节点和交付日期' },
            { id: '6', title: '任务分配', level: 2 as const, status: 'idle' as const, content: '明确各阶段的任务负责人和团队分工' },
            { id: '7', title: '风险管理', level: 1 as const, status: 'idle' as const, content: '' },
            { id: '8', title: '风险识别', level: 2 as const, status: 'idle' as const, content: '识别可能影响项目的风险因素' },
            { id: '9', title: '应对策略', level: 2 as const, status: 'idle' as const, content: '制定相应的风险应对和缓解措施' },
            { id: '10', title: '资源需求', level: 1 as const, status: 'idle' as const, content: '项目所需的人力、物力和财务资源' },
          ];
          useStore.getState().setOutline(taskOutline);
          router.push('/word-editor');
          return;

        default:
          setIsGenerating(false);
          return;
      }
    } catch (error) {
      console.error('Error handling quick action:', error);
      alert('操作失败，请稍后重试。');
      setIsGenerating(false);
    }
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    setIsGenerating(true);

    try {
      // Set document title from prompt
      const title = prompt.slice(0, 50) + (prompt.length > 50 ? '...' : '');
      setDocumentTitle(title);

      // Check if API key is available
      if (!storedApiKey) {
        // Use sample data for demo purposes
        await generateSampleOutline(prompt);
      } else {
        // Generate outline using Dify API
        await generateOutline(prompt);
      }

      // Navigate to editor page
      router.push('/word-editor');
    } catch (error) {
      console.error('Error generating outline:', error);
      alert('Failed to generate outline. Please check your API key in settings.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Generate sample outline for demo without API
  const generateSampleOutline = async (topic: string) => {
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        const { setOutline } = useStore.getState();

        // Create sample outline based on the topic
        const sampleOutline = [
          {
            id: '1',
            title: '引言',
            level: 1 as const,
            status: 'idle' as const,
            content: '本文将探讨' + topic + '的各个方面。通过深入分析，我们将了解其背景、发展历程以及未来趋势。',
          },
          {
            id: '2',
            title: '背景概述',
            level: 1 as const,
            status: 'idle' as const,
            content: '在深入了解之前，我们需要先了解' + topic + '的基本概念和背景。这一部分将为后续的讨论奠定基础。',
          },
          {
            id: '3',
            title: '历史发展',
            level: 1 as const,
            status: 'idle' as const,
            content: '',
          },
          {
            id: '4',
            title: '早期阶段',
            level: 2 as const,
            status: 'idle' as const,
            content: '在发展的早期阶段，' + topic + '还处于探索期。当时的主要关注点集中在基础功能的建设和完善。',
          },
          {
            id: '5',
            title: '快速发展期',
            level: 2 as const,
            status: 'idle' as const,
            content: '随着技术的进步，' + topic + '进入了快速发展期。这一时期出现了许多重要的突破和创新。',
          },
          {
            id: '6',
            title: '核心概念',
            level: 1 as const,
            status: 'idle' as const,
            content: '',
          },
          {
            id: '7',
            title: '定义与范围',
            level: 2 as const,
            status: 'idle' as const,
            content: topic + '可以被定义为...。其适用范围涵盖了多个领域，包括教育、医疗、金融等。',
          },
          {
            id: '8',
            title: '关键特征',
            level: 2 as const,
            status: 'idle' as const,
            content: '1. 高效性 - ' + topic + '能够显著提高工作效率\n2. 准确性 - 在处理复杂任务时保持高精度\n3. 智能化 - 能够学习和适应用户需求',
          },
          {
            id: '9',
            title: '应用领域',
            level: 1 as const,
            status: 'idle' as const,
            content: '',
          },
          {
            id: '10',
            title: '商业应用',
            level: 2 as const,
            status: 'idle' as const,
            content: '在商业领域，' + topic + '已经被广泛应用于客户服务、数据分析、流程优化等方面。',
          },
          {
            id: '11',
            title: '个人应用',
            level: 2 as const,
            status: 'idle' as const,
            content: '对于个人用户，' + topic + '可以帮助更好地管理时间、提高学习效率、简化日常任务。',
          },
          {
            id: '12',
            title: '未来展望',
            level: 1 as const,
            status: 'idle' as const,
            content: '展望未来，' + topic + '将继续朝着更加智能化、人性化的方向发展。我们有理由相信，它将在更多领域发挥重要作用。',
          },
        ];

        setOutline(sampleOutline);
        resolve();
      }, 1500); // Simulate API delay
    });
  };

  const quickActions = [
    {
      id: 'whats-new',
      title: '智能文档生成',
      icon: Sparkles
    },
    {
      id: 'meeting-agenda',
      title: '撰写会议纪要',
      icon: ListChecks
    },
    {
      id: 'analyze-pdf',
      title: '智能文档分析',
      icon: FileText
    },
    {
      id: 'task-tracker',
      title: '项目管理模板',
      icon: CheckCircle2
    }
  ];

  return (
    <div
      className="min-h-screen"
      style={{
        backgroundColor: '#fff',
        fontFamily: 'ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI Variable Display", "Segoe UI", Helvetica, "PingFang SC", "Microsoft YaHei", Helvetica, "Apple Color Emoji", Arial, sans-serif, "Segoe UI Emoji", "Segoe UI Symbol"',
        WebkitFontSmoothing: 'auto',
        color: 'var(--c-texPri, rgba(55, 53, 47, 1))',
        lineHeight: 1.5
      }}
    >
      {/* Top Toolbar */}
      <div
        role="toolbar"
        tabIndex={0}
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          overflow: 'hidden',
          height: '44px',
          paddingInline: '12px 10px'
        }}
      >
        <div style={{ position: 'relative', display: 'flex', flexShrink: 0, alignItems: 'center', gap: '4px' }}>
          <button
            role="button"
            tabIndex={0}
            aria-label="对话记录"
            style={{
              userSelect: 'none',
              transition: 'background 20ms ease-in',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 0,
              height: '28px',
              paddingInline: 0,
              borderRadius: '4px',
              whiteSpace: 'nowrap',
              fontSize: '14px',
              fontWeight: 500,
              lineHeight: 1.2,
              width: '34px',
              color: 'var(--c-texPri, rgba(55, 53, 47, 1))',
              flexShrink: 0,
              marginInlineEnd: 0,
              background: 'transparent',
              border: 'none'
            }}
          >
            <Clock style={{ width: '22px', height: '22px', display: 'block', fill: 'var(--c-icoPri, rgba(55, 53, 47, 0.65))', flexShrink: 0 }} />
          </button>
        </div>
        <div style={{ flexGrow: 1, flexShrink: 1 }}></div>
        <div style={{ position: 'relative', display: 'flex', flexShrink: 0, alignItems: 'center', gap: '4px' }}>
          <button
            role="button"
            tabIndex={0}
            onClick={() => setShowSettings(!showSettings)}
            style={{
              userSelect: 'none',
              transition: 'background 20ms ease-in',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'unset',
              height: '28px',
              paddingInline: '8px',
              borderRadius: '6px',
              whiteSpace: 'nowrap',
              fontSize: '14px',
              fontWeight: 400,
              lineHeight: 1.2,
              color: 'var(--c-texPri, rgba(55, 53, 47, 1))',
              flexShrink: 0,
              minWidth: 0,
              gap: '6px',
              background: 'transparent',
              border: 'none'
            }}
          >
            <Settings style={{ width: '20px', height: '20px', display: 'block', fill: 'var(--c-icoPri, rgba(55, 53, 47, 0.65))', flexShrink: 0, color: 'inherit' }} />
            <span>API 设置</span>
          </button>
        </div>

        {/* API Key Settings Modal */}
        {showSettings && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000,
            }}
            onClick={() => setShowSettings(false)}
          >
            <div
              style={{
                backgroundColor: 'white',
                borderRadius: '16px',
                padding: '24px',
                width: '400px',
                maxWidth: '90%',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '16px', color: 'rgba(55, 53, 47, 1)' }}>
                Dify API 设置
              </h3>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '14px', marginBottom: '8px', color: 'rgba(55, 53, 47, 0.65)' }}>
                  API Base URL
                </label>
                <input
                  type="text"
                  value={apiUrl}
                  onChange={(e) => setApiUrl(e.target.value)}
                  placeholder="http://10.23.22.37/v1"
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid rgba(55, 53, 47, 0.09)',
                    borderRadius: '8px',
                    fontSize: '14px',
                    color: 'rgba(55, 53, 47, 1)',
                    marginBottom: '8px',
                  }}
                />
                <div style={{ fontSize: '12px', color: 'rgba(55, 53, 47, 0.45)' }}>
                  Dify API 基础 URL,例如: http://10.23.22.37/v1
                </div>
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '14px', marginBottom: '8px', color: 'rgba(55, 53, 47, 0.65)' }}>
                  Workflow API Key
                </label>
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="app-xxxxxxxxxxxxxxxxxxx"
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid rgba(55, 53, 47, 0.09)',
                    borderRadius: '8px',
                    fontSize: '14px',
                    color: 'rgba(55, 53, 47, 1)',
                  }}
                />
              </div>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => setShowSettings(false)}
                  style={{
                    padding: '10px 20px',
                    borderRadius: '8px',
                    border: '1px solid rgba(55, 53, 47, 0.09)',
                    background: 'transparent',
                    fontSize: '14px',
                    cursor: 'pointer',
                  }}
                >
                  取消
                </button>
                <button
                  onClick={() => {
                    saveApiKey(apiKey);
                    saveApiUrl(apiUrl);
                    setShowSettings(false);
                  }}
                  style={{
                    padding: '10px 20px',
                    borderRadius: '8px',
                    background: 'linear-gradient(135deg, #2383E2 0%, #1A6FC4 100%)',
                    color: 'white',
                    fontSize: '14px',
                    cursor: 'pointer',
                    border: 'none',
                  }}
                >
                  保存
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main Content Area */}
      <div
        style={{
          width: '100%',
          flexGrow: 1,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center'
        }}
      >
        <div
          style={{
            width: '100%',
            maxWidth: '1168px',
            marginTop: '-24px',
            paddingBottom: '15vh',
            flexGrow: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              flexDirection: 'column',
              gap: '24px',
              alignItems: 'center',
              paddingInline: '48px',
              width: '100%'
            }}
          >
            {/* Logo Section */}
            <div
              style={{
                opacity: 1,
                transition: 'opacity 800ms ease-in-out',
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                paddingTop: '16px',
                paddingBottom: '16px',
                marginTop: '-16px',
                marginBottom: '-16px'
              }}
            >
              <div style={{ position: 'relative', display: 'inline-block' }}>
                <button
                  role="button"
                  tabIndex={0}
                  aria-label="Open personalization settings"
                  style={{
                    userSelect: 'none',
                    transition: 'background 20ms ease-in',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'unset',
                    height: '64px',
                    paddingInline: 0,
                    borderRadius: '50%',
                    whiteSpace: 'nowrap',
                    fontSize: '14px',
                    fontWeight: 400,
                    lineHeight: 1.2,
                    color: 'var(--c-texPri, rgba(55, 53, 47, 1))',
                    flexShrink: 0,
                    minWidth: 0,
                    width: '64px',
                    backgroundColor: 'var(--c-bacEle, #fff)',
                    boxShadow: 'var(--c-shaSM, 0 1px 2px rgba(0, 0, 0, 0.03))',
                    pointerEvents: 'auto',
                    touchAction: 'manipulation',
                    border: 'none'
                  }}
                >
                  <div>
                    <div style={{ position: 'relative', width: '64px', height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <div
                        style={{
                          width: '64px',
                          height: '64px',
                          borderRadius: '100%',
                          background: 'var(--c-assCorButBac, linear-gradient(135deg, #2383E2 0%, #1A6FC4 100%))',
                          boxShadow: 'var(--c-shaMD, 0 2px 8px rgba(0, 0, 0, 0.1))',
                          overflow: 'hidden',
                          userSelect: 'none'
                        }}
                      >
                        <div
                          style={{
                            width: '64px',
                            height: '64px',
                            borderRadius: '100%',
                            background: 'linear-gradient(135deg, #2383E2 0%, #1A6FC4 100%)',
                            overflow: 'hidden',
                            transform: 'scaleX(var(--direction, 1))'
                          }}
                        >
                          {/* Notion AI Face Logo */}
                          <svg viewBox="0 0 48 48" style={{ height: '64px', width: '64px', userSelect: 'none' }} className="select-none">
                            <defs>
                              <linearGradient id="notionLogoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
                                <stop offset="100%" stopColor="#f5f5f5" stopOpacity="0.95" />
                              </linearGradient>
                            </defs>
                            <circle cx="24" cy="24" r="20" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" />
                            <path
                              d="M24 8 C14 8, 8 14, 8 24 C8 34, 14 40, 24 40 C34 40, 40 34, 40 24 C40 14, 34 8, 24 8 Z M24 12 C30 12, 34 16, 34 24 C34 32, 30 36, 24 36 C18 36, 14 32, 14 24 C14 16, 18 12, 24 12 Z"
                              fill="url(#notionLogoGradient)"
                              fillRule="evenodd"
                            />
                            <circle cx="18" cy="22" r="2.5" fill="white" />
                            <circle cx="30" cy="22" r="2.5" fill="white" />
                            <path
                              d="M16 28 Q24 32, 32 28"
                              stroke="white"
                              strokeWidth="2.5"
                              fill="none"
                              strokeLinecap="round"
                            />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>
                </button>
              </div>
            </div>

            {/* Main Heading */}
            <div style={{ opacity: 1, transition: 'opacity 800ms ease-in-out' }}>
              <div
                style={{
                  fontSize: '30px',
                  lineHeight: 1.2,
                  fontWeight: 600,
                  paddingInline: '8px',
                  textAlign: 'center',
                  color: 'rgba(55, 53, 47, 1)'
                }}
              >
                {isGenerating ? '正在生成大纲...' : '今日事，我来帮。'}
              </div>
            </div>

            {/* Input Area */}
            <div style={{ flex: '0 0 auto', position: 'relative', padding: '0px 0px 16px' }}>
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  margin: '0px auto',
                  width: '100%',
                  maxWidth: '710px',
                  padding: 0,
                  marginInlineStart: 'auto',
                  flex: '0 0 auto'
                }}
              >
                <div
                  style={{
                    minWidth: 0,
                    position: 'relative'
                  }}
                >
                  <div role="presentation" style={{ position: 'relative' }}>
                    <div
                      style={{
                        borderRadius: '22px',
                        boxShadow: 'var(--c-shaOutSm, 0 1px 2px rgba(0, 0, 0, 0.03))',
                        backgroundColor: '#F7F6F3',
                        minWidth: 0,
                        transition: 'box-shadow 0.1s ease-in-out',
                        pointerEvents: 'none',
                        border: '1px solid rgba(55, 53, 47, 0.09)'
                      }}
                    >
                      <div style={{ pointerEvents: 'auto', height: 'auto', opacity: 1 }}>
                        <div>
                          {/* Add Context Button */}
                          <div
                            style={{
                              padding: '10px 10px 0px',
                              flexWrap: 'wrap',
                              gap: '6px 4px',
                              pointerEvents: 'none',
                              display: 'flex',
                              alignItems: 'center'
                            }}
                          >
                            <div style={{ opacity: 1, filter: 'blur(0px)', width: 'auto' }}>
                              <button
                                role="button"
                                tabIndex={0}
                                data-testid="unified-chat-add-context-button"
                                aria-expanded={false}
                                aria-haspopup="dialog"
                                style={{
                                  userSelect: 'none',
                                  transition: 'background 20ms ease-in',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  height: '28px',
                                  paddingInline: '8px',
                                  borderRadius: '50px',
                                  whiteSpace: 'nowrap',
                                  fontSize: '12px',
                                  fontWeight: 400,
                                  lineHeight: 1.2,
                                  border: '1px solid var(--c-borPri, rgba(55, 53, 47, 0.09))',
                                  color: 'var(--c-texPri, rgba(55, 53, 47, 1))',
                                  padding: '2px 3px',
                                  outline: 'none',
                                  position: 'relative',
                                  pointerEvents: 'auto',
                                  background: 'transparent'
                                }}
                              >
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '20px', height: '20px', flexShrink: 0 }}>
                                  <AtSign style={{ width: '16px', height: '16px', display: 'block', flexShrink: 0, color: 'var(--c-icoSec, rgba(55, 53, 47, 0.65))' }} />
                                </div>
                                <div style={{ flexShrink: 0, width: '4px' }}></div>
                                <div style={{ overflow: 'hidden', opacity: 1, width: 'auto' }}>
                                  <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0, flex: '1 1 0%' }}>
                                    <div style={{ color: 'var(--c-texSec, rgba(55, 53, 47, 0.65))', fontSize: '12px', lineHeight: '16px', fontWeight: 400 }}>
                                      添加背景信息
                                    </div>
                                  </div>
                                </div>
                                <div style={{ flexShrink: 0, width: '8px' }}></div>
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Input Field */}
                        <div style={{ color: 'var(--c-texPri, rgba(55, 53, 47, 1))', fontSize: '14px', lineHeight: '20px', fontWeight: 400, position: 'relative' }}>
                          <div
                            contentEditable={true}
                            spellCheck={true}
                            data-placeholder="询问、搜索或制作任何内容…"
                            data-content-editable-leaf={true}
                            tabIndex={0}
                            role="textbox"
                            aria-label="开始输入以编辑文本"
                            onInput={(e) => {
                              const text = e.currentTarget.textContent || '';
                              setPrompt(text);
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                const currentTime = Date.now();
                                const timeDiff = currentTime - lastEnterTime;

                                if (timeDiff < 500) {
                                  // 双击回车，发送消息
                                  handleGenerate();
                                  setLastEnterTime(0);
                                } else {
                                  // 单击回车，记录时间
                                  setLastEnterTime(currentTime);
                                }
                              }
                            }}
                            className={!prompt ? 'empty-placeholder' : ''}
                            style={{
                              maxWidth: '100%',
                              width: '100%',
                              whiteSpace: 'break-spaces',
                              wordBreak: 'break-word',
                              caretColor: 'var(--c-texPri, rgba(55, 53, 47, 1))',
                              flexGrow: 1,
                              padding: '12px',
                              minHeight: '56px',
                              maxHeight: '240px',
                              overflow: 'auto',
                              pointerEvents: 'auto',
                              color: prompt ? 'var(--c-texPri, rgba(55, 53, 47, 1))' : 'transparent',
                              cursor: 'text',
                              outline: 'none',
                              border: 'none',
                              background: 'transparent'
                            }}
                          ></div>
                        </div>

                        {/* Bottom Controls */}
                        <div
                          style={{
                            padding: '0px 8px 8px',
                            gap: '12px',
                            pointerEvents: 'none',
                            minWidth: 0,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '2px', pointerEvents: 'none', minWidth: 0, flexGrow: 1 }}>
                            <button
                              role="button"
                              tabIndex={0}
                              data-testid="unified-chat-attach-file-button"
                              aria-label="附加文件"
                              style={{
                                userSelect: 'none',
                                transition: 'background 20ms ease-in',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 0,
                                height: '28px',
                                paddingInline: 0,
                                borderRadius: '50%',
                                whiteSpace: 'nowrap',
                                fontSize: '14px',
                                fontWeight: 500,
                                lineHeight: 1.2,
                                width: '28px',
                                color: 'var(--c-texPri, rgba(55, 53, 47, 1))',
                                flexShrink: 0,
                                pointerEvents: 'auto',
                                background: 'transparent',
                                border: 'none'
                              }}
                            >
                              <Paperclip style={{ width: '20px', height: '20px', display: 'block', flexShrink: 0, color: 'var(--c-icoSec, rgba(55, 53, 47, 0.65))' }} />
                            </button>
                            <button
                              role="button"
                              tabIndex={0}
                              data-testid="unified-chat-model-button"
                              aria-expanded={false}
                              aria-haspopup="dialog"
                              style={{
                                userSelect: 'none',
                                transition: 'background 20ms ease-in',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                height: '28px',
                                paddingInline: '12px',
                                borderRadius: '50px',
                                whiteSpace: 'nowrap',
                                fontSize: '14px',
                                fontWeight: 500,
                                lineHeight: 1.2,
                                color: 'var(--c-texPri, rgba(55, 53, 47, 1))',
                                background: 'transparent',
                                gap: '6px',
                                pointerEvents: 'auto',
                                minWidth: 0,
                                maxWidth: '200px',
                                border: 'none'
                              }}
                            >
                              <div style={{ color: 'var(--c-graTexSec, rgba(55, 53, 47, 0.65))', fontSize: '14px', lineHeight: '20px', fontWeight: 500, textOverflow: 'ellipsis', whiteSpace: 'nowrap', overflow: 'hidden' }}>
                                自动
                              </div>
                            </button>
                            <button
                              role="button"
                              tabIndex={0}
                              data-testid="unified-chat-research-mode-button"
                              aria-pressed={false}
                              style={{
                                userSelect: 'none',
                                transition: 'background 20ms ease-in',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                height: '28px',
                                paddingInline: '8px',
                                borderRadius: '50px',
                                whiteSpace: 'nowrap',
                                fontSize: '14px',
                                fontWeight: 500,
                                lineHeight: 1.2,
                                color: 'var(--c-texPri, rgba(55, 53, 47, 1))',
                                background: 'transparent',
                                gap: '4px',
                                pointerEvents: 'auto',
                                border: 'none'
                              }}
                            >
                              <Eye style={{ width: '20px', height: '20px', display: 'block', flexShrink: 0, color: 'var(--c-graIcoSec, rgba(55, 53, 47, 0.65))' }} />
                              <div style={{ color: 'var(--c-graTexSec, rgba(55, 53, 47, 0.65))', fontSize: '14px', lineHeight: '20px', fontWeight: 500 }}>
                                探究
                              </div>
                            </button>
                            <button
                              role="button"
                              tabIndex={0}
                              data-testid="unified-chat-search-scope-button"
                              aria-expanded={false}
                              aria-haspopup="dialog"
                              style={{
                                userSelect: 'none',
                                transition: 'background 20ms ease-in',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                height: '28px',
                                paddingInline: '6px 10px',
                                borderRadius: '50px',
                                whiteSpace: 'nowrap',
                                fontSize: '14px',
                                fontWeight: 500,
                                lineHeight: 1.2,
                                color: 'var(--c-texPri, rgba(55, 53, 47, 1))',
                                background: 'transparent',
                                gap: '4px',
                                pointerEvents: 'auto',
                                flexShrink: 1,
                                minWidth: 0,
                                border: 'none'
                              }}
                            >
                              <Globe style={{ width: '20px', height: '20px', display: 'block', flexShrink: 0, color: 'var(--c-graIcoAccPri, #2383E2)' }} />
                              <div style={{ color: 'var(--c-graTexSec, rgba(55, 53, 47, 0.65))', fontSize: '14px', lineHeight: '20px', fontWeight: 500, textOverflow: 'ellipsis', whiteSpace: 'nowrap', overflow: 'hidden', minWidth: 0 }}>
                                全部信息源
                              </div>
                            </button>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', pointerEvents: 'none' }}>
                            <button
                              aria-disabled={!prompt.trim() || isGenerating}
                              role="button"
                              tabIndex={!prompt.trim() || isGenerating ? -1 : 0}
                              data-testid="agent-send-message-button"
                              aria-label="提交 AI 消息"
                              onClick={handleGenerate}
                              disabled={!prompt.trim() || isGenerating}
                              style={{
                                userSelect: 'none',
                                transition: 'background 20ms ease-in',
                                cursor: !prompt.trim() || isGenerating ? 'default' : 'pointer',
                                opacity: !prompt.trim() || isGenerating ? 0.4 : 1,
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 0,
                                height: '28px',
                                paddingInline: 0,
                                borderRadius: '30px',
                                whiteSpace: 'nowrap',
                                fontSize: '14px',
                                fontWeight: 500,
                                lineHeight: 1.2,
                                width: '28px',
                                color: 'var(--c-texSec, rgba(55, 53, 47, 0.65))',
                                flexShrink: 0,
                                pointerEvents: 'auto',
                                background: !prompt.trim() || isGenerating ? 'var(--ca-bacTerTra, transparent)' : 'transparent',
                                border: 'none'
                              }}
                            >
                              {isGenerating ? (
                                <Loader2 className="animate-spin" style={{ width: '16px', height: '16px', display: 'block', flexShrink: 0, color: 'var(--c-icoTer, rgba(55, 53, 47, 0.4))' }} />
                              ) : (
                                <ArrowUp style={{ width: '16px', height: '16px', display: 'block', flexShrink: 0, color: 'var(--c-icoTer, rgba(55, 53, 47, 0.4))' }} />
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Get Started Section */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                maxWidth: '710px',
                width: '100%',
                alignSelf: 'center',
                margin: '0px auto',
                paddingTop: '16px'
              }}
            >
              {showGetStarted && (
                <div
                  style={{
                    width: '100%',
                    display: 'grid',
                    gridTemplateColumns: 'repeat(2, 1fr)',
                    gap: '16px',
                    justifyContent: 'center',
                    marginBottom: '16px',
                    maxHeight: '200px',
                    opacity: 1,
                    transform: 'translateY(0px)',
                    transition: 'margin-bottom 400ms ease-out, max-height 400ms ease-out, opacity 400ms ease-out, transform 400ms ease-out',
                    overflow: 'hidden'
                  }}
                >
                  <div style={{ gridColumn: '1 / -1', display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingInlineStart: '8px', marginBottom: '-8px' }}>
                    <div style={{ color: 'var(--c-texSec, rgba(55, 53, 47, 0.65))', fontSize: '12px', lineHeight: '16px', fontWeight: 400 }}>
                      立即开始
                    </div>
                    <button
                      role="button"
                      tabIndex={0}
                      aria-label="关闭"
                      onClick={() => setShowGetStarted(false)}
                      style={{
                        userSelect: 'none',
                        transition: 'background 20ms ease-in',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 0,
                        height: '24px',
                        paddingInline: 0,
                        borderRadius: '50%',
                        whiteSpace: 'nowrap',
                        fontSize: '14px',
                        fontWeight: 500,
                        lineHeight: 1.2,
                        width: '24px',
                        color: 'var(--c-graTexAccPri, rgba(55, 53, 47, 0.65))',
                        flexShrink: 0,
                        background: 'transparent',
                        border: 'none'
                      }}
                    >
                      <X style={{ width: '16px', height: '16px', display: 'block', flexShrink: 0, color: 'var(--c-graIcoAccPri, rgba(55, 53, 47, 0.65))' }} />
                    </button>
                  </div>
                  {quickActions.map((action) => {
                    const Icon = action.icon;
                    return (
                      <button
                        key={action.id}
                        role="button"
                        tabIndex={0}
                        onClick={() => handleQuickAction(action.id)}
                        style={{
                          userSelect: 'none',
                          transition: 'opacity 800ms ease-in-out',
                          cursor: 'pointer',
                          opacity: 1,
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'flex-start',
                          gap: '10px',
                          padding: '12px',
                          borderRadius: '16px',
                          whiteSpace: 'nowrap',
                          color: 'var(--c-texSec, rgba(55, 53, 47, 0.65))',
                          backgroundColor: 'var(--ca-graBacPriTra, rgba(0, 0, 0, 0.02))',
                          flexBasis: 0,
                          flexGrow: 1,
                          border: 'none',
                          textAlign: 'left'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                          <Icon style={{ width: '20px', height: '20px', display: 'block', flexShrink: 0, color: 'var(--c-icoSec, rgba(55, 53, 47, 0.65))' }} />
                        </div>
                        <div style={{ fontSize: '12px', fontWeight: 400, lineHeight: 1.2, width: '100%', overflowWrap: 'break-word', whiteSpace: 'normal' }}>
                          {action.title}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
