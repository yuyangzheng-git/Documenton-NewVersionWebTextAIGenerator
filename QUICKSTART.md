# 快速开始指南 - HTML 转 Word 集成

## 概述

已成功将 Python Pandoc 方案集成到 Next.js 项目中。现在导出 Word 文档时会使用 Pandoc，支持：
- ✅ 模板样式（字体、页眉页脚、背景图）
- ✅ 自动生成目录（3 层）
- ✅ 智能处理图片（URL 和 Base64）
- ✅ 完美格式化

## 已完成的修改

### 1. 创建的文件

```
FrontendWord/
├── ai-document-generator/
│   ├── app/api/export/word/route.ts    # 新的 Word 导出 API
│   ├── Dockerfile                      # 更新：包含 Python 和 Pandoc
│   ├── TEMPLATE_GUIDE.md               # 模板配置指南
│   └── INTEGRATION_GUIDE.md            # 完整集成说明
├── document_generator.py               # Python 文档生成器
├── cli.py                             # Python CLI 接口
└── requirements.txt                   # Python 依赖
```

### 2. 修改的文件

- `ai-document-generator/lib/export-utils.ts` - 添加 `exportToDocxWithPandoc` 函数
- `ai-document-generator/app/word-editor/page.tsx` - 更新导出按钮逻辑
- `ai-document-generator/package.json` - 端口改为 3000

## 立即使用

### 步骤 1：安装依赖（本地开发）

```bash
# 安装 Pandoc
# Ubuntu/Debian:
sudo apt-get install pandoc

# macOS:
brew install pandoc

# Windows:
# 从 https://pandoc.org/installing.html 下载安装

# 安装 Python 依赖
pip3 install -r requirements.txt
```

### 步骤 2：创建模板文件

你需要一个 `reference_template.docx` 文件来定义 Word 文档样式。

**快速创建：**
1. 打开 Microsoft Word
2. 新建空白文档
3. 设置标题样式：
   - 标题 1：宋体 18pt 粗体
   - 标题 2：宋体 16pt 粗体
   - 标题 3：宋体 14pt 粗体
4. 设置正文样式：宋体 12pt
5. （可选）添加页眉页脚
6. 保存为 `reference_template.docx`
7. 复制到：`/Users/2812019221qq.com/FrontendWord/ai-document-generator/`

**详细说明：** 参考 `TEMPLATE_GUIDE.md`

### 步骤 3：启动开发服务器

```bash
cd ai-document-generator
npm run dev
```

服务器将在 `http://localhost:3000` 运行。

### 步骤 4：测试导出

1. 访问 `http://localhost:3000`
2. 输入主题并生成文档
3. 在编辑器中编辑内容
4. 点击"导出"按钮
5. 下载的 Word 文档会使用模板样式并包含目录

## 工作原理

### 导出流程

```
用户点击导出
    ↓
编辑器收集 blocks
    ↓
将 blocks 转换为 HTML
    ↓
调用 /api/export/word
    ↓
Python/Pandoc 处理
    ↓
生成 Word 文档
    ↓
自动下载
```

### 处理的 HTML 元素

| 元素 | Word 样式 | 说明 |
|------|----------|------|
| h1, h2, h3 | 标题 1/2/3 | 标题层级 |
| p | Normal | 正文段落 |
| ul, ol | Normal | 列表 |
| blockquote | Normal | 引用 |
| table | Normal | 表格 |
| img | Normal | 图片 |

## Docker 部署

```bash
cd ai-document-generator

# 构建镜像
docker build -t ai-doc-generator .

# 运行容器
docker run -p 3000:3000 \
  -v $(pwd)/reference_template.docx:/app/reference_template.docx \
  ai-doc-generator
```

## 常见问题

### Q: 导出失败，提示找不到 Pandoc
**A:** 安装 Pandoc：`sudo apt-get install pandoc` 或 `brew install pandoc`

### Q: 提示找不到模板文件
**A:** 确保 `reference_template.docx` 在项目根目录：`ai-document-generator/reference_template.docx`

### Q: 导出的文档没有样式
**A:** 检查模板文件中的样式设置，确保有"标题 1"、"标题 2"、"标题 3"样式

### Q: 目录页码不显示
**A:** 这是 Word 的正常行为。用户需要在 Word 中按 F9 更新目录

### Q: 图片不显示
**A:** 确保 Python 依赖已安装：`pip3 install -r requirements.txt`

## 下一步

1. 创建或优化 `reference_template.docx` 模板文件
2. 测试各种内容类型的导出
3. 根据需要调整样式
4. 部署到生产环境

## 文档

- `TEMPLATE_GUIDE.md` - 模板配置详细说明
- `INTEGRATION_GUIDE.md` - 完整集成文档
- `README.md` - Python 方案说明

## 支持

如有问题，请检查：
1. Pandoc 是否正确安装：`pandoc --version`
2. Python 依赖是否安装：`pip3 list | grep pypandoc`
3. 模板文件是否存在：`ls -la reference_template.docx`
4. 开发服务器是否运行：访问 `http://localhost:3000`
