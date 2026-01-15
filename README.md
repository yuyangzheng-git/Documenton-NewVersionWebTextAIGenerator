<div align="center">

# ✨ AI Document Generator
### AI-Powered Professional Document Writing Platform

<div align="center">

[![Next.js](https://img.shields.io/badge/Next.js-16.1-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)](LICENSE)
[![GitHub Stars](https://img.shields.io/github/stars/yuyangzheng-git/Documenton-NewVersionWebTextAIGenerator?style=social)](https://github.com/yuyangzheng-git/Documenton-NewVersionWebTextAIGenerator/stargazers)

**[English](#english) | [中文](#中文)**

</div>

---

## 中文 | Chinese

<div align="center">

**🚀 基于人工智能的专业文档写作平台，支持 12+ 主流 AI 模型**

</div>

---

### ✨ 核心功能

<div align="center">

<table>
<tr>
<td width="50%">

**🤖 AI 智能大纲**
- 一键生成结构化大纲
- 支持多级标题
- 自动编号

</td>
<td width="50%">

**📝 章节内容规划**
- 每个二级标题独立规划
- 可自定义写作要求
- 实时同步编辑

</td>
</tr>
<tr>
<td width="50%">

**📊 段落分段编辑**
- 生成内容自动分段
- 每段独立可编辑
- 支持拖拽排序

</td>
<td width="50%">

**⚡ 流式实时生成**
- 实时显示生成内容
- 流畅的用户体验
- 支持中途停止

</td>
</tr>
</table>

</div>

---

### 🌐 支持的 AI 平台 (12+)

<div align="center">

**🌍 国际主流** | **🇨🇳 国内平台** | **🔓 开源/快速**
---|---|---
OpenAI (GPT-4o) | 通义千问 (Qwen) | DeepSeek
Claude 3.5 (Anthropic) | 文心一言 (ERNIE) | Groq (Llama 3.3)
Google Gemini 2.5 | 智谱 GLM (Zhipu) |
Cohere Command R | Kimi (Moonshot) | Dify

</div>

👉 **[📖 查看完整配置指南](./AI_PLATFORMS.md)**

---

### 🎬 快速开始

```bash
# 1. 克隆项目
git clone https://github.com/yuyangzheng-git/Documenton-NewVersionWebTextAIGenerator.git
cd ai-document-generator

# 2. 安装依赖
npm install

# 3. 配置环境变量
cp .env.example .env.local
# 编辑 .env.local 填写你的 API Key

# 4. 启动开发服务器
npm run dev

# 5. 打开浏览器
访问 http://localhost:3000
```

---

### 🏗️ 技术栈

```
Frontend:  Next.js 16 + TypeScript + React 18
State:     Zustand
UI:        Tailwind CSS + Lucide Icons
Export:    docx (DOCX)
Drag:       DnD Kit
AI:        12+ 主流 LLM 支持
```

---

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

---

### 🤝 贡献

欢迎提交 Issue 和 Pull Request！

- [提交 Issue](https://github.com/yuyangzheng-git/Documenton-NewVersionWebTextAIGenerator/issues)
- [发起 Pull Request](https://github.com/yuyangzheng-git/Documenton-NewVersionWebTextAIGenerator/pulls)

---

### 📄 许可证

本项目采用 [MIT License](LICENSE) 开源。

---

<div align="center">

**⭐ 如果这个项目对你有帮助，请给个 Star！**

Made with ❤️ by [yuyangzheng](https://github.com/yuyangzheng-git)

</div>

---

## English | English

<div align="center">

**🚀 AI-powered professional document writing platform supporting 12+ mainstream AI models**

</div>

---

### ✨ Core Features

<div align="center">

<table>
<tr>
<td width="50%">

**🤖 AI Smart Outline**
- One-click structured outline
- Multi-level heading support
- Auto-numbering

</td>
<td width="50%">

**📝 Chapter Content Planning**
- Independent planning per level-2 heading
- Customizable writing requirements
- Real-time sync editing

</td>
</tr>
<tr>
<td width="50%">

**📊 Paragraph Segmentation**
- Auto-segment generated content
- Each paragraph independently editable
- Drag-and-drop reordering

</td>
<td width="50%">

**⚡ Streaming Real-time Generation**
- Real-time content display
- Smooth user experience
- Mid-generation stop support

</td>
</tr>
</table>

</div>

---

### 🌐 Supported AI Platforms (12+)

<div align="center">

**🌍 International** | **🇨🇳 Domestic (China)** | **🔓 Open Source / Fast**
---|---|---
OpenAI (GPT-5.2) | Qwen (Tongyi Qianwen) | DeepSeek (V3.2)
Claude 3.5 (Anthropic) | Wenxin Yiyuan (ERNIE) | Groq (Llama 4)
Google Gemini 3/2.5 | Zhipu GLM | |
Cohere Command A | Kimi (Moonshot) | Dify

</div>

👉 **[📖 View Full Configuration Guide](./AI_CONFIG_GUIDE.md)**

---

### 🎬 Quick Start

```bash
# 1. Clone the repository
git clone https://github.com/yuyangzheng-git/Documenton-NewVersionWebTextAIGenerator.git
cd ai-document-generator

# 2. Install dependencies
npm install

# 3. Configure environment variables
cp .env.example .env.local
# Edit .env.local and fill in your API Key

# 4. Start development server
npm run dev

# 5. Open browser
Visit http://localhost:3000
```

---

### 🏗️ Tech Stack

```
Frontend:  Next.js 16 + TypeScript + React 18
State:     Zustand
UI:        Tailwind CSS + Lucide Icons
Export:    docx (DOCX)
Drag:       DnD Kit
```

---

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

---

### 🤝 Contributing

Issues and Pull Requests are welcome!

- [Submit Issue](https://github.com/yuyangzheng-git/Documenton-NewVersionWebTextAIGenerator/issues)
- [Open Pull Request](https://github.com/yuyangzheng-git/Documenton-NewVersionWebTextAIGenerator/pulls)

---

### 📄 License

This project is open-sourced under [MIT License](LICENSE).

---

<div align="center">

**⭐ Star this repo if it helped you!**

Made with ❤️ by [yuyangzheng](https://github.com/yuyangzheng)

</div>
