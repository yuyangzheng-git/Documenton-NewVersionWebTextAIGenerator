# 服务器部署 - 导出功能配置指南

## 当前导出功能实现

项目支持 3 种导出方式：

### 1. Pandoc 方式（使用 Python + Pandoc）
**依赖**：
- Python 3.x
- Pandoc
- 本地模板文件 (`public/templates/asiainfo-template.docx`)

**优点**：
- 支持复杂模板样式
- 格式保真度高

**缺点**：
- 需要安装系统依赖
- 部署较复杂

### 2. 本地模板方式（docxtemplater）
**依赖**：
- Node.js（已有）
- 用户上传的模板文件

**优点**：
- 纯 JS 实现，易部署
- 支持自定义模板

**缺点**：
- 需要文件存储

### 3. 内置模板方式（docx.js）
**依赖**：
- 仅需 Node.js（已有）

**优点**：
- 纯 JS，最容易部署
- 零外部依赖
- **推荐用于服务器部署** ✅

**缺点**：
- 模板样式较简单

## 服务器部署方案

### 方案 A：纯 Node.js 部署（推荐）⭐

**适用场景**：简单部署，快速上线

**步骤**：

1. **修改默认导出方式**（改为使用 docx.js）

2. **部署配置**：
   ```bash
   # 1. 安装依赖
   npm install

   # 2. 构建项目
   npm run build

   # 3. 启动服务
   npm start
   ```

3. **环境变量**（`.env.production`）：
   ```env
   # Dify API 配置
   NEXT_PUBLIC_DIFY_BASE_URL=https://your-dify-instance/v1
   NEXT_PUBLIC_DIFY_PLANNER_KEY=app-xxx
   NEXT_PUBLIC_DIFY_CHAPTER_KEY=app-xxx

   # 服务器配置
   PORT=3000
   ```

**优点**：
- ✅ 零外部依赖
- ✅ 部署简单
- ✅ 跨平台兼容

---

### 方案 B：Docker 部署（完整功能）

**适用场景**：需要使用所有导出功能（包括 Pandoc）

**Dockerfile**：
```dockerfile
FROM node:20-alpine AS base

# 安装 Python 和 Pandoc
RUN apk add --no-cache python3 py3-pip pandoc

WORKDIR /app

# 复制依赖文件
COPY package*.json ./
RUN npm ci --only=production

# 复制项目文件
COPY . .

# 构建项目
RUN npm run build

# 暴露端口
EXPOSE 3000

# 启动命令
CMD ["npm", "start"]
```

**docker-compose.yml**：
```yaml
version: '3.8'

services:
  ai-document-generator:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_DIFY_BASE_URL=https://your-dify-instance/v1
      - NEXT_PUBLIC_DIFY_PLANNER_KEY=app-xxx
      - NEXT_PUBLIC_DIFY_CHAPTER_KEY=app-xxx
    volumes:
      - ./public/templates:/app/public/templates
      - ./store:/app/store  # 用户上传的模板存储
    restart: unless-stopped
```

**部署命令**：
```bash
# 构建镜像
docker-compose build

# 启动服务
docker-compose up -d

# 查看日志
docker-compose logs -f
```

**优点**：
- ✅ 支持所有导出功能
- ✅ 环境隔离
- ✅ 易于扩展

---

### 方案 C：云服务部署（Vercel/Railway/等）

**适用场景**：快速部署，自动扩展

**限制**：
- ❌ 不支持 Pandoc 方式（需要系统依赖）
- ✅ 支持 docx.js 方式
- ⚠️ 文件上传需要配置对象存储（S3/OSS）

**Vercel 部署**：
```bash
# 1. 安装 Vercel CLI
npm i -g vercel

# 2. 部署
vercel

# 3. 设置环境变量
vercel env add NEXT_PUBLIC_DIFY_BASE_URL
vercel env add NEXT_PUBLIC_DIFY_PLANNER_KEY
vercel env add NEXT_PUBLIC_DIFY_CHAPTER_KEY
```

**注意事项**：
- Vercel 无文件系统，用户上传的模板需要存储到云存储
- 推荐使用内置模板方式（docx.js）

---

## 推荐配置

### 小型项目/个人使用
```
方案 A（纯 Node.js）+ 内置模板（docx.js）
```

### 中型项目/团队使用
```
方案 B（Docker）+ 所有导出方式
```

### 大型项目/SaaS 服务
```
方案 C（云服务）+ 对象存储 + 内置模板
```

---

## 性能优化建议

### 1. 导出性能优化
```typescript
// 在 app/api/export/docx/route.ts 添加缓存
import { unstable_cache } from 'next/cache';

const cachedExport = unstable_cache(
  async (blocks, outline, title) => {
    return await exportWithBuiltinTemplate(blocks, outline, title, 'default');
  },
  ['document-export'],
  { revalidate: 3600 } // 1小时缓存
);
```

### 2. 大文件处理
```typescript
// 使用流式传输
export async function POST(request: NextRequest) {
  const buffer = await exportDocument(...);

  // 使用 ReadableStream
  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(buffer);
      controller.close();
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'Content-Disposition': `attachment; filename="${fileName}.docx"`,
    }
  });
}
```

### 3. 并发限制
```typescript
// 使用队列限制并发导出
import PQueue from 'p-queue';

const exportQueue = new PQueue({ concurrency: 5 });

export async function POST(request: NextRequest) {
  return exportQueue.add(() => handleExport(request));
}
```

---

## 文件存储方案

### 本地存储（开发/小型部署）
```typescript
// store/templates/[id].docx
const TEMPLATE_DIR = join(process.cwd(), 'store', 'templates');
```

### 对象存储（生产环境）
```typescript
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';

// 上传模板
async function uploadTemplate(file: File, userId: string) {
  const s3 = new S3Client({ region: 'us-east-1' });

  await s3.send(new PutObjectCommand({
    Bucket: 'your-bucket',
    Key: `templates/${userId}/${file.name}`,
    Body: await file.arrayBuffer(),
  }));
}

// 加载模板
async function loadTemplate(templateId: string) {
  const s3 = new S3Client({ region: 'us-east-1' });

  const response = await s3.send(new GetObjectCommand({
    Bucket: 'your-bucket',
    Key: `templates/${templateId}`,
  }));

  return Buffer.from(await response.Body.transformToByteArray());
}
```

---

## 部署检查清单

### 部署前
- [ ] 确认 Node.js 版本（推荐 18.x 或 20.x）
- [ ] 配置环境变量
- [ ] 测试导出功能
- [ ] 准备模板文件

### Docker 部署
- [ ] 测试 Dockerfile 构建
- [ ] 配置 volume 映射
- [ ] 测试容器启动
- [ ] 验证导出功能

### 云服务部署
- [ ] 配置对象存储（如需要）
- [ ] 设置环境变量
- [ ] 测试部署
- [ ] 配置域名和 SSL

### 监控和日志
- [ ] 配置日志收集
- [ ] 设置错误监控（如 Sentry）
- [ ] 配置性能监控
- [ ] 设置告警规则

---

## 常见问题

### Q1: Pandoc 在 Docker 中安装失败？
**A**: 使用 Alpine 基础镜像时，使用 `apk add pandoc`。使用 Debian/Ubuntu 基础镜像时，使用 `apt-get install pandoc`。

### Q2: 导出的文件在服务器上无法下载？
**A**: 检查 CORS 配置和 Content-Disposition header。

### Q3: 大文件导出超时？
**A**: 增加 Next.js API 路由超时时间：
```javascript
export const maxDuration = 60; // 60 秒
```

### Q4: 用户上传的模板丢失？
**A**: 使用持久化存储（volume 或对象存储）。

### Q5: 内存溢出？
**A**: 限制并发导出数量，使用队列。

---

## 下一步

根据您的部署场景，我可以帮您：
1. 创建 Dockerfile 和 docker-compose.yml
2. 配置对象存储集成
3. 优化导出性能
4. 设置监控和日志

请告诉我您的部署环境和需求！
