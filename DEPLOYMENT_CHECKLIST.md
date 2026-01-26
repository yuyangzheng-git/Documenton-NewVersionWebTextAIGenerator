# Docker 部署检查清单

## 📋 部署前检查

### 1. 项目文件准备

- [x] 根目录 Dockerfile 已创建
- [x] docker-compose.yml 已创建
- [x] .dockerignore 已创建
- [x] .github/workflows/docker.yml 已创建
- [x] deploy.sh 一键部署脚本已创建
- [x] GITHUB_DEPLOYMENT.md 部署文档已创建
- [x] DEPLOY_README.md 项目 README 已创建

### 2. 依赖检查

- [ ] Docker 已安装（`docker --version`）
- [ ] Docker Compose 已安装（`docker-compose --version`）
- [ ] Python 3 已安装（`python3 --version`）
- [ ] Pandoc 已安装（`pandoc --version`）

### 3. 配置文件

- [ ] .env 文件已配置（包含 Dify API 密钥）
- [ ] reference_template.docx 模板文件已创建（可选）
- [ ] 端口 3000 未被占用

## 🚀 部署步骤

### 方式 1：使用一键部署脚本

```bash
# 克隆仓库
git clone https://github.com/your-username/FrontendWord.git
cd FrontendWord

# 运行部署脚本
./deploy.sh
```

### 方式 2：使用 Docker Compose

```bash
# 克隆仓库
git clone https://github.com/your-username/FrontendWord.git
cd FrontendWord

# 启动服务
docker-compose up -d
```

### 方式 3：使用 Docker 命令

```bash
# 拉取镜像
docker pull ghcr.io/your-username/front-endword:latest

# 运行容器
docker run -d \
  --name ai-doc-generator \
  -p 3000:3000 \
  ghcr.io/your-username/front-endword:latest
```

### 方式 4：使用 GitHub Actions 自动构建

1. 推送代码到 GitHub
2. GitHub Actions 自动构建并推送镜像
3. 在服务器上拉取镜像运行

## 📤 推送到 GitHub

### 1. 初始化 Git（如果需要）

```bash
cd /Users/2812019221qq.com/FrontendWord
git init
git add .
git commit -m "Initial commit with Docker support"
```

### 2. 连接到远程仓库

```bash
git remote add origin https://github.com/YOUR_USERNAME/FrontendWord.git
git branch -M main
```

### 3. 推送代码

```bash
git push -u origin main
```

### 4. 验证 GitHub Actions

1. 访问 GitHub 仓库
2. 点击 "Actions" 标签页
3. 查看 "Build and Push Docker Image" workflow
4. 等待构建完成

## ✅ 部署后验证

### 1. 检查容器状态

```bash
docker ps | grep ai-doc-generator
```

预期输出：
```
a1b2c3d4e5f6  ghcr.io/your-username/front-endword:latest  ...  Up  ai-doc-generator
```

### 2. 检查应用日志

```bash
docker logs -f ai-doc-generator
```

预期输出：
```
▲ Next.js 16.1.1
- Local:        http://localhost:3000
```

### 3. 访问应用

在浏览器中打开：http://localhost:3000

### 4. 功能测试

- [ ] 首页正常加载
- [ ] 输入主题后能生成大纲
- [ ] 编辑器页面正常显示
- [ ] AI 生成功能正常
- [ ] 导出 Word 功能正常
- [ ] 图片上传功能正常

## 🔧 故障排查

### 问题 1：容器无法启动

**检查**：
```bash
docker logs ai-doc-generator
```

**常见原因**：
- 端口被占用：`-p 8080:3000`
- 缺少环境变量：挂载 .env 文件
- 镜像下载失败：检查网络连接

### 问题 2：镜像拉取失败

**原因**：GitHub Container Registry 认证问题

**解决**：
```bash
echo $GITHUB_TOKEN | docker login ghcr.io -u YOUR_USERNAME --password-stdin
```

### 问题 3：应用无法访问

**检查**：
```bash
# 检查端口是否开放
netstat -an | grep 3000

# 检查防火墙
sudo ufw status
```

### 问题 4：导出 Word 失败

**检查**：
```bash
# 检查 Pandoc 是否安装
docker exec ai-doc-generator which pandoc

# 检查 Python 依赖
docker exec ai-doc-generator pip3 list | grep pypandoc

# 检查模板文件
docker exec ai-doc-generator ls -la reference_template.docx
```

## 🔄 更新部署

### 自动更新（使用 Watchtower）

```bash
docker run -d \
  --name watchtower \
  -v /var/run/docker.sock:/var/run/docker.sock \
  containrrr/watchtower \
  --interval 3600 \
  ghcr.io/your-username/front-endword:latest
```

### 手动更新

```bash
# 1. 拉取新镜像
docker pull ghcr.io/your-username/front-endword:latest

# 2. 停止旧容器
docker stop ai-doc-generator
docker rm ai-doc-generator

# 3. 运行新容器
docker run -d \
  --name ai-doc-generator \
  -p 3000:3000 \
  -v $(pwd)/.env:/app/.env:ro \
  -v $(pwd)/reference_template.docx:/app/reference_template.docx:ro \
  ghcr.io/your-username/front-endword:latest
```

## 📊 监控和维护

### 查看容器资源使用

```bash
docker stats ai-doc-generator
```

### 清理未使用的镜像

```bash
docker image prune -a
```

### 清理未使用的容器

```bash
docker container prune
```

### 查看磁盘使用

```bash
docker system df
```

## 📝 部署日志

记录每次部署的关键信息：

| 日期 | 版本 | 镜像 | 状态 | 备注 |
|------|------|------|------|------|
| 2026-01-26 | v1.0.0 | ghcr.io/... | ✅ | 初始部署 |

## 🎯 下一步

1. [ ] 完成首次部署
2. [ ] 配置 Nginx 反向代理
3. [ ] 启用 HTTPS（Let's Encrypt）
4. [ ] 设置监控和告警
5. [ ] 配置自动备份
6. [ ] 性能优化

## 📞 获取帮助

- 查看 [GITHUB_DEPLOYMENT.md](GITHUB_DEPLOYMENT.md) 获取详细部署指南
- 查看 [QUICKSTART.md](QUICKSTART.md) 获取快速开始指南
- 提交 [GitHub Issue](https://github.com/your-username/FrontendWord/issues)

## ✅ 完成检查

部署完成后，确认以下项目：

- [ ] 容器正常运行
- [ ] 应用可访问
- [ ] 所有功能正常
- [ ] 环境变量已配置
- [ ] 模板文件已挂载（如使用）
- [ ] 日志正常输出
- [ ] 备份策略已设置
- [ ] 监控已配置

恭喜！部署完成！🎉
