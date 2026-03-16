# 🔄 双模式支持说明

## 概述

本应用现在支持两种导航模式，可以根据部署环境自动切换：

1. **本地开发模式** - 同端口内跳转（使用 `router.push`）
2. **跨域生产模式** - 跨端口通信（使用 `window.open` + `postMessage`）

---

## 📋 模式对比

| 特性 | 本地开发模式 | 跨域生产模式 |
|-----|------------|------------|
| **触发条件** | `localhost` 或 `127.0.0.1` | 其他域名/IP |
| **导航方式** | `router.push('/word-editor')` | `window.open(targetUrl)` |
| **数据传递** | Zustand Store (同端口共享) | postMessage (跨窗口) |
| **窗口行为** | 当前窗口跳转 | 打开新窗口 |
| **加载界面** | ❌ 不显示 | ✅ 显示"正在同步数据..." |
| **适用场景** | 本地开发调试 | 服务器多端口部署 |

---

## 🚀 使用方法

### 1. 本地开发（默认）

无需任何配置，直接运行：

```bash
npm run dev
# 访问 http://localhost:3000
```

**行为**：
- 点击"生成大纲"后，**当前窗口跳转**到 `/word-editor`
- 数据通过 Zustand Store 共享（同一个 Next.js 应用）
- 不会打开新窗口
- 不会显示"正在同步数据..."加载界面

**控制台日志**：
```
[handleGenerate] Local mode: Using router.push for same-origin navigation
[WordEditor] Local mode: Skipping message listener
```

---

### 2. 跨域生产模式

#### 方式A: 自动检测（推荐）

部署到生产服务器（非 localhost），自动启用跨域模式：

```bash
# 在服务器上
npm run build
npm start
# 访问 http://your-server-ip:3001
```

#### 方式B: 强制启用（在 localhost 测试跨域）

如果你想在 localhost 上测试跨域功能，修改 `.env.local`：

```bash
# .env.local
NEXT_PUBLIC_USE_CROSS_ORIGIN_MODE=true
NEXT_PUBLIC_CHILD_WINDOW_ORIGIN=http://localhost:3001
NEXT_PUBLIC_PARENT_ORIGIN=http://localhost:3000
```

然后启动**两个端口**的服务：

```bash
# 终端1: 父页面 (3000端口)
PORT=3000 npm run dev

# 终端2: 子页面 (3001端口)
PORT=3001 npm run dev
```

**行为**：
- 点击"生成大纲"后，**打开新窗口**（3001端口）
- 通过 `postMessage` 传递数据
- 显示"正在同步数据..."加载界面
- 子窗口接收数据后渲染编辑器

**控制台日志**：
```
// 父窗口 (3000)
[handleGenerate] Cross-origin mode: Opening child window...
[Parent] Data sent to child window via postMessage

// 子窗口 (3001)
[WordEditor] Sent CHILD_READY message to parent
[WordEditor] Received message: {...}
[WordEditor] Outline updated in store
```

---

## ⚙️ 配置选项

### 环境变量

在 `.env.local` 或 `.env` 中配置：

```bash
# 强制启用跨域模式（可选，默认自动检测）
NEXT_PUBLIC_USE_CROSS_ORIGIN_MODE=false

# 子窗口地址（跨域模式需要）
NEXT_PUBLIC_CHILD_WINDOW_ORIGIN=http://your-server-ip:3001

# 父窗口地址（跨域模式需要，用于安全校验）
NEXT_PUBLIC_PARENT_ORIGIN=http://your-server-ip:3000
```

### 自动检测逻辑

代码会自动判断当前环境：

```typescript
// app/page.tsx
const isLocalhost = window.location.hostname === 'localhost' ||
                    window.location.hostname === '127.0.0.1';
const useCrossOrigin = process.env.NEXT_PUBLIC_USE_CROSS_ORIGIN_MODE === 'true';

if (isLocalhost && !useCrossOrigin) {
  // 本地模式：router.push
  router.push('/word-editor');
} else {
  // 跨域模式：window.open + postMessage
  const childWindow = window.open(targetUrl, '_blank');
  childWindow.postMessage(data, targetOrigin);
}
```

---

## 🎯 部署场景

### 场景1: 单端口部署（推荐新手）

```bash
# 一个 Next.js 实例，单一端口
npm run build
npm start
# 访问 http://your-domain.com:3000
```

**配置**：
```bash
# .env
NEXT_PUBLIC_USE_CROSS_ORIGIN_MODE=false
```

**效果**：同域跳转，无需 postMessage

---

### 场景2: 多端口部署（高级用户）

```bash
# 启动两个独立的 Next.js 实例
PORT=3000 npm start  # 父页面
PORT=3001 npm start  # 子页面（编辑器）
```

**配置**：
```bash
# .env
NEXT_PUBLIC_USE_CROSS_ORIGIN_MODE=true
NEXT_PUBLIC_CHILD_WINDOW_ORIGIN=http://your-server-ip:3001
NEXT_PUBLIC_PARENT_ORIGIN=http://your-server-ip:3000
```

**效果**：跨窗口通信，数据通过 postMessage 传递

---

### 场景3: Docker 多容器部署

```yaml
# docker-compose.yml
services:
  app-parent:
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_USE_CROSS_ORIGIN_MODE=true
      - NEXT_PUBLIC_CHILD_WINDOW_ORIGIN=http://your-server-ip:3001

  app-child:
    ports:
      - "3001:3000"
    environment:
      - NEXT_PUBLIC_PARENT_ORIGIN=http://your-server-ip:3000
```

---

## 🐛 故障排查

### 问题1: 本地开发时打开了新窗口

**原因**：环境变量配置了 `USE_CROSS_ORIGIN_MODE=true`

**解决**：
```bash
# .env.local
NEXT_PUBLIC_USE_CROSS_ORIGIN_MODE=false
```

或者删除该配置，让代码自动检测。

---

### 问题2: 生产环境跳转到同一窗口

**原因**：服务器域名被识别为 localhost

**解决**：强制启用跨域模式
```bash
# .env
NEXT_PUBLIC_USE_CROSS_ORIGIN_MODE=true
```

---

### 问题3: 跨域模式下子窗口收不到数据

**检查**：
1. 确认两个端口的服务都在运行
2. 检查 origin 配置是否正确
3. 查看浏览器控制台是否有 CORS 错误

**解决**：
```bash
# 确保配置匹配
NEXT_PUBLIC_CHILD_WINDOW_ORIGIN=http://your-server-ip:3001
NEXT_PUBLIC_PARENT_ORIGIN=http://your-server-ip:3000
```

---

### 问题4: 显示"正在同步数据..."但一直不消失

**原因**：子窗口没收到 postMessage

**检查**：
```javascript
// 浏览器控制台
// 子窗口应该有日志
[WordEditor] Received message: {...}
[WordEditor] Outline updated in store
```

**解决**：
1. 检查父窗口是否发送了数据
2. 确认 origin 校验是否通过
3. 查看 3秒超时后是否使用了本地 store

---

## 📊 工作流程图

### 本地开发模式

```
用户输入 → 生成大纲 → Store保存
    ↓
router.push('/word-editor')
    ↓
/word-editor 页面 → 从 Store 读取 outline
    ↓
渲染编辑器 ✅
```

### 跨域生产模式

```
用户输入 → 生成大纲 → Store保存
    ↓
window.open('http://your-server-ip:3001/word-editor')
    ↓
新窗口加载 → 显示"正在同步..."
    ↓
发送 CHILD_READY → 父窗口收到
    ↓
父窗口 postMessage → 子窗口接收
    ↓
更新 Store → 生成 Blocks
    ↓
渲染编辑器 ✅
```

---

## 🎓 开发建议

### 推荐做法

1. **本地开发**：使用默认配置，自动检测为本地模式
2. **测试跨域**：设置 `USE_CROSS_ORIGIN_MODE=true` 并启动双端口
3. **生产部署**：根据实际部署架构选择单端口或多端口

### 不推荐做法

- ❌ 在 localhost 上不设置环境变量就启动多个端口
- ❌ 在生产环境使用 `localhost` 域名
- ❌ 混合使用两种模式（可能导致数据同步问题）

---

## 📚 相关文档

- [POSTMESSAGE_INTEGRATION.md](./POSTMESSAGE_INTEGRATION.md) - postMessage 详细实现
- [DEPLOY_TO_SERVER.md](./DEPLOY_TO_SERVER.md) - 服务器部署指南
- [README.md](./README.md) - 项目总览

---

**更新时间**: 2026-02-28
**版本**: v1.2.0
