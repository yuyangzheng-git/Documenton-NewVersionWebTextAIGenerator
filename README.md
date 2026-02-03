# AI Document Generator - 完整文档

**AI驱动的专业文档写作平台**

[![Next.js](https://img.shields.io/badge/Next.js-16.1-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Docker](https://img.shields.io/badge/Docker-Ready-blue?style=flat-square&logo=docker)](https://www.docker.com/)

---

# 目录

1. [项目简介](#项目简介)
2. [核心功能](#核心功能)
3. [最新更新](#最新更新)
4. [快速开始](#快速开始)
5. [AI 平台配置](#ai-平台配置)
6. [表格功能](#表格功能)
7. [富文本编辑](#富文本编辑)
8. [导出功能](#导出功能)
9. [Docker 部署](#docker-部署)
10. [自定义模板](#自定义模板)
11. [技术栈](#技术栈)
12. [贡献指南](#贡献指南)
13. [常见问题](#常见问题)
14. [安全政策](#安全政策)

---

# 项目简介

基于 AI 的智能文档生成系统，支持自动生成大纲、章节内容，并导出为格式完美的 Word 文档。支持 12+ 主流 AI 模型。

## 主要特性

- 🤖 **AI 智能大纲** - 一键生成结构化文档大纲
- 📝 **章节内容规划** - 每个章节独立规划写作要求
- ⚡ **流式实时生成** - 实时显示 AI 生成内容
- 📊 **智能表格** - Markdown 表格自动识别，支持编辑和拖拽
- ✨ **富文本编辑** - 支持加粗、斜体、下划线等 Markdown 格式
- 📄 **Word 导出** - 使用 Pandoc 生成格式完美的文档
- 🎨 **模板支持** - 自定义 Word 模板（字体、页眉页脚、背景图）
- 🌐 **12+ AI 平台** - 支持 Dify、OpenAI、Claude、Gemini 等主流模型

---

# 核心功能

## 支持的 AI 平台

### 国际主流平台
- **OpenAI** (GPT-4o, GPT-4 Turbo)
- **Claude 3.5** (Anthropic)
- **Google Gemini 2.5**
- **Cohere Command R**

### 国内平台
- **通义千问 (Qwen)** - 阿里云
- **文心一言 (ERNIE)** - 百度
- **智谱 GLM (Zhipu)** - 智谱AI
- **Kimi (Moonshot)** - 月之暗面

### 开源/快速推理
- **DeepSeek**
- **Groq** (Llama 3.3)
- **Dify** 平台

## 功能列表

| 功能 | 描述 |
|------|------|
| 智能大纲生成 | AI 自动生成文档结构化大纲 |
| 章节内容规划 | 为每个章节设置独立的写作要求 |
| 流式内容生成 | 实时显示 AI 生成的内容 |
| 智能表格识别 | 自动识别 Markdown 表格并转换为可编辑表格 |
| 富文本编辑 | 支持加粗、斜体、下划线等格式 |
| 段落编辑 | 每个段落可独立编辑、删除、重新生成 |
| 拖拽排序 | 支持块级拖拽重新排序 |
| Word 导出 | 自动生成 3 层目录，支持图片和表格 |
| 自定义模板 | 使用自己的 Word 模板文件 |

---

# 最新更新

## 🎉 v1.2.0 - 富文本编辑支持

### ✨ 新功能

#### 1. 所有文本块支持富文本编辑
- **支持格式**：加粗 (**text**)、斜体 (*text*)、下划线、删除线 (~~text~~)、行内代码 (`code`)
- **显示模式**：文本框外显示格式化的 HTML
- **编辑模式**：点击文本后显示原始 Markdown
- **自动保存**：编辑完成后自动保存格式

#### 2. 支持的块类型
- 正文段落
- 标题 (H1, H2, H3)
- 无序列表
- 有序列表
- 引用块
- 提示块

#### 3. 导出兼容性
- 格式化文本完整导出到 Word 文档
- 自动转换为对应的 DOCX 格式

### 🔧 技术实现
- 创建 `lib/markdown-renderer.ts` 处理 Markdown 到 HTML 的转换
- 所有文本块添加 `isEditing` 状态进行模式切换
- 使用 `dangerouslySetInnerHTML` 安全渲染 HTML

---

## 🎉 v1.1.0 - 表格功能完全重写

### ✨ 新功能

#### 1. 全新的TableBlock组件
- **完全重写的表格系统**，基于原生HTML table实现
- **响应式设计**：表格宽度与正文块一致（704px），支持横向滚动
- **智能滚动条**：随着列数增加，滚动条自动变小，滚动范围增大
- **自动宽度调整**：cell宽度根据内容自动调整，支持自动换行

#### 2. 优雅的操作按钮
- **小圆形按钮**：14px精致圆形按钮，嵌在表格边框上
- **颜色区分**：
  - 加号（添加列/行）：蓝色 `#2383E2`
  - 减号（删除列/行）：红色 `#d32f2f`
- **流畅动画**：悬停放大1.2倍，点击缩小效果

#### 3. Markdown表格自动识别
- **实时检测**：流式生成过程中自动识别Markdown表格
- **自动转换**：将Markdown表格（`| col1 | col2 |` 格式）自动转换为TableBlock
- **智能解析**：支持表头、分隔线、多行数据的标准Markdown表格格式

### 🔧 技术改进

#### 核心文件
1. **components/blocks/TableBlock/**
   - `TableBlock.tsx` - 主表格组件
   - `TableCell.tsx` - 单元格组件，支持编辑和导航
   - `types.ts` - 类型定义
   - `utils/` - 工具函数（验证、默认值、操作）
   - `operations/` - CRUD操作

2. **lib/table-parser.ts**
   - `parseMarkdownTable()` - 解析Markdown表格字符串
   - `extractTablesFromContent()` - 从生成内容中提取表格

### 🐛 Bug修复

- ✅ 修复滚动条大小不随列数变化的问题
- ✅ 确保表格不超出正文块宽度
- ✅ 修复表头不显示的bug
- ✅ 移除"空"占位符，改用不可见空格
- ✅ 空cell有最小高度24px，不会太矮

### 📊 表格特性

- **宽度管理**：`width: 100%` 默认填满，`minWidth: fit-content` 支持扩展
- **布局模式**：`tableLayout: auto` 自动计算列宽
- **边框样式**：`1px solid #e0e0e0` 统一边框
- **表头样式**：`#F7F6F3` 背景，600字重
- **滚动体验**：
  - Webkit滚动条：8px高度，圆角4px
  - 普通浏览器：`scrollbarWidth: thin`

---

# 快速开始

## 方式 1: Docker Compose (推荐)

```bash
# 1. 克隆仓库
git clone https://github.com/yuyangzheng-git/Documenton-NewVersionWebTextAIGenerator.git
cd Documenton-NewVersionWebTextAIGenerator

# 2. 配置环境变量
cp .env.example .env.local
# 编辑 .env.local 填写你的 API Key

# 3. 启动服务
docker-compose up -d

# 4. 访问应用
open http://localhost:3000
```

## 方式 2: Docker 命令

```bash
# 构建镜像
docker build -t ai-document-generator .

# 运行容器
docker run -d \
  --name ai-doc-gen \
  -p 3000:3000 \
  --env-file .env.local \
  ai-document-generator

# 访问应用
open http://localhost:3000
```

## 方式 3: 本地开发

```bash
# 1. 安装依赖
npm install

# 2. 配置环境变量
cp .env.example .env.local
# 编辑 .env.local

# 3. 安装系统依赖
# macOS:
brew install python3 pandoc

# Ubuntu/Debian:
sudo apt-get install python3 python3-pip pandoc

# 4. 安装 Python 依赖
pip3 install -r requirements.txt

# 5. 启动开发服务器
npm run dev
```

---

# AI 平台配置

## 环境变量配置

创建 `.env.local` 文件：

```env
# AI 平台选择
AI_PLATFORM=dify  # 可选: dify | openai | claude | gemini | kimi | qwen | deepseek | groq | cohere | wenxin | zhipu

# Dify 配置
NEXT_PUBLIC_DIFY_OUTLINE_API_KEY=app-your-outline-api-key
NEXT_PUBLIC_DIFY_CHAPTER_API_KEY=app-your-chapter-api-key
NEXT_PUBLIC_DIFY_CHAT_API_KEY=app-your-chat-api-key

# OpenAI 配置
OPENAI_API_KEY=sk-your-openai-api-key
OPENAI_MODEL=gpt-4-turbo
OPENAI_BASE_URL=https://api.openai.com/v1

# Claude 配置
CLAUDE_API_KEY=sk-ant-your-claude-api-key
CLAUDE_MODEL=claude-3-5-sonnet-20241022
CLAUDE_BASE_URL=https://api.anthropic.com

# Gemini 配置
GEMINI_API_KEY=your-gemini-api-key
GEMINI_MODEL=gemini-1.5-pro
GEMINI_BASE_URL=https://generativelanguage.googleapis.com/v1beta

# Kimi 配置
KIMI_API_KEY=your-kimi-api-key
KIMI_MODEL=moonshot-v1-8k
KIMI_BASE_URL=https://api.moonshot.cn/v1

# Qwen 配置
QWEN_API_KEY=your-qwen-api-key
QWEN_MODEL=qwen-turbo
QWEN_BASE_URL=https://dashscope.aliyuncs.com/compatible-mode/v1

# DeepSeek 配置
DEEPSEEK_API_KEY=your-deepseek-api-key
DEEPSEEK_MODEL=deepseek-chat
DEEPSEEK_BASE_URL=https://api.deepseek.com

# Groq 配置
GROQ_API_KEY=your-groq-api-key
GROQ_MODEL=llama-3.3-70b-versatile
GROQ_BASE_URL=https://api.groq.com/openai/v1

# Cohere 配置
COHERE_API_KEY=your-cohere-api-key
COHERE_MODEL=command-r-plus
COHERE_BASE_URL=https://api.cohere.ai

# Wenxin 配置
WENXIN_API_KEY=your-wenxin-api-key
WENXIN_SECRET_KEY=your-wenxin-secret-key
WENXIN_MODEL=ernie-4.0-8k

# Zhipu 配置
ZHIPU_API_KEY=your-zhipu-api-key
ZHIPU_MODEL=glm-4-plus
ZHIPU_BASE_URL=https://open.bigmodel.cn/api/paas/v4
```

## Dify 平台配置

### 获取 API 密钥

1. 访问 [Dify Cloud](https://cloud.dify.ai) 或部署私有化 Dify
2. 注册账号并登录
3. 创建三个应用：
   - **大纲生成** - 用于生成文档大纲
   - **章节写作** - 用于生成章节内容
   - **AI 助手** - 用于对话式编辑

### Dify 工作流设置

#### 大纲生成工作流

**节点配置**:
1. **开始节点**
   - 输入变量：`topic` (文档主题)

2. **LLM 节点**
   - 模型：GPT-4 或其他强大模型
   - 提示词：见下方

3. **输出节点**
   - 输出变量：`outline` (生成的大纲)

**提示词**:
```
根据以下主题生成一个专业的文档大纲。

主题：{{topic}}

要求：
1. 包含 3-5 个一级标题
2. 每个一级标题下包含 2-4 个二级标题
3. 使用序号格式（1. 1.1 1.2）
4. 每个标题简洁明确

请直接输出大纲，不要额外解释。
```

#### 章节写作工作流

**节点配置**:
1. **开始节点**
   - `topic` - 文档主题
   - `outline` - 完整大纲
   - `section_title` - 当前章节标题
   - `requirements` - 写作要求（可选）

2. **LLM 节点** (流式输出)
   - 模型：GPT-4 Turbo 或 GPT-3.5 Turbo
   - 启用流式输出
   - 提示词：见下方

3. **输出节点**
   - 输出：生成的章节内容

**提示词**:
```
你是一个专业的内容写作助手。

文档主题：{{topic}}

完整大纲：
{{outline}}

当前章节：{{section_title}}

写作要求：{{requirements}}

请为当前章节撰写详细的内容。要求：
1. 内容专业、准确、有深度
2. 段落清晰，逻辑连贯
3. 可以使用 Markdown 格式（标题、列表、表格等）
4. 字数：800-1500字

请开始撰写：
```

---

# 表格功能

## 快速使用

### 插入表格

1. 在文档中按 `/` 显示菜单
2. 选择"表格"选项
3. 选择表格的行列数（默认3x3）

### 表格操作

#### 添加行/列
- 右侧蓝色 `+` 按钮：添加列
- 底部蓝色 `+` 按钮：添加行

#### 删除行/列
- 右侧红色 `-` 按钮：删除列
- 底部红色 `-` 按钮：删除行

#### 编辑单元格
- 点击单元格进行编辑
- Tab 键：下一个单元格
- Shift+Tab：上一个单元格
- Enter：下一行
- Esc：退出编辑

## Markdown 表格自动识别

系统会自动识别 AI 生成的 Markdown 表格格式：

```markdown
| 列1 | 列2 | 列3 |
|-----|-----|-----|
| 数据1 | 数据2 | 数据3 |
| 数据4 | 数据5 | 数据6 |
```

自动转换为可编辑的表格块。

---

# 富文本编辑

## 支持的格式

### 文本格式
- **加粗**: `**text**` 或 `__text__`
- **斜体**: `*text*` 或 `_text_`
- **下划线**: `<u>text</u>`
- **删除线**: `~~text~~`
- **行内代码**: `` `code` ``

### 使用方法

1. **输入格式**: 直接输入 Markdown 语法
   ```
   这是 **加粗文本** 和 *斜体文本*
   ```

2. **显示效果**: 点击外部自动显示格式化结果
   ```
   这是 加粗文本 和 斜体文本
   （加粗和斜体会按样式渲染）
   ```

3. **编辑**: 再次点击恢复原始 Markdown 进行编辑

### 导出

所有格式化文本在导出到 Word 时完整保留：
- 加粗 → **Bold**
- 斜体 → *Italic*
- 删除线 → ~~Strikethrough~~
- 行内代码 → Code with styling

---

# 导出功能

## Word 导出

### 支持的内容
- ✅ 所有文本块（支持富文本格式）
- ✅ 标题（自动生成目录）
- ✅ 列表（有序和无序）
- ✅ 表格（包括Markdown自动识别的表格）
- ✅ 图片（HTTP/HTTPS 或 Base64）
- ✅ 代码块（带语言高亮）
- ✅ 引用块

### 导出步骤

1. 点击页面右上角 "导出" 按钮
2. 选择导出格式（DOCX、PDF）
3. 等待导出完成
4. 自动下载文件

### 更新目录（Word）

在 Word 中打开生成的文档：
1. 右键点击目录
2. 选择 "更新域" → "更新整个目录"
3. 或按 F9 键快速更新

---

# Docker 部署

## Docker Compose 部署

### 基础部署

```bash
# 1. 克隆项目
git clone <your-repo-url>
cd Documenton-NewVersionWebTextAIGenerator

# 2. 配置环境变量
cp .env.example .env.local
# 编辑 .env.local

# 3. 启动服务
docker-compose up -d

# 4. 查看日志
docker-compose logs -f

# 5. 停止服务
docker-compose down
```

### 自定义配置

修改 `docker-compose.yml`：

```yaml
services:
  app:
    ports:
      - "8080:3000"  # 修改端口
    environment:
      - NODE_ENV=production
    volumes:
      # 挂载自定义模板
      - ./my-template.docx:/app/reference_template.docx:ro
```

## Docker 命令部署

```bash
# 构建镜像
docker build -t ai-doc-generator .

# 运行容器
docker run -d \
  --name ai-doc-gen \
  -p 3000:3000 \
  --env-file .env.local \
  -v $(pwd)/my-template.docx:/app/reference_template.docx:ro \
  ai-document-generator

# 查看日志
docker logs -f ai-doc-gen

# 停止容器
docker stop ai-doc-gen

# 删除容器
docker rm ai-doc-gen
```

## 生产环境建议

### 1. 使用 HTTPS

配置 Nginx 反向代理：

```nginx
server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 2. 资源限制

在 `docker-compose.yml` 中添加：

```yaml
services:
  app:
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 2G
        reservations:
          cpus: '1'
          memory: 1G
```

### 3. 健康检查

已内置健康检查端点 `/api/health`。

### 4. 自动重启

配置中已启用 `restart: unless-stopped`。

---

# 自定义模板

## 创建自定义 Word 模板

### 1. 使用 Microsoft Word 创建模板

1. 打开 Microsoft Word
2. 设置文档样式：
   - **标题 1** - 一级标题样式
   - **标题 2** - 二级标题样式
   - **标题 3** - 三级标题样式
   - **正文** - 段落文本样式

3. 设置页面样式：
   - 页眉和页脚
   - 页边距
   - 字体（中文：宋体，英文：Times New Roman）

4. 保存为 `reference_template.docx`

### 2. 模板示例配置

```
页面设置：
- 纸张：A4
- 方向：纵向
- 页边距：上下 2.54cm，左右 3.18cm

字体设置：
- 标题 1：黑体，小二号（18pt），加粗
- 标题 2：黑体，三号（16pt），加粗
- 标题 3：黑体，四号（14pt），加粗
- 正文：宋体，小四号（12pt）

段落设置：
- 首行缩进：2字符
- 行距：1.5倍
```

### 3. 使用模板

#### 本地开发

将模板文件放在项目根目录：

```bash
cp your-template.docx reference_template.docx
```

#### Docker 部署

挂载模板文件到容器：

```bash
docker run -d \
  --name ai-doc-gen \
  -p 3000:3000 \
  -v $(pwd)/reference_template.docx:/app/reference_template.docx:ro \
  --env-file .env.local \
  ai-document-generator
```

或在 `docker-compose.yml` 中配置：

```yaml
services:
  app:
    volumes:
      - ./reference_template.docx:/app/reference_template.docx:ro
```

---

# 技术栈

## 前端技术

```
Framework:     Next.js 16.1 (App Router)
Language:      TypeScript 5.0
UI Library:    React 19
State:         Zustand (轻量级状态管理)
Styling:       Tailwind CSS
Icons:         Lucide Icons
Drag & Drop:   DnD Kit
Editor:        自定义块编辑器
```

## 后端技术

```
Runtime:       Node.js 20
API Routes:    Next.js API Routes
Export:        Pandoc (通过 pypandoc)
Python:        Python 3.x
Database:      IndexedDB (客户端存储)
```

## AI 集成

```
平台支持:      Dify, OpenAI, Claude, Gemini, Kimi, Qwen
              DeepSeek, Groq, Cohere, Wenxin, Zhipu
流式输出:      Server-Sent Events (SSE)
提示词管理:    Markdown 格式提示词文件
```

## 部署

```
容器化:        Docker + Docker Compose
CI/CD:        GitHub Actions
镜像仓库:      Docker Hub / GitHub Container Registry
多架构:        AMD64, ARM64
```

## 项目结构

```
ai-document-generator/
├── app/                      # Next.js App Router
│   ├── word-editor/         # 文档编辑器页面
│   ├── api/                 # API 路由
│   │   ├── ai/chat/        # AI 对话接口
│   │   └── export/docx/    # Word 导出接口
│   └── globals.css         # 全局样式
│
├── components/              # React 组件
│   ├── NotionEditor.tsx    # 块编辑器主组件
│   ├── NotionBlock.tsx     # 单个块组件
│   ├── AIChat.tsx          # AI 对话组件
│   ├── blocks/             # 块类型组件
│   │   ├── TableBlock/     # 表格组件
│   │   ├── ImageBlock.tsx  # 图片块
│   │   └── CodeBlock.tsx   # 代码块
│   └── outline/            # 大纲组件
│
├── lib/                     # 工具库
│   ├── ai/                 # AI 平台集成
│   ├── markdown-renderer.ts # Markdown 到 HTML 转换
│   ├── table-parser.ts     # 表格解析
│   ├── db.ts               # IndexedDB 封装
│   └── logger.ts
│
├── store/                  # Zustand 状态管理
│
├── hooks/                  # 自定义 Hooks
│
├── public/                 # 静态资源
│
├── Dockerfile             # Docker 配置
├── docker-compose.yml     # Docker Compose 配置
└── package.json           # 项目依赖
```

---

# 贡献指南

## 如何贡献

欢迎为项目做出贡献！

### 报告问题

1. 检查 [Issues](https://github.com/yuyangzheng-git/Documenton-NewVersionWebTextAIGenerator/issues) 确保问题未被报告
2. 创建新 Issue，包含：
   - 问题描述
   - 复现步骤
   - 预期行为
   - 实际行为
   - 环境信息（浏览器、操作系统等）

### 提交代码

1. **Fork 项目**
   ```bash
   git clone https://github.com/your-username/Documenton-NewVersionWebTextAIGenerator.git
   cd Documenton-NewVersionWebTextAIGenerator
   ```

2. **创建分支**
   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **开发和测试**
   ```bash
   npm install
   npm run dev
   npm run build  # 确保构建成功
   ```

4. **提交代码**
   ```bash
   git add .
   git commit -m "feat: add your feature description"
   git push origin feature/your-feature-name
   ```

5. **创建 Pull Request**
   - 描述你的更改
   - 关联相关 Issue
   - 等待代码审查

### 代码规范

- 使用 TypeScript
- 遵循项目现有代码风格
- 为新功能添加注释
- 确保构建无错误

### 提交信息规范

使用语义化提交信息：

```
feat: 添加新功能
fix: 修复 bug
docs: 更新文档
style: 代码格式调整
refactor: 重构代码
test: 添加测试
chore: 构建配置等
```

---

# 常见问题

## 部署相关

**Q: Docker 构建失败？**

A: 检查以下几点：
1. Docker 版本是否 >= 20.10
2. 网络是否正常（需要下载依赖）
3. 磁盘空间是否充足（至少 5GB）

**Q: 端口冲突怎么办？**

A: 修改 `docker-compose.yml` 中的端口映射：
```yaml
ports:
  - "8080:3000"  # 改为其他端口
```

## 功能相关

**Q: Word 导出失败？**

A: 确保 Pandoc 已安装：
```bash
pandoc --version
```

如使用 Docker，Pandoc 已内置。

**Q: 目录页码不显示？**

A: 在 Word 中右键目录 → 更新域 → 更新整个目录（或按 F9）

**Q: 表格不显示？**

A: 检查以下几点：
1. 表格是否使用标准 Markdown 格式
2. AI 生成的表格是否包含表头和分隔线
3. 刷新页面重新加载

**Q: 富文本格式不显示？**

A: 检查以下几点：
1. 确保使用了正确的 Markdown 语法
2. 刷新页面
3. 尝试重新点击文本块进入编辑模式

**Q: AI 生成速度慢？**

A:
1. 检查网络连接
2. 尝试更换 AI 模型（如从 GPT-4 切换到 GPT-3.5）
3. 使用 Groq 等快速推理平台

## 配置相关

**Q: Dify API 密钥在哪里获取？**

A:
1. 访问 https://cloud.dify.ai
2. 创建应用
3. 在应用设置中复制 API Key

**Q: 可以同时使用多个 AI 平台吗？**

A: 可以。在设置中切换不同平台，环境变量配置多个平台的密钥即可。

**Q: 支持私有化部署吗？**

A: 完全支持。使用 Docker 部署到自己的服务器，配置私有化的 AI 服务。

---

# 安全政策

## 报告安全漏洞

如果发现安全漏洞，请**不要**公开发布。

包含以下信息：
- 漏洞描述
- 影响范围
- 复现步骤
- 建议的修复方案

我们会在 48 小时内回复。

## 安全最佳实践

### API 密钥管理

- ✅ 使用环境变量存储 API 密钥
- ✅ 不要将 `.env.local` 提交到 Git
- ✅ 使用 `.env.example` 作为模板
- ❌ 不要在代码中硬编码密钥

### Docker 安全

- ✅ 使用非 root 用户运行容器
- ✅ 限制容器资源使用
- ✅ 定期更新基础镜像
- ❌ 不要使用 `--privileged` 标志

### 生产部署

- ✅ 使用 HTTPS
- ✅ 启用 CORS 限制
- ✅ 设置请求速率限制
- ✅ 定期备份数据

---

# 许可证

本项目采用 [MIT License](LICENSE) 开源。

```
MIT License

Copyright (c) 2024 AI Document Generator

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

# 致谢

- [Next.js](https://nextjs.org/) - React 框架
- [Pandoc](https://pandoc.org/) - 文档转换工具
- [Dify](https://dify.ai/) - AI 应用开发平台
- [Tailwind CSS](https://tailwindcss.com/) - CSS 框架
- [Lucide Icons](https://lucide.dev/) - 图标库

---

<div align="center">

**⭐ 如果这个项目对你有帮助，请给个 Star！**

Made with ❤️ by [yuyangzheng-git](https://github.com/yuyangzheng-git)

[GitHub](https://github.com/yuyangzheng-git/Documenton-NewVersionWebTextAIGenerator) •
[Issues](https://github.com/yuyangzheng-git/Documenton-NewVersionWebTextAIGenerator/issues) •
[Pull Requests](https://github.com/yuyangzheng-git/Documenton-NewVersionWebTextAIGenerator/pulls)

</div>

---

**版本**: v1.2.0
**日期**: 2026-02-03
**贡献者**: Claude Sonnet 4.5
