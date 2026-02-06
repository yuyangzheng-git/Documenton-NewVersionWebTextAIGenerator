# 🚀 完整部署检查清单

> 从GitHub克隆到服务器部署的完整步骤

## ✅ 部署前检查（5分钟）

### 1. 服务器要求

**硬件要求**：
- [ ] CPU: 2核心或更多
- [ ] 内存: 4GB或更多
- [ ] 磁盘: 10GB可用空间

**软件要求**：
- [ ] 操作系统: Linux (Ubuntu 20.04+, CentOS 7+, Debian 10+)
- [ ] Docker 20.10+ 已安装
- [ ] Docker Compose 已安装
- [ ] Git 已安装

**网络要求**：
- [ ] 服务器可以访问GitHub（或使用代理）
- [ ] 端口3001、6379、8081未被占用
- [ ] Dify服务正常运行在80端口

### 2. Dify服务检查

在服务器上执行：

```bash
# 检查Dify是否运行
curl http://localhost/

# 检查Dify监听地址
netstat -tlnp | grep :80
# 或
ss -tlnp | grep :80
```

**期望结果**：
- ✅ curl返回Dify的HTML页面
- ✅ 监听在 `0.0.0.0:80` 或 `*:80`（不是127.0.0.1:80）

**如果Dify只监听127.0.0.1**：
```bash
# 需要修改Dify的docker-compose.yml
# 将 ports 从 "127.0.0.1:80:80" 改为 "80:80"
```

### 3. 检查安装的软件

```bash
# 检查Docker
docker --version
# 期望: Docker version 20.10+

# 检查Docker Compose
docker-compose --version
# 或
docker compose version
# 期望: 任意版本

# 检查Git
git --version
# 期望: 任意版本

# 检查Docker服务状态
sudo systemctl status docker
# 期望: active (running)
```

---

## 🚀 快速部署步骤（3步）

### 第1步: 克隆项目

```bash
# 1. SSH登录到服务器
ssh user@10.23.22.37

# 2. 选择部署目录
cd /opt  # 或其他目录，如 /home/user

# 3. 克隆项目
git clone https://github.com/yuyangzheng-git/Documenton-NewVersionWebTextAIGenerator.git

# 4. 进入项目目录
cd Documenton-NewVersionWebTextAIGenerator
```

### 第2步: 验证配置（可选但推荐）

```bash
# 查看部署脚本
cat deploy-server.sh

# 检查会自动创建的配置
# 脚本会自动创建 .env.local 文件，包含：
# - NEXT_PUBLIC_DIFY_BASE_URL=http://host.docker.internal/v1
# - NEXT_PUBLIC_DIFY_OUTLINE_KEY=app-yIhd9xD2SHZ6e9BNTYSWEfYD
# - NEXT_PUBLIC_DIFY_CHAPTER_KEY=app-wqO8BTPC99CwAGFDabEze6Uz
# - NEXT_PUBLIC_DIFY_LLM_KEY=app-ThlXmch2AjSRdv6kuvacb4bM
```

### 第3步: 一键部署

```bash
# 运行部署脚本
./deploy-server.sh
```

**部署过程**：
1. ✅ 检查Docker和Docker Compose
2. ✅ 自动创建.env.local配置文件
3. ✅ 询问是否继续（输入y确认）
4. ✅ 询问是否清理旧镜像（首次部署输入n）
5. ✅ 构建Docker镜像（3-5分钟）
6. ✅ 启动所有服务
7. ✅ 自动测试Dify连接
8. ✅ 显示访问地址

---

## ✅ 部署后验证（2分钟）

### 1. 检查服务状态

```bash
docker-compose -f docker-compose.server.yml ps
```

**期望输出**：
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

**期望输出**：
```json
{"status":"healthy","timestamp":"...","version":"1.0.0"}
```

### 3. 测试Dify连接

```bash
docker exec ai-document-generator wget -q -O- http://host.docker.internal/ | head -10
```

**期望结果**：返回Dify的HTML内容

### 4. 浏览器访问

访问：`http://10.23.22.37:3001`

**测试功能**：
1. 输入文档主题
2. 点击"生成大纲"
3. 验证是否成功生成

---

## 🔧 常见问题和解决方案

### 问题1: Docker未安装

**安装Docker（Ubuntu/Debian）**：
```bash
# 卸载旧版本
sudo apt-get remove docker docker-engine docker.io containerd runc

# 更新包索引
sudo apt-get update

# 安装依赖
sudo apt-get install ca-certificates curl gnupg lsb-release

# 添加Docker官方GPG密钥
sudo mkdir -p /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg

# 设置仓库
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# 安装Docker
sudo apt-get update
sudo apt-get install docker-ce docker-ce-cli containerd.io docker-compose-plugin

# 启动Docker
sudo systemctl start docker
sudo systemctl enable docker

# 将用户加入docker组（避免sudo）
sudo usermod -aG docker $USER
# 注销后重新登录生效
```

**安装Docker（CentOS/RHEL）**：
```bash
# 卸载旧版本
sudo yum remove docker docker-common docker-selinux docker-engine

# 安装依赖
sudo yum install -y yum-utils

# 添加仓库
sudo yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo

# 安装Docker
sudo yum install docker-ce docker-ce-cli containerd.io docker-compose-plugin

# 启动Docker
sudo systemctl start docker
sudo systemctl enable docker
```

### 问题2: 端口被占用

```bash
# 检查端口占用
sudo netstat -tlnp | grep -E "3001|6379|8081"

# 如果端口被占用，修改 docker-compose.server.yml
# 例如：将3001改为3002
ports:
  - "3002:3000"
```

### 问题3: 权限问题

```bash
# 如果提示权限错误
sudo chmod +x deploy-server.sh
sudo chmod +x *.sh

# 或直接使用docker compose（可能需要sudo）
sudo docker-compose -f docker-compose.server.yml up -d
```

### 问题4: Git克隆失败

```bash
# 如果GitHub访问慢或失败，使用代理
git config --global http.proxy http://proxy-server:port

# 或使用镜像
git clone https://ghproxy.com/https://github.com/yuyangzheng-git/Documenton-NewVersionWebTextAIGenerator.git
```

### 问题5: 构建超时

```bash
# 如果构建过程中网络超时，配置Docker镜像加速
sudo mkdir -p /etc/docker
sudo tee /etc/docker/daemon.json <<-'EOF'
{
  "registry-mirrors": [
    "https://docker.m.daocloud.io",
    "https://dockerproxy.com",
    "https://docker.mirrors.ustc.edu.cn"
  ]
}
EOF

# 重启Docker
sudo systemctl daemon-reload
sudo systemctl restart docker

# 重新构建
./deploy-server.sh
```

---

## 📝 完整部署命令速查

```bash
# === 在服务器上执行 ===

# 1. 克隆项目
git clone https://github.com/yuyangzheng-git/Documenton-NewVersionWebTextAIGenerator.git
cd Documenton-NewVersionWebTextAIGenerator

# 2. 一键部署
./deploy-server.sh

# 3. 查看日志
docker-compose -f docker-compose.server.yml logs -f app

# 4. 查看状态
docker-compose -f docker-compose.server.yml ps

# 5. 重启服务
docker-compose -f docker-compose.server.yml restart app

# 6. 停止服务
docker-compose -f docker-compose.server.yml down

# 7. 更新代码
git pull
docker-compose -f docker-compose.server.yml build app
docker-compose -f docker-compose.server.yml up -d
```

---

## 🎯 部署成功标志

✅ 所有容器状态显示 `Up (healthy)`
✅ 健康检查返回 `{"status":"healthy"}`
✅ Dify连接测试成功
✅ 浏览器可访问应用
✅ 生成大纲功能正常工作

---

## 🆘 需要帮助？

如果遇到问题：

1. **查看日志**
   ```bash
   docker-compose -f docker-compose.server.yml logs --tail=100 app
   ```

2. **检查Dify状态**
   ```bash
   curl http://localhost/
   docker ps | grep dify
   ```

3. **查看完整文档**
   - [SERVER_DEPLOYMENT.md](SERVER_DEPLOYMENT.md)
   - [DIFY_NETWORK_GUIDE.md](DIFY_NETWORK_GUIDE.md)

4. **进入容器调试**
   ```bash
   docker exec -it ai-document-generator sh
   ```

---

## ✨ 总结

**是的，就是这么简单！**

只需3个命令：
```bash
git clone https://github.com/yuyangzheng-git/Documenton-NewVersionWebTextAIGenerator.git
cd Documenton-NewVersionWebTextAIGenerator
./deploy-server.sh
```

**前提条件**：
- ✅ 服务器已安装Docker和Docker Compose
- ✅ Dify服务正常运行
- ✅ 端口未被占用

**部署脚本会自动**：
- ✅ 检查环境
- ✅ 创建配置文件
- ✅ 构建镜像
- ✅ 启动服务
- ✅ 测试连接

**预计时间**：5-10分钟（取决于网络速度）

---

**祝您部署顺利！** 🚀
