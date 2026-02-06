# 🚀 裸机部署 - 快速命令

## 自动部署（一键完成）

```bash
chmod +x deploy-bare-metal.sh
./deploy-bare-metal.sh
```

---

## 手动部署（分步执行）

### 1. 安装 Python 依赖

```bash
# 创建 uv 虚拟环境
uv venv

# 激活环境
source .venv/bin/activate

# 安装依赖
uv pip install -r requirements.txt

# 记录 Python 路径
which python
# 输出: /path/to/.venv/bin/python
```

### 2. 安装 Node.js 依赖

```bash
npm install
```

### 3. 配置环境变量

```bash
cp .env.example .env.local
nano .env.local
```

**必填配置：**
```env
# Dify API 配置
NEXT_PUBLIC_DIFY_BASE_URL=http://your-server/v1
NEXT_PUBLIC_DIFY_OUTLINE_KEY=app-xxxxx
NEXT_PUBLIC_DIFY_CHAPTER_KEY=app-xxxxx
NEXT_PUBLIC_DIFY_LLM_KEY=app-xxxxx

# Python 路径（重要！）
PYTHON_PATH=/path/to/.venv/bin/python
```

### 4. 构建项目

```bash
npm run build
```

### 5. 启动应用

#### 使用 PM2（推荐）

```bash
# 安装 PM2
npm install -g pm2

# 创建日志目录
mkdir -p logs

# 启动应用
pm2 start ecosystem.config.js

# 查看状态
pm2 status

# 查看日志
pm2 logs documenton

# 保存进程列表
pm2 save

# 设置开机自启
pm2 startup
```

#### 直接运行

```bash
npm start
```

---

## 验证部署

```bash
# 检查进程
pm2 status

# 检查端口
lsof -i :3000

# 健康检查
curl http://localhost:3000/api/health

# 查看日志
pm2 logs documenton --lines 50
```

---

## 更新部署

```bash
git pull
npm install
uv pip install -r requirements.txt
npm run build
pm2 restart documenton
```

---

## 常见问题

### Q: 导出失败，找不到 Python

```bash
# 1. 确认 Python 路径
which python

# 2. 在 .env.local 中设置
PYTHON_PATH=/path/to/.venv/bin/python

# 3. 重启
pm2 restart documenton
```

### Q: 端口被占用

```bash
lsof -i :3000
kill -9 $(lsof -ti :3000)
```

### Q: 环境变量未生效

```bash
# 确认 ecosystem.config.js 中有：
env_file: '.env.local'

# 重启应用
pm2 restart documenton
```

---

**完整文档：** `BARE_METAL_DEPLOYMENT.md`
