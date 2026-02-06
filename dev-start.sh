#!/bin/bash

# 开发环境启动脚本
# Python (uv) + Next.js (本地) + Redis (Docker)

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}================================================${NC}"
echo -e "${BLUE}  启动 Documenton 开发环境${NC}"
echo -e "${BLUE}================================================${NC}"
echo ""

# 检查 Docker
echo -e "${BLUE}[1/5] 检查 Docker...${NC}"
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}✗ Docker 未运行${NC}"
    echo -e "${YELLOW}请先启动 Docker Desktop，然后重新运行此脚本${NC}"
    exit 1
else
    echo -e "${GREEN}✓ Docker 正在运行${NC}"
fi

echo ""

# 检查 uv 和 Python 环境
echo -e "${BLUE}[2/5] 检查 Python 环境...${NC}"
if [ ! -d ".venv" ]; then
    echo -e "${YELLOW}Python 环境未设置。正在运行设置脚本...${NC}"
    ./setup-python-uv.sh
else
    echo -e "${GREEN}✓ Python uv 环境已就绪${NC}"
fi

echo ""

# 启动 Redis (Docker)
echo -e "${BLUE}[3/5] 启动 Redis 服务 (Docker)...${NC}"
if docker ps | grep -q ai-doc-redis-dev; then
    echo -e "${GREEN}✓ Redis 已在运行${NC}"
else
    docker-compose -f docker-compose.dev.yml up -d redis
    echo -e "${GREEN}✓ Redis 已启动${NC}"
fi

echo ""

# 等待 Redis 就绪
echo -e "${BLUE}[4/5] 等待 Redis 就绪...${NC}"
sleep 2
if docker exec ai-doc-redis-dev redis-cli ping > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Redis 就绪${NC}"
else
    echo -e "${RED}✗ Redis 未就绪${NC}"
    exit 1
fi

echo ""

# 激活 Python 环境并启动 Next.js
echo -e "${BLUE}[5/5] 启动 Next.js 开发服务器...${NC}"
echo -e "${YELLOW}提示: 使用 Ctrl+C 停止服务器${NC}"
echo ""

# 激活 Python 环境
source .venv/bin/activate

# 显示环境信息
echo -e "${GREEN}================================================${NC}"
echo -e "${GREEN}环境信息:${NC}"
echo -e "${GREEN}  - Python: $(python --version)${NC}"
echo -e "${GREEN}  - Node.js: $(node --version)${NC}"
echo -e "${GREEN}  - Redis: localhost:6379${NC}"
echo -e "${GREEN}  - Redis Commander: http://localhost:8081${NC}"
echo -e "${GREEN}================================================${NC}"
echo ""

# 启动 Next.js
npm run dev
