#!/bin/bash

# 热重载开发环境停止脚本

echo "🛑 停止热重载开发环境..."

docker-compose -f docker-compose.hotreload.yml down

echo ""
echo "✅ 热重载开发环境已停止"
echo ""
echo "💡 提示："
echo "  • 重新启动: ./dev-start-hotreload.sh"
echo "  • 启动生产环境: docker-compose up -d"
echo ""
