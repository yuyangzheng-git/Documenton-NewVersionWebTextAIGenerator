#!/bin/bash

# Documenton 服务器快速安装脚本
# 适用于 Ubuntu 20.04+ / CentOS 7+ / Debian 10+

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo_info() {
    echo -e "${GREEN}[✓]${NC} $1"
}

echo_warn() {
    echo -e "${YELLOW}[!]${NC} $1"
}

echo_error() {
    echo -e "${RED}[✗]${NC} $1"
}

echo_step() {
    echo -e "\n${BLUE}==>${NC} $1\n"
}

# 检测操作系统
detect_os() {
    if [ -f /etc/os-release ]; then
        . /etc/os-release
        OS=$ID
        VER=$VERSION_ID
    else
        echo_error "无法检测操作系统"
        exit 1
    fi

    echo_info "检测到操作系统: $OS $VER"
}

# 安装 Docker
install_docker() {
    echo_step "安装 Docker"

    if command -v docker &> /dev/null; then
        echo_info "Docker 已安装: $(docker --version)"
        return 0
    fi

    case $OS in
        ubuntu|debian)
            echo_info "Ubuntu/Debian 系统，使用 apt 安装..."
            sudo apt-get update
            sudo apt-get install -y ca-certificates curl gnupg lsb-release

            # 添加 Docker 官方 GPG key
            sudo mkdir -p /etc/apt/keyrings
            curl -fsSL https://download.docker.com/linux/$OS/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg

            # 添加 Docker 仓库
            echo \
              "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/$OS \
              $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

            # 安装 Docker
            sudo apt-get update
            sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
            ;;

        centos|rhel|fedora)
            echo_info "CentOS/RHEL/Fedora 系统，使用 yum 安装..."
            sudo yum install -y yum-utils
            sudo yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo
            sudo yum install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
            sudo systemctl start docker
            sudo systemctl enable docker
            ;;

        *)
            echo_error "不支持的操作系统: $OS"
            echo_warn "请手动安装 Docker: https://docs.docker.com/engine/install/"
            exit 1
            ;;
    esac

    # 添加当前用户到 docker 组
    sudo usermod -aG docker $USER

    echo_info "Docker 安装完成"
    echo_warn "请注销并重新登录以使 docker 组生效，或运行: newgrp docker"
}

# 安装 Python 和 Pandoc
install_python_pandoc() {
    echo_step "安装 Python 和 Pandoc"

    case $OS in
        ubuntu|debian)
            sudo apt-get update
            sudo apt-get install -y python3 python3-pip python3-venv pandoc
            ;;

        centos|rhel|fedora)
            sudo yum install -y python3 python3-pip pandoc
            ;;

        *)
            echo_error "不支持的操作系统"
            exit 1
            ;;
    esac

    echo_info "Python 版本: $(python3 --version)"
    echo_info "Pandoc 版本: $(pandoc --version | head -1)"
}

# 安装 Node.js (可选，非 Docker 部署需要)
install_nodejs() {
    echo_step "安装 Node.js (可选)"

    read -p "是否安装 Node.js 用于非 Docker 部署? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo_info "跳过 Node.js 安装"
        return 0
    fi

    if command -v node &> /dev/null; then
        echo_info "Node.js 已安装: $(node --version)"
        return 0
    fi

    # 使用 NodeSource 安装 Node.js 18
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -

    case $OS in
        ubuntu|debian)
            sudo apt-get install -y nodejs
            ;;

        centos|rhel|fedora)
            sudo yum install -y nodejs
            ;;
    esac

    echo_info "Node.js 版本: $(node --version)"
    echo_info "npm 版本: $(npm --version)"
}

# 配置防火墙
configure_firewall() {
    echo_step "配置防火墙"

    read -p "是否配置防火墙开放 3000 端口? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo_info "跳过防火墙配置"
        return 0
    fi

    if command -v ufw &> /dev/null; then
        sudo ufw allow 3000/tcp
        echo_info "UFW 防火墙已开放 3000 端口"
    elif command -v firewall-cmd &> /dev/null; then
        sudo firewall-cmd --permanent --add-port=3000/tcp
        sudo firewall-cmd --reload
        echo_info "Firewalld 防火墙已开放 3000 端口"
    else
        echo_warn "未检测到 ufw 或 firewalld"
    fi
}

# 部署应用
deploy_app() {
    echo_step "部署 Documenton 应用"

    # 检查是否在项目目录
    if [ ! -f "package.json" ]; then
        echo_error "未找到 package.json，请在项目根目录运行此脚本"
        exit 1
    fi

    # 配置环境变量
    if [ ! -f ".env.local" ]; then
        if [ -f ".env.example" ]; then
            echo_info "复制环境变量模板..."
            cp .env.example .env.local
            echo_warn "请编辑 .env.local 配置您的 API 密钥"
            echo ""
            read -p "现在编辑 .env.local? (Y/n) " -n 1 -r
            echo
            if [[ ! $REPLY =~ ^[Nn]$ ]]; then
                ${EDITOR:-nano} .env.local
            fi
        else
            echo_error "未找到 .env.example"
            exit 1
        fi
    else
        echo_info ".env.local 已存在"
    fi

    # 创建必要目录
    mkdir -p store/templates public/templates

    # 配置 Python 环境
    if [ ! -d "venv" ]; then
        echo_info "创建 Python 虚拟环境..."
        python3 -m venv venv
    fi

    echo_info "安装 Python 依赖..."
    source venv/bin/activate
    pip install -r requirements.txt
    deactivate

    # 选择部署方式
    echo ""
    echo "选择部署方式:"
    echo "1) Docker 部署 (推荐)"
    echo "2) 手动部署 (需要 Node.js)"
    read -p "请选择 (1/2): " -n 1 -r
    echo

    if [[ $REPLY == "1" ]]; then
        # Docker 部署
        echo_info "使用 Docker 部署..."
        chmod +x deploy-server.sh
        ./deploy-server.sh deploy
    else
        # 手动部署
        echo_info "使用手动部署..."

        if ! command -v node &> /dev/null; then
            echo_error "未安装 Node.js，请先安装或选择 Docker 部署"
            exit 1
        fi

        echo_info "安装 Node.js 依赖..."
        npm install

        echo_info "构建应用..."
        npm run build

        echo_info "启动应用..."
        if command -v pm2 &> /dev/null; then
            pm2 start npm --name "documenton" -- start
            pm2 save
            echo_info "应用已使用 PM2 启动"
        else
            echo_warn "未安装 PM2，将在前台运行"
            echo_warn "建议安装 PM2: npm install -g pm2"
            npm start
        fi
    fi
}

# 显示完成信息
show_completion() {
    echo ""
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}   Documenton 部署完成！${NC}"
    echo -e "${GREEN}========================================${NC}"
    echo ""
    echo "访问地址:"
    echo "  http://localhost:3000"
    echo "  http://$(hostname -I | awk '{print $1}'):3000"
    echo ""
    echo "常用命令:"
    echo "  查看状态: ./deploy-server.sh status"
    echo "  查看日志: ./deploy-server.sh logs"
    echo "  停止服务: ./deploy-server.sh stop"
    echo "  重启服务: ./deploy-server.sh restart"
    echo ""
    echo "文档:"
    echo "  完整部署指南: SERVER_DEPLOYMENT.md"
    echo "  项目文档: README.md"
    echo ""
    echo_warn "如果使用 Docker，请注销并重新登录以使 docker 组生效"
}

# 主函数
main() {
    echo -e "${BLUE}"
    echo "╔═══════════════════════════════════════════════╗"
    echo "║   Documenton 服务器快速安装脚本             ║"
    echo "║   AI 文档生成器自动化部署                   ║"
    echo "╚═══════════════════════════════════════════════╝"
    echo -e "${NC}"

    # 检查 root 权限
    if [ "$EUID" -eq 0 ]; then
        echo_error "请不要使用 root 用户运行此脚本"
        echo_info "使用普通用户运行，需要时会自动提示输入 sudo 密码"
        exit 1
    fi

    # 检测操作系统
    detect_os

    # 安装依赖
    install_docker
    install_python_pandoc
    install_nodejs

    # 配置系统
    configure_firewall

    # 部署应用
    deploy_app

    # 显示完成信息
    show_completion
}

# 运行主函数
main "$@"
