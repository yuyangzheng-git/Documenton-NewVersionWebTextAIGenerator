# 服务器部署指南

## 概述

本指南用于将文档生成应用部署到**Dify所在的同一台服务器**（your-server-ip）。

## ✅ 关键配置

### Docker容器访问同主机Dify的方案

在Linux服务器上，Docker容器访问宿主机服务需要特殊配置：

```yaml
# docker-compose.server.yml
services:
  app:
    extra_hosts:
      - "host.docker.internal:host-gateway"  # 关键配置！
```

### Dify地址配置

```bash
# 使用 host.docker.internal 而不是 localhost 或 127.0.0.1
NEXT_PUBLIC_DIFY_BASE_URL=http://host.docker.internal/v1
```

**为什么这样配置？**

| 地址 | 是否可行 | 说明 |
|------|---------|------|
| `http://localhost/v1` | ❌ 不可行 | 容器内的localhost指向容器自己 |
| `http://127.0.0.1/v1` | ❌ 不可行 | 同上，指向容器自己 |
| `http://your-server-ip/v1` | ✅ 可行 | 但需要Dify监听在0.0.0.0 |
| `http://host.docker.internal/v1` | ✅ **推荐** | 自动解析为宿主机IP |

## 🚀 快速部署

### 方法1: 使用部署脚本（推荐）

```bash
# 1. 上传项目到服务器
scp -r . user@your-server-ip:/path/to/project

# 2. SSH登录服务器
ssh user@your-server-ip

# 3. 进入项目目录
cd /path/to/project

# 4. 运行部署脚本
./deploy-server.sh
```

### 方法2: 手动部署

```bash
# 1. 构建镜像
docker-compose -f docker-compose.server.yml build

# 2. 启动服务
docker-compose -f docker-compose.server.yml up -d

# 3. 查看状态
docker-compose -f docker-compose.server.yml ps
```

## 📋 部署前检查清单

### 1. 检查Dify服务状态

```bash
# 在服务器上执行
curl http://localhost/

# 或
wget -O- http://localhost/
```

**期望结果**: 返回Dify的HTML页面

### 2. 检查Dify监听地址

```bash
# 查看Dify端口监听
netstat -tlnp | grep :80

# 或
ss -tlnp | grep :80
```

**期望结果**: 应该看到监听在 `0.0.0.0:80` 或 `*:80`

**如果只监听在 `127.0.0.1:80`**:
- 需要修改Dify配置，改为监听 `0.0.0.0`
- 或者使用方案B（见下文）

### 3. 检查防火墙

```bash
# 检查防火墙状态（如果使用ufw）
sudo ufw status

# 检查iptables（如果使用）
sudo iptables -L
```

**确保**: 允许Docker网桥访问宿主机端口

### 4. 检查Docker和Docker Compose

```bash
# 检查Docker版本
docker --version

# 检查Docker Compose版本
docker-compose --version
# 或
docker compose version
```

## 🔧 配置方案

### 方案A: 使用 host.docker.internal（推荐）

**优点**: 
- ✅ 简单，不需要知道宿主机IP
- ✅ 在不同环境中通用
- ✅ 自动解析

**配置**:

```yaml
# docker-compose.server.yml
services:
  app:
    build:
      args:
        NEXT_PUBLIC_DIFY_BASE_URL: http://host.docker.internal/v1
    extra_hosts:
      - "host.docker.internal:host-gateway"
```

**要求**: Docker版本 >= 20.10

### 方案B: 使用宿主机IP

**优点**:
- ✅ 兼容老版本Docker
- ✅ 明确的地址

**配置**:

```yaml
# docker-compose.server.yml
services:
  app:
    build:
      args:
        NEXT_PUBLIC_DIFY_BASE_URL: http://your-server-ip/v1
```

**要求**: Dify必须监听在 `0.0.0.0:80`

### 方案C: 使用 host 网络模式

**优点**:
- ✅ 可以用localhost
- ✅ 性能最佳

**缺点**:
- ❌ 容器端口直接暴露在宿主机
- ❌ 端口冲突风险

**配置**:

```yaml
# docker-compose.server.yml
services:
  app:
    network_mode: "host"
    build:
      args:
        NEXT_PUBLIC_DIFY_BASE_URL: http://localhost/v1
```

**不推荐**，除非其他方案都不可行。

## 🧪 部署后测试

### 1. 检查服务状态

```bash
docker-compose -f docker-compose.server.yml ps
```

**期望输出**:
```
NAME                    STATUS
ai-document-generator   Up (healthy)
ai-doc-redis           Up (healthy)
ai-doc-redis-commander Up (healthy)
```

### 2. 测试健康检查

```bash
curl http://localhost:3001/api/health
```

**期望输出**:
```json
{
  "status": "healthy",
  "timestamp": "...",
  "version": "1.0.0"
}
```

### 3. 测试Dify连接

```bash
# 进入容器
docker exec -it ai-document-generator sh

# 测试连接
wget -O- http://host.docker.internal/

# 退出容器
exit
```

**期望结果**: 返回Dify的HTML页面

### 4. 测试应用功能

1. 在浏览器访问: `http://your-server-ip:3001`
2. 输入文档主题
3. 点击"生成大纲"
4. 查看是否成功生成

## 🔍 故障排查

### 问题1: 容器无法访问Dify

**症状**: 生成大纲时出现网络错误

**排查步骤**:

```bash
# 1. 进入容器
docker exec -it ai-document-generator sh

# 2. 测试host.docker.internal解析
ping host.docker.internal

# 3. 测试HTTP连接
wget -O- http://host.docker.internal/

# 4. 检查环境变量
env | grep DIFY
```

**可能原因和解决方案**:

| 原因 | 解决方案 |
|------|---------|
| Docker版本太低 | 升级到20.10+ 或使用方案B |
| Dify只监听127.0.0.1 | 修改Dify配置监听0.0.0.0 |
| 防火墙阻止 | 添加防火墙规则允许Docker访问 |

### 问题2: 健康检查失败

**症状**: 容器状态显示 unhealthy

**排查步骤**:

```bash
# 查看健康检查日志
docker inspect ai-document-generator | grep -A 10 Health

# 查看应用日志
docker-compose -f docker-compose.server.yml logs app
```

**常见原因**:
- 应用启动时间超过start_period
- 端口配置错误
- 应用崩溃

### 问题3: API调用失败

**症状**: 前端显示API错误

**排查步骤**:

```bash
# 1. 查看应用日志
docker-compose -f docker-compose.server.yml logs -f app

# 2. 查看Redis连接
docker exec ai-doc-redis redis-cli ping

# 3. 检查API key配置
docker exec ai-document-generator env | grep DIFY_.*_KEY
```

### 问题4: Dify CORS错误

**症状**: 浏览器控制台显示CORS错误

**说明**: 这个问题已通过后端代理解决

**验证**:
- 所有Dify API调用都通过 `/api/ai/*` 后端代理
- 浏览器不会直接调用Dify API

## 📊 监控和维护

### 查看日志

```bash
# 查看所有服务日志
docker-compose -f docker-compose.server.yml logs -f

# 只看应用日志
docker-compose -f docker-compose.server.yml logs -f app

# 只看Redis日志
docker-compose -f docker-compose.server.yml logs -f redis
```

### 查看资源使用

```bash
# 查看容器资源使用
docker stats ai-document-generator ai-doc-redis

# 查看详细信息
docker inspect ai-document-generator
```

### 重启服务

```bash
# 重启应用
docker-compose -f docker-compose.server.yml restart app

# 重启所有服务
docker-compose -f docker-compose.server.yml restart
```

### 更新应用

```bash
# 1. 拉取最新代码
git pull

# 2. 重新构建
docker-compose -f docker-compose.server.yml build app

# 3. 重启服务
docker-compose -f docker-compose.server.yml up -d
```

## 🔒 安全建议

### 1. 使用环境变量

不要在代码中硬编码API密钥，使用 `.env.local`:

```bash
# .env.local
NEXT_PUBLIC_DIFY_OUTLINE_KEY=app-YOUR_OUTLINE_KEY_HERE
NEXT_PUBLIC_DIFY_CHAPTER_KEY=app-YOUR_CHAPTER_KEY_HERE
NEXT_PUBLIC_DIFY_LLM_KEY=app-YOUR_LLM_KEY_HERE
```

### 2. 限制端口访问

```bash
# 只允许特定IP访问
# docker-compose.server.yml
ports:
  - "127.0.0.1:3001:3000"  # 只允许本地访问
```

### 3. 使用反向代理

推荐使用Nginx作为反向代理：

```nginx
# /etc/nginx/sites-available/doc-generator
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

### 4. 启用HTTPS

```bash
# 使用Let's Encrypt
sudo certbot --nginx -d doc.yourdomain.com
```

## 📦 备份和恢复

### 备份数据

```bash
# 备份Redis数据
docker cp ai-doc-redis:/data ./backup/redis-$(date +%Y%m%d).tar

# 备份应用数据
tar -czf backup/store-$(date +%Y%m%d).tar.gz ./store
```

### 恢复数据

```bash
# 恢复Redis数据
docker cp ./backup/redis-20260206.tar ai-doc-redis:/data

# 恢复应用数据
tar -xzf backup/store-20260206.tar.gz
```

## 🆘 紧急处理

### 服务完全停止

```bash
# 停止所有服务
docker-compose -f docker-compose.server.yml down

# 清理所有数据（谨慎！）
docker-compose -f docker-compose.server.yml down -v

# 重新部署
./deploy-server.sh
```

### 查看完整错误信息

```bash
# 查看容器详细信息
docker inspect ai-document-generator

# 查看最近的日志
docker-compose -f docker-compose.server.yml logs --tail=100 app
```

## 📞 获取帮助

如果遇到问题：

1. 查看应用日志
2. 检查Dify服务状态
3. 验证网络连通性
4. 查阅本文档的故障排查部分

## 🎯 总结

**关键配置要点**:

1. ✅ 使用 `host.docker.internal` 访问宿主机服务
2. ✅ 配置 `extra_hosts` 让容器识别宿主机
3. ✅ 确保Dify监听在正确的地址
4. ✅ 通过后端代理避免CORS问题

**部署流程**:

```bash
# 一键部署
./deploy-server.sh
```

**验证成功**:

- ✅ 服务状态健康
- ✅ 健康检查通过
- ✅ 能访问Dify
- ✅ 前端功能正常

---

**祝部署顺利！** 🚀
