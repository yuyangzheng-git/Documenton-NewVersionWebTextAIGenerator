'use client';

import { useState, useEffect } from 'react';
import { ArrowUp, Loader2, Settings, Check, X as Cross, FileText, Sparkles, LayoutList, BookOpen } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { generateOutline } from '@/store/useDocumentActions';
import { useStore } from '@/store/useStore';
import { validateDifyWorkflowKey } from '@/lib/dify-api';

export default function Home() {
  const router = useRouter();
  const [prompt, setPrompt] = useState('');
  const [showQuickStart, setShowQuickStart] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [apiUrl, setApiUrl] = useState('');
  const [chapterApiKey, setChapterApiKey] = useState('');
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [connectionTestResult, setConnectionTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const { setDocumentTitle, apiKey: storedApiKey, setApiKey: saveApiKey, apiUrl: storedApiUrl, setApiUrl: saveApiUrl, chapterApiKey: storedChapterApiKey, setChapterApiKey: saveChapterApiKey, aiPlatform, setAIPlatform, openaiApiKey, openaiModel, openaiBaseUrl, setOpenaiApiKey, setOpenaiModel, setOpenaiBaseUrl, geminiApiKey, geminiModel, geminiBaseUrl, setGeminiApiKey, setGeminiModel, setGeminiBaseUrl, kimiApiKey, kimiModel, kimiBaseUrl, setKimiApiKey, setKimiModel, setKimiBaseUrl, qwenApiKey, qwenModel, qwenBaseUrl, setQwenApiKey, setQwenModel, setQwenBaseUrl } = useStore();

  useEffect(() => {
    if (storedApiKey) {
      setApiKey(storedApiKey);
    }
    if (storedApiUrl) {
      setApiUrl(storedApiUrl);
    }
    if (storedChapterApiKey) {
      setChapterApiKey(storedChapterApiKey);
    }
    if (openaiApiKey) {
      setOpenaiApiKey(openaiApiKey);
    }
    if (openaiModel) {
      setOpenaiModel(openaiModel);
    }
    if (openaiBaseUrl) {
      setOpenaiBaseUrl(openaiBaseUrl);
    }
    if (geminiApiKey) {
      setGeminiApiKey(geminiApiKey);
    }
    if (geminiModel) {
      setGeminiModel(geminiModel);
    }
    if (geminiBaseUrl) {
      setGeminiBaseUrl(geminiBaseUrl);
    }
    if (kimiApiKey) {
      setKimiApiKey(kimiApiKey);
    }
    if (kimiModel) {
      setKimiModel(kimiModel);
    }
    if (kimiBaseUrl) {
      setKimiBaseUrl(kimiBaseUrl);
    }
    if (qwenApiKey) {
      setQwenApiKey(qwenApiKey);
    }
    if (qwenModel) {
      setQwenModel(qwenModel);
    }
    if (qwenBaseUrl) {
      setQwenBaseUrl(qwenBaseUrl);
    }
  }, [storedApiKey, storedApiUrl, storedChapterApiKey, openaiApiKey, openaiModel, openaiBaseUrl, geminiApiKey, geminiModel, geminiBaseUrl, kimiApiKey, kimiModel, kimiBaseUrl, qwenApiKey, qwenModel, qwenBaseUrl]);

  const testConnection = async () => {
    setIsTestingConnection(true);
    setConnectionTestResult(null);

    try {
      if (aiPlatform === 'dify') {
        if (!apiKey || apiKey === 'app-xxxxxxxxxxxxxxxxxxx') {
          throw new Error('请先输入有效的 API Key');
        }
        if (!apiUrl || apiUrl === 'http://your-dify-instance/v1') {
          throw new Error('请先输入有效的 API URL');
        }
        await validateDifyWorkflowKey(apiKey);
      } else if (aiPlatform === 'openai') {
        if (!openaiApiKey || !openaiApiKey.startsWith('sk-')) {
          throw new Error('请先输入有效的 OpenAI API Key');
        }
        // Test by making a simple request
        const response = await fetch(`${openaiBaseUrl}/models`, {
          headers: {
            'Authorization': `Bearer ${openaiApiKey}`,
          },
        });
        if (!response.ok) {
          throw new Error('OpenAI API 连接失败，请检查 API Key 和 Base URL');
        }
      } else if (aiPlatform === 'gemini') {
        if (!geminiApiKey) {
          throw new Error('请先输入有效的 Gemini API Key');
        }
        // Test by making a simple request
        const response = await fetch(`${geminiBaseUrl}/models?key=${geminiApiKey}`);
        if (!response.ok) {
          throw new Error('Gemini API 连接失败，请检查 API Key 和 Base URL');
        }
      } else if (aiPlatform === 'kimi') {
        if (!kimiApiKey || !kimiApiKey.startsWith('sk-')) {
          throw new Error('请先输入有效的 Kimi API Key');
        }
        // Test by making a simple request
        const response = await fetch(`${kimiBaseUrl}/models`, {
          headers: {
            'Authorization': `Bearer ${kimiApiKey}`,
          },
        });
        if (!response.ok) {
          throw new Error('Kimi API 连接失败，请检查 API Key 和 Base URL');
        }
      } else if (aiPlatform === 'qwen') {
        if (!qwenApiKey || !qwenApiKey.startsWith('sk-')) {
          throw new Error('请先输入有效的 Qwen API Key');
        }
        // Test by making a simple request
        const response = await fetch(`${qwenBaseUrl}/models`, {
          headers: {
            'Authorization': `Bearer ${qwenApiKey}`,
          },
        });
        if (!response.ok) {
          throw new Error('Qwen API 连接失败，请检查 API Key 和 Base URL');
        }
      } else if (aiPlatform === 'deepseek' || aiPlatform === 'claude' || aiPlatform === 'groq' || aiPlatform === 'cohere' || aiPlatform === 'wenxin' || aiPlatform === 'zhipu') {
        // For other platforms, just validate API key is present
        throw new Error('请在设置中填写相应的 API Key 后使用');
      } else {
        throw new Error('请选择 AI 平台');
      }

      setConnectionTestResult({
        success: true,
        message: '连接成功! API 配置正确'
      });
    } catch (error: any) {
      setConnectionTestResult({
        success: false,
        message: `连接失败: ${error.message}`
      });
    } finally {
      setIsTestingConnection(false);
    }
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    setIsGenerating(true);

    try {
      const title = prompt.slice(0, 50) + (prompt.length > 50 ? '...' : '');
      setDocumentTitle(title);

      if (!storedApiKey) {
        alert('请先在设置中配置 Dify API Key');
        setShowSettings(true);
        setIsGenerating(false);
        return;
      }

      if (!storedApiUrl || storedApiUrl === 'http://your-dify-instance/v1') {
        alert('请先在设置中配置 Dify API Base URL');
        setShowSettings(true);
        setIsGenerating(false);
        return;
      }

      await generateOutline(prompt);
      router.push('/word-editor');
    } catch (error: any) {
      console.error('Error generating outline:', error);

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

        {/* Right Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={() => setShowSettings(!showSettings)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 16px',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 500,
              color: 'rgba(55, 53, 47, 0.85)',
              backgroundColor: 'rgba(55, 53, 47, 0.04)',
              border: '1px solid rgba(55, 53, 47, 0.08)',
              cursor: 'pointer',
              transition: 'all 200ms ease-in-out',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(55, 53, 47, 0.08)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(55, 53, 47, 0.04)';
            }}
          >
            <Settings style={{ width: '16px', height: '16px' }} />
            <span>API 设置</span>
          </button>
        </div>
      </nav>

      {/* API Settings Modal */}
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
            padding: '20px'
          }}
          onClick={() => setShowSettings(false)}
        >
          <div
            style={{
              backgroundColor: 'white',
              borderRadius: '16px',
              padding: '24px',
              width: '520px',
              maxWidth: '100%',
              maxHeight: '90vh',
              overflow: 'auto',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '24px', color: 'rgba(55, 53, 47, 1)' }}>
              AI 模型设置
            </h3>

            {/* Platform Selection */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '14px', marginBottom: '8px', color: 'rgba(55, 53, 47, 0.65)', fontWeight: 500 }}>
                选择 AI 平台
              </label>
              <select
                value={aiPlatform}
                onChange={(e) => setAIPlatform(e.target.value as any)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid rgba(55, 53, 47, 0.12)',
                  borderRadius: '8px',
                  fontSize: '14px',
                  color: 'rgba(55, 53, 47, 1)',
                  backgroundColor: 'white',
                  cursor: 'pointer',
                }}
              >
                <option value="dify">Dify</option>
                <option value="openai">OpenAI (GPT-4/GPT-3.5)</option>
                <option value="gemini">Google Gemini</option>
                <option value="kimi">Kimi (Moonshot AI)</option>
                <option value="qwen">通义千问 (Qwen)</option>
                <option value="deepseek">DeepSeek (深度求索)</option>
                <option value="claude">Claude (Anthropic)</option>
                <option value="groq">Groq (超快速)</option>
                <option value="cohere">Cohere</option>
                <option value="wenxin">百度文心一言</option>
                <option value="zhipu">智谱 GLM</option>
              </select>
            </div>

            {/* Dify Configuration */}
            {aiPlatform === 'dify' && (
              <div style={{ marginBottom: '16px' }}>
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'block', fontSize: '14px', marginBottom: '6px', color: 'rgba(55, 53, 47, 0.65)', fontWeight: 500 }}>
                    API Base URL
                  </label>
                  <input
                    type="text"
                    value={apiUrl}
                    onChange={(e) => setApiUrl(e.target.value)}
                    placeholder="http://your-dify-instance/v1"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid rgba(55, 53, 47, 0.12)',
                      borderRadius: '8px',
                      fontSize: '14px',
                      color: 'rgba(55, 53, 47, 1)',
                    }}
                  />
                </div>
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'block', fontSize: '14px', marginBottom: '6px', color: 'rgba(55, 53, 47, 0.65)', fontWeight: 500 }}>
                    Workflow API Key (大纲生成)
                  </label>
                  <input
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="app-xxxxxxxxxxxxxxxxxxx"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid rgba(55, 53, 47, 0.12)',
                      borderRadius: '8px',
                      fontSize: '14px',
                      color: 'rgba(55, 53, 47, 1)',
                    }}
                  />
                </div>
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'block', fontSize: '14px', marginBottom: '6px', color: 'rgba(55, 53, 47, 0.65)', fontWeight: 500 }}>
                    Chapter API Key (正文生成)
                  </label>
                  <input
                    type="password"
                    value={chapterApiKey}
                    onChange={(e) => setChapterApiKey(e.target.value)}
                    placeholder="app-xxxxxxxxxxxxxxxxxxx"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid rgba(55, 53, 47, 0.12)',
                      borderRadius: '8px',
                      fontSize: '14px',
                      color: 'rgba(55, 53, 47, 1)',
                    }}
                  />
                </div>
              </div>
            )}

            {/* OpenAI Configuration */}
            {aiPlatform === 'openai' && (
              <div style={{ marginBottom: '16px' }}>
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'block', fontSize: '14px', marginBottom: '6px', color: 'rgba(55, 53, 47, 0.65)', fontWeight: 500 }}>
                    API Base URL
                  </label>
                  <input
                    type="text"
                    value={openaiBaseUrl}
                    onChange={(e) => setOpenaiBaseUrl(e.target.value)}
                    placeholder="https://api.openai.com/v1"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid rgba(55, 53, 47, 0.12)',
                      borderRadius: '8px',
                      fontSize: '14px',
                      color: 'rgba(55, 53, 47, 1)',
                    }}
                  />
                </div>
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'block', fontSize: '14px', marginBottom: '6px', color: 'rgba(55, 53, 47, 0.65)', fontWeight: 500 }}>
                    API Key
                  </label>
                  <input
                    type="password"
                    value={openaiApiKey}
                    onChange={(e) => setOpenaiApiKey(e.target.value)}
                    placeholder="sk-xxxxxxxxxxxxxxxxxxx"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid rgba(55, 53, 47, 0.12)',
                      borderRadius: '8px',
                      fontSize: '14px',
                      color: 'rgba(55, 53, 47, 1)',
                    }}
                  />
                </div>
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'block', fontSize: '14px', marginBottom: '6px', color: 'rgba(55, 53, 47, 0.65)', fontWeight: 500 }}>
                    模型
                  </label>
                  <select
                    value={openaiModel}
                    onChange={(e) => setOpenaiModel(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid rgba(55, 53, 47, 0.12)',
                      borderRadius: '8px',
                      fontSize: '14px',
                      color: 'rgba(55, 53, 47, 1)',
                      backgroundColor: 'white',
                      cursor: 'pointer',
                    }}
                  >
                    <option value="gpt-4o">GPT-4o</option>
                    <option value="gpt-4-turbo">GPT-4 Turbo</option>
                    <option value="gpt-4">GPT-4</option>
                    <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                  </select>
                </div>
              </div>
            )}

            {/* Gemini Configuration */}
            {aiPlatform === 'gemini' && (
              <div style={{ marginBottom: '16px' }}>
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'block', fontSize: '14px', marginBottom: '6px', color: 'rgba(55, 53, 47, 0.65)', fontWeight: 500 }}>
                    API Base URL
                  </label>
                  <input
                    type="text"
                    value={geminiBaseUrl}
                    onChange={(e) => setGeminiBaseUrl(e.target.value)}
                    placeholder="https://generativelanguage.googleapis.com/v1beta"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid rgba(55, 53, 47, 0.12)',
                      borderRadius: '8px',
                      fontSize: '14px',
                      color: 'rgba(55, 53, 47, 1)',
                    }}
                  />
                </div>
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'block', fontSize: '14px', marginBottom: '6px', color: 'rgba(55, 53, 47, 0.65)', fontWeight: 500 }}>
                    API Key
                  </label>
                  <input
                    type="password"
                    value={geminiApiKey}
                    onChange={(e) => setGeminiApiKey(e.target.value)}
                    placeholder="AIzaSy..."
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid rgba(55, 53, 47, 0.12)',
                      borderRadius: '8px',
                      fontSize: '14px',
                      color: 'rgba(55, 53, 47, 1)',
                    }}
                  />
                </div>
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'block', fontSize: '14px', marginBottom: '6px', color: 'rgba(55, 53, 47, 0.65)', fontWeight: 500 }}>
                    模型
                  </label>
                  <select
                    value={geminiModel}
                    onChange={(e) => setGeminiModel(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid rgba(55, 53, 47, 0.12)',
                      borderRadius: '8px',
                      fontSize: '14px',
                      color: 'rgba(55, 53, 47, 1)',
                      backgroundColor: 'white',
                      cursor: 'pointer',
                    }}
                  >
                    <option value="gemini-1.5-pro">Gemini 1.5 Pro</option>
                    <option value="gemini-1.5-flash">Gemini 1.5 Flash</option>
                    <option value="gemini-pro">Gemini Pro</option>
                  </select>
                </div>
              </div>
            )}

            {/* Kimi Configuration */}
            {aiPlatform === 'kimi' && (
              <div style={{ marginBottom: '16px' }}>
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'block', fontSize: '14px', marginBottom: '6px', color: 'rgba(55, 53, 47, 0.65)', fontWeight: 500 }}>
                    API Base URL
                  </label>
                  <input
                    type="text"
                    value={kimiBaseUrl}
                    onChange={(e) => setKimiBaseUrl(e.target.value)}
                    placeholder="https://api.moonshot.cn/v1"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid rgba(55, 53, 47, 0.12)',
                      borderRadius: '8px',
                      fontSize: '14px',
                      color: 'rgba(55, 53, 47, 1)',
                    }}
                  />
                </div>
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'block', fontSize: '14px', marginBottom: '6px', color: 'rgba(55, 53, 47, 0.65)', fontWeight: 500 }}>
                    API Key
                  </label>
                  <input
                    type="password"
                    value={kimiApiKey}
                    onChange={(e) => setKimiApiKey(e.target.value)}
                    placeholder="sk-xxxxxxxxxxxxxxxxxxx"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid rgba(55, 53, 47, 0.12)',
                      borderRadius: '8px',
                      fontSize: '14px',
                      color: 'rgba(55, 53, 47, 1)',
                    }}
                  />
                </div>
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'block', fontSize: '14px', marginBottom: '6px', color: 'rgba(55, 53, 47, 0.65)', fontWeight: 500 }}>
                    模型
                  </label>
                  <select
                    value={kimiModel}
                    onChange={(e) => setKimiModel(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid rgba(55, 53, 47, 0.12)',
                      borderRadius: '8px',
                      fontSize: '14px',
                      color: 'rgba(55, 53, 47, 1)',
                      backgroundColor: 'white',
                      cursor: 'pointer',
                    }}
                  >
                    <option value="moonshot-v1-128k">Moonshot v1 128K</option>
                    <option value="moonshot-v1-32k">Moonshot v1 32K</option>
                    <option value="moonshot-v1-8k">Moonshot v1 8K</option>
                  </select>
                </div>
              </div>
            )}

            {/* Qwen Configuration */}
            {aiPlatform === 'qwen' && (
              <div style={{ marginBottom: '16px' }}>
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'block', fontSize: '14px', marginBottom: '6px', color: 'rgba(55, 53, 47, 0.65)', fontWeight: 500 }}>
                    API Base URL
                  </label>
                  <input
                    type="text"
                    value={qwenBaseUrl}
                    onChange={(e) => setQwenBaseUrl(e.target.value)}
                    placeholder="https://dashscope.aliyuncs.com/compatible-mode/v1"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid rgba(55, 53, 47, 0.12)',
                      borderRadius: '8px',
                      fontSize: '14px',
                      color: 'rgba(55, 53, 47, 1)',
                    }}
                  />
                </div>
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'block', fontSize: '14px', marginBottom: '6px', color: 'rgba(55, 53, 47, 0.65)', fontWeight: 500 }}>
                    API Key
                  </label>
                  <input
                    type="password"
                    value={qwenApiKey}
                    onChange={(e) => setQwenApiKey(e.target.value)}
                    placeholder="sk-xxxxxxxxxxxxxxxxxxx"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid rgba(55, 53, 47, 0.12)',
                      borderRadius: '8px',
                      fontSize: '14px',
                      color: 'rgba(55, 53, 47, 1)',
                    }}
                  />
                </div>
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'block', fontSize: '14px', marginBottom: '6px', color: 'rgba(55, 53, 47, 0.65)', fontWeight: 500 }}>
                    模型
                  </label>
                  <select
                    value={qwenModel}
                    onChange={(e) => setQwenModel(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid rgba(55, 53, 47, 0.12)',
                      borderRadius: '8px',
                      fontSize: '14px',
                      color: 'rgba(55, 53, 47, 1)',
                      backgroundColor: 'white',
                      cursor: 'pointer',
                    }}
                  >
                    <option value="qwen-plus">Qwen Plus</option>
                    <option value="qwen-turbo">Qwen Turbo</option>
                    <option value="qwen-max">Qwen Max</option>
                    <option value="qwen-long">Qwen Long</option>
                  </select>
                </div>
              </div>
            )}

            {/* Connection Test Result */}
            {connectionTestResult && (
              <div
                style={{
                  padding: '12px',
                  borderRadius: '8px',
                  backgroundColor: connectionTestResult.success ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                  border: `1px solid ${connectionTestResult.success ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                  marginBottom: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                {connectionTestResult.success ? (
                  <Check style={{ width: '18px', height: '18px', color: '#22c55e', flexShrink: 0 }} />
                ) : (
                  <Cross style={{ width: '18px', height: '18px', color: '#ef4444', flexShrink: 0 }} />
                )}
                <span style={{
                  fontSize: '13px',
                  color: connectionTestResult.success ? '#166534' : '#991b1b',
                }}>
                  {connectionTestResult.message}
                </span>
              </div>
            )}

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'space-between' }}>
              <button
                onClick={testConnection}
                disabled={isTestingConnection}
                style={{
                  padding: '10px 20px',
                  borderRadius: '8px',
                  border: 'none',
                  background: 'rgba(35, 131, 226, 0.1)',
                  color: '#2383E2',
                  fontSize: '14px',
                  cursor: isTestingConnection ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                {isTestingConnection ? (
                  <>
                    <Loader2 className="animate-spin" style={{ width: '16px', height: '16px' }} />
                    测试中...
                  </>
                ) : (
                  '测试连接'
                )}
              </button>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  onClick={() => {
                    setShowSettings(false);
                    setConnectionTestResult(null);
                  }}
                  style={{
                    padding: '10px 20px',
                    borderRadius: '8px',
                    border: '1px solid rgba(55, 53, 47, 0.12)',
                    background: 'transparent',
                    fontSize: '14px',
                    cursor: 'pointer',
                    color: 'rgba(55, 53, 47, 0.85)'
                  }}
                >
                  取消
                </button>
                <button
                  onClick={() => {
                    // Save based on selected platform
                    if (aiPlatform === 'dify') {
                      saveApiKey(apiKey);
                      saveApiUrl(apiUrl);
                      saveChapterApiKey(chapterApiKey);
                    } else if (aiPlatform === 'openai') {
                      setOpenaiApiKey(openaiApiKey);
                      setOpenaiModel(openaiModel);
                      setOpenaiBaseUrl(openaiBaseUrl);
                    } else if (aiPlatform === 'gemini') {
                      setGeminiApiKey(geminiApiKey);
                      setGeminiModel(geminiModel);
                      setGeminiBaseUrl(geminiBaseUrl);
                    } else if (aiPlatform === 'kimi') {
                      setKimiApiKey(kimiApiKey);
                      setKimiModel(kimiModel);
                      setKimiBaseUrl(kimiBaseUrl);
                    } else if (aiPlatform === 'qwen') {
                      setQwenApiKey(qwenApiKey);
                      setQwenModel(qwenModel);
                      setQwenBaseUrl(qwenBaseUrl);
                    }
                    // Other platforms just save the platform selection
                    setShowSettings(false);
                    setConnectionTestResult(null);
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
        </div>
      )}

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
              fontSize: Math.min(56, Math.max(40, window.innerWidth * 0.05)),
              fontWeight: 700,
              margin: '0 0 20px 0',
              background: 'linear-gradient(135deg, #2383E2 0%, #1A6FC4 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              letterSpacing: '-0.02em'
            }}
          >
            {isGenerating ? '正在为您生成文档大纲...' : 'AI 驱动的超长文本生成器'}
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
                        onKeyDown={(e) => {
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
      `}</style>
    </div>
  );
}
