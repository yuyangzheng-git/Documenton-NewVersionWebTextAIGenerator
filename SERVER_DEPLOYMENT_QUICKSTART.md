# 🚀 服务器部署 - 快速开始

> 部署到 Dify 所在的同一台服务器（10.23.22.37）

## 一键部署

```bash
./deploy-server.sh
```

就这么简单！✨

## 详细步骤

### 1️⃣ 上传到服务器

```bash
scp -r . user@10.23.22.37:/path/to/project
```

### 2️⃣ SSH登录

```bash
ssh user@10.23.22.37
cd /path/to/project
```

### 3️⃣ 运行部署

```bash
./deploy-server.sh
```

### 4️⃣ 访问应用

```
http://10.23.22.37:3001
```

## ⚙️ 关键配置

### Docker容器访问同主机Dify

```yaml
extra_hosts:
  - "host.docker.internal:host-gateway"
```

### Dify地址

```bash
NEXT_PUBLIC_DIFY_BASE_URL=http://host.docker.internal/v1
```

## ✅ 验证部署

### 检查服务

```bash
docker-compose -f docker-compose.server.yml ps
```

### 测试健康

```bash
curl http://localhost:3001/api/health
```

### 测试Dify连接

```bash
docker exec ai-document-generator wget -O- http://host.docker.internal/
```

## 📝 常用命令

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

## 🔧 故障排查

### Dify连接失败

```bash
# 进入容器测试
docker exec -it ai-document-generator sh
wget -O- http://host.docker.internal/
```

### 查看错误日志

```bash
docker-compose -f docker-compose.server.yml logs --tail=50 app
```

### 健康检查失败

```bash
# 查看健康状态
docker inspect ai-document-generator | grep -A 10 Health

# 手动测试健康端点
curl http://localhost:3001/api/health
```

## 🌐 网络架构

```
┌──────────────────────────────────────┐
│   服务器 (10.23.22.37)                │
│                                      │
│  ┌─────────┐     ┌──────────────┐   │
│  │  Dify   │     │ Docker容器    │   │
│  │  :80    │◄───►│ 应用 :3000   │   │
│  └─────────┘     │ Redis :6379  │   │
│                  └──────────────┘   │
│                                      │
│  通过 host.docker.internal 连接     │
└──────────────────────────────────────┘
```

## 📚 详细文档

查看 [SERVER_DEPLOYMENT.md](SERVER_DEPLOYMENT.md) 获取：
- 完整配置说明
- 详细故障排查
- 安全最佳实践
- 备份恢复方案

## 🎯 配置文件

| 文件 | 用途 |
|------|------|
| `docker-compose.server.yml` | 服务器部署配置 |
| `deploy-server.sh` | 自动部署脚本 |
| `.env.local` | 环境变量配置 |

## ✨ 成功标志

- ✅ 访问 http://10.23.22.37:3001 能看到应用
- ✅ 生成大纲功能正常工作
- ✅ 健康检查显示 healthy
- ✅ 日志无错误信息

---

**部署遇到问题？** 查看 [SERVER_DEPLOYMENT.md](SERVER_DEPLOYMENT.md) 完整指南
