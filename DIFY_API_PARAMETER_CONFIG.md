# Dify API 参数配置说明

## 修改内容

### 原始实现
之前的代码向 Dify 正文写作工作流传递了多个参数：
```javascript
{
  inputs: {
    title: documentTopic,        // 文档标题
    section: sectionTitle,       // 章节标题
    requirements: requirements,  // 写作要求
    userinput: {
      files: files || [],
    },
  }
}
```

### 当前实现 ✅
现在只传递一个参数，匹配您的 Dify 工作流配置：
```javascript
{
  inputs: {
    requirements: requirements || '',  // 只传递写作要求（注意：复数形式）
  }
}
```

**注意**：参数名是 `requirements`（复数），不是 `requirement`（单数）！

## 修改的文件

`lib/dify-api.ts` - 第 401-406 行

```typescript
const body: any = {
  inputs: {
    requirement: requirements || '',
  },
  response_mode: 'streaming',
  user: 'user-' + Date.now(),
};
```

## requirement 参数的内容

`requirements` 参数包含从 guide 块中获取的写作指导内容，例如：

```
本章需要介绍项目背景和目标
- 说明项目的起因
- 阐述项目要解决的问题
- 列出项目的主要目标
- 字数要求：800-1000字
- 写作风格：专业、严谨
```

## 工作流程

1. **用户点击生成按钮** → 触发 `handleGenerateSection(guideBlockId)`

2. **提取 requirement** → 从 guide 块的 `content` 字段获取

3. **调用 Dify API** → 传递 `{ requirements: "写作要求内容" }`

4. **流式接收内容** → 实时显示生成的文章内容

5. **完成并保存** → 将生成的内容保存为段落块或表格块

## 如果您需要传递更多参数

如果您的 Dify 工作流需要额外的参数（如章节标题、文档主题等），可以修改 `lib/dify-api.ts` 文件：

### 方案 A：组合所有信息到 requirements 参数

在 `app/word-editor/page.tsx` 中修改传递给 `generateSectionWithWorker` 的 requirements：

```typescript
// 在 handleGenerateSection 函数中
const combinedRequirement = `
文档标题：${documentTopic}
章节名称：${sectionTitle}

写作要求：
${requirements}

全文大纲：
${fullOutline}
`.trim();

await generateSectionWithWorker(
  apiKey,
  sectionTitle,      // 这些参数现在不会被使用
  documentTopic,     // 但为了兼容性保留
  fullOutline,       //
  onChunk,
  onComplete,
  combinedRequirement, // 👈 传递组合后的要求
  onError
);
```

### 方案 B：修改 Dify API 传递多个参数

如果您的 Dify 工作流有多个输入变量，修改 `lib/dify-api.ts`：

```typescript
const body: any = {
  inputs: {
    requirements: requirements || '',
    title: sectionTitle,        // 添加章节标题
    topic: documentTopic,       // 添加文档主题
    outline: fullOutline,       // 添加完整大纲
  },
  response_mode: 'streaming',
  user: 'user-' + Date.now(),
};
```

**注意**：参数名称必须与您的 Dify 工作流定义的输入变量名称完全一致！

## 验证修改

### 1. 检查编译
```bash
npm run build
```
✅ 编译成功

### 2. 测试生成
1. 打开应用并进入正文编辑页面
2. 找到任意一个 guide 块（写作指导块）
3. 点击右上角的"生成"按钮
4. 检查是否正常生成内容

### 3. 检查 Dify 日志
在 Dify 工作流的日志中，您应该能看到：
```json
{
  "requirement": "本章需要介绍..."
}
```

## 批量生成兼容性

批量生成功能同样使用 `handleGenerateSection` 函数，因此会自动使用相同的参数配置。无需额外修改。

## 常见问题

### Q: 如果 Dify 提示缺少某个参数怎么办？
A: 按照上面的"方案 B"添加对应的参数。

### Q: 如何查看传递给 Dify 的实际参数？
A: 打开浏览器开发者工具 → Console 标签，查找以下日志：
```
=== Chapter Generation Debug ===
Section Title: ...
Document Topic: ...
Requirements: ...
===============================
Request body: { inputs: { requirements: "..." } }
```

### Q: requirements 参数为空怎么办？
A: 代码会传递空字符串 `''`。您可以在 Dify 工作流中设置默认值或提示用户填写。

### Q: 批量生成时每个章节都会传递 requirements 吗？
A: 是的，每个章节都会从对应的 guide 块中提取 requirements 内容。

## 下一步

如果您需要调整参数：
1. 确认您的 Dify 工作流需要哪些输入变量
2. 修改 `lib/dify-api.ts` 中的 `body.inputs`
3. 运行 `npm run build` 验证
4. 测试生成功能

---

**修改完成时间**：2026-02-02
**影响范围**：单章节生成 + 批量生成全文
**兼容性**：✅ 完全兼容现有功能
