#!/bin/bash

# ========================================
# AI文档生成器 - 统一管理脚本
# ========================================

set -e

# 颜色定义
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# 显示帮助信息
show_help() {
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}  AI文档生成器 - 管理脚本${NC}"
    echo -e "${BLUE}========================================${NC}"
    echo ""
    echo "用法: ./manage.sh <command>"
    echo ""
    echo "命令:"
    echo "  dev-start       启动开发环境（Redis + Next.js）"
    echo "  dev-stop        停止开发环境"
    echo "  deploy          部署到生产服务器"
    echo "  status          查看服务状态"
    echo "  logs            查看日志"
    echo "  restart         重启服务"
    echo "  stop            停止所有服务"
    echo "  clean           清理容器和镜像"
    echo "  health          健康检查"
    echo "  env-check       检查环境变量"
    echo "  help            显示此帮助信息"
    echo ""
    echo "示例:"
    echo "  ./manage.sh dev-start    # 启动开发环境"
    echo "  ./manage.sh deploy       # 部署到生产"
    echo "  ./manage.sh logs         # 查看日志"
    echo ""
}

# 检查Docker
check_docker() {
    if ! docker info > /dev/null 2>&1; then
        echo -e "${RED}✗ Docker未运行${NC}"
        echo -e "${YELLOW}请先启动Docker Desktop${NC}"
        exit 1
    fi
}

# 启动开发环境
dev_start() {
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}  启动开发环境${NC}"
    echo -e "${BLUE}========================================${NC}"
    echo ""

    # 检查Docker
    echo -e "${BLUE}[1/5] 检查Docker...${NC}"
    check_docker
    echo -e "${GREEN}✓ Docker正在运行${NC}"
    echo ""

    # 检查Python环境
    echo -e "${BLUE}[2/5] 检查Python环境...${NC}"
    if [ ! -d ".venv" ]; then
        echo -e "${YELLOW}Python环境未设置，正在创建...${NC}"
        if command -v uv &> /dev/null; then
            uv venv
        else
            python3 -m venv .venv
        fi
    fi
    echo -e "${GREEN}✓ Python环境就绪${NC}"
    echo ""

    # 启动Redis
    echo -e "${BLUE}[3/5] 启动Redis...${NC}"
    if docker ps | grep -q ai-doc-redis-dev; then
        echo -e "${GREEN}✓ Redis已在运行${NC}"
    else
        docker-compose -f docker-compose.dev.yml up -d redis
        sleep 2
        echo -e "${GREEN}✓ Redis已启动${NC}"
    fi
    echo ""

    # 等待Redis就绪
    echo -e "${BLUE}[4/5] 等待Redis就绪...${NC}"
    for i in {1..10}; do
        if docker exec ai-doc-redis-dev redis-cli ping > /dev/null 2>&1; then
            echo -e "${GREEN}✓ Redis就绪${NC}"
            break
        fi
        if [ $i -eq 10 ]; then
            echo -e "${RED}✗ Redis启动超时${NC}"
            exit 1
        fi
        sleep 1
    done
    echo ""

    # 启动Next.js
    echo -e "${BLUE}[5/5] 启动Next.js...${NC}"
    echo -e "${GREEN}环境信息:${NC}"
    source .venv/bin/activate
    echo -e "${GREEN}  - Python: $(python --version)${NC}"
    echo -e "${GREEN}  - Node.js: $(node --version)${NC}"
    echo -e "${GREEN}  - Redis: localhost:6379${NC}"
    echo -e "${GREEN}  - 应用: http://localhost:3000${NC}"
    echo ""
    echo -e "${YELLOW}提示: 使用Ctrl+C停止服务器${NC}"
    echo ""

    npm run dev
}

# 停止开发环境
dev_stop() {
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}  停止开发环境${NC}"
    echo -e "${BLUE}========================================${NC}"
    echo ""

    echo -e "${BLUE}停止Redis服务...${NC}"
    docker-compose -f docker-compose.dev.yml down

    echo ""
    echo -e "${GREEN}✓ 开发环境已停止${NC}"
    echo ""
    echo "提示:"
    echo "  - 完全清理数据: ./manage.sh clean"
    echo "  - 重启环境: ./manage.sh dev-start"
    echo ""
}

# 部署到生产环境
deploy() {
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}  部署到生产服务器${NC}"
    echo -e "${BLUE}  Dify地址: http://host.docker.internal/v1${NC}"
    echo -e "${BLUE}========================================${NC}"
    echo ""

    # 检查Docker
    check_docker

    # 检查.env.local
    if [ ! -f .env.local ]; then
        echo -e "${YELLOW}⚠️  .env.local不存在，创建默认配置...${NC}"
        cat > .env.local <<EOF
NEXT_PUBLIC_DIFY_BASE_URL=http://host.docker.internal/v1
NEXT_PUBLIC_DIFY_OUTLINE_KEY=app-YOUR_OUTLINE_KEY_HERE
NEXT_PUBLIC_DIFY_CHAPTER_KEY=app-YOUR_CHAPTER_KEY_HERE
NEXT_PUBLIC_DIFY_LLM_KEY=app-YOUR_LLM_KEY_HERE
REDIS_URL=redis://redis:6379
CACHE_ENABLED=1
EOF
        echo -e "${GREEN}✓ 已创建.env.local，请编辑填入实际API密钥${NC}"
        echo ""
    fi

    echo "📋 当前配置:"
    echo "   Dify Base URL: http://host.docker.internal/v1"
    echo "   应用端口: 3001"
    echo "   Redis端口: 6379"
    echo ""

    read -p "是否继续部署？(y/n) " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${RED}取消部署${NC}"
        exit 0
    fi

    # 停止旧容器
    echo -e "${BLUE}🛑 停止旧容器...${NC}"
    docker-compose -f docker-compose.server.yml down 2>/dev/null || true

    # 构建镜像
    read -p "是否清理缓存重新构建？(y/n) " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${BLUE}🧹 清理缓存并构建...${NC}"
        DOCKER_BUILDKIT=1 docker-compose -f docker-compose.server.yml build --no-cache
    else
        echo -e "${BLUE}🔨 构建镜像...${NC}"
        DOCKER_BUILDKIT=1 docker-compose -f docker-compose.server.yml build
    fi

    # 启动服务
    echo -e "${BLUE}🚀 启动服务...${NC}"
    docker-compose -f docker-compose.server.yml up -d

    # 等待启动
    echo -e "${BLUE}⏳ 等待服务启动...${NC}"
    sleep 10

    # 检查状态
    echo ""
    echo -e "${BLUE}📊 服务状态:${NC}"
    docker-compose -f docker-compose.server.yml ps

    # 健康检查
    echo ""
    echo -e "${BLUE}🏥 健康检查:${NC}"
    for i in {1..6}; do
        if curl -s http://localhost:3001/api/health > /dev/null 2>&1; then
            echo -e "${GREEN}✓ 应用健康检查通过${NC}"
            break
        else
            if [ $i -eq 6 ]; then
                echo -e "${YELLOW}⚠️  应用健康检查失败，请查看日志${NC}"
                echo "   查看日志: ./manage.sh logs"
            else
                echo "   等待中... ($i/6)"
                sleep 5
            fi
        fi
    done

    # 测试Dify连接
    echo ""
    echo -e "${BLUE}🔗 测试Dify连接...${NC}"
    if docker exec ai-document-generator sh -c "wget -q --spider --timeout=5 http://host.docker.internal/ 2>&1" > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Dify连接成功${NC}"
    else
        echo -e "${YELLOW}⚠️  Dify连接失败，请检查Dify服务${NC}"
    fi

    echo ""
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}  ✅ 部署完成！${NC}"
    echo -e "${GREEN}========================================${NC}"
    echo ""
    echo "📍 访问地址:"
    echo "   • 主应用: http://localhost:3001"
    echo "   • Redis Commander: http://localhost:8081"
    echo ""
    echo "📝 管理命令:"
    echo "   • 查看日志: ./manage.sh logs"
    echo "   • 查看状态: ./manage.sh status"
    echo "   • 重启服务: ./manage.sh restart"
    echo ""
}

# 查看服务状态
show_status() {
    echo -e "${BLUE}服务状态:${NC}"
    echo ""

    if [ -f docker-compose.server.yml ]; then
        echo "生产环境:"
        docker-compose -f docker-compose.server.yml ps
        echo ""
    fi

    if docker ps | grep -q ai-doc-redis-dev; then
        echo "开发环境:"
        docker-compose -f docker-compose.dev.yml ps
    fi
}

# 查看日志
show_logs() {
    if [ -f docker-compose.server.yml ] && docker-compose -f docker-compose.server.yml ps | grep -q Up; then
        echo -e "${BLUE}生产环境日志 (Ctrl+C退出):${NC}"
        docker-compose -f docker-compose.server.yml logs -f
    elif docker ps | grep -q ai-doc-redis-dev; then
        echo -e "${BLUE}开发环境日志 (Ctrl+C退出):${NC}"
        docker-compose -f docker-compose.dev.yml logs -f
    else
        echo -e "${YELLOW}没有运行中的服务${NC}"
    fi
}

# 重启服务
restart_services() {
    echo -e "${BLUE}重启服务...${NC}"

    if [ -f docker-compose.server.yml ] && docker-compose -f docker-compose.server.yml ps | grep -q Up; then
        docker-compose -f docker-compose.server.yml restart
        echo -e "${GREEN}✓ 生产环境已重启${NC}"
    elif docker ps | grep -q ai-doc-redis-dev; then
        docker-compose -f docker-compose.dev.yml restart
        echo -e "${GREEN}✓ 开发环境已重启${NC}"
    else
        echo -e "${YELLOW}没有运行中的服务${NC}"
    fi
}

# 停止所有服务
stop_all() {
    echo -e "${BLUE}停止所有服务...${NC}"

    docker-compose -f docker-compose.server.yml down 2>/dev/null || true
    docker-compose -f docker-compose.dev.yml down 2>/dev/null || true

    echo -e "${GREEN}✓ 所有服务已停止${NC}"
}

# 清理
clean_all() {
    echo -e "${RED}警告: 这将删除所有容器、镜像和数据${NC}"
    read -p "确认清理？(y/n) " -n 1 -r
    echo ""

    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${BLUE}清理中...${NC}"
        docker-compose -f docker-compose.server.yml down -v --rmi all 2>/dev/null || true
        docker-compose -f docker-compose.dev.yml down -v --rmi all 2>/dev/null || true
        echo -e "${GREEN}✓ 清理完成${NC}"
    else
        echo -e "${YELLOW}取消清理${NC}"
    fi
}

# 健康检查
health_check() {
    echo -e "${BLUE}执行健康检查...${NC}"
    echo ""

    # 检查应用
    if curl -s http://localhost:3000/api/health > /dev/null 2>&1; then
        echo -e "${GREEN}✓ 开发环境健康 (http://localhost:3000)${NC}"
    elif curl -s http://localhost:3001/api/health > /dev/null 2>&1; then
        echo -e "${GREEN}✓ 生产环境健康 (http://localhost:3001)${NC}"
    else
        echo -e "${RED}✗ 应用未响应${NC}"
    fi

    # 检查Redis
    if docker ps | grep -q ai-doc-redis; then
        if docker exec ai-doc-redis redis-cli ping > /dev/null 2>&1; then
            echo -e "${GREEN}✓ Redis健康${NC}"
        else
            echo -e "${RED}✗ Redis未响应${NC}"
        fi
    fi

    echo ""
    curl -s http://localhost:3001/api/health 2>/dev/null || curl -s http://localhost:3000/api/health 2>/dev/null || echo "无法获取详细健康信息"
}

# 环境检查
env_check() {
    echo -e "${BLUE}检查环境配置...${NC}"
    echo ""

    if command -v npm &> /dev/null; then
        npm run env:check
    else
        echo -e "${YELLOW}npm未安装，跳过环境检查${NC}"

        if [ -f .env.local ]; then
            echo -e "${GREEN}✓ .env.local 存在${NC}"
        else
            echo -e "${RED}✗ .env.local 不存在${NC}"
        fi
    fi
}

# 主逻辑
case "${1:-help}" in
    dev-start)
        dev_start
        ;;
    dev-stop)
        dev_stop
        ;;
    deploy)
        deploy
        ;;
    status)
        show_status
        ;;
    logs)
        show_logs
        ;;
    restart)
        restart_services
        ;;
    stop)
        stop_all
        ;;
    clean)
        clean_all
        ;;
    health)
        health_check
        ;;
    env-check)
        env_check
        ;;
    help|--help|-h)
        show_help
        ;;
    *)
        echo -e "${RED}未知命令: $1${NC}"
        echo ""
        show_help
        exit 1
        ;;
esac
