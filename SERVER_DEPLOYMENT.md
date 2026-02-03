# 服务器部署快速开始

## 🚀 一键部署（推荐）

```bash
# 1. 克隆项目
git clone <your-repo-url>
cd Documenton-NewVersionWebTextAIGenerator

# 2. 配置环境变量
cp .env.example .env.local
# 编辑 .env.local，填入你的 Dify API 配置

# 3. 运行部署脚本
./deploy-server.sh
```

访问 http://localhost:3000 或 http://你的服务器IP:3000

## 📋 环境变量配置

编辑 `.env.local` 文件：

```env
# Dify API 基础 URL
NEXT_PUBLIC_DIFY_BASE_URL=https://your-dify-instance/v1

# Dify 大纲规划 API Key
NEXT_PUBLIC_DIFY_PLANNER_KEY=app-your-planner-key

# Dify 正文写作 API Key
NEXT_PUBLIC_DIFY_CHAPTER_KEY=app-your-chapter-key
```

## 🐳 Docker 部署（手动）

### 构建镜像
```bash
docker-compose build
```

### 启动服务
```bash
docker-compose up -d
```

### 查看日志
```bash
docker-compose logs -f
```

### 停止服务
```bash
docker-compose down
```

## 🌐 云服务器部署

### 1. 安装 Docker
```bash
# Ubuntu/Debian
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# 安装 Docker Compose
sudo apt-get install docker-compose-plugin
```

### 2. 防火墙配置
```bash
# 开放 3000 端口
sudo ufw allow 3000/tcp
sudo ufw reload
```

### 3. 使用 Nginx 反向代理（可选）
```nginx
# /etc/nginx/sites-available/ai-doc-generator
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

        # 增加超时时间（用于大文件导出）
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }

    # 文件上传大小限制
    client_max_body_size 50M;
}
```

启用配置：
```bash
sudo ln -s /etc/nginx/sites-available/ai-doc-generator /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 4. HTTPS 配置（推荐）
```bash
# 安装 Certbot
sudo apt-get install certbot python3-certbot-nginx

# 获取 SSL 证书
sudo certbot --nginx -d your-domain.com

# 自动续期
sudo certbot renew --dry-run
```

## 📦 导出功能说明

部署后支持三种导出方式：

### ✅ 方式 1: 内置模板（docx.js）
- **优点**：零依赖，最稳定
- **用途**：基础文档导出
- **状态**：默认启用

### ✅ 方式 2: Pandoc + 模板
- **优点**：支持复杂样式
- **依赖**：Python3 + Pandoc（已在 Docker 中安装）
- **用途**：专业文档导出

### ✅ 方式 3: 自定义模板
- **优点**：完全自定义
- **用途**：企业模板

## 🔧 常用命令

```bash
# 查看服务状态
./deploy-server.sh status

# 重启服务
./deploy-server.sh restart

# 查看日志
./deploy-server.sh logs

# 停止服务
./deploy-server.sh stop

# 清理所有数据（谨慎！）
./deploy-server.sh cleanup
```

## 📊 性能优化

### 1. 增加内存限制
编辑 `docker-compose.yml`：
```yaml
services:
  app:
    deploy:
      resources:
        limits:
          memory: 2G
        reservations:
          memory: 1G
```

### 2. 使用 Redis 缓存（可选）
```yaml
services:
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis-data:/data

volumes:
  redis-data:
```

## 🔍 故障排查

### 问题 1: 容器无法启动
```bash
# 查看详细日志
docker-compose logs app

# 检查端口占用
sudo lsof -i :3000
```

### 问题 2: 导出功能失败
```bash
# 进入容器检查
docker-compose exec app sh

# 测试 Pandoc
pandoc --version

# 测试 Python
python3 --version
```

### 问题 3: 文件上传失败
```bash
# 检查目录权限
ls -la store/

# 修复权限
chmod -R 755 store/
```

## 📝 更新部署

```bash
# 1. 拉取最新代码
git pull

# 2. 重新构建并部署
./deploy-server.sh deploy

# 或手动执行
docker-compose down
docker-compose build
docker-compose up -d
```

## 🛡️ 安全建议

1. **修改默认端口**：编辑 docker-compose.yml 中的端口映射
2. **配置防火墙**：只开放必要端口
3. **使用 HTTPS**：配置 SSL 证书
4. **定期更新**：及时更新 Docker 镜像和依赖
5. **备份数据**：定期备份 `store/` 目录

## 📚 更多文档

- [完整部署指南](./DEPLOYMENT_GUIDE.md)
- [API 配置说明](./DIFY_API_PARAMETER_CONFIG.md)
- [批量生成功能](./BULK_GENERATION_SIMPLIFIED.md)

## 🆘 获取帮助

遇到问题？
1. 查看日志：`./deploy-server.sh logs`
2. 检查配置：`cat .env.local`
3. 查看状态：`./deploy-server.sh status`
4. 提交 Issue 到项目仓库

---

**部署成功后访问**: http://localhost:3000 🎉
