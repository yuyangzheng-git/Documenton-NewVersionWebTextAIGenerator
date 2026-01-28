'use client';

import { useState, useEffect } from 'react';
import { Settings, X, Check, AlertCircle, Loader2 } from 'lucide-react';
import { useStore } from '@/store/useStore';

export function SettingsModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const {
    apiKey,
    setApiKey,
    apiUrl,
    setApiUrl,
    chapterApiKey,
    setChapterApiKey,
    chatApiKey,
    setChatApiKey,
  } = useStore();

  const [localApiKey, setLocalApiKey] = useState(apiKey);
  const [localApiUrl, setLocalApiUrl] = useState(apiUrl);
  const [localChapterApiKey, setLocalChapterApiKey] = useState(chapterApiKey);
  const [localChatApiKey, setLocalChatApiKey] = useState(chatApiKey);

  const [testing, setTesting] = useState(false);
  const [testResults, setTestResults] = useState<{
    outline?: { success: boolean; message: string };
    chapter?: { success: boolean; message: string };
    chat?: { success: boolean; message: string };
  }>({});

  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    setHasChanges(
      localApiKey !== apiKey ||
        localApiUrl !== apiUrl ||
        localChapterApiKey !== chapterApiKey ||
        localChatApiKey !== chatApiKey
    );
  }, [localApiKey, localApiUrl, localChapterApiKey, localChatApiKey, apiKey, apiUrl, chapterApiKey, chatApiKey]);

  const handleSave = () => {
    setApiKey(localApiKey);
    setApiUrl(localApiUrl);
    setChapterApiKey(localChapterApiKey);
    setChatApiKey(localChatApiKey);
    setHasChanges(false);
    onClose();
  };

  const handleCancel = () => {
    setLocalApiKey(apiKey);
    setLocalApiUrl(apiUrl);
    setLocalChapterApiKey(chapterApiKey);
    setLocalChatApiKey(chatApiKey);
    setHasChanges(false);
    onClose();
  };

  const testConnection = async (type: 'outline' | 'chapter' | 'chat') => {
    const keyMap = {
      outline: localApiKey,
      chapter: localChapterApiKey,
      chat: localChatApiKey,
    };

    const key = keyMap[type];

    if (!key) {
      setTestResults(prev => ({
        ...prev,
        [type]: { success: false, message: 'API Key 不能为空' },
      }));
      return;
    }

    setTesting(true);
    setTestResults(prev => ({ ...prev, [type]: { success: false, message: '测试中...' } }));

    try {
      const response = await fetch(`${localApiUrl}/workflows/run`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${key}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputs: {},
          response_mode: 'blocking',
          user: 'test',
        }),
      });

      if (response.ok) {
        setTestResults(prev => ({
          ...prev,
          [type]: { success: true, message: '连接成功 ✅' },
        }));
      } else {
        const error = await response.text();
        setTestResults(prev => ({
          ...prev,
          [type]: { success: false, message: `连接失败: ${response.status}` },
        }));
      }
    } catch (error) {
      setTestResults(prev => ({
        ...prev,
        [type]: {
          success: false,
          message: `连接失败: ${error instanceof Error ? error.message : '未知错误'}`,
        },
      }));
    } finally {
      setTesting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: 'white',
          borderRadius: '16px',
          width: '90%',
          maxWidth: '600px',
          maxHeight: '90vh',
          overflow: 'auto',
          padding: '24px',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '24px',
            paddingBottom: '16px',
            borderBottom: '1px solid rgba(55, 53, 47, 0.09)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Settings style={{ width: '24px', height: '24px', color: '#2383E2' }} />
            <h2 style={{ fontSize: '18px', fontWeight: 600, margin: 0 }}>Dify 配置</h2>
          </div>
          <button
            onClick={onClose}
            style={{
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              padding: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <X style={{ width: '20px', height: '20px', color: 'rgba(55, 53, 47, 0.5)' }} />
          </button>
        </div>

        {/* Base URL */}
        <div style={{ marginBottom: '24px' }}>
          <label
            style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: 500,
              marginBottom: '8px',
              color: 'rgba(55, 53, 47, 1)',
            }}
          >
            Dify Base URL
          </label>
          <input
            type="text"
            value={localApiUrl}
            onChange={(e) => setLocalApiUrl(e.target.value)}
            placeholder="https://your-dify-instance.com/v1"
            style={{
              width: '100%',
              padding: '10px 14px',
              borderRadius: '8px',
              border: '1px solid rgba(55, 53, 47, 0.15)',
              outline: 'none',
              fontSize: '14px',
              boxSizing: 'border-box',
            }}
          />
          <p
            style={{
              fontSize: '12px',
              color: 'rgba(55, 53, 47, 0.4)',
              marginTop: '4px',
              margin: '4px 0 0 0',
            }}
          >
            Dify 实例的基础 URL，包含 /v1 路径
          </p>
        </div>

        {/* Outline API Key */}
        <div style={{ marginBottom: '24px' }}>
          <label
            style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: 500,
              marginBottom: '8px',
              color: 'rgba(55, 53, 47, 1)',
            }}
          >
            大纲写作 API Key
          </label>
          <input
            type="password"
            value={localApiKey}
            onChange={(e) => setLocalApiKey(e.target.value)}
            placeholder="app-xxxxxxxxxxxx"
            style={{
              width: '100%',
              padding: '10px 14px',
              borderRadius: '8px',
              border: '1px solid rgba(55, 53, 47, 0.15)',
              outline: 'none',
              fontSize: '14px',
              boxSizing: 'border-box',
            }}
          />
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '8px' }}>
            <button
              onClick={() => testConnection('outline')}
              disabled={testing}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                border: '1px solid rgba(55, 53, 47, 0.15)',
                background: 'white',
                cursor: testing ? 'not-allowed' : 'pointer',
                fontSize: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              {testing ? (
                <Loader2 style={{ width: '14px', height: '14px' }} className="animate-spin" />
              ) : (
                '测试连接'
              )}
            </button>
            {testResults.outline && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '12px',
                  color: testResults.outline.success ? '#22c55e' : '#ef4444',
                }}
              >
                {testResults.outline.success ? (
                  <Check style={{ width: '16px', height: '16px' }} />
                ) : (
                  <AlertCircle style={{ width: '16px', height: '16px' }} />
                )}
                {testResults.outline.message}
              </div>
            )}
          </div>
          <p
            style={{
              fontSize: '12px',
              color: 'rgba(55, 53, 47, 0.4)',
              marginTop: '4px',
              margin: '4px 0 0 0',
            }}
          >
            用于生成文档大纲的 Workflow API Key
          </p>
        </div>

        {/* Chapter API Key */}
        <div style={{ marginBottom: '24px' }}>
          <label
            style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: 500,
              marginBottom: '8px',
              color: 'rgba(55, 53, 47, 1)',
            }}
          >
            正文写作 API Key
          </label>
          <input
            type="password"
            value={localChapterApiKey}
            onChange={(e) => setLocalChapterApiKey(e.target.value)}
            placeholder="app-xxxxxxxxxxxx"
            style={{
              width: '100%',
              padding: '10px 14px',
              borderRadius: '8px',
              border: '1px solid rgba(55, 53, 47, 0.15)',
              outline: 'none',
              fontSize: '14px',
              boxSizing: 'border-box',
            }}
          />
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '8px' }}>
            <button
              onClick={() => testConnection('chapter')}
              disabled={testing}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                border: '1px solid rgba(55, 53, 47, 0.15)',
                background: 'white',
                cursor: testing ? 'not-allowed' : 'pointer',
                fontSize: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              {testing ? (
                <Loader2 style={{ width: '14px', height: '14px' }} className="animate-spin" />
              ) : (
                '测试连接'
              )}
            </button>
            {testResults.chapter && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '12px',
                  color: testResults.chapter.success ? '#22c55e' : '#ef4444',
                }}
              >
                {testResults.chapter.success ? (
                  <Check style={{ width: '16px', height: '16px' }} />
                ) : (
                  <AlertCircle style={{ width: '16px', height: '16px' }} />
                )}
                {testResults.chapter.message}
              </div>
            )}
          </div>
          <p
            style={{
              fontSize: '12px',
              color: 'rgba(55, 53, 47, 0.4)',
              marginTop: '4px',
              margin: '4px 0 0 0',
            }}
          >
            用于生成章节内容的 Workflow API Key
          </p>
        </div>

        {/* Chat API Key */}
        <div style={{ marginBottom: '24px' }}>
          <label
            style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: 500,
              marginBottom: '8px',
              color: 'rgba(55, 53, 47, 1)',
            }}
          >
            LLM 对话 API Key
          </label>
          <input
            type="password"
            value={localChatApiKey}
            onChange={(e) => setLocalChatApiKey(e.target.value)}
            placeholder="app-xxxxxxxxxxxx"
            style={{
              width: '100%',
              padding: '10px 14px',
              borderRadius: '8px',
              border: '1px solid rgba(55, 53, 47, 0.15)',
              outline: 'none',
              fontSize: '14px',
              boxSizing: 'border-box',
            }}
          />
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '8px' }}>
            <button
              onClick={() => testConnection('chat')}
              disabled={testing}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                border: '1px solid rgba(55, 53, 47, 0.15)',
                background: 'white',
                cursor: testing ? 'not-allowed' : 'pointer',
                fontSize: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              {testing ? (
                <Loader2 style={{ width: '14px', height: '14px' }} className="animate-spin" />
              ) : (
                '测试连接'
              )}
            </button>
            {testResults.chat && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '12px',
                  color: testResults.chat.success ? '#22c55e' : '#ef4444',
                }}
              >
                {testResults.chat.success ? (
                  <Check style={{ width: '16px', height: '16px' }} />
                ) : (
                  <AlertCircle style={{ width: '16px', height: '16px' }} />
                )}
                {testResults.chat.message}
              </div>
            )}
          </div>
          <p
            style={{
              fontSize: '12px',
              color: 'rgba(55, 53, 47, 0.4)',
              marginTop: '4px',
              margin: '4px 0 0 0',
            }}
          >
            用于右下角 AI 助手对话的 Chatbot App API Key
          </p>
        </div>

        {/* Help Link */}
        <div
          style={{
            padding: '12px',
            backgroundColor: 'rgba(35, 131, 226, 0.05)',
            borderRadius: '8px',
            marginBottom: '24px',
          }}
        >
          <p style={{ fontSize: '12px', margin: 0, color: 'rgba(55, 53, 47, 0.6)' }}>
            💡 需要帮助？请查看{' '}
            <a
              href="/DIFY_API_KEYS_GUIDE.md"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                color: '#2383E2',
                textDecoration: 'none',
                fontWeight: 500,
              }}
            >
              Dify API Keys 配置指南
            </a>
          </p>
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <button
            onClick={handleCancel}
            disabled={!hasChanges}
            style={{
              padding: '10px 20px',
              borderRadius: '8px',
              border: '1px solid rgba(55, 53, 47, 0.15)',
              background: 'white',
              cursor: hasChanges ? 'pointer' : 'not-allowed',
              fontSize: '14px',
              opacity: hasChanges ? 1 : 0.5,
            }}
          >
            取消
          </button>
          <button
            onClick={handleSave}
            disabled={!hasChanges}
            style={{
              padding: '10px 20px',
              borderRadius: '8px',
              border: 'none',
              background: hasChanges
                ? 'linear-gradient(135deg, #2383E2 0%, #1A6FC4 100%)'
                : 'rgba(35, 131, 226, 0.3)',
              color: 'white',
              cursor: hasChanges ? 'pointer' : 'not-allowed',
              fontSize: '14px',
              opacity: hasChanges ? 1 : 0.5,
            }}
          >
            保存
          </button>
        </div>
      </div>
    </div>
  );
}
