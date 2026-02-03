#!/bin/bash

# AI Document Generator - 快速部署脚本
# 使用方法：
#   ./deploy.sh        # 首次部署或重新构建
#   ./deploy.sh start  # 启动服务
#   ./deploy.sh stop   # 停止服务
#   ./deploy.sh logs   # 查看日志

set -e

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

echo_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

echo_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查 Docker 和 Docker Compose
check_requirements() {
    echo_info "检查系统依赖..."

    if ! command -v docker &> /dev/null; then
        echo_error "未安装 Docker，请先安装 Docker"
        exit 1
    fi

    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        echo_error "未安装 Docker Compose，请先安装"
        exit 1
    fi

    echo_info "✓ Docker 和 Docker Compose 已安装"
}

# 检查环境变量配置
check_env() {
    echo_info "检查环境变量配置..."

    if [ ! -f .env.local ]; then
        echo_warn ".env.local 文件不存在"
        if [ -f .env.example ]; then
            echo_info "从 .env.example 复制配置文件..."
            cp .env.example .env.local
            echo_warn "请编辑 .env.local 文件，配置您的 Dify API 密钥"
            exit 1
        else
            echo_error "缺少 .env.local 和 .env.example 文件"
            exit 1
        fi
    fi

    echo_info "✓ 环境变量配置文件存在"
}

# 创建必要的目录
create_directories() {
    echo_info "创建必要的目录..."

    mkdir -p store/templates
    mkdir -p public/templates

    echo_info "✓ 目录创建完成"
}

# 构建 Docker 镜像
build_image() {
    echo_info "开始构建 Docker 镜像..."

    if docker-compose build; then
        echo_info "✓ Docker 镜像构建成功"
    else
        echo_error "Docker 镜像构建失败"
        exit 1
    fi
}

# 启动服务
start_service() {
    echo_info "启动服务..."
    echo_info "包含: 应用 + Redis + Redis Commander"

    if docker-compose up -d; then
        echo_info "✓ 服务启动成功"
        echo ""
        echo "访问地址:"
        echo "  - 应用: http://localhost:3000"
        echo "  - Redis Commander: http://localhost:8081 (可选)"
        echo ""
        echo_info "使用 './deploy-server.sh logs' 查看日志"
    else
        echo_error "服务启动失败"
        exit 1
    fi
}

# 停止服务
stop_service() {
    echo_info "停止服务..."

    if docker-compose down; then
        echo_info "✓ 服务已停止"
    else
        echo_error "停止服务失败"
        exit 1
    fi
}

# 查看日志
show_logs() {
    echo_info "显示日志（Ctrl+C 退出）..."
    docker-compose logs -f
}

# 重启服务
restart_service() {
    echo_info "重启服务..."
    stop_service
    start_service
}

# 清理（删除容器、镜像、volume）
cleanup() {
    echo_warn "⚠️  这将删除所有容器、镜像和数据卷"
    read -p "确定要继续吗？(y/N) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo_info "清理 Docker 资源..."
        docker-compose down -v --rmi all
        echo_info "✓ 清理完成"
    else
        echo_info "取消清理操作"
    fi
}

# 显示服务状态
show_status() {
    echo_info "服务状态："
    docker-compose ps
}

# 主函数
main() {
    case "${1:-deploy}" in
        deploy)
            check_requirements
            check_env
            create_directories
            build_image
            start_service
            ;;
        build)
            check_requirements
            build_image
            ;;
        start)
            check_requirements
            start_service
            ;;
        stop)
            stop_service
            ;;
        restart)
            restart_service
            ;;
        logs)
            show_logs
            ;;
        status)
            show_status
            ;;
        cleanup)
            cleanup
            ;;
        *)
            echo "使用方法: $0 {deploy|build|start|stop|restart|logs|status|cleanup}"
            echo ""
            echo "命令说明:"
            echo "  deploy   - 完整部署（默认，包括构建和启动）"
            echo "  build    - 仅构建 Docker 镜像"
            echo "  start    - 启动服务"
            echo "  stop     - 停止服务"
            echo "  restart  - 重启服务"
            echo "  logs     - 查看实时日志"
            echo "  status   - 查看服务状态"
            echo "  cleanup  - 清理所有 Docker 资源（危险操作）"
            exit 1
            ;;
    esac
}

# 运行主函数
main "$@"
