# 本地化模板渲染系统

## 实现概述

本系统完全摒弃了 Carbone Cloud API,基于开源库实现了一个完全本地化的 Word 模板渲染引擎。

## 核心特性

### 1. 完全本地化
- ❌ 不依赖外部 API
- ❌ 不需要 API 密钥
- ❌ 不需要联网
- ✅ 所有功能在本地完成

### 2. 自定义模板支持
- 用户可以上传自定义 .docx 模板
- 模板存储在本地文件系统 (`data/templates/`)
- 支持模板列表查询
- 支持模板删除

### 3. 模板语法
基于 docxtemplater,支持类似 Carbone 的语法:
- 基本变量: `{d.title}`
- 循环遍历: `{#d.sections}...{/d.sections}`
- 条件判断: `{#d.sections.len() > 0}...{/d.sections.len() > 0}`
- 索引访问: `{@index}`

### 4. 格式化器
实现了常用格式化器 (`lib/template-formatters.ts`):
- `upperCase()` - 大写
- `lowerCase()` - 小写
- `ucFirst()` - 首字母大写
- `ucWords()` - 每个单词首字母大写
- `substr()` - 截取
- `replace()` - 替换
- `len()` - 长度
- `padl()` / `padr()` - 填充
- `ellipsis()` - 省略号截断

### 5. API 路由

| 路由 | 方法 | 功能 |
|-----|------|------|
| `/api/template/upload` | POST | 上传模板到本地存储 |
| `/api/templates` | GET | 获取所有模板列表 |
| `/api/export/docx` | POST | 使用模板导出文档 |

## 文件结构

```
lib/
├── template-parser.ts      # 模板解析和渲染核心
├── template-storage.ts    # 本地模板存储管理
└── template-formatters.ts # 格式化器实现

app/api/
├── template/upload/
│   └── route.ts         # 模板上传 API
├── templates/
│   └── route.ts         # 模板列表 API
└── export/
    └── docx/route.ts    # 文档导出 API

data/
└── templates/           # 本地模板存储目录
```

## 核心实现

### 1. 模板上传 (`/api/template/upload`)
```typescript
- 接收 .docx 文件
- 提取模板占位符
- 保存到本地文件系统
- 返回模板 ID 和信息
```

### 2. 模板渲染 (`lib/template-parser.ts`)
```typescript
- 使用 PizZip 解压 .docx
- 使用 Docxtemplater 渲染模板
- 支持 linebreaks 自动换行
- 返回生成的 Buffer
```

### 3. 文档导出 (`/api/export/docx`)
```typescript
- 准备数据结构 (sections, outline, etc.)
- 加载本地模板
- 渲染模板并生成文档
- 返回文档流
```

## 与 Carbone Cloud API 的对比

| 特性 | Carbone Cloud | 本地实现 |
|-----|--------------|---------|
| 需要网络 | ✅ | ❌ |
| 需要密钥 | ✅ | ❌ |
| 付费 | ✅ (免费额度后) | ❌ |
| 模板存储 | 云端 | 本地 |
| 速度 | 受网络影响 | 本地快速 |
| 隐私 | 数据上传云端 | 数据不离开本地 |
| 自定义格式化器 | 限制 | 完全可控 |

## 使用示例

### 上传模板
```bash
curl -X POST http://localhost:3000/api/template/upload \
  -F "template=@my-template.docx"
```

响应:
```json
{
  "success": true,
  "templateId": "tpl_1736248900000_abc123def",
  "templateName": "my-template",
  "originalName": "my-template.docx",
  "fileSize": 12345,
  "placeholders": ["title", "date", "sections", "outline"]
}
```

### 导出文档
```bash
curl -X POST http://localhost:3000/api/export/docx \
  -H "Content-Type: application/json" \
  -d '{
    "customTemplateId": "tpl_1736248900000_abc123def",
    "blocks": [...],
    "outline": [...],
    "documentTitle": "My Document"
  }' \
  --output document.docx
```

## 技术栈

- **Next.js** - 框架
- **docxtemplater** - 模板引擎
- **PizZip** - ZIP 文件处理
- **docx** - 内置模板生成

## 扩展性

### 添加自定义格式化器

在 `lib/template-formatters.ts` 中添加:
```typescript
export function myCustomFormatter(str: string, param: string): string {
  // 你的逻辑
  return result;
}

export const formatters = {
  // ... 现有格式化器
  myCustomFormatter,
};
```

### 添加新的 API 路由

在 `app/api/` 下创建新的路由文件即可。

## 注意事项

1. **模板目录**: 模板文件存储在 `data/templates/`,确保该目录有写权限
2. **文件大小**: 建议单个模板文件不超过 10MB
3. **并发**: 当前实现没有加锁,高并发场景可能需要优化
4. **清理**: 可以使用 `cleanupOldTemplates()` 清理过期模板

## 性能

- **上传速度**: 取决于文件大小,通常 < 1s
- **渲染速度**: 通常 < 2s (取决于模板复杂度)
- **内存使用**: 约 50-100MB (取决于模板和文档大小)

## 未来改进

- [ ] 添加模板预览功能
- [ ] 支持更多格式化器
- [ ] 模板版本管理
- [ ] 模板分享功能
- [ ] 性能优化 (缓存等)
- [ ] 支持图片嵌入
- [ ] 支持表格循环
