# 🚀 Docker 部署就绪 - 完整指南

## 📦 已创建的文件

### 核心配置文件

1. **`/Users/2812019221qq.com/FrontendWord/Dockerfile`**
   - Docker 镜像构建配置
   - 基于 Node.js 20
   - 包含 Python 3 和 Pandoc

2. **`/Users/2812019221qq.com/FrontendWord/docker-compose.yml`**
   - Docker Compose 配置
   - 一键启动所有服务
   - 包含网络和卷配置

3. **`/Users/2812019221qq.com/FrontendWord/.dockerignore`**
   - 排除不必要的文件
   - 优化构建速度
   - 减小镜像大小

### 自动化配置

4. **`/.github/workflows/docker.yml`**
   - GitHub Actions 自动构建
   - 自动推送到 GitHub Container Registry
   - 支持多平台（amd64, arm64）

5. **`/Users/2812019221qq.com/FrontendWord/deploy.sh`**
   - 一键部署脚本
   - 自动检查依赖
   - 彩色输出和错误处理

### 文档

6. **`GITHUB_DEPLOYMENT.md`** - 完整的 GitHub 部署指南
7. **`DEPLOY_README.md`** - 项目 README（用于 GitHub）
8. **`DEPLOYMENT_CHECKLIST.md`** - 部署检查清单

## 🎯 三种部署方式

### 方式 1：GitHub Container Registry（推荐）

**优点**：
- ✅ 与 GitHub 深度集成
- ✅ 自动构建和推送
- ✅ 免费公开镜像
- ✅ 支持 CI/CD

**步骤**：

1. **推送代码到 GitHub**
   ```bash
   cd /Users/2812019221qq.com/FrontendWord
   git init
   git add .
   git commit -m "Add Docker support"
   git remote add origin https://github.com/YOUR_USERNAME/FrontendWord.git
   git branch -M main
   git push -u origin main
   ```

2. **等待 GitHub Actions 构建**
   - 访问 GitHub 仓库
   - 点击 "Actions" 标签页
   - 查看 "Build and Push Docker Image" workflow
   - 等待构建完成（约 5-10 分钟）

3. **拉取并运行镜像**
   ```bash
   # 替换为你的 GitHub 用户名
   docker pull ghcr.io/YOUR_USERNAME/front-endword:latest

   # 运行容器
   docker run -d \
     --name ai-doc-generator \
     -p 3000:3000 \
     ghcr.io/YOUR_USERNAME/front-endword:latest
   ```

4. **访问应用**
   ```
   http://localhost:3000
   ```

### 方式 2：Docker Compose

**步骤**：

1. **克隆仓库**
   ```bash
   git clone https://github.com/YOUR_USERNAME/FrontendWord.git
   cd FrontendWord
   ```

2. **启动服务**
   ```bash
   docker-compose up -d
   ```

3. **查看日志**
   ```bash
   docker-compose logs -f
   ```

### 方式 3：一键部署脚本

**步骤**：

1. **使用脚本部署**
   ```bash
   git clone https://github.com/YOUR_USERNAME/FrontendWord.git
   cd FrontendWord
   ./deploy.sh
   ```

2. **自定义参数**
   ```bash
   # 指定端口
   ./deploy.sh --port 8080

   # 指定镜像
   ./deploy.sh --image ghcr.io/YOUR_USERNAME/front-endword:latest

   # 跳过拉取（使用本地镜像）
   ./deploy.sh --no-pull
   ```

## 🔧 配置说明

### 环境变量

创建 `.env` 文件：

```env
# Dify API 配置
DIFY_API_URL=https://api.dify.ai/v1
DIFY_OUTLINE_API_KEY=app-your-outline-api-key
DIFY_CHAPTER_API_KEY=app-your-chapter-api-key
```

挂载到容器：

```bash
docker run -d \
  --name ai-doc-generator \
  -p 3000:3000 \
  -v $(pwd)/.env:/app/.env:ro \
  ghcr.io/YOUR_USERNAME/front-endword:latest
```

### 模板文件

挂载自定义模板：

```bash
docker run -d \
  --name ai-doc-generator \
  -p 3000:3000 \
  -v $(pwd)/reference_template.docx:/app/reference_template.docx:ro \
  ghcr.io/YOUR_USERNAME/front-endword:latest
```

## 📋 推送到 GitHub 前的检查

- [ ] 替换所有 `your-username` 为你的 GitHub 用户名
- [ ] 替换所有 `front-endword` 为你想要的镜像名称
- [ ] 确保 `.env` 文件中不包含敏感信息（或使用 GitHub Secrets）
- [ ] 测试本地构建：`docker build -f ai-document-generator/Dockerfile -t test .`
- [ ] 更新 `DEPLOY_README.md` 中的项目信息
- [ ] 选择合适的许可证（当前为 MIT）

## 🎨 自定义配置

### 修改端口

编辑 `docker-compose.yml`：

```yaml
services:
  ai-document-generator:
    ports:
      - "8080:3000"  # 修改这里的端口
```

### 修改镜像名称

编辑 `.github/workflows/docker.yml`：

```yaml
env:
  IMAGE_NAME: your-username/your-repo-name
```

### 修改 GitHub Actions

- 触发条件：编辑 `on` 部分
- 构建平台：编辑 `platforms` 部分
- 缓存策略：编辑 `cache-from` 和 `cache-to`

## 🔍 验证部署

### 1. 检查镜像

```bash
docker images | grep front-endword
```

### 2. 检查容器

```bash
docker ps | grep ai-doc-generator
```

### 3. 检查日志

```bash
docker logs ai-doc-generator
```

### 4. 访问应用

打开浏览器访问：http://localhost:3000

### 5. 功能测试

- [ ] 首页正常
- [ ] AI 生成功能
- [ ] 导出 Word 功能
- [ ] 图片上传功能

## 📊 镜像标签说明

| 标签 | 说明 | 使用场景 |
|------|------|----------|
| `latest` | 最新稳定版本 | 生产环境 |
| `main` | main 分支 | 开发测试 |
| `v1.0.0` | 特定版本 | 稳定部署 |
| `sha-xxx` | 特定提交 | 回滚 |

## 🔄 更新流程

### 自动更新

使用 Watchtower 自动更新：

```bash
docker run -d \
  --name watchtower \
  -v /var/run/docker.sock:/var/run/docker.sock \
  containrrr/watchtower \
  --interval 3600 \
  ghcr.io/YOUR_USERNAME/front-endword:latest
```

### 手动更新

```bash
# 拉取新镜像
docker pull ghcr.io/YOUR_USERNAME/front-endword:latest

# 重启容器
docker stop ai-doc-generator
docker rm ai-doc-generator

# 运行新容器
docker run -d \
  --name ai-doc-generator \
  -p 3000:3000 \
  ghcr.io/YOUR_USERNAME/front-endword:latest
```

## 🐛 常见问题

### Q: 如何修改 GitHub 镜像名称？

A: 编辑 `.github/workflows/docker.yml`：
```yaml
env:
  IMAGE_NAME: your-username/your-repo-name
```

### Q: 如何启用私有镜像？

A: 在 GitHub 仓库设置中启用 "Private" 选项，拉取时需要登录：
```bash
echo $GITHUB_TOKEN | docker login ghcr.io -u USERNAME --password-stdin
```

### Q: 如何在服务器上部署？

A:
```bash
# 1. 安装 Docker 和 Docker Compose
sudo apt-get install docker docker-compose

# 2. 拉取镜像
docker pull ghcr.io/YOUR_USERNAME/front-endword:latest

# 3. 运行容器
docker run -d -p 3000:3000 ghcr.io/YOUR_USERNAME/front-endword:latest
```

### Q: 如何查看 GitHub Actions 构建日志？

A: 访问 GitHub 仓库 → Actions → 选择 workflow → 点击具体的 run

## 📚 相关文档

- [GITHUB_DEPLOYMENT.md](GITHUB_DEPLOYMENT.md) - 详细部署指南
- [DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md) - 部署检查清单
- [QUICKSTART.md](QUICKSTART.md) - 快速开始
- [TEMPLATE_GUIDE.md](ai-document-generator/TEMPLATE_GUIDE.md) - 模板配置

## ✅ 下一步操作

1. **立即执行**：
   ```bash
   cd /Users/2812019221qq.com/FrontendWord
   git add .
   git commit -m "Add complete Docker deployment support"
   git remote add origin https://github.com/YOUR_USERNAME/FrontendWord.git
   git push -u origin main
   ```

2. **等待构建**：访问 GitHub Actions 页面查看构建进度

3. **测试部署**：构建完成后，在服务器上拉取并运行镜像

4. **自定义配置**：根据需要修改端口、环境变量等

## 🎉 完成部署

恭喜！现在你的项目已经完全支持 Docker 部署，可以通过 GitHub Container Registry 一键拉取和部署！

---

**需要帮助？** 查看 [GITHUB_DEPLOYMENT.md](GITHUB_DEPLOYMENT.md) 获取详细信息。
