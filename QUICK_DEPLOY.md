# 🚀 快速部署命令 - v1.2.2

## 📋 Git提交信息

**最新Commit**: `290da71`
**主要Commit**: `fed7b18` - 核心功能优化

**更新内容**:
- ✅ 修复三级标题编号重复bug
- ✅ 优化导航模式判断逻辑
- ✅ 增强API数据处理和验证
- ✅ 添加详细日志用于调试

---

## ⚡ 方法1: 自动化脚本（推荐）

```bash
# SSH登录服务器
ssh root@10.23.22.37

# 进入项目目录
cd /path/to/Documenton-NewVersionWebTextAIGenerator

# 运行自动化部署脚本
bash deploy.sh
```

脚本会自动执行：
1. 停止服务
2. 拉取代码
3. 安装依赖（可选）
4. 构建项目
5. 启动服务

---

## 📝 方法2: 手动部署（逐步执行）

```bash
# 1. SSH登录
ssh root@10.23.22.37

# 2. 进入项目目录
cd /path/to/Documenton-NewVersionWebTextAIGenerator

# 3. 停止服务
pm2 stop ai-document-generator

# 4. 拉取最新代码
git pull origin main

# 5. 确认版本
git log --oneline -1
# 应该显示: 290da71 或 fed7b18

# 6. 构建
npm run build

# 7. 启动
pm2 start npm --name "ai-document-generator" -- start
# 或重启
pm2 restart ai-document-generator

# 8. 保存PM2配置
pm2 save

# 9. 查看状态
pm2 status

# 10. 查看日志
pm2 logs ai-document-generator --lines 50
```

---

## 🔧 环境变量配置

### 单端口部署（推荐）

```bash
# .env.local
NEXT_PUBLIC_USE_CROSS_ORIGIN_MODE=false
```

### 多端口部署

```bash
# .env.local
NEXT_PUBLIC_USE_CROSS_ORIGIN_MODE=true
NEXT_PUBLIC_CHILD_WINDOW_ORIGIN=http://10.23.22.37:3001
NEXT_PUBLIC_PARENT_ORIGIN=http://10.23.22.37:3000

# 启动两个实例
PORT=3000 pm2 start npm --name "ai-doc-parent" -- start
PORT=3001 pm2 start npm --name "ai-doc-child" -- start
```

---

## ✅ 验证部署

```bash
# 1. 检查服务状态
pm2 status

# 2. 测试HTTP访问
curl http://localhost:3000
curl http://10.23.22.37:3000

# 3. 查看实时日志
pm2 logs ai-document-generator

# 4. 浏览器访问
# http://10.23.22.37:3000
```

---

## 🐛 常见问题

### 问题1: git pull失败

```bash
# 查看本地修改
git status

# 如果有冲突，备份本地修改
git stash

# 重新拉取
git pull origin main

# 恢复修改（如果需要）
git stash pop
```

### 问题2: 构建失败

```bash
# 清除缓存重新构建
rm -rf .next
npm run build
```

### 问题3: PM2服务无法启动

```bash
# 查看详细错误
pm2 logs ai-document-generator --err

# 删除旧实例重新创建
pm2 delete ai-document-generator
pm2 start npm --name "ai-document-generator" -- start
pm2 save
```

### 问题4: 端口被占用

```bash
# 查看端口占用
lsof -i:3000

# 杀掉占用进程
kill -9 <PID>
```

---

## 📊 部署检查清单

部署完成后，请验证以下功能：

- [ ] 服务正常启动（pm2 status显示online）
- [ ] 主页可以访问（http://10.23.22.37:3000）
- [ ] 可以生成大纲
- [ ] **编号显示正确**（4.2.1, 4.2.2, 4.2.3... 不重复）
- [ ] 导航跳转正常（不会跳转到错误地址）
- [ ] 控制台无错误日志
- [ ] 可以生成章节内容
- [ ] 可以导出DOCX文档

---

## 📚 详细文档

- [SERVER_DEPLOY_GUIDE.md](./SERVER_DEPLOY_GUIDE.md) - 完整部署指南
- [OUTLINE_PROCESSING_FIX.md](./OUTLINE_PROCESSING_FIX.md) - 大纲处理优化说明
- [DUAL_MODE_GUIDE.md](./DUAL_MODE_GUIDE.md) - 导航模式使用指南

---

**部署版本**: v1.2.2
**Git Commit**: 290da71
**更新时间**: 2026-02-28
