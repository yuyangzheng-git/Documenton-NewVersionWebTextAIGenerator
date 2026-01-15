# 代码修改完整总结

## 概述

本文档总结了 AI 文档生成器项目的所有关键修改，包括章节内容规划（requirements）功能、段落分段处理、首行缩进等。

---

## 一、核心数据结构修改

### 1.1 OutlineItem 接口扩展

**文件**: `store/useStore.ts` (第 4-13 行)

```typescript
export interface OutlineItem {
  id: string;
  title: string;
  level: 1 | 2 | 3;
  status: 'idle' | 'generating' | 'completed' | 'pending';
  content?: string;              // 章节生成的完整内容
  requirements?: string;          // ← 新增：章节内容规划
  number?: string;               // ← 新增：自动编号（1, 1.1, 2, 2.1...）
  paragraphs?: string[];         // ← 新增：分段后的段落列表
}
```

### 1.2 GenerateContentOptions 扩展

**文件**: `lib/ai/types.ts`

```typescript
export interface GenerateContentOptions {
  sectionTitle: string;
  documentTopic: string;
  fullOutline: string;
  requirements?: string;  // ← 新增：章节内容规划
}
```

---

## 二、大纲生成功能

### 2.1 Dify API 调用

**文件**: `lib/dify-api.ts` (第 173-310 行)

```typescript
export async function generateOutlineWithPlanner(
  apiKey: string,
  topic: string,
  style: string = '专业严肃',
  files?: DifyFileInput[]
): Promise<DifyOutlineItem[]> {
  try {
    const baseUrl = getDifyApiBaseUrl();

    // 调试信息
    console.log('=== Dify Planner API Debug Info ===');
    console.log('Base URL:', baseUrl);
    console.log('API Key:', apiKey);
    console.log('Topic:', topic);

    const body: any = {
      inputs: { topic, style },
      response_mode: 'blocking',
      user: 'user-' + Date.now(),
    };

    const response = await fetch(`${baseUrl}/workflows/run`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    // 解析 AI 返回的 JSON
    const outputText = result.data?.outputs?.text || '';
    const outline = JSON.parse(extractJson(outputText));

    // 验证 requirements 字段
    if (!Array.isArray(outline)) {
      throw new Error('Outline should be an array of items');
    }

    return outline;
  }
}
```

### 2.2 大纲处理逻辑

**文件**: `store/useDocumentActions.ts` (第 6-27 行)

```typescript
export const generateOutline = async (prompt: string) => {
  const apiKey = useStore.getState().apiKey;

  // 调用 Dify API
  const outline = await generateOutlineAPI(apiKey, prompt);

  // 转换为 OutlineItem 格式
  const outlineWithStatus: OutlineItem[] = outline.map((item) => ({
    id: item.id,
    title: item.title,
    level: item.level as 1 | 2,
    status: 'pending' as const,
    requirements: item.requirements,  // ← 保留 requirements
  }));

  // 存储到 store
  useStore.getState().setOutline(outlineWithStatus);
  return outlineWithStatus;
};
```

---

## 三、章节生成功能

### 3.1 章节生成（单个）

**文件**: `components/outline/OutlinePanel.tsx` (第 37-96 行)

```typescript
const handleGenerateChapter = async (itemId: string) => {
  const item = outline.find(i => i.id === itemId);
  updateItem(itemId, { status: 'generating', content: '' });

  const fullOutline = outline.map(i => `${i.number ? i.number + ' ' : ''}${i.title}`).join('\n');

  console.log('Generating chapter for:', item.title);
  console.log('Requirements:', item.requirements || '(none)');

  let accumulatedContent = '';

  await generateSectionWithWorker(
    chapterApiKey,
    item.title,
    documentTopic,
    fullOutline,
    (text: string) => {
      // 流式接收内容
      accumulatedContent += text;
      updateItem(itemId, { content: accumulatedContent });
    },
    () => {
      // ← 关键：生成完成，分段处理
      const paragraphs = accumulatedContent
        .split(/(\n\s*\n|\n{2,})/g)  // 按双换行或连续换行分割
        .filter(p => {
          const trimmed = p.trim();
          return trimmed && !trimmed.match(/^\s*$/);  // 过滤空行
        })
        .map(p => p.replace(/\s+/g, ' ').trim());  // 合并多余空格

      // 存储分段数据
      updateItem(itemId, {
        status: 'completed',
        content: accumulatedContent,
        paragraphs: paragraphs  // ← 存储分段列表
      });

      setIsGenerating(false);
    },
    item.requirements,  // ← 传入章节内容规划
    onError
  );
};
```

### 3.2 递归生成子章节

**文件**: `components/outline/OutlinePanel.tsx` (第 98-164 行)

```typescript
const generateAllChildren = async (parentId: string) => {
  const parentIndex = outline.findIndex(i => i.id === parentId);
  const parentLevel = outline[parentIndex].level;

  // 找出所有子章节（level 更高的连续项）
  const childItems: OutlineItem[] = [];
  for (let i = parentIndex + 1; i < outline.length; i++) {
    const currentItem = outline[i];
    if (currentItem.level > parentLevel) {
      childItems.push(currentItem);
    } else {
      break;  // 遇到兄弟或父级，停止
    }
  }

  // 顺序生成每个子章节
  for (const childItem of childItems) {
    if (childItem.content) {
      console.log(`Skipping ${childItem.title} - already has content`);
      continue;
    }

    try {
      updateItem(childItem.id, { status: 'generating', content: '' });

      const fullOutline = outline.map(i => `${i.number ? i.number + ' ' : ''}${i.title}`).join('\n');

      let accumulatedContent = '';

      await generateSectionWithWorker(
        chapterApiKey,
        childItem.title,
        documentTopic,
        fullOutline,
        (text: string) => {
          accumulatedContent += text;
          updateItem(childItem.id, { content: accumulatedContent });
        },
        () => {
          // ← 同样的分段处理
          const paragraphs = accumulatedContent
            .split(/(\n\s*\n|\n{2,})/g)
            .filter(p => p.trim())
            .map(p => p.replace(/\s+/g, ' ').trim());

          updateItem(childItem.id, {
            status: 'completed',
            content: accumulatedContent,
            paragraphs: paragraphs
          });

          console.log('Chapter generation completed:', childItem.title);
        },
        childItem.requirements,  // ← 传入 requirements
        onError
      );
    } catch (error) {
      console.error('生成章节失败:', error);
      updateItem(childItem.id, { status: 'pending' });
      alert(`生成失败: ${childItem.title} - ${error.message}`);
    }
  }

  setIsGenerating(false);
  console.log('All child chapters generation completed');
};
```

---

## 四、编辑器显示逻辑

### 4.1 Requirements 显示规则

**文件**: `app/word-editor/page.tsx` (第 169-192 行)

```typescript
// 只有 level 2 的章节在生成内容前显示 requirements
// Level 1 不显示 requirements
if (item.level === 2 && item.requirements && !item.content) {
  const reqBlockId = `requirements-${item.id}`;

  // 检查是否已有编辑过的块
  const existingBlock = blocks.find(b => b.id === reqBlockId);

  if (existingBlock) {
    // 保留用户编辑的内容
    if (!generatedBlockIds.has(existingBlock.id)) {
      notionBlocks.push(existingBlock);
      generatedBlockIds.add(existingBlock.id);
    }
  } else if (!generatedBlockIds.has(reqBlockId)) {
    // 创建新的 requirements 块
    notionBlocks.push({
      id: reqBlockId,
      type: 'paragraph',
      content: item.requirements,
      properties: {},
      children: [],
    });
    generatedBlockIds.add(reqBlockId);
  }
}
```

### 4.2 段落分段显示（核心功能）

**文件**: `app/word-editor/page.tsx` (第 195-242 行)

```typescript
// 添加内容块（优先显示分段）
if (item.content) {
  // ← 关键：如果有段落列表，将每个段落作为独立块显示
  if (item.paragraphs && item.paragraphs.length > 0) {
    item.paragraphs.forEach((paragraph, index) => {
      const blockId = `content-${item.id}-p${index}`;  // ID 格式：content-1-1-p0

      // 检查重复 ID（避免 React key 冲突）
      if (generatedBlockIds.has(blockId)) {
        console.warn('Skipping duplicate paragraph block:', blockId);
        return;
      }

      // 保留用户编辑的内容
      const existingBlock = blocks.find(b => b.id === blockId);
      if (existingBlock) {
        notionBlocks.push(existingBlock);
      } else {
        // 创建新的段落块
        notionBlocks.push({
          id: blockId,
          type: 'paragraph',
          content: paragraph,
          properties: {},
          children: [],
        });
      }
      generatedBlockIds.add(blockId);
    });
  } else {
    // 如果没有段落列表，将整个内容作为一个块
    const blockId = `content-${item.id}`;

    if (!generatedBlockIds.has(blockId)) {
      const existingBlock = blocks.find(b => b.id === blockId);
      if (existingBlock) {
        notionBlocks.push(existingBlock);
      } else {
        notionBlocks.push({
          id: blockId,
          type: 'paragraph',
          content: item.content,
          properties: {},
          children: [],
        });
      }
      generatedBlockIds.add(blockId);
    }
  }
}
```

### 4.3 段落编辑同步

**文件**: `app/word-editor/page.tsx` (第 26-78 行)

```typescript
const handleBlockUpdate = (id: string, updates: Partial<NotionBlock>) => {
  setBlocks(prev => prev.map(block =>
    block.id === id ? { ...block, ...updates } : block
  ));

  // ← 更新 requirements 块
  if (id.startsWith('requirements-')) {
    const outlineItemId = id.replace('requirements-', '');
    if (updates.content !== undefined) {
      updateItem(outlineItemId, { requirements: updates.content });
    }
  }

  // ← 更新 content 块（支持分段）
  if (id.startsWith('content-')) {
    const paragraphMatch = id.match(/^content-([^-]+)-p(\d+)$/);

    if (paragraphMatch) {
      // 这是段落块：content-{itemId}-p{index}
      const outlineItemId = paragraphMatch[1];
      const paragraphIndex = parseInt(paragraphMatch[2], 10);

      if (updates.content !== undefined) {
        const currentItem = outline.find(item => item.id === outlineItemId);
        if (currentItem && currentItem.paragraphs) {
          // 更新特定段落
          const newParagraphs = [...currentItem.paragraphs];
          newParagraphs[paragraphIndex] = updates.content;

          // 重新组合所有段落
          const newContent = newParagraphs.join('\n\n');

          // 更新 outline
          updateItem(outlineItemId, {
            paragraphs: newParagraphs,
            content: newContent,
            requirements: ''  // 清空 requirements
          });
        }
      }
    } else {
      // 这是旧的单一内容块：content-{itemId}
      const outlineItemId = id.replace('content-', '');
      if (updates.content !== undefined) {
        updateItem(outlineItemId, {
          content: updates.content,
          requirements: ''  // 清空 requirements
        });
      }
    }
  }
};
```

---

## 五、首行缩进格式

### 5.1 段落缩进

**文件**: `components/NotionBlock.tsx` (第 322-327 行)

```typescript
default: {
  fontSize: '15px',
  lineHeight: 1.8,
  marginBottom: '8px',
  textIndent: '2em',  // ← 新增：每段首行缩进2个中文字符
}
```

### 5.2 引用块缩进

**文件**: `components/NotionBlock.tsx` (第 312-322 行)

```typescript
case 'quote':
  return {
    fontSize: '15px',
    lineHeight: 1.8,
    marginBottom: '12px',
    fontStyle: 'italic',
    color: 'rgba(55, 53, 47, 0.8)',
    paddingLeft: '16px',
    borderLeft: '3px solid rgba(55, 53, 47, 0.2)',
    textIndent: '2em',  // ← 引用块也支持首行缩进
  };
```

---

## 六、错误处理和调试

### 6.1 Dify API 错误处理

**文件**: `app/page.tsx` (第 97-124 行)

```typescript
const handleGenerate = async () => {
  if (!prompt.trim()) return;
  setIsGenerating(true);

  try {
    const title = prompt.slice(0, 50) + (prompt.length > 50 ? '...' : '');
    setDocumentTitle(title);

    if (!storedApiKey) {
      alert('请先在设置中配置 Dify API Key');
      setShowSettings(true);
      setIsGenerating(false);
      return;
    }

    if (!storedApiUrl || storedApiUrl === 'http://your-dify-instance/v1') {
      alert('请先在设置中配置 Dify API Base URL');
      setShowSettings(true);
      setIsGenerating(false);
      return;
    }

    await generateOutline(prompt);
    router.push('/word-editor');

  } catch (error: any) {
    console.error('Error generating outline:', error);

    let errorMessage = '大纲生成失败。';

    if (error.message.includes('fetch')) {
      errorMessage += '\n\n网络错误：无法连接到 Dify 服务器。\n请检查：\n1. API URL 是否正确\n2. 网络连接是否正常\n3. 服务器是否可访问';
    } else if (error.message.includes('401') || error.message.includes('403')) {
      errorMessage += '\n\n认证错误：API Key 无效或已过期。\n请在设置中更新 Workflow API Key。';
    } else if (error.message.includes('404')) {
      errorMessage += '\n\n端点错误：API URL 不正确。\n请检查 Dify API Base URL 是否以 /v1 结尾。';
    } else if (error.message.includes('timeout')) {
      errorMessage += '\n\n请求超时：服务器响应时间过长。\n请稍后重试。';
    } else {
      errorMessage += `\n\n详细信息：${error.message}`;
    }

    alert(errorMessage);
  } finally {
    setIsGenerating(false);
  }
};
```

### 6.2 连接测试功能

**文件**: `app/page.tsx` (第 18-31 行)

```typescript
const testConnection = async () => {
  setIsTestingConnection(true);
  setConnectionTestResult(null);

  try {
    if (!apiKey || apiKey === 'app-xxxxxxxxxxxxxxxxxxx') {
      throw new Error('请先输入有效的 API Key');
    }

    if (!apiUrl || apiUrl === 'http://your-dify-instance/v1') {
      throw new Error('请先输入有效的 API URL');
    }

    await validateDifyWorkflowKey(apiKey);

    setConnectionTestResult({
      success: true,
      message: '连接成功！API 配置正确'
    });
  } catch (error: any) {
    setConnectionTestResult({
      success: false,
      message: `连接失败：${error.message}`
    });
  } finally {
    setIsTestingConnection(false);
  }
};
```

---

## 七、数据流图解

### 7.1 完整的数据流程

```
用户输入主题
    ↓
generateOutline(prompt) [useDocumentActions.ts]
    ↓
Dify API: /workflows/run
    Body: { topic, style }
    ↓
API 返回 JSON
    [
      { id, title, level, requirements },
      { id, title, level, requirements }
    ]
    ↓
转换为 OutlineItem 格式
    + status: 'pending'
    + paragraphs: undefined
    ↓
setOutline(outline) [useStore.ts]
    ↓
自动编号（1, 1.1, 2, 2.1...）
    ↓
outline → blocks 转换 [word-editor/page.tsx]
    ├─ Level 2: 添加 requirements 块（可编辑）
    └─ Level 1: 不添加 requirements
    ↓
编辑器显示 NotionBlock
    ↓
用户编辑 requirements
    ↓
updateItem({ requirements: 新内容 })
    ↓
用户点击"生成章节"
    ↓
handleGenerateChapter(itemId) [OutlinePanel.tsx]
    ↓
build fullOutline 字符串
    ↓
generateSectionWithWorker(apiKey, title, topic, fullOutline, requirements)
    ↓
Dify API: /workflows/run (SSE 流式)
    ↓
onChunk 回调（实时）
    accumulatedContent += text
    updateItem(itemId, { content: accumulatedContent })
    ↓
编辑器实时显示（未分段）
    ↓
onComplete 回调
    ↓
分段处理：
paragraphs = accumulatedContent.split(/\n\s*\n/).filter(p => p.trim())
    ↓
updateItem(itemId, {
  status: 'completed',
  content: accumulatedContent,
  paragraphs: [段1, 段2, ...]
})
    ↓
outline → blocks 重新转换
    ├─ 隐藏 requirements 块
    └─ 显示 paragraphs（每个段落独立块）
    ↓
用户编辑段落
    ↓
handleBlockUpdate(id, { content: 新段落内容 })
    ↓
段落块 ID: content-{itemId}-p{index}
    ↓
更新：
  newParagraphs[index] = 新内容
  newContent = newParagraphs.join('\n\n')
    ↓
updateItem(itemId, {
  paragraphs: newParagraphs,
  content: newContent,
  requirements: ''
})
```

---

## 八、关键设计模式

### 8.1 段落分段处理

**目的**: 将 AI 生成的长文本按段落分割，每个段落作为独立块显示

**优势**:
- 更精细的编辑控制
- 可以单独重写某一段
- 提升用户体验

**实现**:
```typescript
// 1. 生成完成时分割
const paragraphs = content
  .split(/(\n\s*\n|\n{2,})/g)  // 双换行或连续换行
  .filter(p => p.trim())
  .map(p => p.replace(/\s+/g, ' ').trim());

// 2. 存储分段
updateItem(itemId, { paragraphs, content });

// 3. 显示时展开
paragraphs.forEach((p, i) => {
  blocks.push({
    id: `content-${itemId}-p${i}`,  // 独立 ID
    type: 'paragraph',
    content: p
  });
});

// 4. 编辑时同步
const match = id.match(/^content-([^-]+)-p(\d+)$/);
if (match) {
  const itemId = match[1];
  const idx = parseInt(match[2]);
  paragraphs[idx] = newContent;
  updateItem(itemId, { paragraphs, content: paragraphs.join('\n\n') });
}
```

### 8.2 双向数据绑定

**outline ↔ blocks**:
- outline 变化 → 自动转换为 blocks
- blocks 编辑 → 同步回 outline

**冲突解决**:
- requirements vs content：优先显示 content > requirements
- 编辑 content → 自动清空 requirements
- 删除 content → 恢复显示 requirements

### 8.3 去重机制

**避免 React key 冲突**:
```typescript
const generatedBlockIds = new Set<string>();

// 检查 ID 是否已存在
if (generatedBlockIds.has(blockId)) {
  console.warn('Skipping duplicate:', blockId);
  return;
}
generatedBlockIds.add(blockId);
```

**大纲去重**:
```typescript
const seenIds = new Set<string>();
const uniqueOutline = outline.filter(item => {
  if (seenIds.has(item.id)) {
    console.warn('Removing duplicate:', item.id);
    return false;
  }
  seenIds.add(item.id);
  return true;
});
```

---

## 九、主要修改文件列表

| 文件路径 | 功能 | 关键修改行数 |
|---------|------|-------------|
| `store/useStore.ts` | 状态定义 | 13 行（添加 requirements, paragraphs, number） |
| `store/useDocumentActions.ts` | 文档操作 | 27 行（大纲生成逻辑） |
| `lib/dify-api.ts` | Dify API | 137 行（Workflow 调用、调试日志） |
| `lib/ai/types.ts` | 类型定义 | 1 行（添加 requirements） |
| `components/outline/OutlinePanel.tsx` | 大纲面板 | 127 行（章节生成、递归、分段） |
| `app/word-editor/page.tsx` | 编辑器 | 267 行（转换逻辑、编辑同步、去重） |
| `app/page.tsx` | 首页 | 127 行（错误处理、连接测试） |
| `components/NotionBlock.tsx` | 块组件 | 2 行（首行缩进） |
| `components/outline/OutlineNode.tsx` | 大纲节点 | 状态显示 |

**总计**: 约 760 行关键代码修改

---

## 十、功能特性总结

### ✅ 已实现功能

1. **章节内容规划 (Requirements)**
   - 大纲生成时自动生成 requirements
   - Level 2 标题下可编辑 requirements
   - Level 1 标题不显示 requirements
   - 生成内容后 requirements 自动隐藏

2. **段落分段处理**
   - AI 内容按 `\n\n` 分割
   - 每个段落作为独立块显示
   - 段落块格式：`content-{itemId}-p{index}`
   - 编辑段落时自动同步到 outline

3. **首行缩进**
   - 段落首行缩进 2em（2个中文字符）
   - 引用块也支持首行缩进
   - 符合中文文档标准

4. **错误处理**
   - 详细的错误提示
   - API 连接测试功能
   - 控制台调试日志

5. **数据同步**
   - outline ↔ blocks 双向绑定
   - 编辑 requirements 同步到 outline
   - 编辑段落同步到 outline
   - 自动编号（1, 1.1, 2, 2.1...）

6. **去重机制**
   - 避免 React key 冲突
   - 大纲项去重
   - 块 ID 去重

---

## 十一、使用说明

### 11.1 生成大纲

1. 在首页输入文档主题
2. 点击生成
3. 等待大纲生成完成
4. 自动进入编辑器

### 11.2 编辑章节规划

1. 在编辑器中找到二级标题
2. 标题下显示 requirements（可编辑）
3. 直接编辑 requirements 内容
4. 编辑后自动同步到 store

### 11.3 生成章节内容

1. 在大纲面板点击"生成"按钮
2. AI 根据 requirements 生成内容
3. 生成完成后：
   - requirements 被隐藏
   - 内容按段落分段显示
4. 每个段落可以独立编辑

### 11.4 编辑已生成内容

1. 点击任意段落块
2. 编辑段落内容
3. 编辑后自动：
   - 更新 outline.content
   - 更新 outline.paragraphs
   - 清空 requirements

---

## 十二、注意事项

1. **Requirements 生命周期**
   - 大纲生成后创建
   - 编辑器中可编辑（仅 Level 2，未生成内容前）
   - 章节生成时传给 AI
   - 生成完成后隐藏

2. **段落编辑优先级**
   - 优先显示段落块（paragraphs）
   - 如果没有 paragraphs，显示单一 content 块
   - 编辑段落时同时更新 content

3. **性能优化**
   - 使用 Set 进行去重检查（O(1) 时间复杂度）
   - 避免不必要的重新渲染
   - 保留用户编辑的内容

4. **边界情况处理**
   - 空内容不创建段落块
   - 连续空行被过滤
   - 重复 ID 被跳过并警告

---

## 总结

您的代码修改非常完整，实现了以下核心功能：

✅ **章节内容规划 (Requirements)** - 完整的生命周期管理
✅ **段落分段处理** - AI 内容按段落独立显示和编辑
✅ **首行缩进** - 符合中文文档标准
✅ **错误处理** - 详细的提示和调试
✅ **数据同步** - outline ↔ blocks 双向绑定
✅ **去重机制** - 避免 React key 冲突

所有修改都已集成到现有代码库中，可以正常使用。
