#!/bin/bash

# 快速检查脚本 - 验证开发环境配置

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}================================================${NC}"
echo -e "${BLUE}  Documenton 开发环境检查${NC}"
echo -e "${BLUE}================================================${NC}"
echo ""

# Check uv
echo -e "${BLUE}检查 uv...${NC}"
if command -v uv &> /dev/null; then
    echo -e "${GREEN}✓ uv: $(uv --version)${NC}"
else
    echo -e "${RED}✗ uv 未安装${NC}"
    echo -e "${YELLOW}  安装: curl -LsSf https://astral.sh/uv/install.sh | sh${NC}"
fi

# Check Python venv
echo -e "${BLUE}检查 Python 虚拟环境...${NC}"
if [ -d ".venv" ]; then
    echo -e "${GREEN}✓ Python venv 已创建${NC}"
    if [ -f ".venv/bin/python" ]; then
        source .venv/bin/activate
        echo -e "${GREEN}  Python: $(python --version)${NC}"
        if python -c "import pypandoc" 2>/dev/null; then
            echo -e "${GREEN}  pypandoc: $(python -c 'import pypandoc; print(pypandoc.__version__)')${NC}"
        else
            echo -e "${RED}  ✗ pypandoc 未安装${NC}"
        fi
    fi
else
    echo -e "${RED}✗ Python venv 未创建${NC}"
    echo -e "${YELLOW}  运行: ./setup-python-uv.sh${NC}"
fi

echo ""

# Check Node.js
echo -e "${BLUE}检查 Node.js...${NC}"
if command -v node &> /dev/null; then
    echo -e "${GREEN}✓ Node.js: $(node --version)${NC}"
    echo -e "${GREEN}✓ npm: $(npm --version)${NC}"
else
    echo -e "${RED}✗ Node.js 未安装${NC}"
fi

# Check node_modules
if [ -d "node_modules" ]; then
    echo -e "${GREEN}✓ Node 依赖已安装${NC}"
else
    echo -e "${RED}✗ Node 依赖未安装${NC}"
    echo -e "${YELLOW}  运行: npm install${NC}"
fi

echo ""

# Check Docker
echo -e "${BLUE}检查 Docker...${NC}"
if command -v docker &> /dev/null; then
    if docker info > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Docker: $(docker --version | cut -d' ' -f3 | tr -d ',')${NC}"
        echo -e "${GREEN}✓ Docker daemon 正在运行${NC}"

        # Check Redis container
        if docker ps | grep -q ai-doc-redis-dev; then
            echo -e "${GREEN}✓ Redis 容器正在运行${NC}"
        else
            echo -e "${YELLOW}⚠ Redis 容器未运行${NC}"
            echo -e "${YELLOW}  启动: docker-compose -f docker-compose.dev.yml up -d redis${NC}"
        fi
    else
        echo -e "${RED}✗ Docker daemon 未运行${NC}"
        echo -e "${YELLOW}  请启动 Docker Desktop${NC}"
    fi
else
    echo -e "${RED}✗ Docker 未安装${NC}"
fi

echo ""

# Check Pandoc
echo -e "${BLUE}检查 Pandoc...${NC}"
if command -v pandoc &> /dev/null; then
    echo -e "${GREEN}✓ Pandoc: $(pandoc --version | head -n1 | cut -d' ' -f2)${NC}"
else
    echo -e "${RED}✗ Pandoc 未安装${NC}"
    echo -e "${YELLOW}  macOS: brew install pandoc${NC}"
    echo -e "${YELLOW}  Ubuntu: sudo apt-get install pandoc${NC}"
fi

echo ""

# Check .env.local
echo -e "${BLUE}检查环境配置...${NC}"
if [ -f ".env.local" ]; then
    echo -e "${GREEN}✓ .env.local 存在${NC}"
    if grep -q "REDIS_URL" .env.local; then
        echo -e "${GREEN}  ✓ Redis 配置已设置${NC}"
    else
        echo -e "${YELLOW}  ⚠ Redis 配置缺失${NC}"
    fi
    if grep -q "NEXT_PUBLIC_DIFY" .env.local; then
        echo -e "${GREEN}  ✓ Dify API 配置已设置${NC}"
    else
        echo -e "${YELLOW}  ⚠ Dify API 配置缺失${NC}"
    fi
else
    echo -e "${RED}✗ .env.local 不存在${NC}"
    echo -e "${YELLOW}  运行: cp .env.example .env.local${NC}"
fi

echo ""
echo -e "${BLUE}================================================${NC}"

# Summary
if [ -d ".venv" ] && [ -d "node_modules" ] && docker info > /dev/null 2>&1; then
    echo -e "${GREEN}✓ 开发环境配置完成！${NC}"
    echo ""
    echo "启动开发环境:"
    echo -e "${BLUE}  ./dev-start.sh${NC}"
else
    echo -e "${YELLOW}⚠ 环境配置不完整${NC}"
    echo ""
    echo "完成配置步骤:"
    [ ! -d ".venv" ] && echo -e "${YELLOW}  1. 运行 ./setup-python-uv.sh${NC}"
    [ ! -d "node_modules" ] && echo -e "${YELLOW}  2. 运行 npm install${NC}"
    docker info > /dev/null 2>&1 || echo -e "${YELLOW}  3. 启动 Docker Desktop${NC}"
fi

echo -e "${BLUE}================================================${NC}"
