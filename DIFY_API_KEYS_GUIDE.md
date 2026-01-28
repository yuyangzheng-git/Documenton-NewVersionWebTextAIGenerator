# Dify API Keys 配置指南

## 概述

本项目使用 **三个独立的 Dify API Key**，分别对应三个不同的功能模块：

1. **大纲写作** (Outline Generation)
2. **正文写作** (Chapter Content Generation)
3. **LLM 对话** (AI Chat Assistant)

---

## 三个 API Key 详细说明

### 1. NEXT_PUBLIC_DIFY_OUTLINE_KEY (大纲写作)

**用途**: 用于首页输入主题后生成文档大纲

**对应的 Workflow**: Outline Workflow

**功能**:
- 接收用户输入的主题和风格
- 生成结构化的文档大纲 (JSON 格式)
- 包含章节标题、层级、编号等信息

**环境变量**:
```env
NEXT_PUBLIC_DIFY_OUTLINE_KEY=app-your-outline-workflow-key
```

**Store 中的变量**:
```typescript
apiKey: string          // 默认值为 NEXT_PUBLIC_DIFY_OUTLINE_KEY
setApiKey: (key) => void
```

**使用的 API 端点**:
```
POST {baseUrl}/workflows/run
```

**调用的函数**:
```typescript
generateOutlineWithPlanner(apiKey, topic, style, files?)
```

---

### 2. NEXT_PUBLIC_DIFY_CHAPTER_KEY (正文写作)

**用途**: 用于点击标题旁的"生成/重写"按钮生成章节内容

**对应的 Workflow**: Chapter Workflow

**功能**:
- 根据章节标题、写作指导、全文大纲生成正文
- 支持流式输出，实时显示生成内容
- 保持与前文和后文的连贯性

**环境变量**:
```env
NEXT_PUBLIC_DIFY_CHAPTER_KEY=app-your-chapter-workflow-key
```

**Store 中的变量**:
```typescript
chapterApiKey: string    // 默认值为 NEXT_PUBLIC_DIFY_CHAPTER_KEY
setChapterApiKey: (key) => void
```

**使用的 API 端点**:
```
POST {baseUrl}/workflows/run
```

**调用的函数**:
```typescript
generateSectionWithWorker(
  apiKey,
  sectionTitle,
  documentTopic,
  fullOutline,
  onChunk,
  onComplete,
  requirements,
  onError,
  files?
)
```

---

### 3. NEXT_PUBLIC_DIFY_LLM_KEY (LLM 对话)

**用途**: 用于右下角悬浮的 AI 对话助手

**对应的 Workflow/Chatbot**: LLM Chat App

**功能**:
- 与用户进行自由对话
- 支持重写章节命令 (如 "帮我重写 1.2")
- 保持对话历史上下文

**环境变量**:
```env
NEXT_PUBLIC_DIFY_LLM_KEY=app-your-llm-chat-key
```

**Store 中的变量**:
```typescript
chatApiKey: string       // 默认值为 NEXT_PUBLIC_DIFY_LLM_KEY
setChatApiKey: (key) => void
```

**使用的 API 端点**:
```
POST /api/ai/chat  (内部路由，转发到 Dify)
```

**调用的组件**:
```typescript
<AIChat />
```

---

## Dify Base URL 配置

**环境变量**:
```env
NEXT_PUBLIC_DIFY_BASE_URL=https://your-dify-instance.com/v1
```

**Store 中的变量**:
```typescript
apiUrl: string          // 默认值为 NEXT_PUBLIC_DIFY_BASE_URL
setApiUrl: (url) => void
```

**获取 URL 的函数**:
```typescript
getDifyApiBaseUrl(): string  // lib/dify-api.ts
```

---

## 如何在 Dify 中创建三个不同的 Workflow

### 步骤 1: 创建 Outline Workflow

1. 登录 Dify 平台
2. 创建新的 Workflow 应用
3. 配置输入参数:
   - `topic`: 文档主题 (文本)
   - `style`: 写作风格 (文本，可选)
   - `files`: 参考文件 (可选)
4. 配置输出:
   - `text` 或 `output`: JSON 格式的大纲结构
5. 获取 API Key 并填入 `NEXT_PUBLIC_DIFY_OUTLINE_KEY`

### 步骤 2: 创建 Chapter Workflow

1. 创建新的 Workflow 应用
2. **重要**: 配置输入参数 (必须与代码中的参数名称一致):
   - `title`: 文档标题 (文本，必需) ⚠️
   - `section`: 章节标题 (文本，必需) ⚠️
   - `requirements`: 写作指导 (文本，可选)
   - `files`: 参考文件 (可选)

   **注意**:
   - 参数名称必须是 `title`、`section`，不能使用其他名称
   - 如果使用 `topic`、`outline`、`section_title`、`document_topic`、`full_outline` 等名称，会导致 `parameter X is required` 错误
   - 这些参数名称在 `lib/dify-api.ts` 的 `generateSectionWithWorker` 函数中定义
   - 示例输入: `{"title": "AI XDR详细方案", "section": "行业发展趋势", "requirements": "分析客户所在行业..."}`

3. 配置输出:
   - 流式输出的 Markdown 内容
   - 确保使用 "text_chunk" 事件输出文本

4. 获取 API Key 并填入 `NEXT_PUBLIC_DIFY_CHAPTER_KEY`

### 步骤 3: 创建 LLM Chat App

1. 创建新的 Chatbot 应用
2. 配置对话能力和提示词
3. 确保支持重写章节命令的解析
4. 获取 API Key 并填入 `NEXT_PUBLIC_DIFY_LLM_KEY`

---

## 验证配置

### 方法 1: 使用 API 测试工具

```bash
# 测试 Outline Key
curl -X POST https://your-dify-instance.com/v1/workflows/run \
  -H "Authorization: Bearer $NEXT_PUBLIC_DIFY_OUTLINE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"inputs": {"topic": "测试主题"}, "response_mode": "blocking", "user": "test"}'

# 测试 Chapter Key
curl -X POST https://your-dify-instance.com/v1/workflows/run \
  -H "Authorization: Bearer $NEXT_PUBLIC_DIFY_CHAPTER_KEY" \
  -H "Content-Type: application/json" \
  -d '{"inputs": {"section_title": "测试章节"}, "response_mode": "streaming", "user": "test"}'

# 测试 LLM Key
curl -X POST https://your-dify-instance.com/v1/chat-messages \
  -H "Authorization: Bearer $NEXT_PUBLIC_DIFY_LLM_KEY" \
  -H "Content-Type: application/json" \
  -d '{"inputs": {"query": "测试消息"}, "response_mode": "blocking", "user": "test"}'
```

### 方法 2: 在应用中验证

1. 启动应用: `npm run dev`
2. 打开浏览器开发者工具
3. 检查 Console 中的 API 请求日志
4. 查看 Network 面板中的请求和响应

---

## 常见问题

### Q: 为什么需要三个不同的 API Key?

A: 因为三个功能使用不同的 Workflow/App，每个 Workflow 在 Dify 中都有独立的 API Key。这样设计的好处是:
- 每个功能可以使用不同的模型和能力
- 便于隔离和管理
- 支持不同场景的配置

### Q: 可以使用同一个 API Key 吗?

A: 技术上可以，但不推荐。建议创建三个不同的 Workflow 以获得更好的功能隔离和配置灵活性。

### Q: API Key 长度是多少?

A: Dify API Key 通常是 `app-` 开头的字符串，长度约为 20-40 个字符。

### Q: 如何在代码中访问这三个 Key?

A: 通过 Zustand store:
```typescript
const { apiKey, chapterApiKey, chatApiKey } = useStore();
```

### Q: 章节生成时出现 "title is required" 错误怎么办?

A: 这是 Dify Workflow 输入参数名称不匹配的问题。请检查:

1. 打开 Dify 平台，进入 Chapter Workflow 的编辑页面
2. 检查"开始"节点的输入变量名称
3. 确保参数名称为:
   - `title` (不是 `section_title`)
   - `topic` (不是 `document_topic`)
   - `outline` (不是 `full_outline`)
4. 如果参数名称不同，修改 Dify Workflow 的输入变量名称，使其与代码一致
5. 保存并重新发布 Workflow

### Q: 如何查看当前发送给 Dify 的请求参数?

A: 打开浏览器控制台，会看到详细的调试信息:
```
=== Chapter Generation Debug ===
Section Title: ...
Document Topic: ...
Requirements: ...
===============================
Request body: { ... }
```

### Q: Dify Workflow 支持哪些输入类型?

A:
- 文本: 单行或多行文本
- 段落: 长文本
- 数字: 整数或浮点数
- 选择器: 下拉选择
- 文件: 支持上传文件（需要先调用文件上传 API）

对于本项目的 Chapter Workflow，所有输入参数都是文本类型。

---

## 相关文件

- **Store 定义**: `store/useStore.ts`
- **API 调用**: `lib/dify-api.ts`
- **首页大纲生成**: `app/page.tsx`
- **章节内容生成**: `app/word-editor/page.tsx`
- **LLM 对话**: `components/AIChat.tsx`

---

**最后更新**: 2026-01-28
