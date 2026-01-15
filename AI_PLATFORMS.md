# AI 平台配置指南

本文档介绍如何配置和项目支持的所有主流 AI 平台。

## 支持的平台

| 平台 | 提供商 | 状态 | 说明 |
|------|---------|------|------|
| **Dify** | Dify | ✅ 已支持 | 开源 AI 应用开发平台 |
| **OpenAI** | OpenAI | ✅ 已支持 | GPT-4, GPT-3.5 等模型 |
| **Gemini** | Google | ✅ 已支持 | Google Gemini 系列模型 |
| **Kimi** | Moonshot AI | ✅ 已支持 | 月之暗面 Kimi 模型 |
| **Qwen** | 阿里云 | ✅ 已支持 | 通义千问系列模型 |
| **LangChain** | LangChain | ✅ 已支持 | LLM 应用开发框架 |
| **DeepSeek** | DeepSeek | ✅ 新增 | DeepSeek 开源模型 |
| **Claude** | Anthropic | ✅ 新增 | Claude 3.5 系列 |
| **Groq** | Groq | ✅ 新增 | 超快速推理引擎 |
| **Cohere** | Cohere | ✅ 新增 | Command 系列模型 |
| **Wenxin** | 百度 | ✅ 新增 | 文心一言 (ERNIE) |
| **Zhipu** | 智谱 AI | ✅ 新增 | ChatGLM 系列 |

---

## 1. DeepSeek 配置

### 获取 API Key

1. 访问 [DeepSeek 开放平台](https://platform.deepseek.com/)
2. 注册并登录账号
3. 在控制台获取 API Key

### 环境变量配置

```env
NEXT_PUBLIC_DEEPSEEK_API_KEY=your_deepseek_api_key_here
NEXT_PUBLIC_DEEPSEEK_MODEL=deepseek-chat
NEXT_PUBLIC_DEEPSEEK_BASE_URL=https://api.deepseek.com
```

### 支持的模型

- `deepseek-chat` - 通用对话模型
- `deepseek-coder` - 代码专用模型

### API 特性

- OpenAI 兼容接口
- 支持流式输出
- 长上下文支持 (128K)

---

## 2. Claude (Anthropic) 配置

### 获取 API Key

1. 访问 [Anthropic Console](https://console.anthropic.com/)
2. 注册并登录账号
3. 在 API Keys 页面创建新的 API Key

### 环境变量配置

```env
NEXT_PUBLIC_CLAUDE_API_KEY=your_claude_api_key_here
NEXT_PUBLIC_CLAUDE_MODEL=claude-3-5-sonnet-20241022
NEXT_PUBLIC_CLAUDE_BASE_URL=https://api.anthropic.com
```

### 支持的模型

- `claude-3-5-sonnet-20241022` - 最强性能模型
- `claude-3-5-haiku-20241022` - 快速响应模型
- `claude-3-opus-20240229` - 高质量模型

### API 特性

- Claude 3.5 系列，性能卓越
- 长上下文窗口 (200K)
- 强大的代码生成能力
- 流式输出支持

---

## 3. Groq 配置

### 获取 API Key

1. 访问 [Groq Console](https://console.groq.com/)
2. 注册并登录账号
3. 在 API Keys 页面创建新的 API Key

### 环境变量配置

```env
NEXT_PUBLIC_GROQ_API_KEY=your_groq_api_key_here
NEXT_PUBLIC_GROQ_MODEL=llama-3.3-70b-versatile
NEXT_PUBLIC_GROQ_BASE_URL=https://api.groq.com/openai/v1
```

### 支持的模型

- `llama-3.3-70b-versatile` - Llama 3.3 70B (推荐)
- `llama-3.1-70b-versatile` - Llama 3.1 70B
- `mixtral-8x7b-32768` - Mixtral 8x7B
- `gemma-7b-it` - Google Gemma 7B

### API 特性

- **超快速推理** (LPU 引擎)
- OpenAI 兼容接口
- 超低延迟
- 流式输出

---

## 4. Cohere 配置

### 获取 API Key

1. 访问 [Cohere Dashboard](https://dashboard.cohere.com/)
2. 注册并登录账号
3. 在 API Keys 页面创建新的 API Key

### 环境变量配置

```env
NEXT_PUBLIC_COHERE_API_KEY=your_cohere_api_key_here
NEXT_PUBLIC_COHERE_MODEL=command-r-plus
NEXT_PUBLIC_COHERE_BASE_URL=https://api.cohere.ai/v1
```

### 支持的模型

- `command-r-plus` - 最强模型
- `command-r` - 平衡模型
- `command` - 快速模型

### API 特性

- 企业级 LLM
- 128K 上下文窗口
- RAG 原生支持
- 工具调用能力

---

## 5. Wenxin (百度文心一言) 配置

### 获取 API Key

1. 访问 [百度智能云控制台](https://cloud.baidu.com/)
2. 开通千帆大模型平台服务
3. 创建应用并获取 API Key 和 Secret Key

### 环境变量配置

```env
# 格式: {API Key}#{Secret Key}
NEXT_PUBLIC_WENXIN_API_KEY=your_api_key#your_secret_key
NEXT_PUBLIC_WENXIN_MODEL=ernie-4.0-8k
NEXT_PUBLIC_WENXIN_BASE_URL=https://aip.baidubce.com/rpc/2.0/ai_custom/v1/wenxinworkshop
```

### 支持的模型

- `ernie-4.0-8k` - ERNIE 4.0 (推荐)
- `ernie-3.5-8k` - ERNIE 3.5
- `ernie-speed-128k` - 快速模型
- `ernie-turbo-8k` - 高速模型

### API 特性

- 中文优化
- 百度生态整合
- 文档理解能力
- 流式输出

---

## 6. Zhipu (智谱 GLM) 配置

### 获取 API Key

1. 访问 [智谱AI开放平台](https://open.bigmodel.cn/)
2. 注册并登录账号
3. 在 API Keys 页面创建新的 API Key

### 环境变量配置

```env
# 格式: {id}.{secret}
NEXT_PUBLIC_ZHIPU_API_KEY=your_id.your_secret
NEXT_PUBLIC_ZHIPU_MODEL=glm-4-plus
NEXT_PUBLIC_ZHIPU_BASE_URL=https://open.bigmodel.cn/api/paas/v4
```

### 支持的模型

- `glm-4-plus` - 最强模型 (推荐)
- `glm-4` - 通用模型
- `glm-4-flash` - 快速模型
- `glm-3-turbo` - 高速模型

### API 特性

- 中文能力强
- ChatGLM 系列
- 128K 上下文
- 流式输出

---

## 如何切换 AI 平台

### 通过设置界面

1. 打开应用
2. 点击右上角"设置"按钮
3. 在"AI 平台"下拉菜单中选择目标平台
4. 填写相应的 API Key
5. 保存配置

### 通过环境变量

编辑 `.env.local` 文件：

```env
# 设置默认平台
NEXT_PUBLIC_DEFAULT_AI_PLATFORM=deepseek

# 配置对应平台的 API Key
NEXT_PUBLIC_DEEPSEEK_API_KEY=your_api_key
```

---

## 模型选择建议

### 根据场景选择

| 场景 | 推荐平台 | 推荐模型 | 说明 |
|------|----------|----------|------|
| **超低延迟** | Groq | llama-3.3-70b-versatile | LPU 引擎，响应极快 |
| **高质量中文** | Zhipu | glm-4-plus | ChatGLM 系列，中文优化 |
| **企业级应用** | Cohere | command-r-plus | 稳定可靠，API 限流宽松 |
| **代码生成** | DeepSeek | deepseek-coder | 开源模型，代码能力强 |
| **综合最强** | Claude | claude-3-5-sonnet | 性能卓越，多模态 |
| **文档写作** | Qwen | qwen-plus | 通义千问，适合中文写作 |
| **通用对话** | OpenAI | gpt-4o | GPT 系列，稳定可靠 |

### 根据成本选择

| 成本考虑 | 推荐平台 | 说明 |
|---------|----------|------|
| **低成本** | DeepSeek, Groq | 价格便宜，性能出色 |
| **中等成本** | Qwen, Zhipu | 性价比高 |
| **不差钱** | Claude, OpenAI | 性能最强 |

---

## 常见问题

### Q: 如何测试 API Key 是否有效？

在应用的设置界面中，每个平台都有"测试连接"按钮，点击即可测试。

### Q: 支持自定义 Base URL 吗？

是的，所有平台都支持自定义 Base URL，用于：
- 使用代理服务
- 自建 API 服务
- 企业内网部署

### Q: 流式输出有什么优势？

- 实时显示生成内容
- 更好的用户体验
- 避免长时间等待
- 可以提前停止生成

### Q: 如何处理 API 限流？

- 使用不同的平台分散请求
- 调整温度和最大 token 数
- 使用更快的模型（如 Groq）
- 实现请求队列

---

## API 调用示例

### 创建提供商实例

```typescript
import { createAIProvider } from './lib/ai/provider-factory';

// 创建 DeepSeek 提供商
const provider = createAIProvider('deepseek');

// 创建 Claude 提供商
const claudeProvider = createAIProvider('claude');

// 创建 Groq 提供商
const groqProvider = createAIProvider('groq');
```

### 生成大纲

```typescript
const outline = await provider.generateOutline(
  { prompt: '人工智能的发展历程' },
  { apiKey: 'your-api-key', model: 'deepseek-chat' }
);
```

### 生成内容（流式）

```typescript
await provider.generateContent(
  {
    sectionTitle: '引言',
    documentTopic: '人工智能的发展历程',
    fullOutline: '完整大纲...',
  },
  { apiKey: 'your-api-key', model: 'deepseek-chat' },
  (chunk) => console.log(chunk.text),  // 实时输出
  () => console.log('生成完成'),
  (error) => console.error(error)
);
```

---

## 贡献

如果您想添加新的 AI 平台支持，请：

1. 在 `lib/ai/` 目录下创建新的提供商文件
2. 实现 `AIProvider` 接口
3. 在 `types.ts` 中添加平台类型
4. 在 `provider-factory.ts` 中注册新提供商
5. 更新此文档

---

## 许可证

MIT License
