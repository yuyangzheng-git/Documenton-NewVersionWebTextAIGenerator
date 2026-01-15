'use client';

import React, { useState } from 'react';

interface AIPlatform {
  id: string;
  name: string;
  description: string;
  icon: string;
  models: string[];
  defaultModel: string;
  category: 'international' | 'domestic' | 'open-source';
  docsUrl?: string;
}

const AI_PLATFORMS: AIPlatform[] = [
  // 国际主流平台
  {
    id: 'openai',
    name: 'OpenAI',
    description: 'GPT-4o, GPT-4o-mini - 行业领先的大语言模型',
    icon: '🤖',
    models: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-3.5-turbo'],
    defaultModel: 'gpt-4o',
    category: 'international',
    docsUrl: 'https://platform.openai.com/docs/models',
  },
  {
    id: 'claude',
    name: 'Claude (Anthropic)',
    description: 'Claude 3.5 Sonnet - 高性能、安全可靠',
    icon: '🧠',
    models: ['claude-3-5-sonnet-20241022', 'claude-3-5-haiku-20241022', 'claude-3-opus-20240229'],
    defaultModel: 'claude-3-5-sonnet-20241022',
    category: 'international',
    docsUrl: 'https://docs.anthropic.com/claude/reference/getting-started-with-the-api',
  },
  {
    id: 'gemini',
    name: 'Gemini (Google)',
    description: 'Gemini 2.5 Pro - Google 最新的多模态模型',
    icon: '💎',
    models: ['gemini-2.5-pro', 'gemini-2.5-flash', 'gemini-1.5-pro'],
    defaultModel: 'gemini-2.5-pro',
    category: 'international',
    docsUrl: 'https://ai.google.dev/gemini-api/docs/models',
  },
  {
    id: 'cohere',
    name: 'Cohere',
    description: 'Command R Plus - 企业级大语言模型',
    icon: '🏢',
    models: ['command-r-plus', 'command-r', 'command'],
    defaultModel: 'command-r-plus',
    category: 'international',
    docsUrl: 'https://docs.cohere.com/docs/the-cohere-platform',
  },

  // 开源/快速平台
  {
    id: 'deepseek',
    name: 'DeepSeek',
    description: 'DeepSeek Chat - 开源的高性能模型',
    icon: '🔍',
    models: ['deepseek-chat', 'deepseek-coder'],
    defaultModel: 'deepseek-chat',
    category: 'open-source',
    docsUrl: 'https://platform.deepseek.com/api-docs/',
  },
  {
    id: 'groq',
    name: 'Groq',
    description: 'Llama 3.3 - 超快速推理引擎 (LPU)',
    icon: '⚡',
    models: ['llama-3.3-70b-versatile', 'llama-3.1-70b-versatile', 'mixtral-8x7b-32768'],
    defaultModel: 'llama-3.3-70b-versatile',
    category: 'open-source',
    docsUrl: 'https://console.groq.com/docs/quickstart',
  },

  // 国内平台
  {
    id: 'qwen',
    name: 'Qwen (阿里云)',
    description: '通义千问 Plus - 阿里云大语言模型',
    icon: '☁️',
    models: ['qwen-plus', 'qwen-max', 'qwen-flash', 'qwen-turbo'],
    defaultModel: 'qwen-plus',
    category: 'domestic',
    docsUrl: 'https://help.aliyun.com/zh/model-studio/developer-reference/quick-start',
  },
  {
    id: 'zhipu',
    name: 'Zhipu (智谱)',
    description: 'GLM-4 Plus - 智谱 ChatGLM 系列',
    icon: '🎯',
    models: ['glm-4-plus', 'glm-4', 'glm-4-flash', 'glm-3-turbo'],
    defaultModel: 'glm-4-plus',
    category: 'domestic',
    docsUrl: 'https://open.bigmodel.cn/dev/api#model',
  },
  {
    id: 'wenxin',
    name: 'Wenxin (百度)',
    description: '文心一言 ERNIE - 百度大语言模型',
    icon: '🔵',
    models: ['ernie-4.0-8k', 'ernie-3.5-8k', 'ernie-speed-128k'],
    defaultModel: 'ernie-4.0-8k',
    category: 'domestic',
    docsUrl: 'https://cloud.baidu.com/doc/WENXINWORKSHOP/s/Nlks5zkzu',
  },
  {
    id: 'kimi',
    name: 'Kimi (Moonshot)',
    description: 'Moonshot-v1 - 月之暗面长上下文模型',
    icon: '🌙',
    models: ['moonshot-v1-128k', 'moonshot-v1-32k', 'moonshot-v1-8k'],
    defaultModel: 'moonshot-v1-128k',
    category: 'domestic',
  },
];

interface AIPlatformSelectorProps {
  selectedPlatform?: string;
  selectedModel?: string;
  onPlatformChange: (platform: string) => void;
  onModelChange: (model: string) => void;
}

const CATEGORY_LABELS = {
  international: '🌍 国际主流',
  domestic: '🇨🇳 国内平台',
  'open-source': '🔓 开源/快速',
};

export default function AIPlatformSelector({
  selectedPlatform,
  selectedModel,
  onPlatformChange,
  onModelChange,
}: AIPlatformSelectorProps) {
  const [filter, setFilter] = useState<string>('all');

  const selectedPlatformData = AI_PLATFORMS.find((p) => p.id === selectedPlatform);

  const filteredPlatforms =
    filter === 'all'
      ? AI_PLATFORMS
      : AI_PLATFORMS.filter((p) => p.category === filter);

  return (
    <div className="space-y-6">
      {/* Platform Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          选择 AI 平台
        </label>

        {/* Category Filter */}
        <div className="flex flex-wrap gap-2 mb-4">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              filter === 'all'
                ? 'bg-blue-100 text-blue-700'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            全部
          </button>
          {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                filter === key
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Platform Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredPlatforms.map((platform) => (
            <button
              key={platform.id}
              onClick={() => {
                onPlatformChange(platform.id);
                onModelChange(platform.defaultModel);
              }}
              className={`p-4 rounded-lg border-2 text-left transition-all hover:shadow-md ${
                selectedPlatform === platform.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{platform.icon}</span>
                  <span className="font-semibold text-gray-900">{platform.name}</span>
                </div>
                {selectedPlatform === platform.id && (
                  <span className="text-blue-500">✓</span>
                )}
              </div>
              <p className="text-sm text-gray-600 mb-2">{platform.description}</p>
              <div className="text-xs text-gray-500">
                {platform.models.length} 个模型可用
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Model Selection */}
      {selectedPlatformData && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            选择模型
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {selectedPlatformData.models.map((model) => (
              <button
                key={model}
                onClick={() => onModelChange(model)}
                className={`p-3 rounded-lg border text-left transition-all ${
                  selectedModel === model
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-sm">{model}</span>
                  {selectedModel === model && <span className="text-blue-500">✓</span>}
                </div>
              </button>
            ))}
          </div>
          {selectedPlatformData.docsUrl && (
            <a
              href={selectedPlatformData.docsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 mt-3 text-sm text-blue-600 hover:text-blue-700"
            >
              📖 查看 {selectedPlatformData.name} 官方文档
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          )}
        </div>
      )}
    </div>
  );
}
