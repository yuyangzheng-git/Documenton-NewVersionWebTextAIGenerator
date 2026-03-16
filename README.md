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
- [API参考](#api参考)

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

## API参考

### 健康检查

```bash
GET /api/health
```

**响应**:
```json
{
  "status": "healthy",
  "timestamp": "2026-02-06T12:00:00.000Z",
  "version": "1.0.0"
}
```

### 生成大纲

```bash
POST /api/ai/outline
Content-Type: application/json

{
  "topic": "人工智能的发展历史"
}
```

**响应**:
```json
{
  "outline": [
    {
      "id": "uuid-1",
      "title": "人工智能的起源",
      "level": 1,
      "requirements": ""
    }
  ]
}
```

### 生成内容（流式）

```bash
POST /api/ai/generate
Content-Type: application/json

{
  "sectionTitle": "人工智能的起源",
  "documentTopic": "人工智能的发展历史",
  "fullOutline": "...",
  "requirements": ""
}
```

**响应**: Server-Sent Events (SSE)
```
data: {"text":"人工智能"}
data: {"text":"的起源"}
data: {"event":"done"}
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
