# Clash + Docker Desktop 配置指南

## 🔍 问题原因

Clash 默认配置可能拦截了来自 Docker Desktop 的连接请求。

## ✅ 解决方案

### 方法 1: 配置 Clash 允许局域网连接（推荐）

#### 1. 打开 Clash 配置

**如果使用 ClashX Pro / ClashX：**
1. 点击菜单栏的 Clash 图标
2. 配置 → 打开配置文件夹
3. 找到当前使用的配置文件（通常是 config.yaml）

**如果使用 Clash Verge：**
1. 打开 Clash Verge
2. 配置 → 打开配置文件夹

#### 2. 修改配置文件

在配置文件中找到或添加以下配置：

```yaml
# 允许局域网连接（重要！）
allow-lan: true

# 绑定地址（保持默认或设置为 0.0.0.0）
bind-address: "*"

# 绕过规则（添加 Docker 相关）
bypass:
  - localhost
  - 127.*
  - 10.*
  - 172.16.*
  - 172.17.*  # Docker 网络
  - 172.18.*
  - 192.168.*
  - <local>
```

#### 3. 重启 Clash

保存配置后，重启 Clash 代理软件

#### 4. 验证配置

```bash
# 测试 Clash 代理是否可用
curl -x http://127.0.0.1:7890 https://www.google.com

# 如果返回 HTML，说明代理正常工作
```

---

### 方法 2: 使用 Clash 的增强模式

某些 Clash 版本支持增强模式（TUN 模式）：

**ClashX Pro：**
1. 菜单栏 → Clash 图标
2. 开启 "增强模式" 或 "TUN 模式"
3. 重启 Docker Desktop

**注意：** TUN 模式需要系统权限

---

### 方法 3: Docker 使用 Clash 的 HTTP 代理端口

确保 Docker Desktop 代理配置使用正确的端口：

**检查 Clash 的端口：**
- HTTP 代理端口：通常是 7890
- SOCKS5 代理端口：通常是 7891

**Docker Desktop 配置：**
```
Settings → Resources → Proxies

☑️ Manual proxy configuration

HTTP Proxy:  http://127.0.0.1:7890
HTTPS Proxy: http://127.0.0.1:7890
SOCKS Proxy: socks5://127.0.0.1:7891

Bypass: localhost,127.0.0.1
```

---

### 方法 4: 最简单 - 使用镜像源（绕过代理问题）

**不依赖 Clash，直接访问国内镜像：**

1. Docker Desktop → Settings → Docker Engine

2. 添加配置：
```json
{
  "registry-mirrors": [
    "https://docker.m.daocloud.io",
    "https://docker.1panel.live"
  ]
}
```

3. Apply & Restart

4. 构建镜像（不需要代理）

---

## 🎯 推荐方案（按优先级）

### 方案 A: 镜像源（最简单、最可靠）⭐⭐⭐⭐⭐
- ✅ 不依赖 Clash
- ✅ 3分钟配置
- ✅ 速度快且稳定

### 方案 B: 配置 Clash allow-lan ⭐⭐⭐⭐
- ✅ 适用于所有网络请求
- ⚠️ 需要修改 Clash 配置文件

### 方案 C: Clash TUN 模式 ⭐⭐⭐
- ✅ 全局代理
- ⚠️ 需要系统权限
- ⚠️ 某些版本不支持

---

## 🔧 快速诊断

运行以下命令诊断：

```bash
# 1. 检查 Clash 是否在运行
lsof -i :7890

# 2. 测试 Clash 代理
curl -x http://127.0.0.1:7890 https://www.google.com -I

# 3. 检查 Docker 代理配置
docker info | grep -i proxy
```

---

## 💡 我的建议

**立即可用的方案：**

1. **现在**：配置 Docker 镜像源（3分钟）
   → 立即解决 Docker 镜像拉取问题

2. **稍后**：优化 Clash 配置（可选）
   → 提升整体网络性能

**不需要折腾 Clash，直接用镜像源最快！**

---

## 📋 具体操作步骤

### 立即配置镜像源：

```bash
# 1. 打开 Docker Desktop

# 2. Settings → Docker Engine

# 3. 粘贴配置：
{
  "registry-mirrors": ["https://docker.m.daocloud.io"]
}

# 4. Apply & Restart

# 5. 构建镜像
cd /Users/2812019221qq.com/Documenton-NewVersionWebTextAIGenerator
docker-compose build
```

完成后告诉我结果！
