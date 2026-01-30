# AI Document Generator - 完整文档

**AI驱动的专业文档写作平台**

[![Next.js](https://img.shields.io/badge/Next.js-16.1-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Docker](https://img.shields.io/badge/Docker-Ready-blue?style=flat-square&logo=docker)](https://www.docker.com/)

---

# 目录

1. [项目简介](#项目简介)
2. [核心功能](#核心功能)
3. [快速开始](#快速开始)
4. [AI 平台配置](#ai-平台配置)
5. [Docker 部署](#docker-部署)
6. [自定义模板](#自定义模板)
7. [技术栈](#技术栈)
8. [贡献指南](#贡献指南)
9. [安全政策](#安全政策)
10. [常见问题](#常见问题)

---

# 项目简介

基于 AI 的智能文档生成系统，支持自动生成大纲、章节内容，并导出为格式完美的 Word 文档。支持 12+ 主流 AI 模型。

## 主要特性

- 🤖 **AI 智能大纲** - 一键生成结构化文档大纲
- 📝 **章节内容规划** - 每个章节独立规划写作要求
- ⚡ **流式实时生成** - 实时显示 AI 生成内容
- 📊 **段落分段编辑** - 生成内容自动分段，每段独立可编辑
- 📄 **Word 导出** - 使用 Pandoc 生成格式完美的文档
- 🎨 **模板支持** - 自定义 Word 模板（字体、页眉页脚、背景图）
- 🌐 **12+ AI 平台** - 支持 Dify、OpenAI、Claude、Gemini 等主流模型


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
| Markdown 渲染 | 支持代码高亮、表格等 Markdown 格式 |
| 段落编辑 | 每个段落可独立编辑、删除、重新生成 |
| 拖拽排序 | 支持块级拖拽重新排序 |
| Word 导出 | 自动生成 3 层目录，支持图片和表格 |
| 自定义模板 | 使用自己的 Word 模板文件 |


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
  ai-doc-generator

# 查看日志
docker logs -f ai-doc-gen

# 停止容器
docker stop ai-doc-gen

# 删除容器
docker rm ai-doc-gen
```

## 推送到 Docker Hub

```bash
# 登录
docker login

# 标记镜像
docker tag ai-doc-generator your-username/ai-doc-generator:latest
docker tag ai-doc-generator your-username/ai-doc-generator:v1.0.0

# 推送
docker push your-username/ai-doc-generator:latest
docker push your-username/ai-doc-generator:v1.0.0
```

## 从 Docker Hub 拉取

```bash
# 拉取镜像
docker pull your-username/ai-doc-generator:latest

# 运行
docker run -d \
  --name ai-doc-gen \
  -p 3000:3000 \
  --env-file .env.local \
  your-username/ai-doc-generator:latest
```

## 多架构支持

构建支持 AMD64 和 ARM64 的镜像：

```bash
# 创建 buildx builder
docker buildx create --name multiarch --use

# 构建并推送多架构镜像
docker buildx build \
  --platform linux/amd64,linux/arm64 \
  -t your-username/ai-doc-generator:latest \
  --push \
  .
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
  ai-doc-generator
```

或在 `docker-compose.yml` 中配置：

```yaml
services:
  app:
    volumes:
      - ./reference_template.docx:/app/reference_template.docx:ro
```

### 4. 高级定制

#### 添加页眉页脚

```
页眉：[文档标题]
页脚：第 [页码] 页，共 [总页数] 页
```

#### 添加封面

在模板中添加第一页作为封面，包含：
- 文档标题（居中，特号字体）
- 作者信息
- 创建日期
- 公司/组织 Logo

#### 添加水印

1. 在 Word 中插入水印：设计 → 水印 → 自定义水印
2. 保存模板


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

## 开发工具

```
Package Manager:  npm
Linter:           ESLint
Formatter:        Prettier (内置于 Next.js)
Version Control:  Git
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
│   │   ├── SimpleTableBlock.tsx  # 表格块
│   │   ├── ImageBlock.tsx        # 图片块
│   │   └── CodeBlock.tsx         # 代码块
│   └── outline/            # 大纲组件
│       ├── OutlinePanel.tsx
│       └── OutlineTree.tsx
│
├── lib/                     # 工具库
│   ├── ai/                 # AI 平台集成
│   │   ├── dify-provider.ts
│   │   ├── openai-provider.ts
│   │   ├── gemini-provider.ts
│   │   └── ...
│   ├── db.ts               # IndexedDB 封装
│   ├── markdown-table-parser.ts
│   └── logger.ts
│
├── store/                  # Zustand 状态管理
│   └── useStore.ts
│
├── hooks/                  # 自定义 Hooks
│   └── useAutoSave.ts
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

### 开发环境设置

```bash
# 1. 安装依赖
npm install

# 2. 配置环境变量
cp .env.example .env.local

# 3. 安装系统依赖
brew install pandoc  # macOS
sudo apt-get install pandoc  # Ubuntu

# 4. 启动开发服务器
npm run dev
```

### 新增 AI 平台

如果要添加新的 AI 平台支持：

1. 在 `lib/ai/` 创建新的 provider 文件
2. 实现 `AIProvider` 接口
3. 在 `lib/ai/provider-factory.ts` 注册
4. 更新 `AI_CONFIG_GUIDE.md` 文档

---

# 安全政策

## 报告安全漏洞

如果发现安全漏洞，请**不要**公开发布。

请发送邮件至：[项目维护者邮箱]

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

**Q: 图片不显示？**

A: 检查图片 URL：
- 必须是 HTTP/HTTPS 链接
- 或 Base64 格式（`data:image/png;base64,...`）

**Q: AI 生成速度慢？**

A: 
1. 检查网络连接
2. 尝试更换 AI 模型（如从 GPT-4 切换到 GPT-3.5）
3. 使用 Groq 等快速推理平台

**Q: 如何停止正在生成的内容？**

A: 刷新页面或关闭浏览器标签页。

## 配置相关

**Q: Dify API 密钥在哪里获取？**

A: 
1. 访问 https://cloud.dify.ai
2. 创建应用
3. 在应用设置中复制 API Key

详见项目中的 `DIFY_API_KEYS_GUIDE.md`

**Q: 可以同时使用多个 AI 平台吗？**

A: 可以。在设置中切换不同平台，环境变量配置多个平台的密钥即可。

**Q: 支持私有化部署吗？**

A: 完全支持。使用 Docker 部署到自己的服务器，配置私有化的 AI 服务。

## 开发相关

**Q: 如何添加新的 AI 平台？**

A: 
1. 在 `lib/ai/` 创建新的 provider
2. 实现 `AIProvider` 接口
3. 在 factory 中注册

参考现有 provider 实现。

**Q: 如何自定义编辑器块类型？**

A: 
1. 在 `components/blocks/` 创建新组件
2. 在 `NotionBlock.tsx` 添加渲染逻辑
3. 更新 `BlockType` 类型定义

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
- [AppFlowy](https://appflowy.io/) - 表格组件参考

---

<div align="center">

**⭐ 如果这个项目对你有帮助，请给个 Star！**

Made with ❤️ by [yuyangzheng-git](https://github.com/yuyangzheng-git)

[GitHub](https://github.com/yuyangzheng-git/Documenton-NewVersionWebTextAIGenerator) • 
[Issues](https://github.com/yuyangzheng-git/Documenton-NewVersionWebTextAIGenerator/issues) • 
[Pull Requests](https://github.com/yuyangzheng-git/Documenton-NewVersionWebTextAIGenerator/pulls)

</div>
