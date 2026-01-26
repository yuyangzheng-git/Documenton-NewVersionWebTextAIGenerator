# GitHub + Docker 部署指南

## 概述

本项目可以通过 Docker Hub 或 GitHub Container Registry 进行一键部署。

## 方案选择

### 方案 1：使用 GitHub Container Registry (推荐)

**优点**：
- 与 GitHub 深度集成
- 自动构建
- 免费公开镜像
- 支持私有镜像

**缺点**：
- 需要配置 GitHub Actions

### 方案 2：使用 Docker Hub

**优点**：
- 最大的 Docker 镜像仓库
- 社区广泛使用

**缺点**：
- 需要单独注册
- 需要手动推送

## 步骤 1：准备项目文件

### 1.1 创建根目录的 Dockerfile

我已经创建了 `/Users/2812019221qq.com/FrontendWord/Dockerfile`

### 1.2 创建 docker-compose.yml

我已经创建了 `/Users/2812019221qq.com/FrontendWord/docker-compose.yml`

### 1.3 创建 .dockerignore

我已经创建了 `/Users/2812019221qq.com/FrontendWord/.dockerignore`

## 步骤 2：配置 GitHub Actions

### 2.1 创建 GitHub Actions 配置

创建文件：`.github/workflows/docker.yml`

```yaml
name: Build and Push Docker Image

on:
  push:
    branches:
      - main
      - master
    tags:
      - 'v*.*.*'
  pull_request:
    branches:
      - main
      - master

env:
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}

jobs:
  build-and-push:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write

    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Log in to GitHub Container Registry
        uses: docker/login-action@v3
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Extract metadata for Docker
        id: meta
        uses: docker/metadata-action@v5
        with:
          images: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}
          tags: |
            type=ref,event=branch
            type=ref,event=pr
            type=semver,pattern={{version}}
            type=semver,pattern={{major}}.{{minor}}
            type=sha,prefix={{branch}}-

      - name: Build and push Docker image
        uses: docker/build-push-action@v5
        with:
          context: ./ai-document-generator
          push: true
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}
          cache-from: type=gha
          cache-to: type=gha,mode=max
```

### 2.2 推送到 GitHub

```bash
cd /Users/2812019221qq.com/FrontendWord

# 初始化 Git（如果还没有）
git init
git add .
git commit -m "Add Docker support for GitHub deployment"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/FrontendWord.git
git push -u origin main
```

### 2.3 启用 GitHub Packages

1. 访问 GitHub 仓库设置
2. 进入 "Packages" 标签页
3. 确认包已发布

## 步骤 3：部署到服务器

### 3.1 使用 Docker Pull（推荐）

```bash
# 拉取镜像
docker pull ghcr.io/your-username/front-endword:main

# 运行容器
docker run -d \
  --name ai-doc-generator \
  -p 3000:3000 \
  -v $(pwd)/reference_template.docx:/app/reference_template.docx:ro \
  ghcr.io/your-username/front-endword:main
```

### 3.2 使用 Docker Compose

```bash
# 克隆仓库
git clone https://github.com/your-username/FrontendWord.git
cd FrontendWord

# 启动服务
docker-compose up -d
```

### 3.3 使用 Nginx 反向代理

创建 `nginx.conf`：

```nginx
server {
    listen 80;
    server_name your-domain.com;

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

运行：

```bash
docker run -d \
  --name nginx-proxy \
  -p 80:80 \
  -v $(pwd)/nginx.conf:/etc/nginx/conf.d/default.conf:ro \
  --link ai-doc-generator:backend \
  nginx:alpine
```

## 步骤 4：配置环境变量

### 4.1 创建 .env 文件

在服务器上创建 `/Users/2812019221qq.com/FrontendWord/ai-document-generator/.env`：

```env
# Dify API 配置
DIFY_API_URL=https://api.dify.ai/v1
DIFY_OUTLINE_API_KEY=app-your-outline-api-key
DIFY_CHAPTER_API_KEY=app-your-chapter-api-key
```

### 4.2 挂载 .env 文件

```bash
docker run -d \
  --name ai-doc-generator \
  -p 3000:3000 \
  -v $(pwd)/.env:/app/.env:ro \
  -v $(pwd)/reference_template.docx:/app/reference_template.docx:ro \
  ghcr.io/your-username/front-endword:main
```

## 步骤 5：自动化更新

### 5.1 使用 Watchtower 自动更新

```bash
docker run -d \
  --name watchtower \
  -v /var/run/docker.sock:/var/run/docker.sock \
  containrrr/watchtower \
  --interval 3600 \
  ghcr.io/your-username/front-endword:main
```

### 5.2 手动更新

```bash
# 停止旧容器
docker stop ai-doc-generator
docker rm ai-doc-generator

# 拉取新镜像
docker pull ghcr.io/your-username/front-endword:main

# 运行新容器
docker run -d \
  --name ai-doc-generator \
  -p 3000:3000 \
  -v $(pwd)/.env:/app/.env:ro \
  -v $(pwd)/reference_template.docx:/app/reference_template.docx:ro \
  ghcr.io/your-username/front-endword:main
```

## 故障排查

### 问题 1：镜像构建失败

**检查**：Dockerfile 中的文件路径

```bash
# 本地测试构建
docker build -f ai-document-generator/Dockerfile -t test-image ./ai-document-generator
```

### 问题 2：容器启动失败

**检查日志**：
```bash
docker logs ai-doc-generator
```

**常见原因**：
- 端口冲突：`-p 8080:3000` 改用其他端口
- 缺少环境变量：挂载 .env 文件
- 缺少模板文件：挂载 reference_template.docx

### 问题 3：无法访问镜像

**解决方案**：
1. 确认镜像名称正确：`ghcr.io/your-username/front-endword`
2. 登录到 GitHub Container Registry：
   ```bash
   echo $GITHUB_TOKEN | docker login ghcr.io -u YOUR_USERNAME --password-stdin
   ```

## 性能优化

### 1. 使用多阶段构建

已在 Dockerfile 中实现。

### 2. 启用 Docker BuildKit

```bash
export DOCKER_BUILDKIT=1
docker build ...
```

### 3. 使用 Buildx 缓存

已在 GitHub Actions 中配置。

## 安全建议

1. **使用私有镜像**：对于生产环境，使用私有镜像
2. **定期更新**：使用 Watchtower 自动更新镜像
3. **扫描漏洞**：使用 Trivy 扫描镜像：
   ```bash
   docker run --rm -v /var/run/docker.sock:/var/run/docker.sock \
     aquasec/trivy image ghcr.io/your-username/front-endword:main
   ```
4. **使用非 root 用户**：在 Dockerfile 中添加：
   ```dockerfile
   RUN addgroup --system --gid 1001 nodejs
   RUN adduser --system --uid 1001 nextjs
   USER nextjs
   ```

## 参考资源

- [GitHub Packages 文档](https://docs.github.com/en/packages)
- [Docker Hub 文档](https://docs.docker.com/docker-hub/)
- [Docker Compose 文档](https://docs.docker.com/compose/)
- [Watchtower](https://containrrr.dev/watchtower/)

## 快速命令参考

```bash
# 构建镜像
docker build -f ai-document-generator/Dockerfile -t front-endword .

# 运行容器
docker run -d -p 3000:3000 --name ai-doc front-endword

# 查看日志
docker logs -f ai-doc

# 停止容器
docker stop ai-doc

# 删除容器
docker rm ai-doc

# 删除镜像
docker rmi front-endword

# 进入容器
docker exec -it ai-doc bash

# 复制文件到容器
docker cp reference_template.docx ai-doc:/app/reference_template.docx
```
