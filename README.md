# ✨ AI Document Generator
### AI-Powered Professional Document Writing Platform

<div align="center">

[![Next.js](https://img.shields.io/badge/Next.js-16.1-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)](LICENSE)
[![Docker](https://img.shields.io/badge/Docker-Ready-blue?style=flat-square&logo=docker)](https://www.docker.com/)

**[English](#english) | [中文](#中文)**

</div>

---

## 中文 | Chinese

### 🚀 项目简介

基于 AI 的智能文档生成系统，支持自动生成大纲、章节内容，并导出为格式完美的 Word 文档。支持 12+ 主流 AI 模型。

### ✨ 核心功能

| 🤖 AI 智能大纲 | 📝 章节内容规划 |
|---|---|
| 一键生成结构化大纲 | 每个二级标题独立规划 |
| 支持多级标题 | 可自定义写作要求 |
| 自动编号 | 实时同步编辑 |

| 📊 段落分段编辑 | ⚡ 流式实时生成 |
|---|---|
| 生成内容自动分段 | 实时显示生成内容 |
| 每段独立可编辑 | 流畅的用户体验 |
| 支持拖拽排序 | 支持中途停止 |

| 📄 Word 导出 | 🎨 模板支持 |
|---|---|
| 使用 Pandoc 生成格式完美的文档 | 自定义 Word 模板 |
| 自动生成 3 层目录 | 字体、页眉页脚、背景图 |
| 支持 URL 和 Base64 图片 | 多种导出格式 |

### 🌐 支持的 AI 平台 (12+)

| 🌍 国际主流 | 🇨🇳 国内平台 | 🔓 开源/快速 |
|---|---|---|
| OpenAI (GPT-4o) | 通义千问 (Qwen) | DeepSeek |
| Claude 3.5 (Anthropic) | 文心一言 (ERNIE) | Groq (Llama 3.3) |
| Google Gemini 2.5 | 智谱 GLM (Zhipu) | Dify |
| Cohere Command R | Kimi (Moonshot) | |

### 🎬 快速开始

#### 方式 1：克隆 + Docker Compose（推荐，最简单）

```bash
# 1. 克隆仓库
git clone https://github.com/yuyangzheng-git/Documenton-NewVersionWebTextAIGenerator.git
cd Documenton-NewVersionWebTextAIGenerator

# 2. 配置环境变量
cp .env.example .env
# 编辑 .env 填写你的 API Key

# 3. 启动服务
docker-compose up -d

# 4. 访问应用
open http://localhost:3000
```

#### 方式 2：使用 GitHub Container Registry 镜像

```bash
# 1. 拉取镜像
docker pull ghcr.io/yuyangzheng-git/documenton-newversionwebtextaigenerator:latest

# 2. 运行容器
docker run -d \
  --name ai-doc-generator \
  -p 3000:3000 \
  --env-file .env \
  ghcr.io/yuyangzheng-git/documenton-newversionwebtextaigenerator:latest

# 3. 访问应用
open http://localhost:3000
```

#### 本地开发

```bash
# 1. 克隆项目
git clone https://github.com/yuyangzheng-git/Documenton-NewVersionWebTextAIGenerator.git
cd Documenton-NewVersionWebTextAIGenerator

# 2. 安装依赖
npm install

# 3. 配置环境变量
cp .env.example .env.local
# 编辑 .env.local 填写你的 API Key

# 4. 安装系统依赖
# macOS:
brew install python3 pandoc

# Ubuntu/Debian:
sudo apt-get install python3 python3-pip pandoc

# 5. 安装 Python 依赖
pip3 install -r requirements.txt

# 6. 启动开发服务器
npm run dev
```

访问 http://localhost:3000

### 📋 环境变量配置

创建 `.env` 文件：

```env
# Dify API 配置
DIFY_API_URL=https://api.dify.ai/v1
DIFY_OUTLINE_API_KEY=app-your-outline-api-key
DIFY_CHAPTER_API_KEY=app-your-chapter-api-key

# 其他 AI 平台配置（可选）
NEXT_PUBLIC_DEEPSEEK_API_KEY=your_deepseek_api_key
NEXT_PUBLIC_OPENAI_API_KEY=your_openai_api_key
# ... 更多配置参考 AI_CONFIG_GUIDE.md
```

### 📄 自定义 Word 模板

1. 使用 Microsoft Word 创建模板文件
2. 设置样式（标题 1/2/3、正文等）
3. 保存为 `reference_template.docx`
4. 挂载到容器：

```bash
docker run -d \
  --name ai-doc-generator \
  -p 3000:3000 \
  -v $(pwd)/reference_template.docx:/app/reference_template.docx:ro \
  ghcr.io/yuyangzheng-git/documenton-newversionwebtextaigenerator:latest
```

详细说明请查看 [CUSTOM_TEMPLATE_GUIDE.md](CUSTOM_TEMPLATE_GUIDE.md)

### 🏗️ 技术栈

```
Frontend:  Next.js 16 + TypeScript + React 19
State:     Zustand
UI:        Tailwind CSS + Lucide Icons
Export:    Pandoc (Python pypandoc)
Drag:      DnD Kit
AI:        12+ 主流 LLM 支持
Container: Docker + Docker Compose
```

### 📸 功能演示

```
┌─────────────────────────────────────┐
│ 1️⃣ 输入主题                        │
│    "人工智能的发展历程"           │
├─────────────────────────────────────┤
│ 2️⃣ AI 生成大纲                      │
│    ├─ 1. 引言                        │
│    ├─ 2. AI 技术基础                │
│    ├─ 3. 深度学习时代              │
│    └─ 4. 未来趋势                  │
├─────────────────────────────────────┤
│ 3️⃣ 设置章节规划 (二级标题)        │
│    "介绍 AI 的起源、发展..."        │
├─────────────────────────────────────┤
│ 4️⃣ 生成内容 (流式显示)            │
│    人工智能（AI）起源于...         │
├─────────────────────────────────────┤
│ 5️⃣ 导出 Word 文档                   │
│    ✅ 一键导出                      │
└─────────────────────────────────────┘
```

### 🔧 Docker 部署详细说明

#### 镜像标签说明

| 标签 | 说明 | 使用场景 |
|------|------|----------|
| `latest` | 最新稳定版本 | 生产环境 |
| `main` | main 分支 | 开发测试 |
| `v1.0.0` | 特定版本 | 稳定部署 |

#### 自定义配置

**修改端口：**
编辑 `docker-compose.yml`：
```yaml
services:
  ai-document-generator:
    ports:
      - "8080:3000"
```

**挂载环境变量：**
```bash
docker run -d \
  --name ai-doc-generator \
  -p 3000:3000 \
  -v $(pwd)/.env:/app/.env:ro \
  -v $(pwd)/reference_template.docx:/app/reference_template.docx:ro \
  ghcr.io/yuyangzheng-git/documenton-newversionwebtextaigenerator:latest
```

#### 自动更新

使用 Watchtower 自动更新：
```bash
docker run -d \
  --name watchtower \
  -v /var/run/docker.sock:/var/run/docker.sock \
  containrrr/watchtower \
  --interval 3600 \
  ghcr.io/yuyangzheng-git/documenton-newversionwebtextaigenerator:latest
```

### 🤝 贡献

欢迎提交 Issue 和 Pull Request！

- [提交 Issue](https://github.com/yuyangzheng-git/Documenton-NewVersionWebTextAIGenerator/issues)
- [发起 Pull Request](https://github.com/yuyangzheng-git/Documenton-NewVersionWebTextAIGenerator/pulls)

### 📚 相关文档

- [AI 配置指南](AI_CONFIG_GUIDE.md) - 所有 AI 平台的详细配置
- [自定义模板指南](CUSTOM_TEMPLATE_GUIDE.md) - Word 模板创建
- [CONTRIBUTING.md](CONTRIBUTING.md) - 贡献指南
- [LICENSE](LICENSE) - MIT 许可证

### 🐛 常见问题

**Q: 导出 Word 失败？**

A: 检查 Pandoc 是否安装：`pandoc --version`

**Q: 目录页码不显示？**

A: 在 Word 中按 F9 更新目录（正常行为）

**Q: 图片不显示？**

A: 确保图片 URL 有效（http 或 data:image 开头）

**Q: 如何部署到服务器？**

A: 使用 Docker 拉取镜像运行即可，参考上面的部署说明

### 📄 许可证

本项目采用 [MIT License](LICENSE) 开源。

---

<div align="center">

**⭐ 如果这个项目对你有帮助，请给个 Star！**

Made with ❤️ by [yuyangzheng-git](https://github.com/yuyangzheng-git)

</div>

---

## English | English

### 🚀 Overview

AI-powered professional document writing platform that supports automatic outline generation, chapter content creation, and export to perfectly formatted Word documents. Supports 12+ mainstream AI models.

### ✨ Core Features

| 🤖 AI Smart Outline | 📝 Chapter Planning |
|---|---|
| One-click structured outline | Independent planning per level-2 heading |
| Multi-level heading support | Customizable writing requirements |
| Auto-numbering | Real-time sync editing |

| 📊 Paragraph Segmentation | ⚡ Streaming Generation |
|---|---|
| Auto-segment generated content | Real-time content display |
| Each paragraph independently editable | Smooth user experience |
| Drag-and-drop reordering | Mid-generation stop support |

| 📄 Word Export | 🎨 Template Support |
|---|---|
| Perfect formatting with Pandoc | Custom Word templates |
| Auto-generate 3-level TOC | Fonts, headers, footers, backgrounds |
| Support URL & Base64 images | Multiple export formats |

### 🌐 Supported AI Platforms (12+)

| 🌍 International | 🇨🇳 Domestic (China) | 🔓 Open Source / Fast |
|---|---|---|
| OpenAI (GPT-4o) | Qwen (Tongyi Qianwen) | DeepSeek |
| Claude 3.5 (Anthropic) | Wenxin Yiyuan (ERNIE) | Groq (Llama 3.3) |
| Google Gemini 2.5 | Zhipu GLM | Dify |
| Cohere Command R | Kimi (Moonshot) | |

### 🎬 Quick Start

#### Option 1: Clone + Docker Compose (Recommended, Easiest)

```bash
# 1. Clone repository
git clone https://github.com/yuyangzheng-git/Documenton-NewVersionWebTextAIGenerator.git
cd Documenton-NewVersionWebTextAIGenerator

# 2. Configure environment variables
cp .env.example .env
# Edit .env and fill in your API Key

# 3. Start services
docker-compose up -d

# 4. Access application
open http://localhost:3000
```

#### Option 2: Use GitHub Container Registry Image

```bash
# 1. Pull image
docker pull ghcr.io/yuyangzheng-git/documenton-newversionwebtextaigenerator:latest

# 2. Run container
docker run -d \
  --name ai-doc-generator \
  -p 3000:3000 \
  --env-file .env \
  ghcr.io/yuyangzheng-git/documenton-newversionwebtextaigenerator:latest

# 3. Access application
open http://localhost:3000
```

#### Local Development

```bash
# 1. Clone repository
git clone https://github.com/yuyangzheng-git/Documenton-NewVersionWebTextAIGenerator.git
cd Documenton-NewVersionWebTextAIGenerator

# 2. Install dependencies
npm install

# 3. Configure environment variables
cp .env.example .env.local
# Edit .env.local and fill in your API Key

# 4. Install system dependencies
# macOS:
brew install python3 pandoc

# Ubuntu/Debian:
sudo apt-get install python3 python3-pip pandoc

# 5. Install Python dependencies
pip3 install -r requirements.txt

# 6. Start development server
npm run dev
```

Visit http://localhost:3000

### 📋 Environment Variables

Create `.env` file:

```env
# Dify API Configuration
DIFY_API_URL=https://api.dify.ai/v1
DIFY_OUTLINE_API_KEY=app-your-outline-api-key
DIFY_CHAPTER_API_KEY=app-your-chapter-api-key

# Other AI Platform Configuration (Optional)
NEXT_PUBLIC_DEEPSEEK_API_KEY=your_deepseek_api_key
NEXT_PUBLIC_OPENAI_API_KEY=your_openai_api_key
# ... More configuration in AI_CONFIG_GUIDE.md
```

### 📄 Custom Word Templates

1. Create template file using Microsoft Word
2. Set styles (Heading 1/2/3, Normal, etc.)
3. Save as `reference_template.docx`
4. Mount to container:

```bash
docker run -d \
  --name ai-doc-generator \
  -p 3000:3000 \
  -v $(pwd)/reference_template.docx:/app/reference_template.docx:ro \
  ghcr.io/yuyangzheng-git/documenton-newversionwebtextaigenerator:latest
```

Detailed instructions in [CUSTOM_TEMPLATE_GUIDE.md](CUSTOM_TEMPLATE_GUIDE.md)

### 🏗️ Tech Stack

```
Frontend:  Next.js 16 + TypeScript + React 19
State:     Zustand
UI:        Tailwind CSS + Lucide Icons
Export:    Pandoc (Python pypandoc)
Drag:      DnD Kit
AI:        12+ Mainstream LLM Support
Container: Docker + Docker Compose
```

### 📸 Feature Demo

```
┌─────────────────────────────────────┐
│ 1️⃣ Input Topic                      │
│    "History of AI Development"      │
├─────────────────────────────────────┤
│ 2️⃣ AI Generates Outline             │
│    ├─ 1. Introduction                 │
│    ├─ 2. AI Technical Foundations   │
│    ├─ 3. Deep Learning Era         │
│    └─ 4. Future Trends              │
├─────────────────────────────────────┤
│ 3️⃣ Set Chapter Plan (Level-2)      │
│    "Introduce AI's origins..."      │
├─────────────────────────────────────┤
│ 4️⃣ Generate Content (Streaming)     │
│    Artificial Intelligence (AI)...   │
├─────────────────────────────────────┤
│ 5️⃣ Export Word Document             │
│    ✅ One-click Export             │
└─────────────────────────────────────┘
```

### 🔧 Docker Deployment Details

#### Image Tags

| Tag | Description | Use Case |
|-----|-------------|----------|
| `latest` | Latest stable version | Production |
| `main` | main branch | Development |
| `v1.0.0` | Specific version | Stable deployment |

#### Custom Configuration

**Change Port:**
Edit `docker-compose.yml`:
```yaml
services:
  ai-document-generator:
    ports:
      - "8080:3000"
```

**Mount Environment Variables:**
```bash
docker run -d \
  --name ai-doc-generator \
  -p 3000:3000 \
  -v $(pwd)/.env:/app/.env:ro \
  -v $(pwd)/reference_template.docx:/app/reference_template.docx:ro \
  ghcr.io/yuyangzheng-git/documenton-newversionwebtextaigenerator:latest
```

#### Auto Update

Use Watchtower for automatic updates:
```bash
docker run -d \
  --name watchtower \
  -v /var/run/docker.sock:/var/run/docker.sock \
  containrrr/watchtower \
  --interval 3600 \
  ghcr.io/yuyangzheng-git/documenton-newversionwebtextaigenerator:latest
```

### 🤝 Contributing

Issues and Pull Requests are welcome!

- [Submit Issue](https://github.com/yuyangzheng-git/Documenton-NewVersionWebTextAIGenerator/issues)
- [Open Pull Request](https://github.com/yuyangzheng-git/Documenton-NewVersionWebTextAIGenerator/pulls)

### 📚 Related Documentation

- [AI Configuration Guide](AI_CONFIG_GUIDE.md) - Detailed configuration for all AI platforms
- [Custom Template Guide](CUSTOM_TEMPLATE_GUIDE.md) - Word template creation
- [CONTRIBUTING.md](CONTRIBUTING.md) - Contribution guide
- [LICENSE](LICENSE) - MIT License

### 🐛 FAQ

**Q: Word export failed?**

A: Check if Pandoc is installed: `pandoc --version`

**Q: TOC page numbers not showing?**

A: Press F9 in Word to update TOC (normal behavior)

**Q: Images not displaying?**

A: Ensure image URLs are valid (start with http or data:image)

**Q: How to deploy to server?**

A: Use Docker to pull and run the image, refer to deployment instructions above

### 📄 License

This project is open-sourced under [MIT License](LICENSE).

---

<div align="center">

**⭐ Star this repo if it helped you!**

Made with ❤️ by [yuyangzheng-git](https://github.com/yuyangzheng-git)

</div>
