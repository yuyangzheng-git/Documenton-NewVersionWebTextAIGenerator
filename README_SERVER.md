# 📦 服务器部署指南总览

> 专为部署到 **Dify 所在的同一台服务器** 设计

## ✅ 已完成配置

您的项目已经完全配置好，可以部署到服务器（10.23.22.37）上了！

### 🎯 关键特性

✅ **Docker容器可访问同主机Dify** - 使用 `host.docker.internal`  
✅ **一键部署脚本** - 自动化部署流程  
✅ **完整文档** - 从快速开始到故障排查  
✅ **网络测试通过** - 已验证容器可访问Dify  

---

## 🚀 快速部署（3步完成）

### 1. 上传项目到服务器

```bash
scp -r . user@10.23.22.37:/path/to/project
```

### 2. SSH登录并进入目录

```bash
ssh user@10.23.22.37
cd /path/to/project
```

### 3. 运行一键部署

```bash
./deploy-server.sh
```

完成！访问 `http://10.23.22.37:3001` 🎉

---

## 📋 部署清单

### ✅ 已创建的文件

```
服务器部署配置
├── docker-compose.server.yml          # Docker Compose配置
├── deploy-server.sh                   # 一键部署脚本
├── SERVER_DEPLOYMENT.md               # 完整部署指南
├── SERVER_DEPLOYMENT_QUICKSTART.md    # 快速开始指南
├── DEPLOYMENT_OPTIONS.md              # 部署方式对比
└── DIFY_NETWORK_GUIDE.md             # 网络配置详解
```

### ✅ 核心配置

**docker-compose.server.yml**:
```yaml
services:
  app:
    build:
      args:
        NEXT_PUBLIC_DIFY_BASE_URL: http://host.docker.internal/v1
    extra_hosts:
      - "host.docker.internal:host-gateway"  # 关键！
```

**.env.local**:
```bash
NEXT_PUBLIC_DIFY_BASE_URL=http://host.docker.internal/v1
NEXT_PUBLIC_DIFY_OUTLINE_KEY=app-yIhd9xD2SHZ6e9BNTYSWEfYD
NEXT_PUBLIC_DIFY_CHAPTER_KEY=app-wqO8BTPC99CwAGFDabEze6Uz
NEXT_PUBLIC_DIFY_LLM_KEY=app-ThlXmch2AjSRdv6kuvacb4bM
```

---

## 🔧 为什么这样配置？

### 问题：Docker容器访问同主机服务

在Linux服务器上，Docker容器内的 `localhost` 或 `127.0.0.1` 指向容器自己，不是宿主机。

### 解决方案：使用 host.docker.internal

```yaml
extra_hosts:
  - "host.docker.internal:host-gateway"
```

这个配置让容器可以通过 `host.docker.internal` 访问宿主机上的服务（Dify）。

### 网络架构

```
┌─────────────────────────────────────────┐
│     服务器 (10.23.22.37)                 │
│                                         │
│  ┌──────────┐      ┌─────────────────┐ │
│  │  Dify    │      │ Docker容器       │ │
│  │  :80     │◄────►│ 文档生成应用     │ │
│  └──────────┘      │ :3000           │ │
│                    └─────────────────┘ │
│                                         │
│  通过 host.docker.internal 连接         │
└─────────────────────────────────────────┘
```

---

## 📚 文档导航

### 🚀 快速开始
- **[SERVER_DEPLOYMENT_QUICKSTART.md](SERVER_DEPLOYMENT_QUICKSTART.md)** ⭐ 从这里开始

### 📖 完整指南
- **[SERVER_DEPLOYMENT.md](SERVER_DEPLOYMENT.md)** - 完整部署指南
  - 部署前检查清单
  - 详细故障排查
  - 安全最佳实践
  - 备份恢复方案

### 🔍 参考文档
- **[DIFY_NETWORK_GUIDE.md](DIFY_NETWORK_GUIDE.md)** - 网络连接详解
- **[DEPLOYMENT_OPTIONS.md](DEPLOYMENT_OPTIONS.md)** - 所有部署方式对比

---

## ✅ 部署验证

部署完成后，按以下步骤验证：

### 1. 检查服务状态

```bash
docker-compose -f docker-compose.server.yml ps
```

期望看到所有服务都是 `Up (healthy)`

### 2. 测试健康检查

```bash
curl http://localhost:3001/api/health
```

期望返回:
```json
{"status":"healthy","timestamp":"...","version":"1.0.0"}
```

### 3. 测试Dify连接

```bash
docker exec ai-document-generator wget -O- http://host.docker.internal/
```

期望返回Dify的HTML页面

### 4. 测试应用功能

1. 浏览器访问: `http://10.23.22.37:3001`
2. 输入文档主题
3. 点击"生成大纲"
4. 验证成功生成

---

## 🛠️ 常用管理命令

```bash
# 查看日志
docker-compose -f docker-compose.server.yml logs -f app

# 重启服务
docker-compose -f docker-compose.server.yml restart app

# 停止服务
docker-compose -f docker-compose.server.yml down

# 更新应用
docker-compose -f docker-compose.server.yml build app
docker-compose -f docker-compose.server.yml up -d
```

---

## 🔍 故障排查快速参考

### 容器无法访问Dify

```bash
# 进入容器测试
docker exec -it ai-document-generator sh
ping host.docker.internal
wget -O- http://host.docker.internal/
```

### 查看错误日志

```bash
docker-compose -f docker-compose.server.yml logs --tail=50 app
```

### 检查Dify服务

```bash
# 在服务器上
curl http://localhost/
netstat -tlnp | grep :80
```

---

## 💡 最佳实践

### 1. 使用反向代理

推荐使用Nginx：

```nginx
server {
    listen 80;
    server_name doc.yourdomain.com;
    
    location / {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### 2. 定期备份

```bash
# 备份Redis数据和应用数据
tar -czf backup-$(date +%Y%m%d).tar.gz ./store
docker cp ai-doc-redis:/data ./backup/redis-$(date +%Y%m%d)
```

### 3. 监控日志

```bash
# 持续监控
docker-compose -f docker-compose.server.yml logs -f app | grep -i error
```

---

## 🆘 需要帮助？

1. 查看 [SERVER_DEPLOYMENT.md](SERVER_DEPLOYMENT.md) 完整指南
2. 查看 [DIFY_NETWORK_GUIDE.md](DIFY_NETWORK_GUIDE.md) 网络配置
3. 检查应用日志
4. 验证Dify服务状态

---

## 🎯 总结

**您的项目已经完全配置好，可以部署了！**

✅ 网络配置正确 - 已测试容器可访问Dify  
✅ 一键部署脚本 - `./deploy-server.sh`  
✅ 完整文档支持 - 从快速开始到故障排查  
✅ 生产级优化 - 健康检查、自动重启等  

**现在就开始部署吧！** 🚀

```bash
# 1. 上传到服务器
scp -r . user@10.23.22.37:/path/to/project

# 2. SSH登录
ssh user@10.23.22.37
cd /path/to/project

# 3. 一键部署
./deploy-server.sh
```

---

**祝您部署顺利！** 🎉
