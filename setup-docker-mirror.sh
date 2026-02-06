#!/bin/bash

# Docker 镜像加速器配置指南

cat << 'EOF'

╔════════════════════════════════════════════════════════════╗
║       Docker Desktop 镜像加速器配置指南                    ║
╚════════════════════════════════════════════════════════════╝

请按照以下步骤操作（需要手动配置）：

┌────────────────────────────────────────────────────────────┐
│ 步骤 1: 打开 Docker Desktop                                 │
└────────────────────────────────────────────────────────────┘

  找到并点击 Dock 栏中的 Docker 图标（鲸鱼图标）
  或使用 Spotlight 搜索 "Docker"


┌────────────────────────────────────────────────────────────┐
│ 步骤 2: 进入设置                                            │
└────────────────────────────────────────────────────────────┘

  点击 Docker Desktop 窗口右上角的 ⚙️ 设置图标


┌────────────────────────────────────────────────────────────┐
│ 步骤 3: 配置 Docker Engine                                  │
└────────────────────────────────────────────────────────────┘

  1. 在左侧菜单中选择 "Docker Engine"

  2. 在右侧的 JSON 编辑器中，找到现有配置

  3. 添加或修改 "registry-mirrors" 配置：

     {
       "builder": {
         "gc": {
           "defaultKeepStorage": "20GB",
           "enabled": true
         }
       },
       "experimental": false,
       "registry-mirrors": [
         "https://docker.m.daocloud.io",
         "https://docker.1panel.live",
         "https://hub.rat.dev"
       ]
     }

  4. 如果已有其他配置，只需添加 "registry-mirrors" 部分


┌────────────────────────────────────────────────────────────┐
│ 步骤 4: 应用并重启                                          │
└────────────────────────────────────────────────────────────┘

  点击右下角的 "Apply & Restart" 按钮


┌────────────────────────────────────────────────────────────┐
│ 步骤 5: 验证配置                                            │
└────────────────────────────────────────────────────────────┘

  等待 Docker Desktop 重启完成（约 10-30 秒）

  然后在终端运行：

    docker info | grep -A 5 "Registry Mirrors"

  应该能看到配置的镜像地址


╔════════════════════════════════════════════════════════════╗
║                  推荐的镜像加速器                           ║
╚════════════════════════════════════════════════════════════╝

  1. DaoCloud 镜像站: https://docker.m.daocloud.io
  2. 1Panel 镜像站:   https://docker.1panel.live
  3. Rat Dev 镜像站:  https://hub.rat.dev


╔════════════════════════════════════════════════════════════╗
║                      配置示例                               ║
╚════════════════════════════════════════════════════════════╝

完整的 Docker Engine 配置示例：

{
  "builder": {
    "gc": {
      "defaultKeepStorage": "20GB",
      "enabled": true
    }
  },
  "experimental": false,
  "registry-mirrors": [
    "https://docker.m.daocloud.io",
    "https://docker.1panel.live",
    "https://hub.rat.dev"
  ]
}


╔════════════════════════════════════════════════════════════╗
║                  配置完成后的操作                           ║
╚════════════════════════════════════════════════════════════╝

配置完成后，在此目录运行：

  cd /Users/2812019221qq.com/Documenton-NewVersionWebTextAIGenerator

  # 构建镜像
  docker-compose build

  # 启动服务
  docker-compose up -d

  # 访问应用
  # http://localhost:3001


╔════════════════════════════════════════════════════════════╗
║                    故障排查                                 ║
╚════════════════════════════════════════════════════════════╝

如果配置后仍无法拉取镜像：

1. 确认 Docker Desktop 已完全重启
2. 检查 JSON 格式是否正确（注意逗号）
3. 尝试重启电脑
4. 尝试更换其他镜像加速器


按 Enter 键继续...
EOF

read

echo ""
echo "现在为您打开 Docker Desktop..."
open -a Docker

echo ""
echo "等待 Docker Desktop 启动..."
sleep 3

echo ""
echo "✓ Docker Desktop 应该已经打开"
echo ""
echo "请按照上述步骤配置镜像加速器"
echo "配置完成后，请按任意键继续构建镜像..."
read -n 1 -s

echo ""
echo "正在验证 Docker 配置..."
if docker info > /dev/null 2>&1; then
    echo "✓ Docker 正在运行"
    echo ""
    echo "镜像加速器配置："
    docker info | grep -A 5 "Registry Mirrors" || echo "未检测到镜像加速器（可能需要重启 Docker）"
    echo ""
else
    echo "✗ Docker 未运行，请启动 Docker Desktop"
    exit 1
fi

echo ""
echo "是否现在开始构建 Docker 镜像？(y/n)"
read -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "开始构建..."
    cd "/Users/2812019221qq.com/Documenton-NewVersionWebTextAIGenerator"
    docker-compose build
else
    echo "稍后可以手动运行："
    echo "  cd /Users/2812019221qq.com/Documenton-NewVersionWebTextAIGenerator"
    echo "  docker-compose build"
fi
