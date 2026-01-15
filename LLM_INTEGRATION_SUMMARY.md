# 主流 LLM 厂商集成总结

## 已完成的工作

本次更新为项目添加了对 6 个主流 AI 平台的支持，使项目总共支持 **12 个 AI 平台**。

---

## 新增平台

### 1. DeepSeek (深度求索)

- **模型**: `deepseek-chat`, `deepseek-coder`
- **特点**:
  - 开源的高性能模型
  - OpenAI 兼容接口
  - 长上下文支持 (128K)
  - 价格极具竞争力
- **适用场景**: 通用对话、代码生成、成本敏感应用
- **API 文档**: https://platform.deepseek.com/api-docs/

### 2. Claude (Anthropic)

- **模型**: `claude-3-5-sonnet`, `claude-3-5-haiku`, `claude-3-opus`
- **特点**:
  - 行业领先的性能
  - 强大的代码生成能力
  - 长上下文窗口 (200K)
  - 优秀的多语言支持
- **适用场景**: 高质量内容生成、代码开发、企业应用
- **API 文档**: https://docs.anthropic.com/claude/reference/getting-started-with-the-api

### 3. Groq

- **模型**: `llama-3.3-70b-versatile`, `llama-3.1-70b-versatile`, `mixtral-8x7b-32768`
- **特点**:
  - **超快速推理** (LPU 引擎)
  - OpenAI 兼容接口
  - 超低延迟
  - 流式输出支持
- **适用场景**: 实时对话、低延迟应用、快速原型开发
- **API 文档**: https://console.groq.com/docs/quickstart

### 4. Cohere

- **模型**: `command-r-plus`, `command-r`, `command`
- **特点**:
  - 企业级 LLM
  - 128K 上下文窗口
  - RAG 原生支持
  - 工具调用能力
  - API 限流宽松
- **适用场景**: 企业应用、知识库问答、文档分析
- **API 文档**: https://docs.cohere.com/docs/the-cohere-platform

### 5. Wenxin (百度文心一言)

- **模型**: `ernie-4.0-8k`, `ernie-3.5-8k`, `ernie-speed-128k`
- **特点**:
  - 中文优化
  - 百度生态整合
  - 文档理解能力强
  - 流式输出支持
- **适用场景**: 中文内容创作、文档理解、百度生态应用
- **API 文档**: https://cloud.baidu.com/doc/WENXINWORKSHOP/s/Nlks5zkzu

### 6. Zhipu (智谱 AI)

- **模型**: `glm-4-plus`, `glm-4`, `glm-4-flash`, `glm-3-turbo`
- **特点**:
  - 中文能力强
  - ChatGLM 系列
  - 128K 上下文
  - 流式输出支持
- **适用场景**: 中文对话、内容生成、多轮对话
- **API 文档**: https://open.bigmodel.cn/dev/api#model

---

## 完整平台列表

| # | 平台 | 提供商 | 类型 | 状态 |
|---|------|---------|------|------|
| 1 | Dify | Dify | 平台 | ✅ 已支持 |
| 2 | OpenAI | OpenAI | 国际 | ✅ 已支持 |
| 3 | Gemini | Google | 国际 | ✅ 已支持 |
| 4 | Kimi | Moonshot AI | 国内 | ✅ 已支持 |
| 5 | Qwen | 阿里云 | 国内 | ✅ 已支持 |
| 6 | LangChain | LangChain | 框架 | ✅ 已支持 |
| 7 | **DeepSeek** | DeepSeek | 开源 | ✅ **新增** |
| 8 | **Claude** | Anthropic | 国际 | ✅ **新增** |
| 9 | **Groq** | Groq | 开源 | ✅ **新增** |
| 10 | **Cohere** | Cohere | 国际 | ✅ **新增** |
| 11 | **Wenxin** | 百度 | 国内 | ✅ **新增** |
| 12 | **Zhipu** | 智谱 AI | 国内 | ✅ **新增** |

---

## 技术实现

### 文件结构

```
lib/ai/
├── types.ts                      # 类型定义 (已更新)
├── provider-factory.ts            # 提供商工厂 (已更新)
├── dify-provider.ts             # Dify 提供商
├── openai-provider.ts           # OpenAI 提供商
├── gemini-provider.ts            # Gemini 提供商
├── kimi-provider.ts             # Kimi 提供商
├── qwen-provider.ts             # Qwen 提供商
├── langchain-provider.ts        # LangChain 提供商
├── deepseek-provider.ts         # DeepSeek 提供商 ✨ 新增
├── claude-provider.ts           # Claude 提供商 ✨ 新增
├── groq-provider.ts            # Groq 提供商 ✨ 新增
├── cohere-provider.ts          # Cohere 提供商 ✨ 新增
├── wenxin-provider.ts          # Wenxin 提供商 ✨ 新增
└── zhipu-provider.ts          # Zhipu 提供商 ✨ 新增

components/
└── AIPlatformSelector.tsx        # 平台选择器组件 ✨ 新增

AI_PLATFORMS.md                 # 平台配置文档 (已更新)
```

### 核心接口

所有提供商都实现了 `AIProvider` 接口：

```typescript
interface AIProvider {
  generateOutline(options: GenerateOutlineOptions, config: AIConfig): Promise<OutlineItem[]>;
  generateContent(options: GenerateContentOptions, config: AIConfig, onChunk?, onComplete?, onError?): Promise<void>;
  chat(messages: {...}[], config: AIConfig, onChunk?, onComplete?, onError?): Promise<void>;
}
```

### 环境变量配置

每个平台都有对应的环境变量：

```env
# DeepSeek
NEXT_PUBLIC_DEEPSEEK_API_KEY=sk-xxx
NEXT_PUBLIC_DEEPSEEK_MODEL=deepseek-chat
NEXT_PUBLIC_DEEPSEEK_BASE_URL=https://api.deepseek.com

# Claude
NEXT_PUBLIC_CLAUDE_API_KEY=sk-ant-xxx
NEXT_PUBLIC_CLAUDE_MODEL=claude-3-5-sonnet-20241022
NEXT_PUBLIC_CLAUDE_BASE_URL=https://api.anthropic.com

# Groq
NEXT_PUBLIC_GROQ_API_KEY=gsk_xxx
NEXT_PUBLIC_GROQ_MODEL=llama-3.3-70b-versatile
NEXT_PUBLIC_GROQ_BASE_URL=https://api.groq.com/openai/v1

# Cohere
NEXT_PUBLIC_COHERE_API_KEY=xxx
NEXT_PUBLIC_COHERE_MODEL=command-r-plus
NEXT_PUBLIC_COHERE_BASE_URL=https://api.cohere.ai/v1

# Wenxin
NEXT_PUBLIC_WENXIN_API_KEY={api_key}#{secret_key}
NEXT_PUBLIC_WENXIN_MODEL=ernie-4.0-8k
NEXT_PUBLIC_WENXIN_BASE_URL=https://aip.baidubce.com/rpc/2.0/ai_custom/v1/wenxinworkshop

# Zhipu
NEXT_PUBLIC_ZHIPU_API_KEY={id}.{secret}
NEXT_PUBLIC_ZHIPU_MODEL=glm-4-plus
NEXT_PUBLIC_ZHIPU_BASE_URL=https://open.bigmodel.cn/api/paas/v4
```

---

## AIPlatformSelector 组件

### 功能特性

- 🎨 **可视化选择器**: 直观的平台和模型选择界面
- 🔍 **分类筛选**: 按国际/国内/开源分类
- 📋 **模型列表**: 显示每个平台支持的所有模型
- 🔗 **文档链接**: 快速跳转到官方文档
- ✅ **选中状态**: 清晰显示当前选择

### 使用示例

```tsx
import AIPlatformSelector from '@/components/AIPlatformSelector';

<AIPlatformSelector
  selectedPlatform={platform}
  selectedModel={model}
  onPlatformChange={setPlatform}
  onModelChange={setModel}
/>
```

---

## 使用建议

### 根据场景选择平台

| 场景 | 推荐平台 | 理由 |
|------|----------|------|
| **超低延迟** | Groq | LPU 引擎，响应极快 |
| **高质量中文** | Zhipu | ChatGLM 系列，中文优化 |
| **企业级应用** | Cohere | 稳定可靠，API 限流宽松 |
| **代码生成** | DeepSeek | 开源模型，代码能力强 |
| **综合最强** | Claude | Claude 3.5 Sonnet，性能卓越 |
| **文档写作** | Qwen | 通义千问，适合中文写作 |
| **通用对话** | OpenAI | GPT 系列，稳定可靠 |

### 根据成本选择

| 成本考虑 | 推荐平台 | 理由 |
|---------|----------|------|
| **低成本** | DeepSeek, Groq | 价格便宜，性能出色 |
| **中等成本** | Qwen, Zhipu, Wenxin | 性价比高 |
| **不差钱** | Claude, OpenAI | 性能最强 |

---

## 模型对比

| 模型 | 平台 | 上下文 | 速度 | 质量 | 价格 |
|------|------|--------|------|------|------|
| claude-3-5-sonnet | Claude | 200K | 快 | ⭐⭐⭐⭐⭐ | 高 |
| gpt-4o | OpenAI | 128K | 快 | ⭐⭐⭐⭐⭐ | 高 |
| deepseek-chat | DeepSeek | 128K | 快 | ⭐⭐⭐⭐ | 低 |
| llama-3.3-70b | Groq | 128K | **极快** | ⭐⭐⭐⭐ | 低 |
| command-r-plus | Cohere | 128K | 快 | ⭐⭐⭐⭐ | 中 |
| glm-4-plus | Zhipu | 128K | 快 | ⭐⭐⭐⭐ | 中 |
| qwen-plus | Qwen | 32K | 快 | ⭐⭐⭐⭐ | 中 |
| ernie-4.0-8k | Wenxin | 8K | 快 | ⭐⭐⭐ | 中 |

---

## 后续优化建议

### 1. 性能优化

- [ ] 实现请求缓存
- [ ] 添加请求重试机制
- [ ] 支持批量请求

### 2. 功能增强

- [ ] 支持多模态输入（图片、音频）
- [ ] 添加函数调用支持
- [ ] 实现工具调用

### 3. 用户体验

- [ ] 添加平台性能对比
- [ ] 支持自定义 API Key 管理
- [ ] 添加用量统计和成本追踪

### 4. 测试

- [ ] 添加单元测试
- [ ] 集成测试
- [ ] 性能基准测试

---

## Git 提交信息

**提交哈希**: `87cae5c`

**文件变更**:
- 修改: `AI_PLATFORMS.md`
- 修改: `components/AIPlatformSelector.tsx`
- 修改: `lib/ai/provider-factory.ts`
- 修改: `lib/ai/types.ts`
- 新增: `lib/ai/deepseek-provider.ts`
- 新增: `lib/ai/claude-provider.ts`
- 新增: `lib/ai/groq-provider.ts`
- 新增: `lib/ai/cohere-provider.ts`
- 新增: `lib/ai/wenxin-provider.ts`
- 新增: `lib/ai/zhipu-provider.ts`

**统计**: 10 个文件修改，2162 行新增，656 行删除

---

## 总结

本次更新成功集成了 6 个主流 AI 平台，使项目的 AI 平台支持从 6 个扩展到 12 个。所有新平台都：

✅ 实现了统一的 `AIProvider` 接口
✅ 支持流式输出
✅ 包含完整的错误处理
✅ 支持自定义 Base URL 和模型选择
✅ 配置简单，开箱即用

项目现在可以为用户提供更丰富的 AI 模型选择，满足不同场景、不同成本预算的需求。
