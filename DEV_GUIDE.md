# 开发环境部署指南

## 架构说明

本项目采用混合部署架构：
- **Python**: 使用 `uv` 管理（本地环境）
- **Next.js**: 本地开发服务器运行
- **Redis**: Docker 容器运行

## 快速开始

### 1. 一键启动开发环境

```bash
chmod +x dev-start.sh dev-stop.sh
./dev-start.sh
```

脚本会自动：
- ✅ 检查并设置 Python uv 环境
- ✅ 启动 Redis Docker 容器
- ✅ 启动 Next.js 开发服务器

### 2. 访问应用

- **主应用**: http://localhost:3000
- **Redis Commander**: http://localhost:8081

### 3. 停止环境

```bash
./dev-stop.sh
```

## 手动安装步骤

如果需要手动配置，请按以下步骤操作：

### 步骤 1: 安装 uv 和 Python 环境

```bash
# 安装 uv
curl -LsSf https://astral.sh/uv/install.sh | sh

# 设置 Python 环境
./setup-python-uv.sh
```

### 步骤 2: 安装 Node.js 依赖

```bash
npm install
```

### 步骤 3: 配置环境变量

```bash
cp .env.example .env.local
# 编辑 .env.local 填入您的 API 密钥
```

确保包含以下 Redis 配置：
```env
REDIS_URL=redis://localhost:6379
CACHE_ENABLED=1
```

### 步骤 4: 启动 Redis (Docker)

```bash
docker-compose -f docker-compose.dev.yml up -d redis
```

### 步骤 5: 启动开发服务器

```bash
# 激活 Python 环境
source .venv/bin/activate

# 启动 Next.js
npm run dev
```

## 环境管理命令

### Python 环境

```bash
# 激活 Python 环境
source .venv/bin/activate

# 或使用便捷脚本
source activate-uv.sh

# 安装新的 Python 包
uv pip install <package-name>

# 更新 requirements.txt
uv pip freeze > requirements.txt
```

### Docker 服务

```bash
# 启动所有服务
docker-compose -f docker-compose.dev.yml up -d

# 启动单个服务
docker-compose -f docker-compose.dev.yml up -d redis

# 查看日志
docker-compose -f docker-compose.dev.yml logs -f

# 停止服务
docker-compose -f docker-compose.dev.yml down

# 清理数据（包括 volumes）
docker-compose -f docker-compose.dev.yml down -v
```

### Redis 管理

```bash
# 连接 Redis CLI
docker exec -it ai-doc-redis-dev redis-cli

# 查看 Redis 状态
docker exec ai-doc-redis-dev redis-cli INFO

# 清空缓存
docker exec ai-doc-redis-dev redis-cli FLUSHALL
```

## 生产环境部署

对于生产环境，使用完整的 Docker 部署：

```bash
# 使用包含 Python 的完整镜像
docker-compose -f docker-compose.yml up -d

# 或使用分离部署（推荐服务器）
./deploy-server.sh deploy
```

详见：
- `SERVER_DEPLOYMENT.md` - 服务器部署指南
- `QUICKSTART.md` - 快速部署指南

## 故障排查

### Redis 连接失败

```bash
# 检查 Redis 是否运行
docker ps | grep redis

# 测试连接
docker exec ai-doc-redis-dev redis-cli ping
```

### Python 模块未找到

```bash
# 确保激活了虚拟环境
source .venv/bin/activate

# 重新安装依赖
uv pip install -r requirements.txt
```

### 端口冲突

如果 3000 或 6379 端口已被占用：

```bash
# 查看端口占用
lsof -i :3000
lsof -i :6379

# 修改端口（编辑 docker-compose.dev.yml 或使用环境变量）
```

## 文件说明

- `docker-compose.dev.yml` - 开发环境 Docker 配置（仅 Redis）
- `docker-compose.separated.yml` - 分离部署配置（生产）
- `docker-compose.yml` - 完整 Docker 配置（生产）
- `dev-start.sh` - 开发环境启动脚本
- `dev-stop.sh` - 开发环境停止脚本
- `setup-python-uv.sh` - Python uv 环境设置脚本
- `activate-uv.sh` - Python 环境快速激活脚本

## 技术栈

- **前端**: Next.js 16 + React 19 + TypeScript
- **Python**: uv + pypandoc
- **缓存**: Redis 7
- **文档生成**: Pandoc
- **AI**: Dify API

## 需要帮助？

- 📖 查看完整文档: `README.md`
- 🐛 报告问题: GitHub Issues
