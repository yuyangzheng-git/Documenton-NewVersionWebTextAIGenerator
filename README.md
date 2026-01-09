<div align="center">

# ✨ Document AI Generator

**AI-Powered Document Writing Assistant**

Create professional documents effortlessly with the power of AI

[![Next.js](https://img.shields.io/badge/Next.js-16.1-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)](LICENSE)

[English](#english) | [中文](#中文)

</div>

---

## 中文

### 📖 简介

Document AI Generator 是一个基于人工智能的文档写作助手，能够帮助用户快速生成专业的文档大纲、章节内容，并支持导出为 Word 格式。

### ✨ 核心功能

- **🤖 AI 大纲生成** - 输入文档主题，自动生成结构化的大纲
- **📝 智能章节写作** - 一键生成各章节的详细内容
- **💬 实时 AI 助手** - 右下角悬浮 AI 聊天窗口，支持流式响应
- **🔄 章节重写** - 输入"帮我重写 1.1"即可重写指定章节
- **📄 Word 导出** - 支持多种模板，一键导出专业 Word 文档
- **🎨 自定义模板** - 上传自定义 Word 模板，个性化文档样式
- **📊 实时大纲** - 右侧大纲面板，实时查看和编辑文档结构
- **🖱️ 拖拽排序** - 支持大纲章节的拖拽排序
- **⚡ 流式生成** - 实时显示生成内容，体验流畅

### 🚀 快速开始

#### 环境要求

- Node.js 18+ 
- npm 或 yarn 或 pnpm

#### 安装步骤

1. **克隆项目**

```bash
git clone https://github.com/yuyangzheng-git/Documenton-NewVersionWebTextAIGenerator.git
cd Documenton-NewVersionWebTextAIGenerator/ai-document-generator
```

2. **安装依赖**

```bash
npm install
```

3. **配置环境变量**

复制 `.env.example` 为 `.env.local` 并填写你的 API 配置：

```bash
cp .env.example .env.local
```

编辑 `.env.local` 文件：

```env
# Dify Planner App API Key (用于生成文档大纲)
NEXT_PUBLIC_DIFY_PLANNER_API_KEY=your_planner_app_key_here

# Dify Chapter Writer App API Key (用于生成章节内容)
NEXT_PUBLIC_DIFY_CHAPTER_API_KEY=your_chapter_writer_app_key_here

# Dify API Base URL
NEXT_PUBLIC_DIFY_API_URL=http://your-dify-instance/v1

# Dify AI Chat App API Key (用于悬浮聊天窗口)
NEXT_PUBLIC_DIFY_CHAT_API_KEY=your_chat_app_key_here
```

4. **启动开发服务器**

```bash
npm run dev
```

5. **打开浏览器**

访问 [http://localhost:3000](http://localhost:3000)

### 📸 功能演示

#### 1. 生成文档大纲

在首页输入文档主题，点击生成按钮，AI 将自动生成结构化大纲。

#### 2. 编辑和生成章节

- 在编辑器中查看和编辑大纲
- 点击右侧大纲面板中的"▶"按钮生成单个章节
- 父章节的生成按钮会批量生成所有子章节

#### 3. AI 智能助手

- 右下角悬浮 AI 聊天窗口
- 支持流式响应，实时显示生成内容
- 输入"帮我重写 1.1"可重写指定章节

#### 4. 导出文档

- 选择内置模板或上传自定义模板
- 点击导出按钮，生成 Word 文档

### 🏗️ 技术栈

- **框架**: [Next.js 16](https://nextjs.org/)
- **语言**: [TypeScript](https://www.typescriptlang.org/)
- **状态管理**: [Zustand](https://zustand-demo.pmnd.rs/)
- **拖拽**: [DnD Kit](https://dndkit.com/)
- **图标**: [Lucide React](https://lucide.dev/)
- **文档生成**: [docx](https://docx.js.org/)
- **AI 集成**: [Dify](https://dify.ai/)

### 📂 项目结构

```
ai-document-generator/
├── app/                    # Next.js App Router
│   ├── api/               # API 路由
│   ├── word-editor/       # 文档编辑器页面
│   └── page.tsx           # 首页
├── components/            # React 组件
│   ├── outline/          # 大纲相关组件
│   ├── NotionEditor.tsx  # Notion 风格编辑器
│   └── AIChat.tsx        # AI 聊天组件
├── lib/                  # 工具库
│   ├── dify-api.ts      # Dify API 集成
│   ├── export-utils.ts  # 文档导出工具
│   └── template-*.ts    # 模板相关工具
├── store/               # Zustand 状态管理
│   ├── useStore.ts      # 全局状态
│   └── useDocumentActions.ts # 文档操作
└── types/               # TypeScript 类型定义
```

### 🔧 配置说明

#### Dify 配置

本项目使用 [Dify](https://dify.ai/) 作为 AI 服务提供商。你需要配置两个 Dify 应用：

1. **Planner App** - 用于生成文档大纲
   - 在 Dify 创建一个 Workflow 应用
   - 配置输入变量：`prompt` (string)
   - 配置输出变量：`outline` (json array)

2. **Chapter Writer App** - 用于生成章节内容
   - 在 Dify 创建一个 Chat 应用
   - 配置系统提示词，指导 AI 生成专业内容

详细配置请参考 [DIFY_CONFIG_GUIDE.md](./DIFY_CONFIG_GUIDE.md)

#### 环境变量说明

| 变量名 | 说明 | 必需 |
|--------|------|------|
| `NEXT_PUBLIC_DIFY_PLANNER_API_KEY` | 大纲生成 API Key | 是 |
| `NEXT_PUBLIC_DIFY_CHAPTER_API_KEY` | 章节写作 API Key | 是 |
| `NEXT_PUBLIC_DIFY_API_URL` | Dify API 地址 | 是 |
| `NEXT_PUBLIC_DIFY_CHAT_API_KEY` | AI 聊天 API Key | 是 |

### 🤝 贡献指南

欢迎提交 Issue 和 Pull Request！

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'feat: Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

### 📄 许可证

本项目采用 [MIT](LICENSE) 许可证。

### 📮 联系方式

- 作者: yuyangzheng
- GitHub: [@yuyangzheng-git](https://github.com/yuyangzheng-git)
- 问题反馈: [Issues](https://github.com/yuyangzheng-git/Documenton-NewVersionWebTextAIGenerator/issues)

---

## English

### 📖 Introduction

Document AI Generator is an AI-powered document writing assistant that helps users quickly generate professional document outlines and chapter content, with support for exporting to Word format.

### ✨ Core Features

- **🤖 AI Outline Generation** - Input a topic and automatically generate a structured outline
- **📝 Smart Chapter Writing** - Generate detailed content for each chapter with one click
- **💬 Real-time AI Assistant** - Floating AI chat window with streaming response support
- **🔄 Chapter Rewrite** - Type "帮我重写 1.1" to rewrite a specific chapter
- **📄 Word Export** - Multiple templates supported, export professional Word documents
- **🎨 Custom Templates** - Upload custom Word templates for personalized document styles
- **📊 Live Outline** - Right-side outline panel for real-time viewing and editing
- **🖱️ Drag & Drop** - Drag and drop support for outline chapter reordering
- **⚡ Streaming Generation** - Real-time content display for smooth experience

### 🚀 Quick Start

#### Prerequisites

- Node.js 18+
- npm, yarn, or pnpm

#### Installation

1. **Clone the repository**

```bash
git clone https://github.com/yuyangzheng-git/Documenton-NewVersionWebTextAIGenerator.git
cd Documenton-NewVersionWebTextAIGenerator/ai-document-generator
```

2. **Install dependencies**

```bash
npm install
```

3. **Configure environment variables**

Copy `.env.example` to `.env.local` and fill in your API configuration:

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```env
# Dify Planner App API Key (for generating document outlines)
NEXT_PUBLIC_DIFY_PLANNER_API_KEY=your_planner_app_key_here

# Dify Chapter Writer App API Key (for generating chapter content)
NEXT_PUBLIC_DIFY_CHAPTER_API_KEY=your_chapter_writer_app_key_here

# Dify API Base URL
NEXT_PUBLIC_DIFY_API_URL=http://your-dify-instance/v1

# Dify AI Chat App API Key (for the floating chat window)
NEXT_PUBLIC_DIFY_CHAT_API_KEY=your_chat_app_key_here
```

4. **Start the development server**

```bash
npm run dev
```

5. **Open in browser**

Visit [http://localhost:3000](http://localhost:3000)

### 📸 Feature Showcase

#### 1. Generate Document Outline

Enter a document topic on the homepage and click generate. AI will automatically create a structured outline.

#### 2. Edit and Generate Chapters

- View and edit the outline in the editor
- Click the "▶" button in the right outline panel to generate a single chapter
- Parent chapter generation button triggers batch generation of all child chapters

#### 3. AI Intelligent Assistant

- Floating AI chat window in the bottom-right corner
- Streaming response support with real-time content display
- Type "帮我重写 1.1" to rewrite a specific chapter

#### 4. Export Document

- Select a built-in template or upload a custom template
- Click export to generate a Word document

### 🏗️ Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **State Management**: [Zustand](https://zustand-demo.pmnd.rs/)
- **Drag & Drop**: [DnD Kit](https://dndkit.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Document Generation**: [docx](https://docx.js.org/)
- **AI Integration**: [Dify](https://dify.ai/)

### 📂 Project Structure

```
ai-document-generator/
├── app/                    # Next.js App Router
│   ├── api/               # API Routes
│   ├── word-editor/       # Document Editor Page
│   └── page.tsx           # Homepage
├── components/            # React Components
│   ├── outline/          # Outline Components
│   ├── NotionEditor.tsx  # Notion-style Editor
│   └── AIChat.tsx        # AI Chat Component
├── lib/                  # Utility Libraries
│   ├── dify-api.ts      # Dify API Integration
│   ├── export-utils.ts  # Document Export Tools
│   └── template-*.ts    # Template Utilities
├── store/               # Zustand State Management
│   ├── useStore.ts      # Global State
│   └── useDocumentActions.ts # Document Actions
└── types/               # TypeScript Type Definitions
```

### 🔧 Configuration Guide

#### Dify Configuration

This project uses [Dify](https://dify.ai/) as the AI service provider. You need to configure two Dify applications:

1. **Planner App** - For generating document outlines
   - Create a Workflow app in Dify
   - Configure input variables: `prompt` (string)
   - Configure output variables: `outline` (json array)

2. **Chapter Writer App** - For generating chapter content
   - Create a Chat app in Dify
   - Configure system prompts to guide AI in generating professional content

For detailed configuration, see [DIFY_CONFIG_GUIDE.md](./DIFY_CONFIG_GUIDE.md)

#### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_DIFY_PLANNER_API_KEY` | Outline generation API Key | Yes |
| `NEXT_PUBLIC_DIFY_CHAPTER_API_KEY` | Chapter writing API Key | Yes |
| `NEXT_PUBLIC_DIFY_API_URL` | Dify API URL | Yes |
| `NEXT_PUBLIC_DIFY_CHAT_API_KEY` | AI chat API Key | Yes |

### 🤝 Contributing

Issues and Pull Requests are welcome!

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'feat: Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### 📄 License

This project is licensed under the [MIT](LICENSE) License.

### 📮 Contact

- Author: yuyangzheng
- GitHub: [@yuyangzheng-git](https://github.com/yuyangzheng-git)
- Issues: [Issues](https://github.com/yuyangzheng-git/Documenton-NewVersionWebTextAIGenerator/issues)

---

<div align="center">

**⭐ Star this repo if it helped you!**

Made with ❤️ by [yuyangzheng-git](https://github.com/yuyangzheng-git)

</div>
