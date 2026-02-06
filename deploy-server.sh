#!/bin/bash

# 服务器部署脚本 - 用于部署到 Dify 所在的同一台服务器
# 服务器IP: 10.23.22.37

set -e  # 遇到错误立即退出

echo "=========================================="
echo "  部署文档生成应用到服务器"
echo "  目标服务器: 10.23.22.37"
echo "  Dify地址: http://host.docker.internal/v1"
echo "=========================================="
echo ""

# 检查 Docker 是否安装
if ! command -v docker &> /dev/null; then
    echo "❌ 错误: Docker 未安装"
    echo "请先安装 Docker: https://docs.docker.com/engine/install/"
    exit 1
fi

# 检查 Docker Compose 是否安装
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo "❌ 错误: Docker Compose 未安装"
    echo "请先安装 Docker Compose"
    exit 1
fi

# 检查 .env.local 文件
if [ ! -f .env.local ]; then
    echo "⚠️  警告: .env.local 文件不存在"
    echo "创建默认配置文件..."
    cat > .env.local <<EOF
NEXT_PUBLIC_DIFY_BASE_URL=http://host.docker.internal/v1
NEXT_PUBLIC_DIFY_OUTLINE_KEY=app-yIhd9xD2SHZ6e9BNTYSWEfYD
NEXT_PUBLIC_DIFY_CHAPTER_KEY=app-wqO8BTPC99CwAGFDabEze6Uz
NEXT_PUBLIC_DIFY_LLM_KEY=app-ThlXmch2AjSRdv6kuvacb4bM
REDIS_URL=redis://redis:6379
CACHE_ENABLED=1
EOF
    echo "✅ 已创建 .env.local"
fi

echo "📋 当前配置："
echo "   Dify Base URL: http://host.docker.internal/v1"
echo "   应用端口: 3001"
echo "   Redis端口: 6379"
echo "   Redis Commander端口: 8081"
echo ""

# 询问是否继续
read -p "是否继续部署？(y/n) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ 取消部署"
    exit 0
fi

# 停止旧容器（如果存在）
echo "🛑 停止旧容器..."
docker-compose -f docker-compose.server.yml down 2>/dev/null || true

# 清理旧镜像（可选）
read -p "是否清理旧镜像？(y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🧹 清理旧镜像..."
    docker-compose -f docker-compose.server.yml build --no-cache
else
    echo "🔨 构建镜像..."
    docker-compose -f docker-compose.server.yml build
fi

# 启动服务
echo "🚀 启动服务..."
docker-compose -f docker-compose.server.yml up -d

# 等待服务启动
echo "⏳ 等待服务启动..."
sleep 10

# 检查服务状态
echo ""
echo "📊 服务状态："
docker-compose -f docker-compose.server.yml ps

# 检查健康状态
echo ""
echo "🏥 健康检查："
for i in {1..6}; do
    if curl -s http://localhost:3001/api/health > /dev/null 2>&1; then
        echo "✅ 应用健康检查通过"
        break
    else
        if [ $i -eq 6 ]; then
            echo "⚠️  应用健康检查失败，请查看日志"
            echo "   查看日志: docker-compose -f docker-compose.server.yml logs app"
        else
            echo "   等待中... ($i/6)"
            sleep 5
        fi
    fi
done

# 测试 Dify 连接
echo ""
echo "🔗 测试 Dify 连接..."
docker exec ai-document-generator sh -c "wget -q --spider --timeout=5 http://host.docker.internal/ 2>&1" && \
    echo "✅ Dify 连接成功" || \
    echo "⚠️  Dify 连接失败，请检查 Dify 服务是否运行"

echo ""
echo "=========================================="
echo "  ✅ 部署完成！"
echo "=========================================="
echo ""
echo "📍 访问地址："
echo "   • 主应用: http://10.23.22.37:3001"
echo "   • 或使用: http://localhost:3001 (在服务器上)"
echo "   • Redis Commander: http://10.23.22.37:8081"
echo ""
echo "📝 常用命令："
echo "   • 查看日志: docker-compose -f docker-compose.server.yml logs -f"
echo "   • 查看状态: docker-compose -f docker-compose.server.yml ps"
echo "   • 停止服务: docker-compose -f docker-compose.server.yml down"
echo "   • 重启服务: docker-compose -f docker-compose.server.yml restart"
echo ""
echo "🔧 故障排查："
echo "   • 查看应用日志: docker-compose -f docker-compose.server.yml logs app"
echo "   • 进入容器: docker exec -it ai-document-generator sh"
echo "   • 测试Dify连接: docker exec ai-document-generator wget -O- http://host.docker.internal/"
echo ""
