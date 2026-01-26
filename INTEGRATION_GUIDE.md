# HTML 转 Word 集成指南

本文档说明如何将 Python Pandoc 方案集成到 Next.js 项目中。

## 架构概述

```
Next.js Frontend (端口 3000)
    ↓
/api/export/word (API Route)
    ↓
Python Script (cli.py) 或直接调用 Pandoc
    ↓
Pandoc (HTML → DOCX)
    ↓
reference_template.docx (模板文件)
    ↓
生成的 Word 文档
```

## 文件结构

```
FrontendWord/
├── ai-document-generator/              # Next.js 项目
│   ├── app/
│   │   └── api/
│   │       └── export/
│   │           └── word/
│   │               └── route.ts        # Word 导出 API
│   ├── lib/
│   │   └── export-utils.ts            # 导出工具（已更新）
│   ├── Dockerfile                     # Docker 配置（已更新）
│   └── reference_template.docx         # Word 模板文件（需要创建）
├── document_generator.py               # Python 文档生成器
├── cli.py                             # Python CLI 接口
├── requirements.txt                   # Python 依赖
└── README.md                          # Python 方案说明
```

## 安装步骤

### 1. 系统依赖

**Ubuntu/Debian:**
```bash
sudo apt-get update
sudo apt-get install -y python3 python3-pip pandoc
```

**macOS:**
```bash
brew install python3 pandoc
```

**Windows:**
- 从 [Python官网](https://www.python.org/downloads/) 安装 Python 3
- 从 [Pandoc官网](https://pandoc.org/installing.html) 安装 Pandoc

### 2. Python 依赖

```bash
cd /Users/2812019221qq.com/FrontendWord
pip3 install -r requirements.txt
```

### 3. 创建模板文件

按照 `TEMPLATE_GUIDE.md` 创建 `reference_template.docx` 文件。

将模板文件放在以下位置之一：
- `/Users/2812019221qq.com/FrontendWord/ai-document-generator/reference_template.docx`（推荐）
- `/Users/2812019221qq.com/FrontendWord/reference_template.docx`

## 验证安装

### 1. 检查 Pandoc
```bash
pandoc --version
```

应该输出版本信息，例如：
```
pandoc 3.x
...
```

### 2. 检查 Python
```bash
python3 --version
```

应该输出 Python 3.x 版本。

### 3. 检查 Python 依赖
```bash
python3 -c "import pypandoc; print('pypandoc installed')"
```

应该输出：`pypandoc installed`

### 4. 测试 Python 脚本
```bash
cd /Users/2812019221qq.com/FrontendWord
python3 cli.py --input test.html --output test.docx --template reference_template.docx
```

## 使用方法

### 前端调用

在编辑器页面中，点击"导出"按钮会调用新的 Pandoc 导出功能：

```typescript
import { exportToDocxWithPandoc } from '@/lib/export-utils';

// 自动处理
await exportToDocxWithPandoc(htmlContent, documentTitle);
```

### API 直接调用

你也可以直接调用 API：

```typescript
const response = await fetch('/api/export/word', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    htmlContent: '<h1>标题</h1><p>内容</p>',
    title: '文档标题',
  }),
});

const blob = await response.blob();
// 下载文件...
```

## 工作流程

1. **用户点击导出按钮**
   - 编辑器收集所有 blocks
   - 将 blocks 转换为 HTML
   - 调用 `exportToDocxWithPandoc()`

2. **前端发送请求**
   - 发送 POST 请求到 `/api/export/word`
   - 包含 HTML 内容和文档标题

3. **服务端处理**
   - 创建临时 HTML 文件
   - 调用 Python 脚本或直接使用 Pandoc
   - 生成 DOCX 文件
   - 清理临时文件
   - 返回文件流

4. **Python/Pandoc 处理**
   - 解析 HTML
   - 处理 Base64 图片（保存为临时文件）
   - 使用模板文件应用样式
   - 生成目录
   - 输出 DOCX

5. **用户下载**
   - 浏览器接收文件流
   - 自动下载 Word 文档
   - 显示提示信息（关于目录更新）

## 配置选项

### 目录深度

默认目录深度为 3 层（h1, h2, h3）。

如需修改，编辑 `app/api/export/word/route.ts`：

```typescript
// 在 runPandoc 函数中
'--toc-depth=4',  // 改为 4 层
```

或在 Python 脚本中：

```python
generator.html_to_docx(
    html_content=html_content,
    output_path=output_path,
    toc_depth=4  # 改为 4 层
)
```

### 模板文件路径

默认路径：`process.cwd() + '/reference_template.docx'`

如需修改，编辑 `app/api/export/word/route.ts`：

```typescript
const templatePath = path.join(process.cwd(), 'custom_template.docx');
```

## 故障排查

### 问题 1：找不到 Pandoc

**错误信息：** `Pandoc process error: spawn pandoc ENOENT`

**解决方案：**
- 确保 Pandoc 已安装：`pandoc --version`
- 重启开发服务器
- 在 Docker 环境中，检查 Dockerfile 是否包含 Pandoc 安装

### 问题 2：找不到模板文件

**错误信息：** `Template file reference_template.docx not found`

**解决方案：**
- 检查模板文件路径是否正确
- 确保文件名是 `reference_template.docx`
- 检查文件权限

### 问题 3：Python 脚本失败

**错误信息：** `Python script error: ...`

**解决方案：**
- 检查 Python 依赖是否安装：`pip3 list | grep pypandoc`
- 查看详细错误日志
- 尝试直接使用 Pandoc（编辑 route.ts，设置 `usePythonScript = false`）

### 问题 4：导出的文档没有样式

**原因：** 模板文件样式设置不正确

**解决方案：**
- 参考 `TEMPLATE_GUIDE.md` 重新创建模板
- 确保模板中有"标题 1"、"标题 2"、"标题 3"样式

### 问题 5：图片不显示

**原因：** Pandoc 无法下载 URL 图片或 Base64 处理失败

**解决方案：**
- 使用 Python 脚本处理 Base64 图片
- 确保 URL 图片可访问
- 检查图片格式（支持 png, jpg, gif）

## Docker 部署

### 构建镜像

```bash
cd ai-document-generator
docker build -t ai-doc-generator .
```

### 运行容器

```bash
docker run -p 3000:3000 \
  -v $(pwd)/reference_template.docx:/app/reference_template.docx \
  ai-doc-generator
```

### 挂载模板文件

推荐将模板文件作为 volume 挂载，方便更新：

```bash
docker run -p 3000:3000 \
  -v /path/to/reference_template.docx:/app/reference_template.docx:ro \
  ai-doc-generator
```

## 性能优化

### 1. 缓存模板文件

模板文件会被 Pandoc 缓存，首次加载后性能会提升。

### 2. 使用流式响应

当前实现使用文件流返回，适合大文件。

### 3. 异步处理

对于特别大的文档，可以考虑：
- 使用消息队列（Redis）
- 后台任务处理
- 通过 WebSocket 或轮询获取进度

## 安全注意事项

1. **临时文件清理**：代码已实现自动清理，但建议定期检查 `temp/` 目录
2. **文件大小限制**：考虑在 API 中添加文件大小限制
3. **输入验证**：HTML 内容应进行基本的验证和清理
4. **模板文件权限**：确保模板文件不可被恶意修改

## 下一步

1. 创建或获取 `reference_template.docx` 模板文件
2. 测试导出功能
3. 根据需要调整模板样式
4. 在生产环境中部署

## 支持

如有问题，请查看：
- `TEMPLATE_GUIDE.md` - 模板配置指南
- `README.md` - Python 方案说明
- Pandoc 官方文档：https://pandoc.org/MANUAL.html
