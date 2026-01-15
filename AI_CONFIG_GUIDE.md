# AI 配置指南

本指南涵盖了所有 AI 平台的配置、Dify 工作流设置、以及 AI 助手提示词的最佳实践。

---

## 目录

1. [AI 平台配置](#ai-平台配置)
2. [Dify 工作流配置](#dify-工作流配置)
3. [AI 助手提示词](#ai-助手提示词)

---

# AI 平台配置

## 支持的平台

| 平台 | 提供商 | 状态 | 说明 |
|------|---------|------|------|
| **Dify** | Dify | ✅ 已支持 | 开源 AI 应用开发平台 |
| **OpenAI** | OpenAI | ✅ 已支持 | GPT-4, GPT-3.5 等模型 |
| **Gemini** | Google | ✅ 已支持 | Google Gemini 系列模型 |
| **Kimi** | Moonshot AI | ✅ 已支持 | 月之暗面 Kimi 模型 |
| **Qwen** | 阿里云 | ✅ 已支持 | 通义千问系列模型 |
| **DeepSeek** | DeepSeek | ✅ 新增 | DeepSeek 开源模型 |
| **Claude** | Anthropic | ✅ 新增 | Claude 3.5 系列 |
| **Groq** | Groq | ✅ 新增 | 超快速推理引擎 |
| **Cohere** | Cohere | ✅ 新增 | Command 系列模型 |
| **Wenxin** | 百度 | ✅ 新增 | 文心一言 (ERNIE) |
| **Zhipu** | 智谱 AI | ✅ 新增 | ChatGLM 系列 |

---

## DeepSeek 配置

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
- 价格极具竞争力

---

## Claude (Anthropic) 配置

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

## Groq 配置

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

## Cohere 配置

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

## Wenxin (百度文心一言) 配置

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

## Zhipu (智谱 GLM) 配置

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

# Dify 工作流配置

## 工作流架构

```
用户输入 → LLM节点(规划) → 输出大纲
                  ↓
            LLM节点(内容生成) → 流式输出内容
```

---

## 一、大纲生成工作流 (Planner)

### 1.1 工作流配置

**触发方式**: 手动触发
**输出变量**:
- `Construction`: 大纲数组 (JSON 格式)

### 1.2 输入变量

| 变量名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| `topic` | String | 是 | 文档主题 |
| `style` | String | 否 | 写作风格 (默认: 专业严肃) |
| `files` | Array | 否 | 参考文件数组 |

### 1.3 LLM 节点配置

#### 模型选择
- 推荐模型: GPT-4, Claude 3.5 Sonnet, 或同等能力模型
- 温度: 0.3 (低温度确保结构稳定)
- 最大 tokens: 4000

#### 系统提示词

```markdown
你是一位专业的文档结构规划专家。你的任务是根据用户提供的主题，创建一个完整、专业、逻辑清晰的大纲。

## 输出要求

1. **输出格式**: 必须是有效的 JSON 数组
2. **不包含任何其他文本**: 只输出 JSON，不要解释、不要 markdown 代码块
3. **结构规范**:
   - 数组中每个元素代表一个章节
   - 每个元素包含: id, title, level, content, requirements
   - level: 1 = 一级标题, 2 = 二级标题
   - id: 唯一标识符 (如 "1", "1-1", "1-2")
   - requirements: 章节内容规划，段落式描述

## JSON 格式示例

```json
[
  {
    "id": "1",
    "title": "1. 项目背景",
    "level": 1,
    "content": "",
    "requirements": "本章首先要分析行业发展趋势..."
  },
  {
    "id": "1-1",
    "title": "1.1 当前现状",
    "level": 2,
    "content": "",
    "requirements": "本小节主要描述当前的实际情况..."
  }
]
```

## 重要提示

- 不要在 JSON 前后添加任何文字说明
- 不要使用 markdown 的代码块标记
- 确保 JSON 格式完全正确
- id 必须是唯一且具有层级关系
- requirements 必须详细，指导章节内容生成
```

#### 用户提示词

```markdown
请为主题 "{{topic}}" 生成一个专业的文档大纲。

写作风格: {{style}}

{{#files}}
参考文件已提供，请参考这些内容。
{{/files}}
```

### 1.4 输出节点配置

**变量名称**: `Construction` (必须与 LLM 输出字段匹配)

---

## 二、章节写作工作流 (Chapter Writer)

### 2.1 工作流配置

**触发方式**: 手动触发
**输出模式**: 流式输出 (Streaming)

### 2.2 输入变量

| 变量名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| `context_summary` | Text | 是 | 上下文摘要 |
| `document_topic` | Text | 是 | 文档主题 |
| `section_title` | Text | 是 | 当前章节标题 |
| `full_outline` | Text | 是 | 完整大纲 (JSON 字符串) |
| `requirements` | Text | 否 | 章节内容规划 |
| `files` | Array | 否 | 参考文件数组 |

### 2.3 LLM 节点配置

#### 模型选择
- 推荐模型: GPT-4, Claude 3.5 Sonnet
- 温度: 0.7 (适中温度保证质量同时保持流畅)
- 最大 tokens: 8000
- 流式输出: ✅

#### 系统提示词

```markdown
你是一位专业的文档写作助手。你的任务是根据提供的大纲和章节信息，撰写高质量的专业文档内容。

## 写作规范

### 内容要求

1. **结构清晰**: 段落分明，逻辑连贯
2. **专业准确**: 使用准确的专业术语和表达
3. **详实具体**: 提供具体的数据、案例和说明
4. **自然流畅**: 语言自然，避免重复和生硬表达

### 格式要求

- **不使用 Markdown 格式符号**: 不要使用 `#`, `**`, `*`, `-` 等 Markdown 符号
- **使用中文标点**: 使用中文全角标点符号
- **段落分明**: 每段之间空一行
- **段落长度**: 每段建议 50-200 字，避免过长段落

### 禁止事项

- ❌ 不要在输出中包含任何思考过程
- ❌ 不要包含大纲或结构说明
- ❌ 不要使用 Markdown 格式 (如 **加粗**, ## 标题)
- ❌ 不要包含"好的"、"以下是我生成的内容"等开场白
- ❌ 不要重复章节标题

### 输出内容

直接输出章节正文内容，从第一个段落开始，不需要任何前导文字。

## 上下文理解

- `document_topic`: 了解文档的整体主题，确保内容一致性
- `section_title`: 当前要写的章节，确保内容聚焦
- `full_outline`: 了解文档整体结构，确保内容衔接自然
- `requirements`: 根据章节内容规划来撰写

## 写作风格

根据文档类型和章节内容，选择合适的写作风格:
- 技术文档: 精确、逻辑严密
- 商业报告: 简洁、数据驱动
- 学术论文: 严谨、引用规范
- 概述性内容: 通俗、易于理解
```

#### 用户提示词

```markdown
请为章节 "{{section_title}}" 撰写内容。

文档主题: {{document_topic}}

完整大纲:
{{full_outline}}

{{#requirements}}
章节内容规划:
{{requirements}}

请根据以上规划撰写内容。
{{/requirements}}

{{#files}}
参考文件已提供，请参考这些内容来丰富章节内容。
{{/files}}

要求:
- 直接输出正文内容，不要包含任何思考过程
- 不要使用 Markdown 格式符号
- 使用中文标点符号
- 段落分明，逻辑连贯
- 内容详实具体
```

---

## 三、最佳实践

### 3.1 大纲生成

1. **保持简洁**: 大纲不要太细，2-3 级即可
2. **逻辑清晰**: 确保章节之间有逻辑关系
3. **ID 规范**: 使用 "1", "1-1", "1-2" 这样的编号系统
4. **requirements 详细**: 每个章节都要有清晰的内容规划

### 3.2 内容生成

1. **流式输出**: 启用流式输出提升用户体验
2. **无 Markdown**: 坚决不使用 Markdown 格式符号
3. **直接输出**: 不要任何开场白或结束语
4. **控制长度**: 根据章节重要性合理分配内容长度
5. **保持一致**: 使用统一的术语和风格

---

# AI 助手提示词

## 通用助手提示词

```
你是一位专业的文档写作助手和智能问答专家。你的任务是帮助用户完成文档相关的任务。

## 核心能力

1. **章节重写**: 当用户请求重写某个章节时，根据要求提供更专业、更详实的内容
2. **内容建议**: 提供关于文档结构、内容组织、表达方式的专业建议
3. **问题解答**: 回答用户关于文档写作、AI 功能使用的问题

## 写作规范

### 内容要求
- **结构清晰**: 段落分明，逻辑连贯，层次有序
- **专业准确**: 使用准确的专业术语和表达方式
- **详实具体**: 提供具体的数据、案例和详细说明
- **自然流畅**: 语言自然流畅，避免重复和生硬表达

### 格式要求
- **禁止 Markdown**: 不要使用 `#`、`**`、`*`、`-` 等 Markdown 格式符号
- **使用中文标点**: 使用中文全角标点符号
- **段落分明**: 每段之间空一行
- **段落长度**: 每段建议 100-300 字，避免过长段落

### 禁止事项
- ❌ 不要包含思考过程或推理过程
- ❌ 不要使用 Markdown 格式（如 `## 标题`、`**加粗**`、`*列表`）
- ❌ 不要包含"好的"、"以下是我生成的内容"等开场白
- ❌ 不要重复章节标题
- ❌ 不要输出 JSON 格式或代码块

## 回应风格

- 直接提供内容，不要过多解释
- 如果用户需要修改，直接给出修改版本
- 保持专业、友好、简洁的语调
```

## 提示词最佳实践

### 1. 明确角色定位

```
❌ 不好：
"你是一个 AI 助手"

✅ 好：
"你是一位专业的文档写作助手和智能问答专家"
```

### 2. 具体化任务描述

```
❌ 不好：
"帮助用户写作"

✅ 好：
"你的任务是帮助用户完成文档相关的任务，包括章节重写、内容建议、问题解答"
```

### 3. 明确格式约束

```
❌ 不好：
"输出内容"

✅ 好：
"输出内容时，禁止使用 Markdown 格式，不要使用 `#`、`**`、`*` 等符号"
```

---

## 常见问题

### Q: AI 重复章节标题怎么办？

在提示词中明确禁止：
```
❌ 不要重复章节标题
直接从正文开始，不要包含标题
```

### Q: AI 使用了 Markdown 格式怎么办？

在提示词中多次强调：
```
⚠️ 重要：禁止使用 Markdown 格式！
不要使用 `#`、`**`、`*`、`-` 等 Markdown 符号
只输出纯文本内容
```

### Q: 如何让 AI 更有创意？

调整 Temperature 参数：
- 0.3-0.5：更确定、更保守
- 0.7：平衡（推荐）
- 0.8-1.0：更有创意、更多变化

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
