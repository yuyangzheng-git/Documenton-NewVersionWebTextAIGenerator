# 完全 Docker 化部署指南

## 当前状况

由于网络问题（Docker Hub 连接超时），完全 Docker 化构建暂时受阻。

### 问题原因
- Docker Hub 连接不稳定
- 需要从 Docker Hub 拉取 `node:20-alpine` 基础镜像

## 解决方案

### 方案 A: 配置 Docker 镜像加速器（推荐）

#### 1. 图形界面配置

1. 打开 **Docker Desktop**
2. 点击右上角 **设置图标**（齿轮）
3. 进入 **Docker Engine** 标签
4. 在 JSON 配置中添加：

```json
{
  "registry-mirrors": [
    "https://docker.m.daocloud.io",
    "https://docker.1panel.live",
    "https://hub.rat.dev"
  ]
}
```

5. 点击 **Apply & Restart**

#### 2. 构建镜像

配置完成后：

```bash
cd /Users/2812019221qq.com/Documenton-NewVersionWebTextAIGenerator
docker-compose build
```

#### 3. 启动服务

```bash
docker-compose up -d
```

### 方案 B: 使用混合模式（快速方案）

如果Docker 镜像拉取仍有问题，可以使用已配置好的混合模式：

```bash
# 1. 启动开发环境（Python + Next.js 本地，Redis Docker）
./dev-start.sh

# 访问 http://localhost:3000
```

**优势：**
- ✅ 无需等待Docker 镜像构建
- ✅ 开发体验更好（热重载）
- ✅ 已经完全配置好，可立即使用

## 完全 Docker 化配置文件说明

### 已准备好的文件

1. **Dockerfile** - 优化的多阶段构建
   - 使用国内镜像源（阿里云）
   - npm 使用淘宝镜像
   - 包含 Python3、Pandoc

2. **docker-compose.yml** - 完整服务编排
   - Next.js 应用容器
   - Redis 缓存容器
   - Redis Commander 管理工具

### 环境变量配置

确保 `.env.local` 中包含：

```env
# Redis 配置（Docker 模式）
REDIS_URL=redis://redis:6379
CACHE_ENABLED=1

# Dify API 配置
NEXT_PUBLIC_DIFY_BASE_URL=http://your-server-ip/v1
NEXT_PUBLIC_DIFY_OUTLINE_KEY=app-YOUR_OUTLINE_KEY_HERE
NEXT_PUBLIC_DIFY_CHAPTER_KEY=app-YOUR_CHAPTER_KEY_HERE
NEXT_PUBLIC_DIFY_LLM_KEY=app-YOUR_LLM_KEY_HERE
```

## 完整 Docker 化启动流程

一旦 Docker 镜像加速器配置完成：

### 1. 构建镜像

```bash
docker-compose build
```

预计时间：5-10 分钟（首次构建）

### 2. 启动所有服务

```bash
docker-compose up -d
```

### 3. 查看状态

```bash
docker-compose ps
```

### 4. 查看日志

```bash
# 所有服务
docker-compose logs -f

# 特定服务
docker-compose logs -f app
docker-compose logs -f redis
```

### 5. 访问应用

- **主应用**: http://localhost:3001
- **Redis Commander**: http://localhost:8081

### 6. 停止服务

```bash
docker-compose down
```

## 架构对比

### 混合模式（当前可用）
```
┌─────────────────────────────┐
│  主机                        │
│  - Next.js (localhost:3000) │
│  - Python (uv)              │
└─────────────────────────────┘
           ↓
┌─────────────────────────────┐
│  Docker 容器                 │
│  - Redis (6379)             │
└─────────────────────────────┘
```

### 完全 Docker 化（待网络稳定）
```
┌─────────────────────────────┐
│  Docker Compose             │
│  ┌─────────────────────┐    │
│  │ Next.js + Python    │    │
│  │ (3001)              │    │
│  └─────────────────────┘    │
│  ┌─────────────────────┐    │
│  │ Redis (6379)        │    │
│  └─────────────────────┘    │
│  ┌─────────────────────┐    │
│  │ Redis Commander     │    │
│  │ (8081)              │    │
│  └─────────────────────┘    │
└─────────────────────────────┘
```

## 常见问题

### Q: 镜像构建失败怎么办？

A:
1. 检查 Docker Desktop 是否在运行
2. 配置镜像加速器（见上文）
3. 检查网络连接
4. 使用混合模式作为备用方案

### Q: 如何切换模式？

A:

**切换到混合模式：**
```bash
docker-compose down
./dev-start.sh
```

**切换到完全 Docker：**
```bash
# 停止混合模式（Ctrl+C）
./dev-stop.sh
docker-compose up -d
```

### Q: 完全 Docker 化的优势？

A:
- ✅ 环境完全隔离
- ✅ 一键部署
- ✅ 适合生产环境
- ✅ 团队环境一致

### Q: 混合模式的优势？

A:
- ✅ 快速启动
- ✅ 开发体验好
- ✅ 调试方便
- ✅ 资源占用少

## 推荐方案

### 开发环境
使用**混合模式**（`./dev-start.sh`）

### 生产环境
使用**完全 Docker 化**（`docker-compose up -d`）

## 立即开始

如果想马上使用应用，运行：

```bash
./dev-start.sh
```

如果要尝试完全 Docker 化，先配置镜像加速器，然后：

```bash
docker-compose build
docker-compose up -d
```

---

**需要帮助？** 查看 `DEV_GUIDE.md` 或 `README.md`
