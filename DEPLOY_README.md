# AI Document Generator

一个基于 AI 的智能文档生成系统，支持自动生成大纲、章节内容，并导出为格式完美的 Word 文档。

## ✨ 功能特性

- 🤖 **AI 驱动**：使用 Dify AI 服务生成文档内容和结构
- 📝 **智能大纲**：自动生成多层文档大纲
- ✍️ **章节生成**：逐节生成详细内容
- 📄 **Word 导出**：使用 Pandoc 生成格式完美的 Word 文档
- 🎨 **模板支持**：自定义 Word 模板（字体、页眉页脚、背景图）
- 📊 **目录自动生成**：自动生成 3 层目录
- 🖼️ **图片处理**：支持 URL 和 Base64 图片
- 💾 **多种导出**：支持 Word、PDF 格式

## 🚀 快速开始

### Docker 部署（推荐）

```bash
# 1. 拉取镜像
docker pull ghcr.io/your-username/front-endword:latest

# 2. 运行容器
docker run -d \
  --name ai-doc-generator \
  -p 3000:3000 \
  ghcr.io/your-username/front-endword:latest

# 3. 访问
open http://localhost:3000
```

### Docker Compose

```bash
git clone https://github.com/your-username/FrontendWord.git
cd FrontendWord

# 启动服务
docker-compose up -d
```

### 本地开发

```bash
cd ai-document-generator
npm install
npm run dev
```

访问 http://localhost:3000

## 📋 环境变量

创建 `.env` 文件：

```env
# Dify API 配置
DIFY_API_URL=https://api.dify.ai/v1
DIFY_OUTLINE_API_KEY=app-your-outline-api-key
DIFY_CHAPTER_API_KEY=app-your-chapter-api-key
```

## 📄 自定义模板

1. 使用 Microsoft Word 创建模板文件
2. 设置样式（标题 1/2/3、正文等）
3. 保存为 `reference_template.docx`
4. 挂载到容器：

```bash
docker run -d \
  --name ai-doc-generator \
  -p 3000:3000 \
  -v $(pwd)/reference_template.docx:/app/reference_template.docx:ro \
  ghcr.io/your-username/front-endword:latest
```

详细说明请查看 [TEMPLATE_GUIDE.md](ai-document-generator/TEMPLATE_GUIDE.md)

## 🔧 技术栈

- **前端**：Next.js 16, React 19, TypeScript
- **UI 组件**：Tailwind CSS, Lucide Icons
- **AI 服务**：Dify Workflow API
- **文档生成**：Pandoc, Python (pypandoc)
- **容器化**：Docker, Docker Compose

## 📖 文档

- [快速开始指南](QUICKSTART.md)
- [完整集成指南](INTEGRATION_GUIDE.md)
- [Word 模板配置](ai-document-generator/TEMPLATE_GUIDE.md)
- [Docker 部署](GITHUB_DEPLOYMENT.md)
- [AI 配置指南](ai-document-generator/AI_CONFIG_GUIDE.md)

## 🛠️ 开发

### 安装依赖

```bash
cd ai-document-generator
npm install
```

### 运行开发服务器

```bash
npm run dev
```

### 构建生产版本

```bash
npm run build
npm start
```

### Docker 本地构建

```bash
docker build -f ai-document-generator/Dockerfile -t front-endword .
docker run -d -p 3000:3000 front-endword
```

## 📦 Docker 镜像

| 标签 | 说明 |
|------|------|
| `latest` | 最新稳定版本 |
| `main` | main 分支的最新版本 |
| `v1.0.0` | 特定版本号 |

镜像地址：`ghcr.io/your-username/front-endword`

## 🤝 贡献

欢迎贡献！请查看 [CONTRIBUTING.md](ai-document-generator/CONTRIBUTING.md)

## 📝 许可证

MIT License - 详见 [LICENSE](ai-document-generator/LICENSE)

## 🐛 问题反馈

如有问题或建议，请提交 [Issue](https://github.com/your-username/FrontendWord/issues)

## 🌟 Star

如果这个项目对你有帮助，请给我们一个 Star ⭐

---

**注意**：首次使用时，需要在 Word 中按 F9 更新目录页码。
