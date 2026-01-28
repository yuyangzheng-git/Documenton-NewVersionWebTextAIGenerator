# 开发任务清单 (Development TODO)

## 📋 项目概览
基于重前端 + 无状态后端架构的 AI 文档生成系统

**当前状态**: ✅ Phase 1 已完成 | ✅ Phase 2 已完成 | 🚧 Phase 3 进行中 | ⏳ Phase 4 待开始

---

## 🎯 Phase 1: 核心骨架 (Core Skeleton)
**预计时间**: Days 1-2

### ✅ 已完成 (Completed)
- [x] Next.js 16 项目初始化 (App Router)
- [x] 集成 Tiptap 编辑器基础功能
- [x] 实现 Block 基础渲染 (H1-H3, Paragraph)
- [x] 集成 Zustand 状态管理
- [x] 实现首页输入界面
- [x] 实现大纲生成基础功能
- [x] Dify API 集成

### 🚧 进行中 (In Progress)
- [x] **[HIGH]** 集成 Dexie.js (IndexedDB)
  - [x] 安装依赖: `npm install dexie`
  - [x] 创建 `lib/db.ts` - 定义数据库 schema (blocks 表)
  - [x] 实现 `useAutoSave` hook - 监听 blocks 变化并自动保存
  - [x] 实现 `useLoadFromDB` hook - 页面加载时从 IndexedDB 恢复数据
  - [ ] 测试: 验证 500+ blocks 的读写性能 (< 50ms)

### ✅ 已完成 (Completed)
- [x] **[HIGH]** 实现"居中画布"布局
  - [x] 修改 `app/word-editor/page.tsx`
  - [x] 移除侧边栏 (outline panel 改为可折叠或移除)
  - [x] 设置画布 max-width: 800px, 居中显示
  - [x] 模拟 A4 纸张感 (白色/极简灰背景)

### ✅ 已完成 (Completed)
- [x] **[HIGH]** Block 基础功能完善
  - [x] 实现 Hover 交互 - 显示 :: 拖拽手柄
  - [x] 实现 + 按钮 - 插入新块
  - [x] 集成 @dnd-kit 实现拖拽排序 (已安装依赖)

---

## 🤖 Phase 2: AI 业务流 (AI Workflows)
**预计时间**: Days 3-4

### ✅ 已完成 (Completed)
- [x] 接入 Dify Workflow 1 (大纲生成)
- [x] JSON 解析为 Heading Blocks
- [x] 实现 Markdown 基础解析

### 🚧 进行中 (In Progress)
- [x] **[HIGH]** HeadingBlock 自定义组件
  - [x] 基础 Heading 渲染
  - [x] 添加写作指导区 (Guidance Panel)
    - [x] 可折叠区域实现 (默认显示, 淡灰色背景)
    - [x] 显示 AI 预生成的 guidance 文本
    - [x] 用户可编辑指导文字
    - [x] 编辑后同步到 store
  - [x] 添加"✨ 生成/重写"按钮
    - [x] 按钮样式和位置 (标题右侧)
    - [x] 点击触发章节生成逻辑

### ✅ 已完成 (Completed)
- [x] **[HIGH]** MarkdownParser 完善
  - [x] 解析 `#` -> Heading Block (支持 H1-H6)
  - [x] 解析 `|...|` -> Table Block
    - [x] 转换为 HTML table 结构
    - [x] 集成 Tiptap Table 扩展 (已安装)
  - [x] 解析 `![...]` -> Image Block
    - [x] 提取 alt text 和 src
  - [x] 解析 Text -> Paragraph Block
  - [x] 处理引用 `[1]` - 保持纯文本, 不转义
  - [x] 解析列表 (Bullet/Ordered) -> List Block
  - [x] 解析引用 `>` -> Quote Block
  - [x] 处理代码块 ``` -> 跳过标记

- [x] **[HIGH]** 暴力覆盖算法 (Violent Overwrite)
  - [x] 实现边界查找逻辑:
    ```typescript
    function findNextHeaderLevel(currentBlock: Block, blocks: Block[]): number {
      // 找到下一个同级(H2)或更高级(H1)的标题块索引
    }
    ```
  - [x] 实现内容清空逻辑:
    ```typescript
    function clearContentBlocks(startIdx: number, endIdx: number, blocks: Block[]): Block[] {
      // 删除 (startIdx + 1) 到 endIdx 之间的所有块
    }
    ```
  - [x] 实现插入逻辑:
    ```typescript
    function insertGeneratedBlocks(insertAt: number, newBlocks: Block[], blocks: Block[]): Block[] {
      // 在指定位置插入新生成的 Block 数组
    }
    ```
  - [x] 添加执行前 Toast 提示
  - [x] 添加生成成功/失败 Toast 反馈

- [x] **[HIGH]** 章节生成流程完善
  - [x] 调用 Dify Workflow 2 (章节生成)
  - [x] 实现流式接收 Markdown 文本
  - [x] 实时解析为 Blocks
  - [x] 更新编辑器状态
  - [x] 添加 Loading 占位符
  - [x] 流式更新 Loading 内容

### ⏳ 待办 (TODO)

---

## ✨ Phase 3: 增强与导出 (Enhancement & Export)
**预计时间**: Days 5-6

### ✅ 已完成 (Completed)
- [x] **[HIGH]** Slash 命令菜单
  - [x] 实现 `/` 唤起菜单
  - [x] 菜单项:
    - [x] `/image` - 插入图片
    - [x] `/table` - 插入表格
    - [x] `/h1`, `/h2`, `/h3` - 插入标题
    - [x] `/bullet`, `/ordered` - 插入列表
  - [x] 键盘导航 (上下箭头选择, Enter 确认)
  - [x] 添加图片选项到菜单
  - [x] 添加表格选项到菜单

- [x] **[HIGH]** 表格处理
  - [x] 安装 Tiptap Table 扩展
  - [x] 实现 Markdown 表格 -> HTML 表格转换
  - [ ] 实现右键菜单:
    - [ ] 插入行 (上方/下方)
    - [ ] 插入列 (左侧/右侧)
    - [ ] 删除行
    - [ ] 删除列

- [x] **[HIGH]** 图片管理
  - [x] **拖拽上传**
    - [x] 实现拖拽监听 (dragover, drop)
    - [x] 检测是否拖拽图片文件
    - [x] 创建 Image Block
    - [x] 将图片转为 Base64
    - [x] 保存到 IndexedDB
  - [x] **按钮上传**
    - [x] `/image` 菜单触发文件选择器
    - [x] 处理文件选择事件
    - [x] 同样转为 Base64 存储

### ⏳ 待办 (TODO)

- [ ] **[LOW]** 表格处理 - 右键菜单
  - [ ] 实现右键菜单:
    - [ ] 插入行 (上方/下方)
    - [ ] 插入列 (左侧/右侧)
    - [ ] 删除行
    - [ ] 删除列

- [ ] **[MEDIUM]** RAG 助手 (右下角悬浮球)
  - [ ] 创建悬浮球组件
    - [ ] 固定定位 (右下角)
    - [ ] 默认收起状态 (圆形图标)
    - [ ] 点击展开对话框
  - [ ] 复用/改进 `AIChat.tsx` 组件
  - [ ] 集成 Dify Chatbot App

- [ ] **[HIGH]** 导出系统
  - [ ] **前端导出准备**
    - [ ] 遍历所有 Blocks -> 降维为 Markdown
      - [ ] Heading -> `# Title`
      - [ ] Paragraph -> 纯文本
      - [ ] Table -> Markdown 表格语法
      - [ ] Image -> `
![caption](img_id)`
    - [ ] 提取所有 Image Block 的 Base64
      - [ ] 生成 ID 映射表 `{ "img_1": "base64...", "img_2": "base64..." }`
      - [ ] 替换 Markdown 中的图片引用

  - [ ] **Python FastAPI 服务**
    - [ ] 创建 `backend/` 目录
    - [ ] 初始化 FastAPI 项目
    - [ ] 实现导出接口:
      ```python
      @app.post("/export")
      async def export_document(payload: ExportRequest):
          # 1. 创建临时目录 /tmp/{session_id}
          # 2. 解码 Base64 并保存图片
          # 3. 调用 Pandoc 转换
          # 4. 返回 .docx 文件流
          # 5. 清理临时目录
      ```
    - [ ] 安装依赖:
      ```txt
      fastapi
      uvicorn
      pypandoc
      python-multipart
      ```
    - [ ] Docker 配置
      - [ ] 创建 `backend/Dockerfile`
      - [ ] 更新 `docker-compose.yml`

  - [ ] **Word 模板制作**
    - [ ] 生成基准模板:
      ```bash
      pandoc --print-default-data-file reference.docx > template.docx
      ```
    - [ ] 修改样式:
      - [ ] Heading 1-4 字体/字号/颜色
      - [ ] Normal 正文样式
      - [ ] Table Normal 表格样式
      - [ ] 页眉/页脚/页码
    - [ ] 部署到 `backend/templates/` 目录

---

## 📦 Phase 4: 优化与测试 (Optimization & Testing)
**预计时间**: Days 7-8

### ⏳ 待办 (TODO)
- [ ] **[MEDIUM]** 性能优化
  - [ ] 实现 React 虚拟列表 (支持 500+ blocks 流畅渲染)
  - [ ] IndexedDB 性能测试和优化
  - [ ] Tiptap 编辑器性能调优

- [ ] **[MEDIUM]** 兼容性测试
  - [ ] Chrome/Edge 测试
  - [ ] Word 导出测试 (Office 2016+ 及 WPS)
  - [ ] 移动端适配 (可选)

- [ ] **[MEDIUM]** 安全性加固
  - [ ] 确认 API Key 存储在服务端 (非前端)
  - [ ] 图片上传大小限制 (单张 < 10MB)
  - [ ] CORS 配置

- [ ] **[MEDIUM]** 超时处理
  - [ ] 配置长超时请求 (> 60s)
  - [ ] Loading 状态优化
  - [ ] 错误处理和重试机制

---

## 📝 数据字典实现 (Data Schema)

### Block 对象结构
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
    guidanceVisible?: boolean; // UI状态：是否展开

    // 图片专用
    src?: string;            // Base64 Data URL
    caption?: string;        // 图片说明
    width?: number;

    // 列表专用
    listType?: 'bullet' | 'ordered';
  };

  order: number;
}
```

### IndexedDB Schema
```typescript
// lib/db.ts
export const db = new Dexie('DocumentEditorDB');

db.version(1).stores({
  blocks: 'id, type, order',  // id 作为主键, order 用于排序
  metadata: 'key'             // 存储文档元数据
});
```

---

## 🔧 技术栈确认

### 前端 (Frontend)
- ✅ Next.js 16 (App Router)
- ✅ Tiptap + Custom Node Views
- ✅ Zustand
- ⏳ Dexie.js (待安装)

### 后端 (Backend)
- ⏳ Python FastAPI (待创建)
- ⏳ pypandoc (待配置)

### AI 平台 (AI Platform)
- ✅ Dify
  - ✅ Outline Workflow
  - ✅ Chapter Workflow
  - ✅ Chatbot App

---

## 📊 进度追踪

| Phase | Status | Progress | Est. Time |
|-------|--------|----------|-----------|
| Phase 1 | ✅ 已完成 | 100% | Days 1-2 |
| Phase 2 | ✅ 已完成 | 100% | Days 3-4 |
| Phase 3 | 🚧 进行中 | 40% | Days 5-6 |
| Phase 4 | ⏳ 待开始 | 0% | Days 7-8 |

**总体进度**: 60% (已完成 + 进行中 / 总任务数)

---

## 🚀 快速开始指南

### 本地开发
```bash
# 前端
npm install
npm run dev

# 后端 (Phase 3)
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload
```

### 环境变量
复制 `.env.example` 到 `.env.local` 并配置 Dify API。

---

## 📖 附录

### Word 模板制作指南
见 `CUSTOM_TEMPLATE_GUIDE.md`

### Dify Workflow 配置
见 `dify-workflow-examples.json`

---

**最后更新**: 2026-01-28
**维护者**: AI Assistant
