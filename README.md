# 📝 AI文档生成器 - 完整指南

> 基于Dify的智能文档生成系统，支持多种AI平台和完整Docker化部署

## 目录

- [项目简介](#项目简介)
- [快速开始](#快速开始)
  - [本地开发](#本地开发)
  - [服务器部署](#服务器部署)
- [部署方式对比](#部署方式对比)
- [详细部署指南](#详细部署指南)
  - [1. 热重载开发环境](#1-热重载开发环境)
  - [2. 服务器生产环境](#2-服务器生产环境)
  - [3. 标准生产环境](#3-标准生产环境)
- [配置说明](#配置说明)
- [开发指南](#开发指南)
- [故障排查](#故障排查)
- [完整文档](#完整文档)

---

## 项目简介

AI文档生成器是一个基于Next.js 16和Dify的智能文档生成系统，支持：

### ✨ 核心功能

- **智能大纲生成** - AI自动分析主题，生成文档结构
- **内容自动生成** - 逐章节生成专业内容
- **多AI平台支持** - Dify、OpenAI、Gemini、Kimi、Qwen
- **流式输出** - 实时查看生成进度
- **富文本编辑** - Notion风格的编辑器
- **文档导出** - 支持DOCX格式导出
- **模板管理** - 自定义文档模板

### 🚀 技术栈

- **前端**: Next.js 16.1.1 (Turbopack) + React
- **后端**: Next.js API Routes
- **AI平台**: Dify + 多AI Provider支持
- **缓存**: Redis 7
- **文档处理**: Pandoc + Python
- **容器化**: Docker + Docker Compose
- **包管理**: npm + Python uv

### 🎯 部署特性

- ✅ **完全Docker化** - 一键部署，环境隔离
- ✅ **热重载开发** - 代码修改实时生效
- ✅ **多环境支持** - 开发/生产环境分离
- ✅ **健康检查** - 自动监控和重启
- ✅ **网络优化** - 支持访问同主机Dify服务

---

## 快速开始

### 本地开发

```bash
# 1. 克隆项目
git clone https://github.com/yuyangzheng-git/Documenton-NewVersionWebTextAIGenerator.git
cd Documenton-NewVersionWebTextAIGenerator

# 2. 启动热重载开发环境
./dev-start-hotreload.sh

# 3. 访问应用
open http://localhost:3000
```

### 服务器部署

```bash
# 1. SSH登录到服务器
ssh user@your-server-ip

# 2. 克隆项目
git clone https://github.com/yuyangzheng-git/Documenton-NewVersionWebTextAIGenerator.git
cd Documenton-NewVersionWebTextAIGenerator

# 3. 一键部署
./deploy-server.sh

# 4. 访问应用
# http://your-server-ip:3001
```

---

## 部署方式对比

| 部署方式 | 适用场景 | 热重载 | 端口 | 启动命令 |
|---------|---------|-------|------|---------|
| 🔥 **热重载开发** | 本地开发调试 | ✅ | 3000 | `./dev-start-hotreload.sh` |
| 🚀 **服务器生产** | 部署到Dify同一服务器 | ❌ | 3001 | `./deploy-server.sh` |
| 📦 **标准生产** | 独立服务器 | ❌ | 3001 | `docker-compose up -d` |
| 🔧 **混合开发** | 轻量级开发 | ✅ | 3000 | `./dev-start.sh` |

---

## 详细部署指南

### 1. 热重载开发环境

#### 特点
- ✅ 修改代码立即生效
- ✅ 浏览器自动刷新
- ✅ 完整Docker化
- ✅ 支持所有源文件热重载

#### 快速启动

```bash
./dev-start-hotreload.sh
```

#### 支持热重载的目录

```
app/          - Next.js 页面和路由
components/   - React 组件
lib/          - 工具函数
store/        - 状态管理
public/       - 静态资源
styles/       - 样式文件
```

#### 常用命令

```bash
# 启动
./dev-start-hotreload.sh

# 停止
./dev-stop-hotreload.sh

# 查看日志
docker-compose -f docker-compose.hotreload.yml logs -f app

# 重启
docker-compose -f docker-compose.hotreload.yml restart app
```

---

### 2. 服务器生产环境

#### 适用场景

部署到**Dify所在的同一台服务器**，容器需要访问同主机的Dify服务。

#### 核心配置

```yaml
# docker-compose.server.yml
services:
  app:
    extra_hosts:
      - "host.docker.internal:host-gateway"  # 关键配置
    build:
      args:
        NEXT_PUBLIC_DIFY_BASE_URL: http://host.docker.internal/v1
```

#### 网络架构

```
┌─────────────────────────────────────┐
│     服务器 (例: your-server-ip)      │
│                                     │
│  ┌──────────┐    ┌──────────────┐  │
│  │  Dify    │    │ Docker容器    │  │
│  │  :80     │◄──►│ 文档生成应用  │  │
│  └──────────┘    └──────────────┘  │
│                                     │
│  通过 host.docker.internal 连接     │
└─────────────────────────────────────┘
```

#### 部署步骤

**前提条件检查**：

```bash
# 1. 检查Docker
docker --version  # 需要 20.10+

# 2. 检查Dify服务
curl http://localhost/

# 3. 检查端口
sudo netstat -tlnp | grep -E "3001|6379|8081"
```

**一键部署**：

```bash
# 克隆项目
git clone https://github.com/yuyangzheng-git/Documenton-NewVersionWebTextAIGenerator.git
cd Documenton-NewVersionWebTextAIGenerator

# 运行部署脚本
./deploy-server.sh
```

**部署脚本会自动**：
- ✅ 检查Docker环境
- ✅ 创建.env.local配置
- ✅ 构建Docker镜像
- ✅ 启动所有服务
- ✅ 测试Dify连接

#### 部署验证

```bash
# 1. 检查服务状态
docker-compose -f docker-compose.server.yml ps

# 2. 测试健康检查
curl http://localhost:3001/api/health

# 3. 测试Dify连接
docker exec ai-document-generator wget -q -O- http://host.docker.internal/
```

---

### 3. 标准生产环境

#### 适用场景

部署到**独立服务器**，Dify在其他服务器或使用公网IP访问。

#### 快速部署

```bash
# 1. 克隆项目
git clone https://github.com/yuyangzheng-git/Documenton-NewVersionWebTextAIGenerator.git
cd Documenton-NewVersionWebTextAIGenerator

# 2. 配置环境变量
cp .env.example .env.local
vim .env.local  # 修改Dify地址和API密钥

# 3. 启动服务
docker-compose up -d

# 4. 查看状态
docker-compose ps
```

---

## 配置说明

### 环境变量

#### Dify配置

```bash
# .env.local
NEXT_PUBLIC_DIFY_BASE_URL=http://host.docker.internal/v1  # 或IP地址
NEXT_PUBLIC_DIFY_OUTLINE_KEY=app-YOUR_OUTLINE_KEY_HERE
NEXT_PUBLIC_DIFY_CHAPTER_KEY=app-YOUR_CHAPTER_KEY_HERE
NEXT_PUBLIC_DIFY_LLM_KEY=app-YOUR_LLM_KEY_HERE
```

#### Redis配置

```bash
REDIS_URL=redis://redis:6379
CACHE_ENABLED=1
```

#### 其他AI平台（可选）

```bash
# OpenAI
NEXT_PUBLIC_OPENAI_API_KEY=sk-...
NEXT_PUBLIC_OPENAI_MODEL=gpt-4o
NEXT_PUBLIC_OPENAI_BASE_URL=https://api.openai.com/v1

# Gemini
NEXT_PUBLIC_GEMINI_API_KEY=...
NEXT_PUBLIC_GEMINI_MODEL=gemini-1.5-pro

# Kimi
NEXT_PUBLIC_KIMI_API_KEY=...
NEXT_PUBLIC_KIMI_MODEL=moonshot-v1-128k

# Qwen
NEXT_PUBLIC_QWEN_API_KEY=...
NEXT_PUBLIC_QWEN_MODEL=qwen-plus
```

### Docker Compose配置文件

| 文件 | 用途 | Dify地址配置 |
|------|------|------------|
| `docker-compose.yml` | 标准生产环境 | IP地址 |
| `docker-compose.server.yml` | 服务器环境 | `host.docker.internal` |
| `docker-compose.hotreload.yml` | 热重载开发 | `host.docker.internal` |
| `docker-compose.dev.yml` | 混合开发 | 本地配置 |

---

## 开发指南

### 本地开发环境

#### 方式1: 热重载Docker环境（推荐）

```bash
# 启动
./dev-start-hotreload.sh

# 特点
- ✅ 完整Docker化
- ✅ 代码热重载
- ✅ 浏览器自动刷新
```

#### 方式2: 混合开发环境

```bash
# 启动
./dev-start.sh

# 特点
- ✅ Redis在Docker
- ✅ Next.js在主机
- ✅ Python用uv管理
- ✅ 资源占用少
```

### 项目结构

```
├── app/                    # Next.js App Router
│   ├── api/               # API路由
│   ├── page.tsx           # 首页
│   └── word-editor/       # 编辑器页面
├── components/            # React组件
│   ├── NotionBlock.tsx    # 块编辑器
│   ├── outline/           # 大纲组件
│   └── blocks/            # 各类块组件
├── lib/                   # 工具库
│   ├── ai/               # AI Provider
│   ├── dify-api.ts       # Dify API
│   └── redis.ts          # Redis客户端
├── store/                 # 状态管理
│   └── useStore.ts       # Zustand Store
├── public/                # 静态资源
├── docker-compose*.yml    # Docker配置
└── Dockerfile*            # Docker镜像定义
```

### 开发工作流

```bash
# 1. 创建功能分支
git checkout -b feature/new-feature

# 2. 启动开发环境
./dev-start-hotreload.sh

# 3. 编辑代码（自动热重载）
vim app/page.tsx

# 4. 测试功能
open http://localhost:3000

# 5. 提交代码
git add .
git commit -m "feat: add new feature"
git push origin feature/new-feature
```

---

## 故障排查

### 常见问题

#### 1. Docker容器无法访问Dify

**症状**: API调用失败，网络错误

**排查步骤**:

```bash
# 1. 进入容器测试
docker exec -it ai-document-generator sh

# 2. 测试网络连通
ping host.docker.internal

# 3. 测试HTTP访问
wget -O- http://host.docker.internal/

# 4. 检查环境变量
env | grep DIFY
```

**可能原因和解决方案**:

| 原因 | 解决方案 |
|------|---------|
| Docker版本太低 | 升级到20.10+ |
| Dify只监听127.0.0.1 | 修改Dify配置监听0.0.0.0 |
| 未配置extra_hosts | 使用docker-compose.server.yml |

#### 2. 端口被占用

```bash
# 检查端口
sudo netstat -tlnp | grep -E "3001|6379|8081"

# 修改端口（在docker-compose.yml中）
ports:
  - "3002:3000"  # 改为其他端口
```

#### 3. 构建超时或失败

```bash
# 配置Docker镜像加速
sudo tee /etc/docker/daemon.json <<-'EOF'
{
  "registry-mirrors": [
    "https://docker.m.daocloud.io",
    "https://dockerproxy.com"
  ]
}
EOF

# 重启Docker
sudo systemctl daemon-reload
sudo systemctl restart docker
```

#### 4. API Key错误

```bash
# 检查环境变量
docker exec ai-document-generator env | grep DIFY

# 重新构建（确保API Key嵌入）
docker-compose -f docker-compose.server.yml build --no-cache app
docker-compose -f docker-compose.server.yml up -d
```

#### 5. 健康检查失败

```bash
# 查看健康检查日志
docker inspect ai-document-generator | grep -A 10 Health

# 手动测试健康端点
curl http://localhost:3001/api/health

# 查看应用日志
docker-compose -f docker-compose.server.yml logs --tail=100 app
```

### 日志查看

```bash
# 查看所有服务日志
docker-compose -f docker-compose.server.yml logs -f

# 只看应用日志
docker-compose -f docker-compose.server.yml logs -f app

# 查看最近100行
docker-compose -f docker-compose.server.yml logs --tail=100 app

# 查看错误日志
docker-compose -f docker-compose.server.yml logs app | grep -i error
```

---

## 完整文档

项目提供了详细的技术文档，涵盖所有方面：

### 📚 核心文档

- **[API文档](docs/API.md)** - 完整的API参考手册
  - 所有API端点说明
  - 请求/响应格式
  - 错误处理和代码
  - SDK使用示例
  - 速率限制说明

- **[Docker部署指南](docs/DOCKER.md)** - Docker化部署完全指南
  - BuildKit优化技巧
  - 资源管理配置
  - 安全加固方案
  - 监控和日志
  - 故障排查指南

- **[环境配置](docs/ENVIRONMENT.md)** - 环境变量配置手册
  - 必需变量说明
  - 可选配置项
  - 验证和检查工具
  - 多环境配置
  - 安全最佳实践

- **[性能指标](docs/METRICS.md)** - 性能监控指南
  - 指标收集系统
  - 缓存效率监控
  - API性能追踪
  - Grafana集成
  - 告警配置

### 🛠️ 快速参考

```bash
# 环境验证
npm run env:check

# 查看API文档
open docs/API.md

# 查看性能指标
curl http://localhost:3000/api/metrics

# 健康检查
curl http://localhost:3000/api/health
```

---

## 管理命令

### 服务管理

```bash
# 启动服务
docker-compose -f docker-compose.server.yml up -d

# 停止服务
docker-compose -f docker-compose.server.yml down

# 重启服务
docker-compose -f docker-compose.server.yml restart

# 重启单个服务
docker-compose -f docker-compose.server.yml restart app

# 查看状态
docker-compose -f docker-compose.server.yml ps

# 查看资源使用
docker stats ai-document-generator
```

### 更新应用

```bash
# 1. 拉取最新代码
git pull

# 2. 重新构建
docker-compose -f docker-compose.server.yml build app

# 3. 重启服务
docker-compose -f docker-compose.server.yml up -d
```

### 备份和恢复

```bash
# 备份Redis数据
docker cp ai-doc-redis:/data ./backup/redis-$(date +%Y%m%d)

# 备份应用数据
tar -czf backup/store-$(date +%Y%m%d).tar.gz ./store

# 恢复
docker cp ./backup/redis-20260206 ai-doc-redis:/data
tar -xzf backup/store-20260206.tar.gz
```

---

## 性能优化

### 生产环境优化

1. **启用Redis缓存**
   ```bash
   CACHE_ENABLED=1
   REDIS_URL=redis://redis:6379
   ```

2. **配置Redis内存限制**
   ```yaml
   command: redis-server --maxmemory 256mb --maxmemory-policy allkeys-lru
   ```

3. **使用Nginx反向代理**
   ```nginx
   server {
       listen 80;
       server_name doc.yourdomain.com;
       
       location / {
           proxy_pass http://localhost:3001;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
       }
   }
   ```

4. **启用HTTPS**
   ```bash
   sudo certbot --nginx -d doc.yourdomain.com
   ```

---

## 安全建议

### 1. 环境变量安全

- ❌ 不要提交.env.local到Git
- ✅ 使用密钥管理服务
- ✅ 定期轮换API密钥

### 2. 网络安全

```yaml
# 限制端口访问（只允许本地）
ports:
  - "127.0.0.1:3001:3000"
```

### 3. 容器安全

```yaml
# 以非root用户运行
user: "nextjs:nodejs"
```

### 4. 防火墙配置

```bash
# 只允许必要的端口
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

---

## 贡献指南

欢迎贡献代码！

### 开发流程

1. Fork本仓库
2. 创建功能分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'feat: add amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 提交Pull Request

### 代码规范

- 使用TypeScript
- 遵循ESLint规则
- 编写单元测试
- 更新相关文档

---

## 许可证

[MIT License](LICENSE)

---

## 联系方式

- GitHub: https://github.com/yuyangzheng-git/Documenton-NewVersionWebTextAIGenerator
- Issues: https://github.com/yuyangzheng-git/Documenton-NewVersionWebTextAIGenerator/issues

---

## 更新日志

### v1.0.0 (2026-02-06)

- ✨ 完整Docker化部署支持
- 🔥 热重载开发环境
- 🚀 服务器部署配置（host.docker.internal）
- 📝 完整文档体系
- 🐛 修复TypeScript类型错误
- 🐛 修复CORS问题
- 🎨 优化UI加载提示

---

**Happy Coding!** 🚀
## API参考

### 核心端点

#### 健康检查
```bash
GET /api/health
```

响应:
```json
{
  "status": "healthy",
  "services": {
    "redis": { "status": "ok" },
    "dify": { "status": "ok", "responseTime": 120 }
  }
}
```

#### 性能指标
```bash
GET /api/metrics
```

响应包含缓存命中率、API响应时间（p95/p99）、错误率等。

#### 生成文档大纲
```bash
POST /api/ai/outline
Content-Type: application/json

{
  "topic": "AI in Healthcare",
  "style": "专业严肃" | "轻松活泼" | "学术严谨" | "商务正式"
}
```

约束：topic最大500字符，自动过滤恶意输入。

#### 生成章节内容（流式）
```bash
POST /api/ai/generate
Content-Type: application/json

{
  "topic": "Medical AI Applications",
  "context": "...",
  "style": "专业严肃"
}
```

返回SSE流:
```
data: {"type":"chunk","content":"AI has revolutionized"}
data: {"type":"done"}
```

超时：120秒，活动超时：30秒。

#### 导出DOCX
```bash
POST /api/export/docx
Content-Type: application/json

{
  "html": "<h1>Title</h1><p>Content...</p>",
  "title": "Document Title",
  "useAdvancedConversion": true
}
```

返回二进制DOCX文件。支持Pandoc（高质量）和docxtemplater（快速）两种模式。

#### 模板管理
```bash
# 列出模板
GET /api/templates

# 上传模板
POST /api/template/upload
Content-Type: multipart/form-data

file: [DOCX file, max 10MB]
```

### 错误代码

| 代码 | HTTP状态 | 说明 |
|------|----------|------|
| `VALIDATION_ERROR` | 400 | 输入验证失败 |
| `INVALID_INPUT` | 400 | 检测到恶意输入 |
| `FILE_TOO_LARGE` | 400 | 文件超过限制 |
| `RATE_LIMIT_EXCEEDED` | 429 | 超过速率限制 |
| `DIFY_API_ERROR` | 500 | Dify API调用失败 |
| `TIMEOUT` | 504 | 请求超时 |

### 速率限制

| 端点 | 限制 | 窗口 |
|------|------|------|
| `/api/ai/*` | 60次 | 1分钟 |
| `/api/template/upload` | 10次 | 1分钟 |
| `/api/export/docx` | 30次 | 1分钟 |

### 客户端示例

**JavaScript:**
```javascript
// 生成大纲
const response = await fetch('/api/ai/outline', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ topic: 'AI in Healthcare' })
});
const { outline } = await response.json();

// 流式生成
const response = await fetch('/api/ai/generate', {
  method: 'POST',
  body: JSON.stringify({ topic: 'Medical AI' })
});

const reader = response.body.getReader();
const decoder = new TextDecoder();

while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  
  const chunk = decoder.decode(value);
  const lines = chunk.split('\n');
  
  for (const line of lines) {
    if (line.startsWith('data: ')) {
      const data = JSON.parse(line.slice(6));
      console.log(data.content);
    }
  }
}
```

**Python:**
```python
import requests

# 生成大纲
response = requests.post('http://localhost:3000/api/ai/outline', json={
    'topic': 'AI in Healthcare'
})
outline = response.json()['outline']

# 导出DOCX
response = requests.post('http://localhost:3000/api/export/docx', json={
    'html': '<h1>Title</h1>',
    'title': 'My Document'
})
with open('document.docx', 'wb') as f:
    f.write(response.content)
```

**cURL:**
```bash
# 健康检查
curl http://localhost:3000/api/health

# 生成大纲
curl -X POST http://localhost:3000/api/ai/outline \
  -H "Content-Type: application/json" \
  -d '{"topic":"AI in Healthcare"}'

# 导出文档
curl -X POST http://localhost:3000/api/export/docx \
  -H "Content-Type: application/json" \
  -d '{"html":"<h1>Title</h1>","title":"My Doc"}' \
  --output doc.docx
```

---

## Docker部署详解

### BuildKit优化

启用BuildKit获得50-80%构建加速:

```bash
# 设置环境变量
export DOCKER_BUILDKIT=1

# 或配置daemon.json
{
  "features": { "buildkit": true }
}
```

Dockerfile已配置缓存挂载:
```dockerfile
RUN --mount=type=cache,target=/root/.npm npm install
RUN --mount=type=cache,target=/app/.next/cache npm run build
```

### 资源限制

所有服务已配置资源限制（docker-compose.server.yml）:

**主应用:**
```yaml
deploy:
  resources:
    limits:
      cpus: '2.0'
      memory: 2G
    reservations:
      cpus: '0.5'
      memory: 512M
```

**Redis:**
```yaml
deploy:
  resources:
    limits:
      cpus: '0.5'
      memory: 512M
```

根据实际使用调整:
```bash
# 查看资源使用
docker stats

# 调整限制
vim docker-compose.server.yml
docker-compose -f docker-compose.server.yml up -d
```

### 安全加固

已实施的安全措施:

1. **非root用户运行**
   ```dockerfile
   USER nextjs
   ```

2. **禁止权限提升**
   ```yaml
   security_opt:
     - no-new-privileges:true
   ```

3. **只读文件系统（Redis）**
   ```yaml
   read_only: true
   tmpfs:
     - /tmp:size=50M
   ```

4. **最小基础镜像**
   - Alpine Linux (5MB vs 120MB)

5. **健康检查**
   ```dockerfile
   HEALTHCHECK --interval=30s --timeout=10s \
     CMD wget --spider http://localhost:3000/api/health
   ```

### 日志管理

配置了自动轮转:
```yaml
logging:
  driver: "json-file"
  options:
    max-size: "10m"
    max-file: "3"
```

查看日志:
```bash
# 实时日志
./manage.sh logs

# 最近100行
docker-compose -f docker-compose.server.yml logs --tail=100 app

# 特定时间
docker-compose logs --since 2024-01-15T10:00:00 app
```

### 监控集成

**健康检查:**
```bash
# Kubernetes探针
curl http://localhost:3001/api/health

# 响应状态
200 - healthy
503 - degraded/unhealthy
```

**性能指标:**
```bash
# Prometheus格式(TODO)
curl http://localhost:3001/api/metrics

# 当前JSON格式
{
  "cache": { "hitRate": 0.75 },
  "apis": [{ "p95": 800, "p99": 1200 }]
}
```

### 故障排查

**容器无法启动:**
```bash
# 查看日志
./manage.sh logs

# 检查端口占用
lsof -i :3001

# 清理重建
./manage.sh clean
./manage.sh deploy
```

**高内存使用:**
```bash
# 查看统计
docker stats

# 调整限制
vim docker-compose.server.yml
# 修改 memory: 2G → 4G
```

**构建缓慢:**
```bash
# 启用BuildKit
export DOCKER_BUILDKIT=1

# 使用层缓存
docker-compose build --pull

# 检查缓存
docker buildx du
```

---

## 环境变量配置

### 快速开始

```bash
# 1. 生成模板
npm run env:generate

# 2. 复制配置
cp .env.example .env.local

# 3. 编辑配置
nano .env.local

# 4. 验证
npm run env:check
```

### 必需变量

**Dify配置（必需）:**
```env
# API基础URL
NEXT_PUBLIC_DIFY_BASE_URL=http://your-dify-server/v1

# 大纲生成API密钥
NEXT_PUBLIC_DIFY_OUTLINE_KEY=app-xxxxx...

# 内容生成API密钥
NEXT_PUBLIC_DIFY_CHAPTER_KEY=app-xxxxx...

# LLM聊天API密钥
NEXT_PUBLIC_DIFY_LLM_KEY=app-xxxxx...
```

验证规则:
- URL必须是有效的HTTP(S)地址
- 密钥必须以`app-`开头
- 密钥长度≥10字符

### 可选变量

**Redis缓存:**
```env
REDIS_URL=redis://localhost:6379
CACHE_ENABLED=1
```

**日志级别:**
```env
LOG_LEVEL=info  # debug | info | warn | error
```

**CORS配置:**
```env
ALLOWED_ORIGINS=https://app.example.com,https://admin.example.com
```

**其他AI提供商:**
```env
# OpenAI
NEXT_PUBLIC_OPENAI_API_KEY=sk-...
NEXT_PUBLIC_OPENAI_MODEL=gpt-4o

# Google Gemini
NEXT_PUBLIC_GEMINI_API_KEY=...
NEXT_PUBLIC_GEMINI_MODEL=gemini-1.5-pro

# Anthropic Claude
NEXT_PUBLIC_CLAUDE_API_KEY=sk-ant-...
NEXT_PUBLIC_CLAUDE_MODEL=claude-3-5-sonnet-20241022

# 更多提供商...
```

### 环境文件优先级

Next.js加载顺序(后者覆盖前者):
1. `.env` - 默认值(提交到git)
2. `.env.local` - 本地覆盖(**不提交**)
3. `.env.production` - 生产配置(提交)
4. `.env.production.local` - 生产本地覆盖(**不提交**)

### 验证系统

自动验证在启动时运行:
```bash
🔍 Validating environment configuration...

❌ Missing required environment variable: NEXT_PUBLIC_DIFY_BASE_URL
   Description: Dify API base URL
   Constraint: Must be a valid HTTP(S) URL

⚠️  Using default value for LOG_LEVEL: info
```

手动验证:
```bash
npm run env:check
```

### Docker部署

**构建时变量（嵌入镜像）:**
```yaml
# docker-compose.server.yml
build:
  args:
    NEXT_PUBLIC_DIFY_BASE_URL: http://host.docker.internal/v1
    NEXT_PUBLIC_DIFY_OUTLINE_KEY: app-...
```

**运行时变量（可修改）:**
```yaml
environment:
  - NODE_ENV=production
  - REDIS_URL=redis://redis:6379

# 或使用文件
env_file:
  - .env.local
```

### 安全最佳实践

1. **永不提交secrets**
   ```bash
   # .gitignore
   .env.local
   .env*.local
   ```

2. **按环境分离密钥**
   ```env
   # 开发
   NEXT_PUBLIC_DIFY_OUTLINE_KEY=app-dev-...
   
   # 生产
   NEXT_PUBLIC_DIFY_OUTLINE_KEY=app-prod-...
   ```

3. **定期轮换密钥**

4. **使用secrets管理**
   - Docker: Docker secrets
   - Kubernetes: K8s secrets
   - Cloud: AWS Secrets Manager, Google Secret Manager

### 故障排查

**"Missing required variable":**
```bash
# 检查文件存在
ls -la .env.local

# 对比模板
diff .env.example .env.local

# 重新生成
npm run env:generate
```

**变量未更新:**
```bash
# 重启开发服务器
Ctrl+C
npm run dev

# 或重建生产环境
docker-compose build --no-cache
docker-compose up -d
```

---

## 性能监控

### 指标收集

系统自动收集以下指标:
- **API响应时间** - min, max, avg, p95, p99
- **缓存命中率** - hits, misses, hit rate
- **错误率** - 按代码和端点分类
- **请求计数** - 总请求和成功率

### 使用方法

**查看指标:**
```bash
curl http://localhost:3000/api/metrics | jq
```

**响应示例:**
```json
{
  "cache": {
    "hits": 150,
    "misses": 50,
    "hitRate": 0.75,
    "totalRequests": 200
  },
  "apis": [
    {
      "endpoint": "/api/ai/outline",
      "method": "POST",
      "responseTime": {
        "avg": 500,
        "p95": 800,
        "p99": 1200
      },
      "errorRate": 0.05
    }
  ]
}
```

### API端点追踪

在路由中自动追踪:
```typescript
import { trackAPIMetrics } from '@/lib/metrics';

export async function POST(request: NextRequest) {
  return trackAPIMetrics('/api/ai/outline', 'POST', async () => {
    // 你的处理逻辑
    const result = await processRequest();
    return NextResponse.json(result);
  });
}
```

### 缓存监控

Redis操作自动追踪:
```typescript
const cached = await cache.get('mykey');
// 自动记录 hit 或 miss
```

手动追踪:
```typescript
import { metrics } from '@/lib/metrics';

metrics.recordCacheHit('custom-key');
metrics.recordCacheMiss('custom-key');
```

### 错误追踪

记录自定义错误:
```typescript
import { metrics } from '@/lib/metrics';

try {
  await riskyOperation();
} catch (error) {
  metrics.recordError('OPERATION_FAILED', '/api/endpoint');
  throw error;
}
```

### Prometheus集成(规划中)

```typescript
// TODO: 导出Prometheus格式
export function toPrometheusFormat(summary: MetricsSummary): string {
  // 转换为Prometheus exposition格式
}
```

### Grafana仪表板

配置数据源:
1. 添加JSON数据源指向 `/api/metrics`
2. 创建面板:
   - 响应时间百分位趋势图
   - 缓存命中率
   - 错误率按端点
   - 请求吞吐量

### 告警配置

建议告警阈值:
- 错误率 > 5%
- 缓存命中率 < 70%
- P95响应时间 > 2秒
- P99响应时间 > 5秒

### 性能优化建议

**基于指标优化:**

1. **低缓存命中率** → 增加TTL或缓存容量
```env
# Redis配置
command: redis-server --maxmemory 512mb
```

2. **高响应时间** → 优化查询或增加资源
```yaml
# 增加CPU/内存
deploy:
  resources:
    limits:
      cpus: '4.0'
      memory: 4G
```

3. **高错误率** → 检查日志排查问题
```bash
./manage.sh logs | grep ERROR
```

### 监控最佳实践

1. **定期检查指标**
   ```bash
   watch -n 5 'curl -s http://localhost:3000/api/metrics | jq .cache'
   ```

2. **设置自动告警**

3. **关联指标与部署**
   - 部署后立即检查指标
   - 对比部署前后性能

4. **长期趋势分析**
   - 使用时序数据库
   - 创建周报/月报

---

**Happy Coding!** 🚀
