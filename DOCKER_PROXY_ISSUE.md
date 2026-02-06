# Docker 代理问题说明

## 为什么有代理还是失败？

### 网络隔离问题

```
┌─────────────────────────────────┐
│  主机 (macOS)                    │
│                                  │
│  127.0.0.1:7890 ← 代理在这里     │
│                                  │
│  ┌──────────────────────────┐   │
│  │ Docker 容器               │   │
│  │                          │   │
│  │ 127.0.0.1 ← 指向容器自己 │   │
│  │ 无法访问主机的代理！      │   │
│  └──────────────────────────┘   │
└─────────────────────────────────┘
```

### 解决方案

容器需要使用主机的特殊地址：
- macOS/Windows: `host.docker.internal`
- Linux: `172.17.0.1` 或 `--network=host`

## 三种解决方法

### 方法 1: 配置 Docker Desktop 代理（最简单）✅

1. 打开 Docker Desktop
2. 设置 → Resources → Proxies
3. 勾选 "Manual proxy configuration"
4. 填入：
   - Web Server (HTTP): `http://127.0.0.1:7890`
   - Secure Web Server (HTTPS): `http://127.0.0.1:7890`
5. Apply & Restart

### 方法 2: 使用镜像加速器（已配置）✅

优势：不需要代理也能快速拉取镜像

### 方法 3: Dockerfile 中使用 host.docker.internal

在构建时传递正确的代理地址（需要特殊配置）
