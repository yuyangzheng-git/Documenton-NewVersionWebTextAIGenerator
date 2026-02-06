#!/bin/bash

# Documenton 裸机部署快速脚本
# 适用于已安装 uv 和 Node.js 的环境

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
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

echo ""
echo "========================================="
echo "  Documenton 裸机部署脚本"
echo "========================================="
echo ""

# 检查依赖
echo "🔍 检查环境依赖..."
echo ""

# 检查 Node.js
if ! command -v node &> /dev/null; then
    echo_error "未安装 Node.js，请先安装 Node.js 18+"
    exit 1
fi
echo_info "Node.js: $(node -v)"

# 检查 npm
if ! command -v npm &> /dev/null; then
    echo_error "未安装 npm"
    exit 1
fi
echo_info "npm: $(npm -v)"

# 检查 uv
if ! command -v uv &> /dev/null; then
    echo_error "未安装 uv，请先安装: curl -LsSf https://astral.sh/uv/install.sh | sh"
    exit 1
fi
echo_info "uv: $(uv --version)"

# 检查 Pandoc
if ! command -v pandoc &> /dev/null; then
    echo_error "未安装 Pandoc，请先安装"
    echo "Ubuntu/Debian: sudo apt-get install pandoc"
    echo "CentOS/RHEL: sudo yum install pandoc"
    exit 1
fi
echo_info "Pandoc: $(pandoc --version | head -1)"

echo ""
echo "========================================="
echo "  开始部署"
echo "========================================="
echo ""

# 1. 安装 Python 依赖
echo "📦 安装 Python 依赖（使用 uv）..."
if [ ! -d ".venv" ]; then
    uv venv
    echo_info "虚拟环境已创建"
fi

source .venv/bin/activate
uv pip install -r requirements.txt
PYTHON_PATH=$(which python)
echo_info "Python 依赖安装完成"
echo_info "Python 路径: $PYTHON_PATH"
deactivate

# 2. 安装 Node.js 依赖
echo ""
echo "📦 安装 Node.js 依赖..."
npm install
echo_info "Node.js 依赖安装完成"

# 3. 配置环境变量
echo ""
if [ ! -f ".env.local" ]; then
    echo "⚙️  配置环境变量..."
    cp .env.example .env.local

    # 自动设置 PYTHON_PATH
    if [ -n "$PYTHON_PATH" ]; then
        echo "" >> .env.local
        echo "# Auto-configured Python path" >> .env.local
        echo "PYTHON_PATH=$PYTHON_PATH" >> .env.local
        echo_info "已自动配置 PYTHON_PATH: $PYTHON_PATH"
    fi

    echo ""
    echo_warn "请编辑 .env.local 配置 Dify API 密钥"
    echo ""
    read -p "现在编辑 .env.local? (Y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Nn]$ ]]; then
        ${EDITOR:-nano} .env.local
    fi
else
    echo_info ".env.local 已存在，跳过配置"

    # 检查是否已设置 PYTHON_PATH
    if ! grep -q "PYTHON_PATH=" .env.local; then
        echo ""
        echo_warn ".env.local 中未找到 PYTHON_PATH 配置"
        echo "建议添加以下配置："
        echo "PYTHON_PATH=$PYTHON_PATH"
        echo ""
        read -p "自动添加 PYTHON_PATH 配置? (Y/n) " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Nn]$ ]]; then
            echo "" >> .env.local
            echo "# Python path for export functionality" >> .env.local
            echo "PYTHON_PATH=$PYTHON_PATH" >> .env.local
            echo_info "已添加 PYTHON_PATH 配置"
        fi
    fi
fi

# 4. 创建日志目录
echo ""
echo "📁 创建日志目录..."
mkdir -p logs
echo_info "日志目录已创建"

# 5. 构建项目
echo ""
echo "🔨 构建 Next.js 项目..."
npm run build
echo_info "构建完成"

# 6. 安装 PM2（如果未安装）
echo ""
if ! command -v pm2 &> /dev/null; then
    echo "📦 安装 PM2..."
    read -p "是否安装 PM2 进程管理器? (Y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Nn]$ ]]; then
        npm install -g pm2
        echo_info "PM2 安装完成"
    else
        echo_warn "跳过 PM2 安装"
    fi
else
    echo_info "PM2 已安装: $(pm2 -v)"
fi

# 7. 启动应用
echo ""
echo "========================================="
echo "  准备启动应用"
echo "========================================="
echo ""

if command -v pm2 &> /dev/null; then
    echo "选择启动方式:"
    echo "1) 使用 PM2 启动（推荐）"
    echo "2) 直接运行（前台）"
    read -p "请选择 (1/2): " -n 1 -r
    echo

    if [[ $REPLY == "1" ]]; then
        echo ""
        echo "🚀 使用 PM2 启动应用..."
        pm2 start ecosystem.config.js

        echo ""
        echo_info "应用已启动"
        echo ""
        echo "PM2 常用命令:"
        echo "  查看状态: pm2 status"
        echo "  查看日志: pm2 logs documenton"
        echo "  停止应用: pm2 stop documenton"
        echo "  重启应用: pm2 restart documenton"
        echo "  保存列表: pm2 save"
        echo "  开机自启: pm2 startup"
        echo ""

        read -p "是否保存 PM2 进程列表? (Y/n) " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Nn]$ ]]; then
            pm2 save
            echo_info "PM2 进程列表已保存"
        fi

        echo ""
        read -p "是否设置开机自启? (Y/n) " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Nn]$ ]]; then
            echo ""
            echo "请执行以下命令设置开机自启:"
            pm2 startup
        fi
    else
        echo ""
        echo "🚀 直接启动应用（前台运行）..."
        echo_warn "应用将在前台运行，按 Ctrl+C 停止"
        echo ""
        npm start
    fi
else
    echo "🚀 启动应用..."
    echo_warn "应用将在前台运行，按 Ctrl+C 停止"
    echo_warn "建议安装 PM2: npm install -g pm2"
    echo ""
    npm start
fi

echo ""
echo "========================================="
echo "  部署完成！"
echo "========================================="
echo ""
echo "访问地址:"
echo "  http://localhost:3000"
echo "  http://$(hostname -I | awk '{print $1}' 2>/dev/null || echo 'your-server-ip'):3000"
echo ""
echo "验证部署:"
echo "  curl http://localhost:3000/api/health"
echo ""
echo "文档:"
echo "  详细指南: BARE_METAL_DEPLOYMENT.md"
echo ""
