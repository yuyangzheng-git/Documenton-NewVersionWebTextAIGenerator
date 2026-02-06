# 部署方式总览

本项目提供**三种部署方式**，适用于不同的场景。

## 📊 部署方式对比

| 部署方式 | 适用场景 | 热重载 | 端口 | 配置文件 | 启动命令 |
|---------|---------|-------|------|---------|---------|
| 🔥 **热重载开发** | 本地开发调试 | ✅ 支持 | 3000 | `docker-compose.hotreload.yml` | `./dev-start-hotreload.sh` |
| 🔧 **混合开发** | 轻量级开发 | ✅ 支持 | 3000 | `docker-compose.dev.yml` | `./dev-start.sh` |
| 🚀 **服务器生产** | 部署到服务器 | ❌ 不支持 | 3001 | `docker-compose.server.yml` | `./deploy-server.sh` |
| 📦 **标准生产** | 通用生产环境 | ❌ 不支持 | 3001 | `docker-compose.yml` | `docker-compose up -d` |

## 1️⃣ 热重载开发环境

### 特点
- ✅ 修改代码立即生效
- ✅ 浏览器自动刷新
- ✅ 完整Docker化
- ✅ 适合日常开发

### 快速开始

```bash
./dev-start-hotreload.sh
```

访问: http://localhost:3000

### 详细文档
- [HOTRELOAD_QUICKSTART.md](HOTRELOAD_QUICKSTART.md) - 快速开始
- [HOTRELOAD_GUIDE.md](HOTRELOAD_GUIDE.md) - 完整指南

---

## 2️⃣ 混合开发环境

### 特点
- ✅ Redis在Docker
- ✅ Next.js在主机
- ✅ Python用uv管理
- ✅ 资源占用少

### 快速开始

```bash
./dev-start.sh
```

访问: http://localhost:3000

### 详细文档
- [DEV_GUIDE.md](DEV_GUIDE.md) - 开发指南

---

## 3️⃣ 服务器生产环境

### 特点
- ✅ 部署到Dify同一服务器
- ✅ 使用host.docker.internal
- ✅ 完整容器化
- ✅ 生产级优化

### 快速开始

```bash
# 在服务器上执行
./deploy-server.sh
```

访问: http://10.23.22.37:3001

### 关键配置

```yaml
# docker-compose.server.yml
extra_hosts:
  - "host.docker.internal:host-gateway"
```

```bash
# .env.local
NEXT_PUBLIC_DIFY_BASE_URL=http://host.docker.internal/v1
```

### 详细文档
- [SERVER_DEPLOYMENT_QUICKSTART.md](SERVER_DEPLOYMENT_QUICKSTART.md) - 快速部署
- [SERVER_DEPLOYMENT.md](SERVER_DEPLOYMENT.md) - 完整指南

---

## 4️⃣ 标准生产环境

### 特点
- ✅ 通用生产配置
- ✅ 适合独立服务器
- ✅ Dify使用IP地址访问

### 快速开始

```bash
docker-compose up -d
```

访问: http://localhost:3001

### 详细文档
- [DOCKER_GUIDE.md](DOCKER_GUIDE.md) - Docker部署指南
- [DEPLOYMENT_STATUS.md](DEPLOYMENT_STATUS.md) - 部署状态

---

## 🎯 选择建议

### 本地开发

```bash
# 推荐：热重载开发环境
./dev-start-hotreload.sh
```

**优势**: 实时热重载，开发体验最佳

### 服务器部署

```bash
# 如果服务器上有Dify
./deploy-server.sh

# 如果独立服务器
docker-compose up -d
```

**注意**: 服务器部署使用 `docker-compose.server.yml`

---

## 🔄 环境切换

### 从开发切换到生产

```bash
# 停止开发环境
./dev-stop-hotreload.sh

# 启动生产环境
docker-compose up -d
```

### 从生产切换到开发

```bash
# 停止生产环境
docker-compose down

# 启动开发环境
./dev-start-hotreload.sh
```

---

## 📂 配置文件说明

| 文件 | 用途 | Dify地址 |
|------|------|---------|
| `docker-compose.yml` | 标准生产 | `http://10.23.22.37/v1` |
| `docker-compose.server.yml` | 服务器生产 | `http://host.docker.internal/v1` |
| `docker-compose.hotreload.yml` | 热重载开发 | `http://host.docker.internal/v1` |
| `docker-compose.dev.yml` | 混合开发 | 主机配置 |

---

## 🛠️ 脚本说明

| 脚本 | 用途 |
|------|------|
| `deploy-server.sh` | 服务器一键部署 |
| `dev-start-hotreload.sh` | 启动热重载环境 |
| `dev-stop-hotreload.sh` | 停止热重载环境 |
| `dev-start.sh` | 启动混合开发环境 |
| `dev-stop.sh` | 停止混合开发环境 |

---

## 📚 所有文档索引

### 快速开始
- [HOTRELOAD_QUICKSTART.md](HOTRELOAD_QUICKSTART.md) - 热重载快速开始
- [SERVER_DEPLOYMENT_QUICKSTART.md](SERVER_DEPLOYMENT_QUICKSTART.md) - 服务器快速部署

### 完整指南
- [HOTRELOAD_GUIDE.md](HOTRELOAD_GUIDE.md) - 热重载完整指南
- [SERVER_DEPLOYMENT.md](SERVER_DEPLOYMENT.md) - 服务器部署完整指南
- [DOCKER_GUIDE.md](DOCKER_GUIDE.md) - Docker部署指南
- [DEV_GUIDE.md](DEV_GUIDE.md) - 开发环境指南

### 参考文档
- [DEPLOYMENT_STATUS.md](DEPLOYMENT_STATUS.md) - 部署状态报告
- [DIFY_NETWORK_GUIDE.md](DIFY_NETWORK_GUIDE.md) - Dify网络连接指南

---

## ❓ 常见问题

### Q: 我应该使用哪种部署方式？

**A**: 
- 本地开发 → 热重载开发环境
- 部署到Dify同一服务器 → 服务器生产环境
- 独立服务器部署 → 标准生产环境

### Q: 热重载环境支持哪些文件？

**A**: 
支持所有源代码文件：`app/`, `components/`, `lib/`, `store/`, `styles/` 等

### Q: 服务器部署为什么要用 host.docker.internal？

**A**: 
Docker容器内的 `localhost` 指向容器自己，使用 `host.docker.internal` 才能访问宿主机的Dify服务。

### Q: 如何查看日志？

**A**:
```bash
# 热重载环境
docker-compose -f docker-compose.hotreload.yml logs -f app

# 服务器环境
docker-compose -f docker-compose.server.yml logs -f app

# 标准环境
docker-compose logs -f app
```

---

**选择合适的部署方式，开始您的开发之旅！** 🚀
