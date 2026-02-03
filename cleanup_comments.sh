#!/bin/bash

# 查找包含中文、emoji或不规范注释的文件
echo "=== 检查注释规范性 ==="

# 检查组件文件
for file in components/**/*.{ts,tsx} lib/**/*.{ts,tsx} app/**/*.{ts,tsx} store/**/*.ts hooks/**/*.ts; do
  if [ -f "$file" ]; then
    # 检查是否有 emoji
    if grep -q "[🎯📝💡🔧⚠️🆕✅❌🚀🔍📊🎨🔑🔄]" "$file" 2>/dev/null; then
      echo "📋 $file - 包含 emoji"
    fi
  fi
done

