#!/bin/bash

# Docker 镜像加速配置脚本

echo "================================================"
echo "  Docker 镜像加速配置"
echo "================================================"
echo ""

echo "请按照以下步骤配置 Docker Desktop 镜像加速："
echo ""
echo "方法 1: 图形界面配置（推荐）"
echo "  1. 打开 Docker Desktop"
echo "  2. 点击右上角设置图标（齿轮）"
echo "  3. 进入 'Docker Engine' 标签"
echo "  4. 在 JSON 配置中添加以下内容："
echo ""
echo '  {'
echo '    "registry-mirrors": ['
echo '      "https://docker.m.daocloud.io",'
echo '      "https://docker.1panel.live",'
echo '      "https://hub.rat.dev"'
echo '    ]'
echo '  }'
echo ""
echo "  5. 点击 'Apply & Restart'"
echo ""
echo "方法 2: 命令行配置"
echo "  运行以下命令："
echo '  echo "{\"registry-mirrors\":[\"https://docker.m.daocloud.io\"]}" > ~/.docker/daemon.json'
echo ""
echo "配置完成后，按任意键继续..."
read -n 1 -s

echo ""
echo "正在重启 Docker..."
osascript -e 'quit app "Docker"'
sleep 3
open -a Docker
echo "等待 Docker 启动..."
sleep 10

echo "Docker 已重启，现在可以构建镜像了"
