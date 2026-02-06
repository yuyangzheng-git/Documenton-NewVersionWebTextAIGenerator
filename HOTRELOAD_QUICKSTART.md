# 🔥 热重载开发环境 - 快速开始

## ✅ 已成功配置！

热重载开发环境已经为您配置完成，现在您可以：

### 🚀 立即开始使用

1. **启动开发环境**
   ```bash
   ./dev-start-hotreload.sh
   ```
   或
   ```bash
   docker-compose -f docker-compose.hotreload.yml up -d
   ```

2. **访问应用**
   - 主应用: http://localhost:3000
   - Redis管理: http://localhost:8081

3. **编辑代码**
   - 直接修改任何源文件
   - 保存后自动生效，无需手动刷新
   - 浏览器会自动重载

4. **停止环境**
   ```bash
   ./dev-stop-hotreload.sh
   ```

## 📂 支持热重载的目录

修改以下目录的文件会自动触发重新编译：

```
✅ app/          - Next.js 页面和路由
✅ components/   - React 组件
✅ lib/          - 工具函数
✅ store/        - 状态管理
✅ public/       - 静态资源
✅ styles/       - 样式文件
✅ types/        - TypeScript 类型定义
```

## 🆚 环境对比

| 特性 | 热重载开发环境 | 生产环境 |
|------|--------------|---------|
| 端口 | **3000** | **3001** |
| 启动 | `./dev-start-hotreload.sh` | `docker-compose up -d` |
| 代码修改 | ✅ **实时生效** | ❌ 需重新构建 |
| 构建时间 | ⚡ **1-2分钟** | 🐌 3-5分钟 |
| 用途 | 💻 **日常开发** | 🚀 部署测试 |

## 💡 使用提示

### 查看日志
```bash
docker-compose -f docker-compose.hotreload.yml logs -f app
```

### 重启服务
```bash
docker-compose -f docker-compose.hotreload.yml restart app
```

### 环境切换
```bash
# 开发 → 生产
./dev-stop-hotreload.sh
docker-compose up -d

# 生产 → 开发
docker-compose down
./dev-start-hotreload.sh
```

## ⚙️ 配置文件

- `docker-compose.hotreload.yml` - Docker Compose 配置
- `Dockerfile.dev` - 开发环境 Dockerfile
- `.env.local` - 环境变量配置

## 📚 详细文档

查看 [HOTRELOAD_GUIDE.md](HOTRELOAD_GUIDE.md) 获取完整的使用指南和故障排查。

## 🎉 现在就开始吧！

```bash
# 1️⃣ 启动开发环境
./dev-start-hotreload.sh

# 2️⃣ 打开浏览器
open http://localhost:3000

# 3️⃣ 编辑代码，保存即生效！
```

---

**享受丝滑的开发体验！** 🚀
