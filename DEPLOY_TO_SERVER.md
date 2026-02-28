# 🚀 服务器部署指南

## 本次更新内容

✅ **跨窗口 postMessage 数据传递功能**
- 父页面(3000端口)通过 postMessage 向子窗口(3001端口)传递大纲数据
- 子窗口监听 message 事件并接收数据
- 实现握手机制(CHILD_READY)确保数据发送时机
- 添加初始化加载状态 UI
- 修复 outline 依赖问题

---

## 📋 服务器部署步骤

### 1️⃣ SSH 登录到服务器

```bash
ssh user@10.23.22.37
# 或者使用你的 SSH 配置
ssh your-server-alias
```

---

### 2️⃣ 进入项目目录

```bash
cd /path/to/Documenton-NewVersionWebTextAIGenerator
# 例如：cd ~/projects/Documenton-NewVersionWebTextAIGenerator
```

---

### 3️⃣ 拉取最新代码

```bash
# 查看当前分支
git branch

# 拉取最新代码
git pull origin main
```

**预期输出**：
```
remote: Enumerating objects: 10, done.
remote: Counting objects: 100% (10/10), done.
remote: Compressing objects: 100% (6/6), done.
remote: Total 6 (delta 4), reused 0 (delta 0), pack-reused 0
Unpacking objects: 100% (6/6), done.
From https://github.com/yuyangzheng-git/Documenton-NewVersionWebTextAIGenerator
   371d9fc..e52757e  main       -> origin/main
Updating 371d9fc..e52757e
Fast-forward
 POSTMESSAGE_INTEGRATION.md |  541 ++++++++++++++++++++++++++++++++++++++++
 app/page.tsx               |   41 +++-
 app/word-editor/page.tsx   |  112 +++++++--
 3 files changed, 672 insertions(+), 22 deletions(-)
 create mode 100644 POSTMESSAGE_INTEGRATION.md
```

---

### 4️⃣ 检查环境变量

```bash
# 查看 .env 文件
cat .env

# 确保以下配置正确
# NEXT_PUBLIC_DIFY_BASE_URL=http://10.23.22.37/v1
# NEXT_PUBLIC_DIFY_OUTLINE_KEY=app-yIhd9xD2SHZ6e9BNTYSWEfYD
# NEXT_PUBLIC_DIFY_CHAPTER_KEY=app-wqO8BTPC99CwAGFDabEze6Uz
```

---

### 5️⃣ 重启服务

根据你的部署方式选择相应的重启命令：

#### 方式A: Docker Compose（推荐）

```bash
# 查看当前运行的服务
docker-compose -f docker-compose.server.yml ps

# 重新构建并启动
docker-compose -f docker-compose.server.yml up -d --build

# 或者只重启应用服务
docker-compose -f docker-compose.server.yml restart app
```

#### 方式B: PM2

```bash
# 查看运行的进程
pm2 list

# 重启应用
pm2 restart ai-document-generator

# 或者重新加载
pm2 reload ai-document-generator
```

#### 方式C: 直接运行

```bash
# 停止当前进程（Ctrl+C 或 kill）
# 然后重新启动
npm run build
npm start
```

---

### 6️⃣ 验证部署

```bash
# 1. 检查服务状态
docker-compose -f docker-compose.server.yml ps

# 2. 查看日志
docker-compose -f docker-compose.server.yml logs -f app

# 3. 测试健康端点
curl http://localhost:3001/api/health

# 4. 测试主页
curl http://localhost:3001/
```

**预期日志**：
```
ai-document-generator  | ▲ Next.js 16.1.1 (Turbopack)
ai-document-generator  | - Local:         http://localhost:3000
ai-document-generator  | - Network:       http://172.20.0.4:3000
ai-document-generator  |
ai-document-generator  | ✓ Starting...
ai-document-generator  | ✓ Ready in 353ms
```

---

### 7️⃣ 浏览器测试

1. 打开浏览器访问：
   ```
   http://10.23.22.37:3001/
   ```

2. 输入主题并生成大纲

3. 观察是否打开新窗口

4. 检查新窗口是否正确显示编辑器

5. 查看浏览器控制台日志：
   ```javascript
   // 父窗口 (3000端口)
   [handleGenerate] Opening child window and sending data via postMessage...
   [Parent] Data sent to child window via postMessage

   // 子窗口 (3001端口)
   [WordEditor] Sent CHILD_READY message to parent
   [WordEditor] Received message: {...}
   [WordEditor] Outline updated in store
   从同步的大纲生成 blocks，outline count: 5
   ```

---

## 🐛 故障排查

### 问题1: 代码拉取失败

```bash
# 查看冲突文件
git status

# 放弃本地修改
git reset --hard origin/main

# 重新拉取
git pull origin main
```

### 问题2: Docker 构建失败

```bash
# 清理 Docker 缓存
docker system prune -a

# 重新构建
docker-compose -f docker-compose.server.yml build --no-cache app
docker-compose -f docker-compose.server.yml up -d
```

### 问题3: 端口被占用

```bash
# 检查端口占用
sudo netstat -tlnp | grep -E "3001|6379"

# 停止占用端口的进程
sudo kill -9 <PID>

# 或者修改端口配置
vim docker-compose.server.yml
# 修改 ports: "3002:3000"
```

### 问题4: 环境变量未生效

```bash
# 检查环境变量
docker exec ai-document-generator env | grep DIFY

# 重新构建（确保环境变量嵌入）
docker-compose -f docker-compose.server.yml build --no-cache app
docker-compose -f docker-compose.server.yml up -d
```

### 问题5: postMessage 不工作

```bash
# 检查跨域设置
# 确保父页面和子页面的域名/端口配置正确

# 查看浏览器控制台是否有 origin 警告
# 可能需要修改代码中的 origin 校验
```

---

## 📊 监控和日志

### 实时查看日志

```bash
# 查看所有服务日志
docker-compose -f docker-compose.server.yml logs -f

# 只看应用日志
docker-compose -f docker-compose.server.yml logs -f app

# 查看最近100行
docker-compose -f docker-compose.server.yml logs --tail=100 app

# 查看错误日志
docker-compose -f docker-compose.server.yml logs app | grep -i error
```

### 检查资源使用

```bash
# 查看 Docker 容器资源使用
docker stats ai-document-generator

# 查看磁盘使用
df -h

# 查看内存使用
free -h
```

---

## 🔄 回滚操作

如果新版本有问题，可以回滚到上一个版本：

```bash
# 1. 查看提交历史
git log --oneline -5

# 2. 回滚到上一个提交
git reset --hard 371d9fc

# 3. 强制推送（谨慎使用）
# git push origin main --force

# 4. 重启服务
docker-compose -f docker-compose.server.yml up -d --build
```

---

## 📝 部署检查清单

部署完成后，请确认以下项目：

- [ ] 代码已成功拉取到服务器
- [ ] 服务已重启并正常运行
- [ ] 健康检查端点返回正常
- [ ] 主页可以正常访问
- [ ] 生成大纲功能正常
- [ ] 新窗口正常打开
- [ ] postMessage 数据传递正常
- [ ] 编辑器正常渲染
- [ ] 控制台无错误日志
- [ ] 生成内容功能正常
- [ ] 导出文档功能正常

---

## 🆘 需要帮助？

如果遇到问题，请提供以下信息：

1. **错误日志**
   ```bash
   docker-compose -f docker-compose.server.yml logs --tail=50 app
   ```

2. **服务状态**
   ```bash
   docker-compose -f docker-compose.server.yml ps
   ```

3. **浏览器控制台日志**
   - 父窗口的控制台输出
   - 子窗口的控制台输出

4. **具体错误描述**
   - 什么操作导致的错误
   - 错误发生的时间
   - 是否可以复现

---

**部署时间**: 2026-02-28
**版本**: v1.1.0 (postMessage 跨窗口通信)
**维护者**: Documenton Team
