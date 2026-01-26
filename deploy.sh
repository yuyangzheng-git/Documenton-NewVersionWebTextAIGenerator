#!/bin/bash

# AI Document Generator - 一键部署脚本

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 打印带颜色的消息
print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查 Docker 是否安装
check_docker() {
    if ! command -v docker &> /dev/null; then
        print_error "Docker 未安装，请先安装 Docker"
        exit 1
    fi
    print_success "Docker 已安装"
}

# 检查 Docker Compose 是否安装
check_docker_compose() {
    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        print_error "Docker Compose 未安装，请先安装 Docker Compose"
        exit 1
    fi
    print_success "Docker Compose 已安装"
}

# 停止并删除旧容器
cleanup_old_containers() {
    print_info "清理旧容器..."
    docker stop ai-doc-generator 2>/dev/null || true
    docker rm ai-doc-generator 2>/dev/null || true
    print_success "旧容器已清理"
}

# 拉取最新镜像
pull_image() {
    IMAGE_NAME="${1:-ghcr.io/your-username/front-endword:latest}"

    print_info "拉取镜像: $IMAGE_NAME"
    docker pull $IMAGE_NAME
    print_success "镜像拉取成功"
}

# 运行容器
run_container() {
    IMAGE_NAME="${1:-ghcr.io/your-username/front-endword:latest}"
    PORT="${2:-3000}"

    print_info "启动容器..."
    print_info "端口: $PORT"
    print_info "镜像: $IMAGE_NAME"

    # 检查是否有模板文件
    if [ -f "reference_template.docx" ]; then
        print_info "发现模板文件，将挂载到容器"
        docker run -d \
            --name ai-doc-generator \
            -p $PORT:3000 \
            -v $(pwd)/reference_template.docx:/app/reference_template.docx:ro \
            $IMAGE_NAME
    else
        print_warning "未找到模板文件 reference_template.docx，将使用默认模板"
        docker run -d \
            --name ai-doc-generator \
            -p $PORT:3000 \
            $IMAGE_NAME
    fi

    print_success "容器已启动"
}

# 检查容器状态
check_container_status() {
    print_info "检查容器状态..."
    sleep 3

    if docker ps | grep -q ai-doc-generator; then
        print_success "容器运行正常"
        echo ""
        echo -e "${GREEN}========================================${NC}"
        echo -e "${GREEN}部署成功！${NC}"
        echo -e "${GREEN}========================================${NC}"
        echo ""
        echo "访问地址: http://localhost:$PORT"
        echo ""
        echo "常用命令："
        echo "  查看日志: docker logs -f ai-doc-generator"
        echo "  停止容器: docker stop ai-doc-generator"
        echo "  启动容器: docker start ai-doc-generator"
        echo "  删除容器: docker rm -f ai-doc-generator"
        echo ""
    else
        print_error "容器启动失败，请查看日志："
        docker logs ai-doc-generator
        exit 1
    fi
}

# 主函数
main() {
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}  AI Document Generator 部署工具${NC}"
    echo -e "${BLUE}========================================${NC}"
    echo ""

    # 解析参数
    IMAGE_NAME=""
    PORT="3000"
    SKIP_PULL=false

    while [[ $# -gt 0 ]]; do
        case $1 in
            --image)
                IMAGE_NAME="$2"
                shift 2
                ;;
            --port)
                PORT="$2"
                shift 2
                ;;
            --no-pull)
                SKIP_PULL=true
                shift
                ;;
            -h|--help)
                echo "用法: $0 [选项]"
                echo ""
                echo "选项:"
                echo "  --image <镜像名称>   指定 Docker 镜像（默认: ghcr.io/your-username/front-endword:latest）"
                echo "  --port <端口>       指定端口（默认: 3000）"
                echo "  --no-pull           跳过拉取镜像，使用本地镜像"
                echo "  -h, --help          显示帮助信息"
                echo ""
                echo "示例:"
                echo "  $0                          # 使用默认配置部署"
                echo "  $0 --port 8080              # 使用端口 8080"
                echo "  $0 --image custom:latest      # 使用自定义镜像"
                exit 0
                ;;
            *)
                print_error "未知参数: $1"
                echo "使用 -h 或 --help 查看帮助"
                exit 1
                ;;
        esac
    done

    # 检查依赖
    check_docker
    check_docker_compose

    # 清理旧容器
    cleanup_old_containers

    # 拉取镜像
    if [ "$SKIP_PULL" = false ]; then
        pull_image "$IMAGE_NAME"
    fi

    # 运行容器
    run_container "$IMAGE_NAME" "$PORT"

    # 检查状态
    check_container_status
}

# 运行主函数
main "$@"
