#!/bin/bash

# 停止开发环境脚本

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}================================================${NC}"
echo -e "${BLUE}  停止 Documenton 开发环境${NC}"
echo -e "${BLUE}================================================${NC}"
echo ""

# 停止 Docker 服务
echo -e "${BLUE}停止 Redis 服务...${NC}"
docker-compose -f docker-compose.dev.yml down

echo ""
echo -e "${GREEN}✓ 开发环境已停止${NC}"
echo ""
echo "提示:"
echo "  - 要完全清理数据: docker-compose -f docker-compose.dev.yml down -v"
echo "  - 要重启环境: ./dev-start.sh"
