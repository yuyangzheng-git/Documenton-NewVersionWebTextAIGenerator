#!/bin/bash

# 热重载开发环境启动脚本

echo "🔥 启动热重载开发环境..."
echo ""
echo "特性："
echo "  ✅ 代码实时热重载"
echo "  ✅ 修改代码自动刷新浏览器"
echo "  ✅ 完整的 Docker 容器化"
echo "  ✅ Redis 缓存支持"
echo ""

# 检查 .env.local 文件
if [ ! -f .env.local ]; then
    echo "❌ 错误: .env.local 文件不存在"
    echo "请先创建 .env.local 文件并配置 Dify API 密钥"
    exit 1
fi

# 停止生产环境（如果在运行）
if docker ps | grep -q "ai-document-generator"; then
    echo "📦 检测到生产环境正在运行，正在停止..."
    docker-compose down
fi

# 构建并启动开发环境
echo "🚀 构建开发环境镜像..."
docker-compose -f docker-compose.hotreload.yml build

echo ""
echo "🎯 启动服务..."
docker-compose -f docker-compose.hotreload.yml up -d

echo ""
echo "⏳ 等待服务启动..."
sleep 5

# 检查服务状态
echo ""
echo "📊 服务状态："
docker-compose -f docker-compose.hotreload.yml ps

echo ""
echo "✅ 热重载开发环境已启动！"
echo ""
echo "📍 访问地址："
echo "  • 主应用: http://localhost:3000"
echo "  • Redis Commander: http://localhost:8081"
echo ""
echo "💡 使用说明："
echo "  • 修改代码会自动重新编译和刷新浏览器"
echo "  • 查看日志: docker-compose -f docker-compose.hotreload.yml logs -f app"
echo "  • 停止服务: ./dev-stop-hotreload.sh 或 docker-compose -f docker-compose.hotreload.yml down"
echo ""
