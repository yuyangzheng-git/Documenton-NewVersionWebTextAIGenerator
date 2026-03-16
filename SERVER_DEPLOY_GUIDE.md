# 🚀 服务器部署指南 - v1.2.2

## 📋 本次更新内容

### 核心功能优化

1. **大纲编号处理优化**
   - 修复三级标题编号重复显示为 4.2.1 的bug
   - 改为智能提取策略：优先从title提取，备用从ID转换
   - 充分利用Dify返回的结构化数据

2. **导航模式优化**
   - 扩展本地模式判断，支持内网IP
   - 修复本地开发时自动跳转到服务器的问题
   - 添加详细的导航决策日志

3. **API和数据处理增强**
   - 优化Dify输出字段提取顺序
   - 增强数据验证和错误检测
   - 添加完整的处理流程日志

---

## 🔧 部署步骤

### 方案A: 在服务器上直接拉取更新（推荐）

```bash
# 1. SSH 登录服务器
ssh root@your-server-ip

# 2. 进入项目目录
cd /path/to/Documenton-NewVersionWebTextAIGenerator

# 3. 停止当前服务
pm2 stop ai-document-generator
# 或
pkill -f "next"

# 4. 拉取最新代码
git pull origin main

# 5. 检查环境变量配置
cat .env.local

# 确保以下配置正确：
# NEXT_PUBLIC_USE_CROSS_ORIGIN_MODE=false  (单端口部署)
# 或
# NEXT_PUBLIC_USE_CROSS_ORIGIN_MODE=true   (多端口部署)
# NEXT_PUBLIC_CHILD_WINDOW_ORIGIN=http://your-server-ip:3001
# NEXT_PUBLIC_PARENT_ORIGIN=http://your-server-ip:3000

# 6. 安装依赖（如果有新依赖）
npm install

# 7. 构建生产版本
npm run build

# 8. 启动服务
npm start
# 或使用 PM2
pm2 start npm --name "ai-document-generator" -- start
pm2 save

# 9. 检查服务状态
pm2 status
# 或
curl http://localhost:3000

# 10. 查看日志
pm2 logs ai-document-generator
# 或
tail -f ~/.pm2/logs/ai-document-generator-out.log
```

---

### 方案B: 重新部署（完整流程）

```bash
# 1. SSH 登录服务器
ssh root@your-server-ip

# 2. 停止并删除旧服务
pm2 delete ai-document-generator
rm -rf /path/to/Documenton-NewVersionWebTextAIGenerator

# 3. 克隆最新代码
cd /path/to/projects
git clone https://github.com/yuyangzheng-git/Documenton-NewVersionWebTextAIGenerator.git
cd Documenton-NewVersionWebTextAIGenerator

# 4. 创建环境变量文件
cat > .env.local <<EOF
NEXT_PUBLIC_DIFY_BASE_URL=http://your-server-ip/v1
NEXT_PUBLIC_DIFY_OUTLINE_KEY=app-YOUR_OUTLINE_KEY_HERE
NEXT_PUBLIC_DIFY_CHAPTER_KEY=app-YOUR_CHAPTER_KEY_HERE
NEXT_PUBLIC_DIFY_LLM_KEY=app-YOUR_LLM_KEY_HERE

# Redis Configuration
REDIS_URL=redis://localhost:6379
CACHE_ENABLED=1

# Python Configuration
PYTHON_PATH=

# Cross-Origin Configuration (单端口部署使用false)
NEXT_PUBLIC_USE_CROSS_ORIGIN_MODE=false
EOF

# 5. 安装依赖
npm install

# 6. 构建
npm run build

# 7. 启动
pm2 start npm --name "ai-document-generator" -- start
pm2 save
```

---

## 🎯 部署配置选择

### 配置1: 单端口部署（推荐新手）

适用于一个Next.js实例运行在单一端口。

```bash
# .env.local
NEXT_PUBLIC_USE_CROSS_ORIGIN_MODE=false
```

**访问方式**:
- 主页: http://your-server-ip:3000
- 编辑器: http://your-server-ip:3000/word-editor
- 导航方式: 同域跳转（router.push）

---

### 配置2: 多端口部署（高级用户）

适用于两个独立的Next.js实例分别运行。

```bash
# .env.local
NEXT_PUBLIC_USE_CROSS_ORIGIN_MODE=true
NEXT_PUBLIC_CHILD_WINDOW_ORIGIN=http://your-server-ip:3001
NEXT_PUBLIC_PARENT_ORIGIN=http://your-server-ip:3000
```

**启动方式**:
```bash
# 终端1: 父页面 (3000端口)
PORT=3000 pm2 start npm --name "ai-doc-parent" -- start

# 终端2: 子页面 (3001端口)
PORT=3001 pm2 start npm --name "ai-doc-child" -- start

pm2 save
```

**访问方式**:
- 主页: http://your-server-ip:3000
- 编辑器窗口: http://your-server-ip:3001/word-editor（自动打开新窗口）
- 导航方式: 跨窗口通信（window.open + postMessage）

---

## ✅ 部署验证

### 1. 检查服务状态

```bash
# PM2状态
pm2 status

# 应该看到类似输出：
# ┌─────┬──────────────────┬─────────┬─────────┬──────────┐
# │ id  │ name             │ mode    │ status  │ cpu      │
# ├─────┼──────────────────┼─────────┼─────────┼──────────┤
# │ 0   │ ai-document-ge…  │ fork    │ online  │ 0%       │
# └─────┴──────────────────┴─────────┴─────────┴──────────┘
```

### 2. 测试主页访问

```bash
curl http://your-server-ip:3000
# 应该返回HTML内容
```

### 3. 测试大纲生成（核心功能）

1. 浏览器打开 `http://your-server-ip:3000`
2. 输入主题并生成大纲
3. **检查控制台日志**（F12 → Console）:
   ```
   [Dify Outline] Successfully parsed X items
   [generateOutline] No duplicates found
   [generateOutline] Final outline with X valid items
   ```
4. **验证编号显示**:
   ```
   4.2    详细功能介绍
     4.2.1  AI XDR 联动防御系统      ✅ 正确
     4.2.2  TrustOne 新一代终端安全   ✅ 正确
     4.2.3  DeepSecurity 云主机安全  ✅ 正确
   ```

### 4. 测试导航功能

1. 点击"生成大纲"
2. **单端口模式**: 应该在当前窗口跳转到编辑器页面
3. **多端口模式**: 应该打开新窗口显示编辑器
4. **检查控制台日志**:
   ```
   [handleGenerate] Navigation Decision: {
     hostname: "your-server-ip",
     isLocalhost: true,
     willUseLocalMode: true
   }
   ```

---

## 🐛 故障排查

### 问题1: 服务启动失败

```bash
# 查看详细错误日志
pm2 logs ai-document-generator --lines 100

# 常见原因：
# 1. 端口被占用
lsof -i:3000
# 解决：kill掉占用进程或换端口

# 2. 环境变量缺失
cat .env.local
# 解决：补充缺失的环境变量

# 3. 依赖未安装
npm install
```

---

### 问题2: 大纲编号仍然重复

```bash
# 1. 确认代码版本
cd /path/to/project
git log --oneline -1
# 应该看到: fed7b18 feat: 优化大纲编号处理和导航逻辑

# 2. 清除浏览器缓存
# Chrome: Ctrl+Shift+Delete → 清除缓存

# 3. 检查构建产物
ls -la .next/
rm -rf .next
npm run build

# 4. 重启服务
pm2 restart ai-document-generator
```

---

### 问题3: 本地测试时跳转到服务器

这是本地开发环境的问题，服务器不受影响。

服务器上的逻辑：
```typescript
// hostname: "your-server-ip"
// isLocalhost: true (因为10.x.x.x被识别为内网)
// 如果 USE_CROSS_ORIGIN_MODE=false
// → 使用 router.push（同域跳转）
```

---

### 问题4: Dify API调用失败

```bash
# 检查Dify服务状态
curl http://your-server-ip/v1/info

# 检查API Key配置
cat .env.local | grep DIFY

# 查看服务器日志
pm2 logs ai-document-generator | grep "Dify"
```

---

## 📊 本次更新的关键日志

部署后，正常运行时应该看到以下日志：

```bash
# 大纲生成成功
[Dify Outline] Found field 'outline': [{"id":"1",...
[Dify Outline] Successfully parsed 15 items
  [0] id=1, level=1, title="第一章：项目背景"
  [1] id=2, level=1, title="第二章：需求痛点"
  ...
[generateOutline] Received 15 items from API
[generateOutline] No duplicates found
[generateOutline] Final outline with 15 valid items

# 导航决策
[handleGenerate] Navigation Decision: {
  hostname: "your-server-ip",
  isLocalhost: true,
  useCrossOrigin: false,
  willUseLocalMode: true
}
[handleGenerate] ✅ Local mode: Using router.push...
```

---

## 📚 相关文档

- [OUTLINE_PROCESSING_FIX.md](./OUTLINE_PROCESSING_FIX.md) - 大纲处理优化详细说明
- [DUAL_MODE_GUIDE.md](./DUAL_MODE_GUIDE.md) - 双模式导航使用指南
- [README.md](./README.md) - 项目总览

---

## 🎓 重要提醒

### 环境变量配置

**单端口部署（推荐）**:
```bash
NEXT_PUBLIC_USE_CROSS_ORIGIN_MODE=false
```

**多端口部署**:
```bash
NEXT_PUBLIC_USE_CROSS_ORIGIN_MODE=true
NEXT_PUBLIC_CHILD_WINDOW_ORIGIN=http://your-server-ip:3001
NEXT_PUBLIC_PARENT_ORIGIN=http://your-server-ip:3000
```

### Git版本确认

确保拉取到最新的commit:
```bash
git log --oneline -1
# 应该显示: fed7b18 feat: 优化大纲编号处理和导航逻辑
```

---

**部署时间**: 2026-02-28
**目标版本**: v1.2.2
**Git Commit**: fed7b18

如有问题，请查看日志或联系开发者。
