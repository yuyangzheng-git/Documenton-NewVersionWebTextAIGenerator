# 项目关键信息 (Key Facts)

## 技术栈

### 前端
- **框架**: Next.js 16 (App Router)
- **编辑器**: Tiptap 3.14.0 + Custom Node Views
- **状态管理**: Zustand 5.0.9
- **拖拽**: @dnd-kit/core 6.3.1
- **样式**: Tailwind CSS 4

### 后端
- **框架**: Python FastAPI
- **文档转换**: pypandoc
- **部署**: Docker + Docker Compose

### AI 平台
- **平台**: Dify
- **Workflows**:
  - Outline Workflow: 输入主题 -> 输出 JSON 结构树
  - Chapter Workflow: 输入标题 + 指导 -> 输出 Markdown 正文
  - Chatbot App: 右下角悬浮对话框
- **API Key 配置** (三个不同的key):
  - `NEXT_PUBLIC_DIFY_OUTLINE_KEY`: 大纲写作 Workflow 的 API Key
  - `NEXT_PUBLIC_DIFY_CHAPTER_KEY`: 正文写作 Workflow 的 API Key
  - `NEXT_PUBLIC_DIFY_LLM_KEY`: 右下角 LLM 对话的 API Key
  - `NEXT_PUBLIC_DIFY_BASE_URL`: Dify 实例的基础 URL

## 环境变量

```env
# Dify 配置 (三个不同的 API Key)
NEXT_PUBLIC_DIFY_OUTLINE_KEY=      # 大纲写作 Workflow API Key
NEXT_PUBLIC_DIFY_CHAPTER_KEY=      # 正文写作 Workflow API Key
NEXT_PUBLIC_DIFY_LLM_KEY=          # 右下角 LLM 对话 API Key
NEXT_PUBLIC_DIFY_BASE_URL=         # Dify 实例基础 URL，如 https://your-dify-instance.com/v1

# 其他 AI 平台 (可选)
NEXT_PUBLIC_OPENAI_API_KEY=
NEXT_PUBLIC_OPENAI_MODEL=gpt-4o
NEXT_PUBLIC_OPENAI_BASE_URL=https://api.openai.com/v1

# ... 其他平台配置
```

## 数据库 Schema (IndexedDB)

```typescript
// lib/db.ts
export const db = new Dexie('DocumentEditorDB');

db.version(1).stores({
  blocks: 'id, type, order',  // 主键: id, 索引: type, order
  metadata: 'key'             // 主键: key
});
```

## Block 数据结构

```typescript
type BlockType = 'heading' | 'paragraph' | 'table' | 'image' | 'list' | 'code';

interface Block {
  id: string;        // UUID v4
  type: BlockType;
  content: string;   // 文本内容 或 HTML 表格代码

  props: {
    // 标题专用
    level?: 1 | 2 | 3 | 4;
    guidance?: string;       // AI 写作指导
    guidanceVisible?: boolean;

    // 图片专用
    src?: string;            // Base64 Data URL
    caption?: string;
    width?: number;

    // 列表专用
    listType?: 'bullet' | 'ordered';
  };

  order: number;
}
```

## API 端点

### 后端 API (FastAPI)
```
POST /export
Body:
{
  "markdown": string,
  "images": {
    "img_1": "base64...",
    "img_2": "base64..."
  }
}
Response: .docx file stream
```

### Dify API
```
# 大纲写作 API (使用 NEXT_PUBLIC_DIFY_OUTLINE_KEY)
POST {baseUrl}/workflows/run
Headers:
  Authorization: Bearer {apiKey}
  Content-Type: application/json
Body:
{
  "inputs": {
    "topic": string,
    "style": string
  },
  "response_mode": "blocking",
  "user": string
}

# 正文写作 API (使用 NEXT_PUBLIC_DIFY_CHAPTER_KEY)
POST {baseUrl}/workflows/run
Headers:
  Authorization: Bearer {chapterApiKey}
  Content-Type: application/json
Body:
{
  "inputs": {
    "context_summary": string,
    "document_topic": string,
    "section_title": string,
    "full_outline": string,
    "requirements": string
  },
  "response_mode": "streaming",
  "user": string
}

# LLM 对话 API (使用 NEXT_PUBLIC_DIFY_LLM_KEY)
POST /api/ai/chat (内部路由)
Headers:
  Content-Type: application/json
Body:
{
  "message": string,
  "history": Message[],
  "appKey": string
}
```

## 文件结构

```
app/
├── page.tsx                 # 首页 (输入主题)
├── word-editor/
│   └── page.tsx            # 编辑器页面
└── layout.tsx

components/
├── NotionEditor.tsx        # 编辑器核心
├── NotionBlock.tsx         # 单个 Block 组件
├── AIChat.tsx              # AI 对话框
└── TextSelectionToolbar.tsx

lib/
├── dify-api.ts            # Dify API 封装 (包含三个不同的 key 逻辑)
├── export-utils.ts        # 导出工具
├── db.ts                  # IndexedDB 封装 (已创建)
└── word-templates.ts      # Word 模板

store/
└── useStore.ts            # Zustand store

backend/
├── main.py                # FastAPI 主文件 (待创建)
├── requirements.txt       # Python 依赖
├── Dockerfile
└── templates/
    └── template.docx      # Word 模板
```

## 性能要求

- ✅ 编辑器支持 500+ blocks 流畅渲染
- ✅ IndexedDB 读写延迟 < 50ms
- ✅ 支持单张图片最大 10MB
- ✅ Dify 请求超时 > 60s

## 浏览器兼容性

- ✅ Chrome (最新版)
- ✅ Edge (最新版)
- ⏳ Firefox (待测试)
- ⚠️ Safari (部分 API 支持有限)

## 导出兼容性

- ✅ Office 2016+
- ✅ WPS Office
- ⏳ LibreOffice (待测试)

## 安全要求

- ✅ API Key 存储在服务端环境变量
- ❌ 严禁在前端暴露 API Key
- ✅ CORS 配置
- ✅ 图片上传大小限制

## 开发命令

```bash
# 前端
npm install          # 安装依赖
npm run dev          # 启动开发服务器
npm run build        # 构建生产版本
npm run start        # 启动生产服务器

# 后端
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload

# Docker
docker-compose up    # 启动所有服务
```

## 已知限制

1. Pandoc 生成的目录需要在 Word 中手动更新
2. Safari 对 IndexedDB 支持有限
3. 大图片导出可能导致服务器内存压力
4. 长文档 (1000+ blocks) 可能需要虚拟滚动
5. 三个 Dify API Key 需要分别配置，使用不同的 Workflow

---

**最后更新**: 2026-01-28
