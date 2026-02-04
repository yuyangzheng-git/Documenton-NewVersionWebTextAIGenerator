# Documenton 服务器部署指南

## 📋 目录

- [系统要求](#系统要求)
- [快速部署](#快速部署)
- [手动部署](#手动部署)
- [环境配置](#环境配置)
- [验证部署](#验证部署)
- [常见问题](#常见问题)

---

## 系统要求

### 硬件要求
- CPU: 2 核心以上
- 内存: 4GB 以上推荐
- 磁盘: 10GB 可用空间

### 软件要求
- **操作系统**: Linux (Ubuntu 20.04+, CentOS 7+) 或 macOS
- **Docker**: 20.10+
- **Docker Compose**: 2.0+
- **Python**: 3.8+ (用于 Pandoc 导出)
- **Pandoc**: 2.0+ (用于 DOCX 导出)

---

## 快速部署（推荐 - Docker 方式）

### 1. 安装 Docker 和 Docker Compose

**Ubuntu/Debian:**
```bash
# 更新包索引
sudo apt-get update

# 安装 Docker
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER

# 安装 Docker Compose
sudo apt-get install docker-compose-plugin

# 重启终端使 docker 组生效
```

**CentOS/RHEL:**
```bash
# 安装 Docker
sudo yum install -y yum-utils
sudo yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo
sudo yum install docker-ce docker-ce-cli containerd.io docker-compose-plugin
sudo systemctl start docker
sudo systemctl enable docker
sudo usermod -aG docker $USER
```

### 2. 克隆项目（或上传到服务器）

```bash
# 如果从 Git 克隆
git clone <your-repo-url>
cd Documenton-NewVersionWebTextAIGenerator

# 或者使用 scp 上传
scp -r Documenton-NewVersionWebTextAIGenerator user@server:/path/to/deploy/
```

### 3. 配置环境变量

```bash
# 复制环境变量模板
cp .env.example .env.local

# 编辑配置文件
nano .env.local
```

**必填配置项**:
```env
# Dify API 配置 (生成大纲)
NEXT_PUBLIC_DIFY_API_KEY=app-xxxxxxxxxxxxx
NEXT_PUBLIC_DIFY_API_URL=https://api.dify.ai/v1

# Dify 章节生成 API
NEXT_PUBLIC_DIFY_CHAPTER_KEY=app-xxxxxxxxxxxxx

# Dify 聊天助手 API
NEXT_PUBLIC_DIFY_CHAT_KEY=app-xxxxxxxxxxxxx
```

### 4. 运行部署脚本

```bash
# 给脚本执行权限
chmod +x deploy-server.sh

# 完整部署（构建 + 启动）
./deploy-server.sh deploy

# 或分步执行
./deploy-server.sh build   # 构建镜像
./deploy-server.sh start   # 启动服务
```

### 5. 验证部署

```bash
# 查看服务状态
./deploy-server.sh status

# 查看日志
./deploy-server.sh logs

# 访问应用
# 浏览器打开: http://your-server-ip:3000
```

---

## 手动部署（非 Docker 方式）

### 1. 安装 Node.js

```bash
# 使用 nvm 安装 Node.js 18+
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc
nvm install 18
nvm use 18
```

### 2. 安装 Python 和 Pandoc

**Ubuntu/Debian:**
```bash
# 安装 Python 3
sudo apt-get install python3 python3-pip python3-venv

# 安装 Pandoc
sudo apt-get install pandoc
# 或下载最新版
wget https://github.com/jgm/pandoc/releases/download/3.1.11/pandoc-3.1.11-1-amd64.deb
sudo dpkg -i pandoc-3.1.11-1-amd64.deb
```

**CentOS/RHEL:**
```bash
# 安装 Python 3
sudo yum install python3 python3-pip

# 安装 Pandoc
sudo yum install pandoc
# 或使用下载的 RPM 包
```

### 3. 配置项目

```bash
cd Documenton-NewVersionWebTextAIGenerator

# 安装 Node.js 依赖
npm install

# 创建 Python 虚拟环境
python3 -m venv venv
source venv/bin/activate

# 安装 Python 依赖
pip install -r requirements.txt

# 配置环境变量
cp .env.example .env.local
nano .env.local
```

### 4. 构建和启动

```bash
# 构建生产版本
npm run build

# 启动生产服务器
npm start
# 或使用 PM2 管理进程
npm install -g pm2
pm2 start npm --name "documenton" -- start
pm2 save
pm2 startup
```

---

## 环境配置详解

### .env.local 配置项说明

```env
# ============ Dify AI 配置 ============
# 大纲生成 Workflow API
NEXT_PUBLIC_DIFY_API_KEY=app-xxxxxxxxxxxxx
NEXT_PUBLIC_DIFY_API_URL=https://api.dify.ai/v1

# 章节内容生成 Workflow API
NEXT_PUBLIC_DIFY_CHAPTER_KEY=app-xxxxxxxxxxxxx

# AI 聊天助手 API
NEXT_PUBLIC_DIFY_CHAT_KEY=app-xxxxxxxxxxxxx

# ============ Redis 配置（可选）============
REDIS_URL=redis://localhost:6379

# ============ 其他 AI 平台（可选）============
# OpenAI
NEXT_PUBLIC_OPENAI_API_KEY=sk-xxxxxxxxxxxxx
NEXT_PUBLIC_OPENAI_BASE_URL=https://api.openai.com/v1
NEXT_PUBLIC_OPENAI_MODEL=gpt-4

# Claude
NEXT_PUBLIC_CLAUDE_API_KEY=sk-ant-xxxxxxxxxxxxx
NEXT_PUBLIC_CLAUDE_BASE_URL=https://api.anthropic.com
NEXT_PUBLIC_CLAUDE_MODEL=claude-3-sonnet-20240229

# 其他平台类似配置...
```

---

## 验证部署

### 1. 检查服务状态

**Docker 方式:**
```bash
docker-compose ps
# 应该看到 app、redis、redis-commander 都在运行

# 查看日志
docker-compose logs -f app
```

**手动方式:**
```bash
# 检查进程
pm2 list
# 或
ps aux | grep node

# 查看日志
pm2 logs documenton
```

### 2. 测试应用

```bash
# 健康检查
curl http://localhost:3000/api/health

# 应该返回: {"status":"ok"}
```

### 3. 浏览器访问

打开浏览器访问: `http://your-server-ip:3000`

### 4. 测试导出功能

1. 在主页输入文档主题
2. 点击"生成大纲"
3. 进入编辑器
4. 点击"导出"按钮
5. 下载 DOCX 文件

---

## 常见命令

### Docker 部署管理

```bash
# 启动服务
./deploy-server.sh start

# 停止服务
./deploy-server.sh stop

# 重启服务
./deploy-server.sh restart

# 查看日志
./deploy-server.sh logs

# 查看状态
./deploy-server.sh status

# 重新构建
./deploy-server.sh build

# 完全清理（危险）
./deploy-server.sh cleanup
```

### 手动部署管理

```bash
# PM2 命令
pm2 start npm --name "documenton" -- start
pm2 stop documenton
pm2 restart documenton
pm2 logs documenton
pm2 delete documenton

# 直接运行
npm run build && npm start

# 开发模式
npm run dev
```

---

## 常见问题

### 1. 端口被占用

**问题**: `Error: listen EADDRINUSE: address already in use :::3000`

**解决**:
```bash
# 查看占用端口的进程
lsof -i :3000
# 或
netstat -tulnp | grep 3000

# 杀死进程
kill -9 <PID>

# 或修改端口
npm run dev -- -p 3001
```

### 2. Docker 构建失败

**问题**: Docker build 出错

**解决**:
```bash
# 清理 Docker 缓存
docker system prune -a

# 重新构建
docker-compose build --no-cache
```

### 3. 导出失败

**问题**: 导出 DOCX 时报错

**解决**:
```bash
# 检查 Python 环境
source venv/bin/activate
python --version
pip list | grep pypandoc

# 检查 Pandoc
pandoc --version

# 重新安装依赖
pip install -r requirements.txt

# 检查模板文件
ls -lh public/templates/asiainfo-template.docx
```

### 4. 权限问题

**问题**: Permission denied

**解决**:
```bash
# 给脚本执行权限
chmod +x deploy-server.sh
chmod +x cli.py

# 修复文件所有权
sudo chown -R $USER:$USER .
```

### 5. 内存不足

**问题**: JavaScript heap out of memory

**解决**:
```bash
# 增加 Node.js 内存限制
export NODE_OPTIONS="--max-old-space-size=4096"
npm run build
```

### 6. Redis 连接失败

**问题**: Redis connection refused

**解决**:
```bash
# 检查 Redis 是否运行
docker-compose ps redis

# 重启 Redis
docker-compose restart redis

# 或注释掉 .env.local 中的 REDIS_URL（Redis 是可选的）
```

---

## 生产环境建议

### 1. 使用 Nginx 反向代理

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
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

### 2. 配置 SSL (HTTPS)

```bash
# 使用 Let's Encrypt
sudo apt-get install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

### 3. 设置防火墙

```bash
# UFW (Ubuntu)
sudo ufw allow 22    # SSH
sudo ufw allow 80    # HTTP
sudo ufw allow 443   # HTTPS
sudo ufw enable

# Firewalld (CentOS)
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --reload
```

### 4. 启用日志轮转

```bash
# 使用 PM2 的日志管理
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
```

### 5. 监控和备份

```bash
# 使用 PM2 监控
pm2 monit

# 定期备份数据
# 编辑 crontab
crontab -e

# 添加每日备份任务
0 2 * * * /path/to/backup-script.sh
```

---

## 性能优化

### 1. 启用 Next.js 缓存

```js
// next.config.ts
export default {
  experimental: {
    outputStandalone: true,
  },
  compress: true,
  poweredByHeader: false,
}
```

### 2. 使用 PM2 集群模式

```bash
pm2 start npm --name "documenton" -i max -- start
```

### 3. 配置 Redis 缓存

确保 `.env.local` 中配置了 Redis URL

---

## 安全建议

1. **不要暴露 .env.local 文件**
2. **定期更新依赖**: `npm audit fix`
3. **使用强密码**: Redis、数据库等
4. **限制 API 调用频率**: 使用 rate limiting
5. **启用 HTTPS**: 生产环境必须
6. **定期备份**: 数据和配置

---

## 支持

如有问题，请查看:
- 项目 README.md
- GitHub Issues
- 日志文件: `./deploy-server.sh logs`

---

**部署愉快！** 🚀
