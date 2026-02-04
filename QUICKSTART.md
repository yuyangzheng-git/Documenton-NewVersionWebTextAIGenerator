# 🚀 服务器部署快速开始

## 方法一：一键安装（推荐）

### 1. 上传项目到服务器

```bash
# 从本地上传
scp -r Documenton-NewVersionWebTextAIGenerator user@your-server:/home/user/

# 或在服务器上克隆
git clone <your-repo-url>
cd Documenton-NewVersionWebTextAIGenerator
```

### 2. 运行安装脚本

```bash
chmod +x install-server.sh
./install-server.sh
```

脚本会自动：
- ✅ 检测操作系统
- ✅ 安装 Docker & Docker Compose
- ✅ 安装 Python & Pandoc
- ✅ 配置环境变量
- ✅ 部署应用

### 3. 配置 API 密钥

编辑 `.env.local` 文件：
```bash
nano .env.local
```

填入你的 Dify API 密钥：
```env
NEXT_PUBLIC_DIFY_API_KEY=app-xxxxxxxxxxxxx
NEXT_PUBLIC_DIFY_CHAPTER_KEY=app-xxxxxxxxxxxxx
NEXT_PUBLIC_DIFY_CHAT_KEY=app-xxxxxxxxxxxxx
```

### 4. 重启服务

```bash
./deploy-server.sh restart
```

### 5. 访问应用

浏览器打开: `http://your-server-ip:3000`

---

## 方法二：Docker 快速部署

### 前置要求
- 已安装 Docker 和 Docker Compose

### 部署步骤

```bash
# 1. 进入项目目录
cd Documenton-NewVersionWebTextAIGenerator

# 2. 配置环境变量
cp .env.example .env.local
nano .env.local  # 填入 API 密钥

# 3. 一键部署
chmod +x deploy-server.sh
./deploy-server.sh deploy
```

### 常用命令

```bash
./deploy-server.sh status   # 查看状态
./deploy-server.sh logs     # 查看日志
./deploy-server.sh restart  # 重启服务
./deploy-server.sh stop     # 停止服务
```

---

## 方法三：手动部署

### 1. 安装依赖

```bash
# Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Python & Pandoc
sudo apt-get install python3 python3-pip python3-venv pandoc
```

### 2. 配置项目

```bash
# 安装 Node 依赖
npm install

# 配置 Python 环境
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# 配置环境变量
cp .env.example .env.local
nano .env.local
```

### 3. 构建和启动

```bash
# 构建
npm run build

# 启动（使用 PM2）
npm install -g pm2
pm2 start npm --name "documenton" -- start
pm2 save
pm2 startup
```

---

## 验证部署

### 1. 检查服务状态

```bash
# Docker 方式
./deploy-server.sh status

# PM2 方式
pm2 list
```

### 2. 测试健康检查

```bash
curl http://localhost:3000/api/health
# 应返回: {"status":"ok"}
```

### 3. 浏览器测试

访问: `http://your-server-ip:3000`

---

## 常见问题

### 端口已被占用

```bash
# 查看占用
lsof -i :3000

# 修改端口（编辑 docker-compose.yml 或启动命令）
```

### 导出失败

```bash
# 检查 Python 环境
source venv/bin/activate
python --version
pip list | grep pypandoc

# 检查 Pandoc
pandoc --version
```

### 权限问题

```bash
chmod +x *.sh
sudo chown -R $USER:$USER .
```

---

## 生产环境配置

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
    }
}
```

### 2. 配置 HTTPS

```bash
sudo apt-get install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

### 3. 防火墙配置

```bash
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable
```

---

## 需要帮助？

- 📖 完整文档: `SERVER_DEPLOYMENT.md`
- 📝 项目文档: `README.md`
- 🐛 报告问题: GitHub Issues

---

**祝部署顺利！** 🎉
