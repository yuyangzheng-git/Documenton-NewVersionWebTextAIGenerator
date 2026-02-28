#!/bin/bash
# 服务器快速部署脚本 - v1.2.2
# 使用方法: bash deploy.sh

set -e  # 遇到错误立即退出

echo "🚀 开始部署 Documenton v1.2.2..."
echo ""

# 1. 停止当前服务
echo "📦 停止当前服务..."
pm2 stop ai-document-generator || echo "服务未运行"

# 2. 拉取最新代码
echo "📥 拉取最新代码..."
git pull origin main

# 3. 显示版本信息
echo "✅ 当前版本:"
git log --oneline -1

# 4. 检查环境变量
echo ""
echo "🔍 检查环境变量配置..."
if [ -f .env.local ]; then
    echo "✅ .env.local 已存在"
    grep "NEXT_PUBLIC_USE_CROSS_ORIGIN_MODE" .env.local || echo "⚠️  未找到 CROSS_ORIGIN_MODE 配置"
else
    echo "❌ .env.local 不存在！"
    echo "请创建 .env.local 文件，参考 .env.example"
    exit 1
fi

# 5. 安装依赖（可选）
echo ""
read -p "是否重新安装依赖? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "📦 安装依赖..."
    npm install
fi

# 6. 构建生产版本
echo ""
echo "🔨 构建生产版本..."
npm run build

# 7. 启动服务
echo ""
echo "🚀 启动服务..."
pm2 start npm --name "ai-document-generator" -- start || pm2 restart ai-document-generator
pm2 save

# 8. 显示状态
echo ""
echo "✅ 部署完成！"
echo ""
pm2 status

echo ""
echo "📊 查看日志:"
echo "  pm2 logs ai-document-generator"
echo ""
echo "🌐 访问地址:"
echo "  http://10.23.22.37:3000"
echo ""
echo "📚 文档:"
echo "  - SERVER_DEPLOY_GUIDE.md: 完整部署指南"
echo "  - OUTLINE_PROCESSING_FIX.md: 大纲处理优化说明"
echo "  - DUAL_MODE_GUIDE.md: 导航模式使用指南"
