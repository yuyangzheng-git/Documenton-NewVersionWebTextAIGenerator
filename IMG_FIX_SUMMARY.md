# 图片加载错误修复

## 问题

控制台报错：
```
Image failed to load
```

## 原因

1. **无效的图片 URL**：图片 content 可能为空字符串或无效的 URL
2. **缺少错误处理**：图片加载失败时只隐藏了元素，但控制台仍有错误
3. **导出时没有验证**：在导出为 HTML 时没有验证图片 URL 的有效性

## 修复内容

### 1. 改进图片错误处理（NotionBlock.tsx）

**位置**：`ai-document-generator/components/NotionBlock.tsx` 第 711-714 行

**修复前**：
```typescript
onError={(e) => {
  console.error('Image failed to load');
  (e.target as HTMLImageElement).style.display = 'none';
}}
```

**修复后**：
```typescript
onError={(e) => {
  console.error('Image failed to load:', block.content);
  // 隐藏失败的图片
  (e.target as HTMLImageElement).style.display = 'none';
  // 显示友好的错误提示
  const parent = (e.target as HTMLImageElement).parentElement;
  if (parent) {
    const errorDiv = document.createElement('div');
    errorDiv.innerHTML = `
      <div style="padding: 20px; background: rgba(255, 87, 87, 0.1); ...">
        [图片加载失败]
      </div>
    `;
    parent.appendChild(errorDiv);
  }
}}
```

**改进**：
- 记录失败的图片 URL，便于调试
- 显示友好的错误提示，而不是空白
- 提示用户可以点击重新上传

### 2. 验证图片 URL（word-editor/page.tsx）

**位置**：`ai-document-generator/app/word-editor/page.tsx` 的 `convertBlocksToHtml` 函数

**修复前**：
```typescript
case 'image':
  html += `<img src="${block.content || ''}" alt="图片" />\n`;
  break;
```

**修复后**：
```typescript
case 'image':
  const imageSrc = block.content?.trim();
  if (imageSrc && (imageSrc.startsWith('http') || imageSrc.startsWith('data:image'))) {
    html += `<img src="${imageSrc}" alt="图片" />\n`;
  } else {
    html += `<p>[图片加载失败]</p>\n`;
  }
  break;
```

**改进**：
- 只导出有效的图片 URL（http 或 data:image）
- 无效图片显示为文本提示，避免 Pandoc 错误
- 添加 trim() 处理空格

### 3. 修复 Dockerfile

**修复前**：
```dockerfile
COPY ../document_generator.py ./document_generator.py
COPY ../reference_template.docx ./reference_template.docx 2>/dev/null || true
```

**问题**：Dockerfile 中 `COPY` 多个源文件时，目标必须是目录并以 `/` 结尾

**修复后**：
```dockerfile
COPY . .
RUN if [ -f requirements.txt ]; then pip3 install --no-cache-dir -r requirements.txt; fi
```

**改进**：
- 简化复制逻辑，一次性复制所有文件
- 条件安装 Python 依赖，避免文件不存在时出错
- 模板文件通过 volume 挂载

## 测试建议

### 1. 测试无效图片

1. 在编辑器中添加图片 block
2. 输入无效的 URL（如 `http://invalid.example.com/image.png`）
3. 验证：
   - 图片应该隐藏
   - 显示友好的错误提示
   - 控制台记录错误的 URL

### 2. 测试空图片

1. 清空图片 block 的 content
2. 验证：
   - 显示上传提示
   - 导出时不包含无效的 `<img>` 标签

### 3. 测试导出

1. 创建包含以下内容的文档：
   - 有效的图片 URL
   - 无效的图片 URL
   - Base64 图片
2. 导出为 Word
3. 验证：
   - 有效图片正确显示
   - 无效图片显示为文本提示
   - 不出现 Pandoc 错误

## 相关文件

- `ai-document-generator/components/NotionBlock.tsx` - 图片显示和错误处理
- `ai-document-generator/app/word-editor/page.tsx` - HTML 转换和图片验证
- `ai-document-generator/Dockerfile` - Docker 配置修复

## 后续优化

1. **图片上传验证**：在上传前验证图片是否可访问
2. **图片压缩**：自动压缩大图片
3. **占位符图片**：使用占位符服务（如 placehold.co）
4. **错误重试**：自动重试失败的图片加载
5. **图片缓存**：缓存已上传的图片
