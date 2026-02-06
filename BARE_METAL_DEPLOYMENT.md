# 🚀 裸机部署指南（UV + Node.js）

本指南适用于在已安装 `uv` 和 `Node.js` 的服务器上进行裸机部署。

---

## 📋 前置条件

确保服务器已安装：
- ✅ Node.js 18+ （验证: `node -v`）
- ✅ npm 或 pnpm （验证: `npm -v`）
- ✅ uv （验证: `uv --version`）
- ✅ Pandoc （验证: `pandoc --version`）
- ✅ PM2 （可选，推荐: `npm install -g pm2`）

---

## 🔧 部署步骤

### 1. 克隆项目

```bash
cd /path/to/your/deployment/directory
git clone https://github.com/yuyangzheng-git/Documenton-NewVersionWebTextAIGenerator.git
cd Documenton-NewVersionWebTextAIGenerator
```

### 2. 安装 Python 依赖（使用 uv）

#### 方法 A：使用 uv 创建虚拟环境（推荐）

```bash
# 创建 uv 管理的虚拟环境
uv venv

# 激活虚拟环境
source .venv/bin/activate  # Linux/macOS
# 或
.venv\Scripts\activate     # Windows

# 使用 uv 安装依赖
uv pip install -r requirements.txt

# 验证安装
python -c "import pypandoc; print('pypandoc version:', pypandoc.__version__)"

# 记录 Python 路径（稍后配置到 .env.local）
which python
# 输出类似: /path/to/Documenton-NewVersionWebTextAIGenerator/.venv/bin/python
```

#### 方法 B：使用全局 uv 环境

```bash
# 直接用 uv 安装到全局或指定环境
uv pip install -r requirements.txt

# 找到 uv 管理的 Python 路径
which python
# 或
uv python find
```

### 3. 安装 Node.js 依赖

```bash
# 安装项目依赖
npm install

# 或使用 pnpm（更快）
pnpm install
```

### 4. 配置环境变量

```bash
# 复制环境变量模板
cp .env.example .env.local

# 编辑配置文件
nano .env.local  # 或使用 vim
```

**关键配置项：**

```env
# ========== AI 平台配置 ==========
NEXT_PUBLIC_DIFY_BASE_URL=http://your-dify-server/v1
NEXT_PUBLIC_DIFY_OUTLINE_KEY=app-xxxxxxxxxxxxx
NEXT_PUBLIC_DIFY_CHAPTER_KEY=app-xxxxxxxxxxxxx
NEXT_PUBLIC_DIFY_LLM_KEY=app-xxxxxxxxxxxxx

# ========== Python 路径配置（重要！）==========
# 指定 uv 环境的 Python 路径
# 使用 "which python" 或 "uv python find" 获取
PYTHON_PATH=/path/to/.venv/bin/python

# 示例：
# PYTHON_PATH=/root/.venv/bin/python
# PYTHON_PATH=/home/user/Documenton/.venv/bin/python
# 留空则使用默认的 python3

# ========== 应用配置 ==========
NEXT_TELEMETRY_DISABLED=1
PORT=3000
```

### 5. 构建 Next.js 项目

```bash
# 构建生产版本
npm run build

# 构建完成后会生成 .next 目录
```

### 6. 创建日志目录（PM2 需要）

```bash
mkdir -p logs
```

### 7. 启动应用

#### 方法 A：使用 PM2（推荐）

```bash
# 安装 PM2（如果未安装）
npm install -g pm2

# 使用 ecosystem.config.js 启动
pm2 start ecosystem.config.js

# 查看状态
pm2 status

# 查看日志
pm2 logs documenton

# 保存 PM2 进程列表
pm2 save

# 设置开机自启
pm2 startup
# 按照提示执行输出的命令
```

#### 方法 B：直接运行

```bash
# 前台运行
npm start

# 后台运行（使用 nohup）
nohup npm start > logs/app.log 2>&1 &

# 查看日志
tail -f logs/app.log
```

### 8. 验证部署

```bash
# 检查端口监听
lsof -i :3000

# 测试健康检查
curl http://localhost:3000/api/health
# 应返回: {"status":"ok"}

# 测试完整页面
curl -I http://localhost:3000
# 应返回: HTTP/1.1 200 OK
```

### 9. 测试导出功能

```bash
# 验证 Python 环境
source .venv/bin/activate  # 如果使用虚拟环境
python cli.py --help

# 验证 Pandoc
pandoc --version

# 在浏览器中测试完整流程：
# 1. 访问 http://server-ip:3000
# 2. 生成文档
# 3. 点击导出按钮
```

---

## 📊 PM2 常用命令

```bash
# 启动
pm2 start ecosystem.config.js

# 停止
pm2 stop documenton

# 重启
pm2 restart documenton

# 删除
pm2 delete documenton

# 查看日志
pm2 logs documenton
pm2 logs documenton --lines 100  # 查看最近100行

# 查看监控
pm2 monit

# 查看详细信息
pm2 show documenton

# 重载配置（不停机）
pm2 reload documenton

# 查看启动脚本
pm2 startup
```

---

## 🔄 更新部署

```bash
cd /path/to/Documenton-NewVersionWebTextAIGenerator

# 1. 拉取最新代码
git pull origin main

# 2. 更新依赖（如果需要）
npm install
uv pip install -r requirements.txt

# 3. 重新构建
npm run build

# 4. 重启应用
pm2 restart documenton

# 5. 查看日志确认
pm2 logs documenton --lines 50
```

---

## 🛠️ 故障排查

### 问题 1：导出失败，提示找不到 Python

**症状：**
```
Error: Failed to spawn Python process: spawn python3 ENOENT
```

**解决：**
```bash
# 1. 确认 Python 路径
which python
# 或
source .venv/bin/activate && which python

# 2. 在 .env.local 中设置正确的路径
PYTHON_PATH=/path/to/.venv/bin/python

# 3. 重启应用
pm2 restart documenton
```

### 问题 2：pypandoc 找不到

**症状：**
```
ModuleNotFoundError: No module named 'pypandoc'
```

**解决：**
```bash
# 激活虚拟环境
source .venv/bin/activate

# 重新安装依赖
uv pip install -r requirements.txt

# 验证
python -c "import pypandoc; print(pypandoc.__version__)"
```

### 问题 3：环境变量未加载

**症状：**
API keys 未生效，或 PYTHON_PATH 未生效

**解决：**

**方法 1：确认 .env.local 存在**
```bash
ls -la .env.local
cat .env.local  # 检查内容
```

**方法 2：手动加载环境变量**
```bash
# 在启动前导出
export $(cat .env.local | xargs)
pm2 restart documenton
```

**方法 3：修改 PM2 配置**
```javascript
// ecosystem.config.js 中确保有：
env_file: '.env.local',
```

**方法 4：使用 dotenv**
```bash
npm install dotenv
# Next.js 会自动加载 .env.local
```

### 问题 4：端口被占用

```bash
# 查看占用
lsof -i :3000

# 杀死进程
kill -9 $(lsof -ti :3000)

# 或修改端口
# 在 .env.local 中添加：
PORT=3001
```

### 问题 5：构建失败（内存不足）

```bash
# 增加 Node.js 内存限制
export NODE_OPTIONS="--max-old-space-size=4096"
npm run build
```

### 问题 6：PM2 日志文件过大

```bash
# 安装日志轮转
pm2 install pm2-logrotate

# 配置日志大小限制（10MB）
pm2 set pm2-logrotate:max_size 10M

# 配置保留天数（7天）
pm2 set pm2-logrotate:retain 7

# 立即轮转
pm2 flush
```

---

## 🔐 生产环境安全配置

### 1. 使用 Nginx 反向代理

```nginx
# /etc/nginx/sites-available/documenton
server {
    listen 80;
    server_name your-domain.com;

    # 限制请求体大小（用于文件上传）
    client_max_body_size 100M;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # 超时设置（导出可能需要较长时间）
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }
}
```

启用配置：
```bash
sudo ln -s /etc/nginx/sites-available/documenton /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 2. 配置 HTTPS

```bash
# 安装 Certbot
sudo apt-get install certbot python3-certbot-nginx

# 获取证书
sudo certbot --nginx -d your-domain.com

# 自动续期
sudo certbot renew --dry-run
```

### 3. 防火墙配置

```bash
# UFW (Ubuntu)
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 22/tcp  # SSH
sudo ufw enable

# Firewalld (CentOS)
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --reload
```

### 4. 文件权限

```bash
# 设置合适的权限
chmod 600 .env.local  # 只有所有者可读写
chmod +x cli.py
chmod +x *.sh

# 确保日志目录可写
chmod 755 logs
```

---

## 📈 性能优化

### 1. PM2 集群模式

```javascript
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'documenton',
    script: 'npm',
    args: 'start',
    instances: 'max',  // 使用所有 CPU 核心
    exec_mode: 'cluster',
    // ... 其他配置
  }]
};
```

重启生效：
```bash
pm2 delete documenton
pm2 start ecosystem.config.js
```

### 2. 启用 Next.js 缓存

Next.js 会自动缓存，确保构建时使用生产模式：
```bash
NODE_ENV=production npm run build
```

### 3. 配置 CDN（可选）

将 `public/` 目录的静态资源上传到 CDN。

---

## 📊 监控

### PM2 监控

```bash
# 实时监控
pm2 monit

# Web 监控界面（可选）
pm2 install pm2-server-monit
# 访问 http://localhost:9615
```

### 系统资源监控

```bash
# 安装 htop
sudo apt-get install htop

# 监控
htop
```

---

## 🔄 备份建议

```bash
# 创建备份脚本
cat > backup.sh << 'EOF'
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/path/to/backups"
PROJECT_DIR="/path/to/Documenton-NewVersionWebTextAIGenerator"

# 创建备份目录
mkdir -p $BACKUP_DIR

# 备份配置和数据
tar -czf $BACKUP_DIR/documenton_$DATE.tar.gz \
    -C $PROJECT_DIR \
    .env.local \
    public/templates \
    store/templates \
    logs

# 保留最近 7 天的备份
find $BACKUP_DIR -name "documenton_*.tar.gz" -mtime +7 -delete

echo "Backup completed: $BACKUP_DIR/documenton_$DATE.tar.gz"
EOF

chmod +x backup.sh

# 添加定时任务
crontab -e
# 添加：每天凌晨 2 点备份
0 2 * * * /path/to/backup.sh
```

---

## 📝 环境检查清单

部署前检查：

- [ ] Node.js 版本 >= 18
- [ ] npm 或 pnpm 已安装
- [ ] uv 已安装且可用
- [ ] Pandoc 已安装
- [ ] 防火墙已配置
- [ ] .env.local 已配置
- [ ] PYTHON_PATH 已设置
- [ ] Python 依赖已安装
- [ ] Node.js 依赖已安装
- [ ] 项目已构建
- [ ] 日志目录已创建
- [ ] PM2 已安装（如果使用）

部署后检查：

- [ ] 应用成功启动
- [ ] 端口 3000 正在监听
- [ ] 健康检查接口返回正常
- [ ] 主页可以访问
- [ ] 文档生成功能正常
- [ ] 导出功能正常
- [ ] 日志正常输出
- [ ] PM2 进程已保存（如果使用）

---

## 🆘 需要帮助？

- 查看日志: `pm2 logs documenton`
- 查看构建日志: `.next/` 目录
- 查看 Python 错误: `logs/pm2-error.log`
- GitHub Issues: https://github.com/yuyangzheng-git/Documenton-NewVersionWebTextAIGenerator/issues

---

**祝部署成功！** 🎉
