# 热重载开发环境指南

## 概述

热重载开发环境允许您在 Docker 容器中运行应用的同时，实时修改代码并自动看到效果，无需重新构建镜像。

## 特性

✅ **实时代码热重载** - 修改代码立即生效
✅ **自动浏览器刷新** - 代码变更时自动刷新页面
✅ **完整容器化** - 所有服务都在 Docker 中运行
✅ **开发工具支持** - 支持 TypeScript、ESLint 等开发工具
✅ **Redis 集成** - 完整的缓存功能支持

## 快速开始

### 1. 启动开发环境

```bash
./dev-start-hotreload.sh
```

或手动执行：

```bash
docker-compose -f docker-compose.hotreload.yml up -d
```

### 2. 访问应用

- **主应用**: http://localhost:3000
- **Redis Commander**: http://localhost:8081

### 3. 开始开发

直接编辑项目文件，保存后会自动：
1. TypeScript 重新编译
2. Next.js 热重载
3. 浏览器自动刷新

### 4. 停止开发环境

```bash
./dev-stop-hotreload.sh
```

或手动执行：

```bash
docker-compose -f docker-compose.hotreload.yml down
```

## 工作原理

### 代码挂载

以下目录通过 Docker volume 实时挂载到容器：

```
./app          → /app/app          (Next.js 路由和页面)
./components   → /app/components   (React 组件)
./lib          → /app/lib          (工具函数和库)
./store        → /app/store        (状态管理)
./public       → /app/public       (静态资源)
./styles       → /app/styles       (样式文件)
```

### 配置文件

```
./next.config.ts     → /app/next.config.ts
./tsconfig.json      → /app/tsconfig.json
./tailwind.config.ts → /app/tailwind.config.ts
```

### Node Modules

`node_modules` 和 `.next` 使用命名 volume，避免主机和容器之间的权限问题。

## 常用命令

### 查看日志

```bash
# 查看所有服务日志
docker-compose -f docker-compose.hotreload.yml logs -f

# 只查看应用日志
docker-compose -f docker-compose.hotreload.yml logs -f app

# 只查看 Redis 日志
docker-compose -f docker-compose.hotreload.yml logs -f redis
```

### 重启服务

```bash
# 重启应用服务
docker-compose -f docker-compose.hotreload.yml restart app

# 重启所有服务
docker-compose -f docker-compose.hotreload.yml restart
```

### 重新构建

如果修改了 `package.json` 或 `Dockerfile.dev`：

```bash
docker-compose -f docker-compose.hotreload.yml build --no-cache
docker-compose -f docker-compose.hotreload.yml up -d
```

### 进入容器调试

```bash
docker exec -it ai-document-generator-dev sh
```

### 清理环境

```bash
# 停止并删除容器、网络
docker-compose -f docker-compose.hotreload.yml down

# 同时删除 volumes（清除数据）
docker-compose -f docker-compose.hotreload.yml down -v
```

## 环境对比

| 功能 | 热重载开发环境 | 生产环境 |
|------|--------------|---------|
| 启动命令 | `./dev-start-hotreload.sh` | `docker-compose up -d` |
| 配置文件 | `docker-compose.hotreload.yml` | `docker-compose.yml` |
| 端口 | 3000 | 3001 |
| 代码修改 | ✅ 实时生效 | ❌ 需重新构建 |
| 构建时间 | 快（只安装依赖） | 慢（完整构建） |
| 性能 | 开发优化 | 生产优化 |
| 适用场景 | 本地开发调试 | 生产部署 |

## 环境切换

### 从生产切换到开发

```bash
# 停止生产环境
docker-compose down

# 启动开发环境
./dev-start-hotreload.sh
```

### 从开发切换到生产

```bash
# 停止开发环境
./dev-stop-hotreload.sh

# 启动生产环境
docker-compose up -d
```

## 故障排查

### 代码修改不生效

1. 检查文件是否在挂载的目录中：
   ```bash
   docker-compose -f docker-compose.hotreload.yml config | grep volumes -A 20
   ```

2. 检查容器日志是否显示重新编译：
   ```bash
   docker-compose -f docker-compose.hotreload.yml logs -f app
   ```

3. 强制重启应用：
   ```bash
   docker-compose -f docker-compose.hotreload.yml restart app
   ```

### 端口冲突

如果 3000 端口被占用：

1. 修改 `docker-compose.hotreload.yml` 中的端口映射：
   ```yaml
   ports:
     - "3002:3000"  # 改为其他端口
   ```

2. 重启服务：
   ```bash
   docker-compose -f docker-compose.hotreload.yml up -d
   ```

### Node Modules 不同步

如果添加了新的 npm 包：

```bash
# 重新构建镜像
docker-compose -f docker-compose.hotreload.yml build app

# 重启服务
docker-compose -f docker-compose.hotreload.yml up -d
```

### 性能问题

如果热重载很慢，可能是文件监听问题：

1. 环境变量已配置轮询模式：
   ```yaml
   environment:
     - WATCHPACK_POLLING=true
     - CHOKIDAR_USEPOLLING=true
   ```

2. 如果还是慢，可以调整轮询间隔（在 `next.config.ts`）：
   ```typescript
   watchOptions: {
     poll: 1000,  // 毫秒
     aggregateTimeout: 300
   }
   ```

## 最佳实践

### 1. 开发时使用热重载环境

日常开发使用热重载环境，享受快速的反馈循环。

### 2. 测试时使用生产环境

重要功能完成后，在生产环境中测试，确保构建和部署正常。

### 3. 定期清理

```bash
# 清理未使用的镜像和容器
docker system prune

# 清理开发环境数据
docker-compose -f docker-compose.hotreload.yml down -v
```

### 4. 环境变量管理

确保 `.env.local` 文件包含所有必要的配置：

```bash
NEXT_PUBLIC_DIFY_BASE_URL=http://your-server-ip/v1
NEXT_PUBLIC_DIFY_OUTLINE_KEY=app-YOUR_OUTLINE_KEY_HERE
NEXT_PUBLIC_DIFY_CHAPTER_KEY=app-YOUR_CHAPTER_KEY_HERE
NEXT_PUBLIC_DIFY_LLM_KEY=app-YOUR_LLM_KEY_HERE
REDIS_URL=redis://localhost:6379
CACHE_ENABLED=1
```

## 高级配置

### 自定义挂载目录

编辑 `docker-compose.hotreload.yml` 添加更多挂载：

```yaml
volumes:
  - ./custom-dir:/app/custom-dir
```

### 调试模式

启用 Node.js 调试：

```yaml
command: node --inspect=0.0.0.0:9229 node_modules/.bin/next dev
ports:
  - "3000:3000"
  - "9229:9229"  # 调试端口
```

然后在 VS Code 中配置 `.vscode/launch.json`：

```json
{
  "type": "node",
  "request": "attach",
  "name": "Docker: Attach to Node",
  "address": "localhost",
  "port": 9229,
  "restart": true
}
```

## 技术栈

- **Next.js 16.1.1** - React 框架，支持热模块替换 (HMR)
- **Node.js 20 Alpine** - 轻量级运行时
- **Redis 7** - 缓存服务
- **Docker Compose** - 容器编排
- **Volume Mounting** - 实时代码同步

## 相关文档

- [生产部署指南](DOCKER_GUIDE.md)
- [开发环境指南](DEV_GUIDE.md)
- [部署状态报告](DEPLOYMENT_STATUS.md)

---

**快乐开发！** 🚀
