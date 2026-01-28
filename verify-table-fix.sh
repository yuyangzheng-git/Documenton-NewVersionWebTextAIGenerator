#!/bin/bash

# 表格修复验证脚本
# 用于快速验证所有修改是否正确应用

echo "🔍 验证表格消失问题的修复..."
echo ""

cd /Users/2812019221qq.com/Documenton-NewVersionWebTextAIGenerator

# 验证点 1: 用户创建块的过滤
echo "✓ 检查点 1: 用户创建块应排除 generated- 前缀"
grep -n "!b.id.startsWith('generated-')" app/word-editor/page.tsx
if [ $? -eq 0 ]; then
  echo "  ✅ 已修改"
else
  echo "  ❌ 未找到修改"
fi
echo ""

# 验证点 2: 保留生成的流式块
echo "✓ 检查点 2: 应有专门保留生成块的逻辑"
grep -n "Preserve generated streaming blocks" app/word-editor/page.tsx
if [ $? -eq 0 ]; then
  echo "  ✅ 已添加"
else
  echo "  ❌ 未找到逻辑"
fi
echo ""

# 验证点 3: outlineItemId 提取和验证
echo "✓ 检查点 3: 应验证 outlineItemId 是否存在"
grep -n "validOutlineIds" app/word-editor/page.tsx
if [ $? -eq 0 ]; then
  echo "  ✅ 已添加"
else
  echo "  ❌ 未找到验证"
fi
echo ""

# 验证点 4: 生成完成时清理旧块
echo "✓ 检查点 4: 生成完成时应清理旧的 generated- 块"
grep -n "isGeneratedForThisItem" app/word-editor/page.tsx
if [ $? -eq 0 ]; then
  echo "  ✅ 已修改"
else
  echo "  ❌ 未找到修改"
fi
echo ""

# 验证点 5: 流式更新时清理
echo "✓ 检查点 5: 流式更新时应清理旧块"
grep -n "streaming-\${outlineItemId}-" app/word-editor/page.tsx
if [ $? -eq 0 ]; then
  echo "  ✅ 已修改"
else
  echo "  ❌ 未找到修改"
fi
echo ""

# 验证点 6: tableData 传递
echo "✓ 检查点 6: 表格应保留 tableData"
grep -n "tableData: block.properties.tableData" app/word-editor/page.tsx
if [ $? -eq 0 ]; then
  echo "  ✅ 已保留"
else
  echo "  ⚠️  请检查表格数据传递"
fi
echo ""

echo "=========================================="
echo "验证完成！"
echo ""
echo "📝 下一步："
echo "1. 运行 npm run dev 启动应用"
echo "2. 生成包含表格的内容"
echo "3. 检查表格是否在生成完成后保留"
echo "4. 查看控制台日志确认无警告"
echo ""
echo "🐛 调试日志关键词："
echo "  - '🔍 Preserving generated blocks'"
echo "  - '📊 Converted notion blocks'"
echo "  - '➕ New blocks with tableData'"
echo "=========================================="
