# 🔧 大纲处理逻辑优化报告

## 📋 优化概述

基于Dify返回的结构化数据（包含 `id`、`title`、`level`、`requirements` 字段），优化大纲编号处理逻辑：

**核心改进**: 从"删除后重新生成"改为**"双策略智能提取"**
- ✅ **策略1**: 优先从title提取编号（如 `"4.2.1 AI XDR"` → `"4.2.1"`）
- ✅ **策略2**: 备用从ID转换编号（如 `"4-2-1"` → `"4.2.1"`）
- ✅ 充分利用Dify提供的结构化数据
- ✅ 信任AI输出，不重新计算

---

## 🔄 处理逻辑对比

### ❌ 旧逻辑（过度复杂）

**步骤**:
1. Dify返回：`{ "id": "4-2-1", "title": "4.2.1 AI XDR 联动防御系统" }`
2. 用正则删除编号：`"AI XDR 联动防御系统"`
3. 用计数器重新生成：`number: "4.2.1"`

**问题**:
- Level 3 编号被硬编码为 `.1`（bug）
- 不信任AI输出，重新计算
- 逻辑复杂，容易出错
- 忽略了Dify提供的结构化ID字段

### ✅ 新逻辑（双策略提取）

**步骤**:
1. Dify返回：`{ "id": "4-2-1", "title": "4.2.1 AI XDR 联动防御系统" }`
2. **策略1**: 从title提取编号 → `"4.2.1"`
3. **策略2**: 如果提取失败，从ID转换 → `"4-2-1"` → `"4.2.1"`
4. 清理标题：`"AI XDR 联动防御系统"`

**优点**:
- 信任AI输出的编号和ID
- 双重保障，更健壮
- 逻辑简单清晰
- 充分利用Dify的结构化数据

---

## 🔧 核心修复

### 文件: `store/useStore.ts`

**新的 `generateNumbers()` 函数**:

```typescript
// Extract numbering from titles or convert from ID field
// Dify returns structured data with both ID (e.g., "4-2-1") and title (e.g., "4.2.1 AI XDR")
// Priority: 1) Extract from title, 2) Convert from ID, 3) Keep existing number
function generateNumbers(items: OutlineItem[]): OutlineItem[] {
  // Deduplicate items by id first
  const seenIds = new Set<string>();
  const uniqueItems: OutlineItem[] = [];
  items.forEach((item) => {
    if (!seenIds.has(item.id)) {
      seenIds.add(item.id);
      uniqueItems.push(item);
    }
  });

  return uniqueItems.map(item => {
    let extractedNumber = '';
    let cleanTitle = item.title;

    // Strategy 1: Extract numbering from title based on level
    if (item.level === 1) {
      const match = item.title.match(/^(\d+)[.、\s]+/);
      if (match) {
        extractedNumber = match[1];
        cleanTitle = item.title.substring(match[0].length).trim();
      }
    } else if (item.level === 2) {
      const match = item.title.match(/^(\d+\.\d+)[.、\s]+/);
      if (match) {
        extractedNumber = match[1];
        cleanTitle = item.title.substring(match[0].length).trim();
      }
    } else if (item.level === 3) {
      const match = item.title.match(/^(\d+\.\d+\.\d+)[.、\s]+/);
      if (match) {
        extractedNumber = match[1];
        cleanTitle = item.title.substring(match[0].length).trim();
      }
    }

    // Strategy 2: If no number extracted from title, try converting from ID
    // ID format: "1", "4-1", "4-2-1" → "1", "4.1", "4.2.1"
    if (!extractedNumber && item.id) {
      const idParts = item.id.split('-');
      if (idParts.length > 0 && idParts.every(part => /^\d+$/.test(part))) {
        extractedNumber = idParts.join('.');
      }
    }

    return {
      ...item,
      title: cleanTitle,
      number: extractedNumber || item.number || ''
    };
  });
}
```

---

## 📊 处理示例

### 案例1: 标准格式（从title提取）

**输入（你提供的Dify数据）**:
```json
{
  "id": "4-2-1",
  "title": "4.2.1 AI XDR 联动防御系统",
  "level": 3,
  "content": "",
  "requirements": "功能定位：明确核心作用..."
}
```

**处理流程**:
1. **策略1-从title提取**: 匹配到 `"4.2.1 "` → `extractedNumber = "4.2.1"`
2. **清理标题**: `cleanTitle = "AI XDR 联动防御系统"`
3. **策略2-跳过**: 已经提取到编号

**输出**:
```typescript
{
  id: "4-2-1",
  title: "AI XDR 联动防御系统",  // ✅ 清理后的标题
  number: "4.2.1",                // ✅ 从title提取的编号
  level: 3,
  requirements: "功能定位：明确核心作用..."
}
```

---

### 案例2: 无编号标题（从ID转换）

**输入**:
```json
{
  "id": "4-2-2",
  "title": "TrustOne 新一代终端安全",  // 无编号前缀
  "level": 3
}
```

**处理流程**:
1. **策略1-从title提取**: 无匹配 → `extractedNumber = ""`
2. **策略2-从ID转换**: `"4-2-2".split('-').join('.')` → `extractedNumber = "4.2.2"`

**输出**:
```typescript
{
  id: "4-2-2",
  title: "TrustOne 新一代终端安全",  // ✅ 保持原标题
  number: "4.2.2",                   // ✅ 从ID转换的编号
  level: 3
}
```

---

### 案例3: 一级标题

**输入**:
```json
{
  "id": "1",
  "title": "第一章：项目背景",  // 中文标题，无数字编号
  "level": 1
}
```

**处理流程**:
1. **策略1-从title提取**: 匹配失败（无 `"1. "` 前缀）
2. **策略2-从ID转换**: `"1".split('-')` → `["1"]` → `extractedNumber = "1"`

**输出**:
```typescript
{
  id: "1",
  title: "第一章：项目背景",  // ✅ 保持原标题
  number: "1",               // ✅ 从ID转换的编号
  level: 1
}
```

---

### 案例4: 完整大纲处理

**输入（完整Dify输出）**:
```json
[
  { "id": "1", "title": "第一章：项目背景", "level": 1 },
  { "id": "4", "title": "第四章：解决方案", "level": 1 },
  { "id": "4-1", "title": "4.1 方案介绍", "level": 2 },
  { "id": "4-2", "title": "4.2 详细功能介绍", "level": 2 },
  { "id": "4-2-1", "title": "4.2.1 AI XDR 联动防御系统", "level": 3 },
  { "id": "4-2-2", "title": "4.2.2 TrustOne 新一代终端安全", "level": 3 },
  { "id": "4-2-7", "title": "4.2.7 AISEDGE 防毒墙", "level": 3 }
]
```

**输出（处理后）**:
```typescript
[
  { id: "1", title: "第一章：项目背景", number: "1", level: 1 },       // 从ID转换
  { id: "4", title: "第四章：解决方案", number: "4", level: 1 },       // 从ID转换
  { id: "4-1", title: "方案介绍", number: "4.1", level: 2 },          // 从title提取
  { id: "4-2", title: "详细功能介绍", number: "4.2", level: 2 },      // 从title提取
  { id: "4-2-1", title: "AI XDR 联动防御系统", number: "4.2.1", level: 3 }, // 从title提取
  { id: "4-2-2", title: "TrustOne 新一代终端安全", number: "4.2.2", level: 3 }, // 从title提取
  { id: "4-2-7", title: "AISEDGE 防毒墙", number: "4.2.7", level: 3 }   // 从title提取
]
```

### 前端显示

```
OutlineNode 组件显示为：

  [number]   [title]
   4.2       详细功能介绍
   4.2.1     AI XDR 联动防御系统
   4.2.2     TrustOne 新一代终端安全
   4.2.3     DeepSecurity 云主机安全
```

---

## 🎯 支持的编号格式与策略

### 双策略优先级

```
策略1: 从title提取编号
    ↓ 成功 → 使用提取的编号
    ↓ 失败 ↓
策略2: 从ID转换编号
    ↓ 成功 → 使用转换的编号
    ↓ 失败 ↓
策略3: 保留原有编号或留空
```

### 策略1: 从Title提取（优先）

正则表达式支持多种编号格式：

#### Level 1（一级标题）
- `"1. 标题"` → `number: "1"`, `title: "标题"`
- `"1 标题"` → `number: "1"`, `title: "标题"`
- `"1、标题"` → `number: "1"`, `title: "标题"`
- `"第一章：标题"` → 不匹配，进入策略2

#### Level 2（二级标题）
- `"4.1 标题"` → `number: "4.1"`, `title: "标题"`
- `"4.1. 标题"` → `number: "4.1"`, `title: "标题"`
- `"4.1、标题"` → `number: "4.1"`, `title: "标题"`

#### Level 3（三级标题）
- `"4.2.1 标题"` → `number: "4.2.1"`, `title: "标题"`
- `"4.2.1. 标题"` → `number: "4.2.1"`, `title: "标题"`
- `"4.2.1、标题"` → `number: "4.2.1"`, `title: "标题"`

---

### 策略2: 从ID转换（备用）

当title中无编号时，使用结构化的ID字段：

```typescript
// ID格式转换规则
"1"       → "1"       // 一级标题
"4"       → "4"       // 一级标题
"4-1"     → "4.1"     // 二级标题
"4-2"     → "4.2"     // 二级标题
"4-2-1"   → "4.2.1"   // 三级标题
"4-2-7"   → "4.2.7"   // 三级标题
```

**转换逻辑**: `id.split('-').join('.')`

**验证**: 确保ID所有部分都是数字

---

### ID字段的优势

1. **结构化**: ID字段（"4-2-1"）比文本编号更结构化
2. **可靠性**: 不受标题格式影响
3. **唯一性**: Dify确保ID唯一，避免重复
4. **层级关系**: ID的层级关系清晰（"4" → "4-1" → "4-2-1"）

**最佳实践**: Title包含编号时从title提取（保留原始格式），否则从ID转换（保证有编号）

---

## 🔴 解决的问题

### 1. ~~Level 3 硬编码Bug~~（已解决）

**旧代码问题**:
```typescript
// ❌ 所有level 3都被赋值为.1
number: `${level1Counter}.${level2Counter}.1`
```

**新方案**:
```typescript
// ✅ 直接从标题提取正确的编号
const match = item.title.match(/^(\d+\.\d+\.\d+)[.、\s]+/);
extractedNumber = match[1];  // "4.2.1", "4.2.2", "4.2.3"...
```

### 2. ~~不信任AI输出~~（已解决）

**旧逻辑**: 删除AI生成的编号，用计数器重新生成
**新逻辑**: 信任AI输出，直接提取编号

### 3. ~~逻辑过于复杂~~（已简化）

**旧代码**: 需要维护 level1/2/3 三个计数器，在不同层级切换时重置
**新代码**: 只需要用正则提取，不需要状态维护

---

## 📋 其他改进（保留）

### API Route 优化

仍然保留了以下优化：

1. **字段提取顺序优化** (`app/api/ai/outline/route.ts`)
   - 优先检查 `outline` 字段（实际使用）
   - 记录匹配到的字段名

2. **验证和日志增强**
   - 记录每个outline项目的详细信息
   - 检测重复ID并警告
   - 检测无效level并警告

3. **前端去重监控** (`store/useDocumentActions.ts`)
   - 统计移除的重复项数量
   - 记录重复的ID列表
   - 验证level有效性

---

## ⚠️ 注意事项

### 1. 用户手动编辑大纲

如果用户在前端手动添加/删除/重排序大纲项：
- **添加**: 用户需要手动输入完整标题（含编号）或留空编号
- **删除**: 可能导致编号不连续（如删除4.2.2后变成4.2.1, 4.2.3）
- **重排序**: 编号可能与顺序不一致

**未来可能的改进**:
- 添加"重新编号"按钮，重新生成所有编号
- 在用户添加时自动推测下一个编号

### 2. 不同的编号风格

当前正则支持：
- `"1. "` - 点号+空格
- `"1 "` - 仅空格
- `"1、"` - 中文顿号

不支持：
- `"第一章："`
- `"Chapter 1:"`
- `"(1)"`

如果Dify输出这些格式，需要调整正则表达式。

---

## 🧪 测试建议

### 测试用例1: 标准编号格式

**Dify输出**:
```json
{ "title": "4.2.1 AI XDR", "level": 3 }
{ "title": "4.2.2 TrustOne", "level": 3 }
```

**预期结果**:
```
number: "4.2.1", title: "AI XDR"
number: "4.2.2", title: "TrustOne"
```

### 测试用例2: 不同分隔符

**Dify输出**:
```json
{ "title": "1. 第一章", "level": 1 }
{ "title": "1、第一章", "level": 1 }
{ "title": "1 第一章", "level": 1 }
```

**预期结果**: 都应正确提取

### 测试用例3: 无编号标题

**Dify输出**:
```json
{ "title": "第一章：背景", "level": 1 }
{ "title": "Introduction", "level": 1 }
```

**预期结果**:
```
number: "", title: "第一章：背景"
number: "", title: "Introduction"
```

---

## 📚 相关文档

- [DUAL_MODE_GUIDE.md](./DUAL_MODE_GUIDE.md) - 双模式导航说明
- [POSTMESSAGE_INTEGRATION.md](./POSTMESSAGE_INTEGRATION.md) - 跨窗口通信实现

---

**更新时间**: 2026-02-28
**优化版本**: v1.2.2
**核心改进**: 从"重新生成编号"改为"提取并信任AI编号"

### 问题描述

**文件**: `store/useStore.ts:178-183`

**原代码**:
```typescript
} else if (item.level === 3) {
  return {
    ...item,
    title: cleanTitle,
    number: `${level1Counter}.${level2Counter}.1`  // ❌ BUG: 硬编码为.1
  };
}
```

**问题**:
- 所有 level 3 项目的编号都被硬编码为 `.1`
- 缺少 `level3Counter` 计数器
- 导致 4.2.1、4.2.2、4.2.3...4.2.7 **全部显示为 4.2.1**

### 实际案例

**Dify输出的正确数据**:
```json
{ "id": "4-2-1", "title": "4.2.1 AI XDR 联动防御系统", "level": 3 }
{ "id": "4-2-2", "title": "4.2.2 TrustOne 新一代终端安全", "level": 3 }
{ "id": "4-2-3", "title": "4.2.3 DeepSecurity 云主机安全", "level": 3 }
{ "id": "4-2-4", "title": "4.2.4 TDA 高级威胁监测系统", "level": 3 }
{ "id": "4-2-5", "title": "4.2.5 DDAN 高级威胁分析系统", "level": 3 }
{ "id": "4-2-6", "title": "4.2.6 DDEI 高级邮件防护系统", "level": 3 }
{ "id": "4-2-7", "title": "4.2.7 AISEDGE 防毒墙系统", "level": 3 }
```

**`generateNumbers()` 处理后的错误结果**:
```typescript
// 标题中的原有编号被删除
cleanTitle = "AI XDR 联动防御系统"        // "4.2.1 " 被删除
cleanTitle = "TrustOne 新一代终端安全"    // "4.2.2 " 被删除
cleanTitle = "DeepSecurity 云主机安全"   // "4.2.3 " 被删除

// number字段全部被赋值为相同的值
number = "4.2.1"  // ❌ 错误
number = "4.2.1"  // ❌ 错误
number = "4.2.1"  // ❌ 错误
```

---

## ✅ 修复方案

### 1. 添加 Level 3 计数器

**修复文件**: `store/useStore.ts:149-189`

```typescript
function generateNumbers(items: OutlineItem[]): OutlineItem[] {
  // ... 去重逻辑 ...

  let level1Counter = 0;
  let level2Counter = 0;
  let level3Counter = 0;  // ✅ 新增 level3 计数器

  return uniqueItems.map(item => {
    // ... 标题清理逻辑 ...

    if (item.level === 1) {
      level1Counter += 1;
      level2Counter = 0;
      level3Counter = 0;  // ✅ 重置 level3
      return {
        ...item,
        title: cleanTitle,
        number: level1Counter.toString()
      };
    } else if (item.level === 2) {
      level2Counter += 1;
      level3Counter = 0;  // ✅ 重置 level3
      return {
        ...item,
        title: cleanTitle,
        number: `${level1Counter}.${level2Counter}`
      };
    } else if (item.level === 3) {
      level3Counter += 1;  // ✅ 递增 level3
      return {
        ...item,
        title: cleanTitle,
        number: `${level1Counter}.${level2Counter}.${level3Counter}`  // ✅ 使用计数器
      };
    }
    return {
      ...item,
      title: cleanTitle
    };
  });
}
```

**修复效果**:
```typescript
// 现在会正确生成编号
number = "4.2.1"  // ✅ 正确
number = "4.2.2"  // ✅ 正确
number = "4.2.3"  // ✅ 正确
number = "4.2.4"  // ✅ 正确
number = "4.2.5"  // ✅ 正确
number = "4.2.6"  // ✅ 正确
number = "4.2.7"  // ✅ 正确
```

---

## 📊 其他改进

### 2. 优化API字段提取顺序

**修复文件**: `app/api/ai/outline/route.ts:66-91`

**改进前**: 字段顺序无优先级
```typescript
const possibleFields = [
  'text', 'output', 'result', 'Construction', 'Constructure',
  'outline', 'data', 'content', 'answer', 'response'
];
```

**改进后**: 根据实际使用优先级排序
```typescript
const possibleFields = [
  'outline',        // ✅ 最常见的标准字段名（实际Dify配置使用）
  'text',           // Dify默认文本输出
  'output',         // 通用输出字段
  'result',         // 结果字段
  'Construction',   // 历史配置字段
  'Constructure',   // 拼写变体
  'data',           // 数据字段
  'content',        // 内容字段
  'answer',         // 问答字段
  'response'        // 响应字段
];
```

**新增**: 记录匹配的字段名
```typescript
let matchedField = '';
for (const field of possibleFields) {
  if (outputs[field]) {
    outputText = String(outputs[field]);
    matchedField = field;
    console.log(`[Dify Outline] Found field '${field}':`, outputText.substring(0, 200));
    break;
  }
}

if (!matchedField) {
  console.warn('[Dify Outline] No matching field found in outputs. Available fields:', Object.keys(outputs));
}
```

---

### 3. 增强验证和日志

#### API Route 验证日志

**文件**: `app/api/ai/outline/route.ts:127-152`

```typescript
// 验证outline结构并记录日志
if (!Array.isArray(outline)) {
  return NextResponse.json(
    { error: 'Parsed outline is not an array', debug: { outline } },
    { status: 500 }
  );
}

console.log(`[Dify Outline] Successfully parsed ${outline.length} items`);

// 记录每个项目的基本信息
outline.forEach((item, idx) => {
  console.log(`  [${idx}] id=${item.id}, level=${item.level}, title="${item.title?.substring(0, 50)}"`);

  // 检测潜在问题
  if (!item.id) {
    console.warn(`    ⚠️  Missing id for item at index ${idx}`);
  }
  if (![1, 2, 3].includes(item.level)) {
    console.warn(`    ⚠️  Invalid level ${item.level} for item ${item.id}`);
  }
});

// 检测重复ID
const ids = outline.map(item => item.id);
const duplicateIds = ids.filter((id, index) => ids.indexOf(id) !== index);
if (duplicateIds.length > 0) {
  console.warn('[Dify Outline] Duplicate IDs detected:', duplicateIds);
}
```

#### 前端处理验证日志

**文件**: `store/useDocumentActions.ts:23-59`

```typescript
console.log(`[generateOutline] Received ${outline.length} items from API`);

// 监控去重效果
if (outline.length !== deduplicatedOutline.length) {
  const removedCount = outline.length - deduplicatedOutline.length;
  console.warn(`[generateOutline] Removed ${removedCount} duplicate items`);

  // 找出重复的ID
  const allIds = outline.map((item: any) => item.id);
  const duplicates = allIds.filter((id: string, index: number) => allIds.indexOf(id) !== index);
  console.warn('[generateOutline] Duplicate IDs:', [...new Set(duplicates)]);
} else {
  console.log('[generateOutline] No duplicates found');
}

// 验证level有效性
if (![1, 2, 3].includes(parsedLevel)) {
  console.warn(`[generateOutline] Invalid level detected for item "${item.id}":`, {
    originalLevel: item.level,
    parsedLevel,
    title: item.title
  });
}

console.log(`[generateOutline] Final outline with ${outlineWithStatus.length} valid items`);
```

---

## 📈 日志输出示例

### 正常流程日志

```
[Dify Outline] Full response: { "data": { "outputs": { "outline": [...] } } }
[Dify Outline] Found field 'outline': [{"id":"1","title":"第一章...
[Dify Outline] Successfully parsed 18 items
  [0] id=1, level=1, title="第一章：项目背景"
  [1] id=2, level=1, title="第二章：需求痛点"
  ...
  [11] id=4-2-1, level=3, title="4.2.1 AI XDR 联动防御系统"
  [12] id=4-2-2, level=3, title="4.2.2 TrustOne 新一代终端安全"
  ...
[generateOutline] Received 18 items from API
[generateOutline] No duplicates found
[generateOutline] Final outline with 18 valid items
```

### 问题检测日志

```
# 场景1: 检测到重复ID
[Dify Outline] Duplicate IDs detected: ['4-2-1', '3']
[generateOutline] Removed 2 duplicate items
[generateOutline] Duplicate IDs: ['4-2-1', '3']

# 场景2: 检测到无效level
  [5] id=bad-item, level=5, title="Invalid level item"
    ⚠️  Invalid level 5 for item bad-item
[generateOutline] Invalid level detected for item "bad-item": {
  originalLevel: 5,
  parsedLevel: 5,
  title: "Invalid level item"
}

# 场景3: 字段名不匹配
[Dify Outline] No matching field found in outputs. Available fields: ['Construction', 'metadata']
```

---

## 🎯 测试验证

### 测试用例

#### 1. 正常三级标题编号

**输入**:
```json
[
  { "id": "1", "title": "第一章", "level": 1 },
  { "id": "1-1", "title": "1.1 节", "level": 2 },
  { "id": "1-1-1", "title": "1.1.1 小节", "level": 3 },
  { "id": "1-1-2", "title": "1.1.2 小节", "level": 3 },
  { "id": "1-1-3", "title": "1.1.3 小节", "level": 3 }
]
```

**预期输出**:
```
1. 第一章
  1.1 节
    1.1.1 小节
    1.1.2 小节
    1.1.3 小节
```

#### 2. 跨二级标题的三级编号重置

**输入**:
```json
[
  { "id": "1", "title": "第一章", "level": 1 },
  { "id": "1-1", "title": "1.1 节", "level": 2 },
  { "id": "1-1-1", "title": "1.1.1 小节", "level": 3 },
  { "id": "1-2", "title": "1.2 节", "level": 2 },
  { "id": "1-2-1", "title": "1.2.1 小节", "level": 3 }
]
```

**预期输出**:
```
1. 第一章
  1.1 节
    1.1.1 小节
  1.2 节
    1.2.1 小节  ✅ 正确重置为1，而不是2
```

#### 3. 用户提供的实际案例

**输入**: （见上面的Dify输出）

**预期输出**:
```
4. 第四章：解决方案
  4.2 详细功能介绍
    4.2.1 AI XDR 联动防御系统      ✅ 正确
    4.2.2 TrustOne 新一代终端安全   ✅ 正确
    4.2.3 DeepSecurity 云主机安全  ✅ 正确
    4.2.4 TDA 高级威胁监测系统     ✅ 正确
    4.2.5 DDAN 高级威胁分析系统    ✅ 正确
    4.2.6 DDEI 高级邮件防护系统    ✅ 正确
    4.2.7 AISEDGE 防毒墙系统       ✅ 正确
```

---

## 📚 Dify 输出分析

### 实际输出格式

用户提供的Dify输出格式非常规范：

```json
{
  "outline": [
    {
      "id": "1",
      "title": "第一章：项目背景",
      "level": 1,
      "content": "",
      "requirements": "本章旨在..."
    }
  ]
}
```

**优点**:
- ✅ 使用标准 `outline` 字段名
- ✅ ID无重复
- ✅ Level值都在有效范围（1, 2, 3）
- ✅ 包含 `requirements` 字段用于指导内容生成

**注意点**:
- `content` 字段当前为空字符串（预留用于存储生成的内容）
- 标题中已包含编号（如 "4.2.1 AI XDR"），会被 `generateNumbers()` 删除并重新生成

---

## 🔍 后续监控建议

### 1. 生产环境监控指标

- **重复ID频率**: 监控 `[generateOutline] Removed X duplicate items` 日志
- **无效Level频率**: 监控 `Invalid level detected` 警告
- **字段名匹配情况**: 统计哪个字段名被使用最多

### 2. Dify Prompt 优化建议

如果发现重复或无效level问题，可以在Dify的system prompt中添加：

```
输出要求：
1. 返回纯JSON数组，不要包含markdown代码块标记
2. 格式: [{"id": "1", "title": "...", "level": 1, "requirements": ""}, ...]
3. level必须是整数1、2或3
4. id必须唯一，不要重复
5. 建议id格式：一级用"1","2"，二级用"1-1","1-2"，三级用"1-1-1","1-1-2"
```

### 3. 未来优化方向

1. **Schema验证**: 考虑引入Zod等库进行类型验证
2. **统一解析工具**: 将 `route.ts` 和 `dify-api.ts` 的解析逻辑提取为共享工具
3. **配置化字段名**: 允许用户在设置中指定Dify输出字段名

---

## ✅ 修复清单

- [x] 修复 `useStore.ts` Level 3 编号硬编码bug
- [x] 添加 `level3Counter` 计数器
- [x] 优化 `route.ts` 字段提取顺序
- [x] 添加字段匹配日志
- [x] 添加outline验证日志（ID、level检查）
- [x] 添加重复ID检测和警告
- [x] 添加前端去重监控日志
- [x] 添加无效level检测和警告

---

**更新时间**: 2026-02-28
**修复版本**: v1.2.1
**影响范围**: 所有包含三级标题的大纲生成

**相关文档**:
- [DUAL_MODE_GUIDE.md](./DUAL_MODE_GUIDE.md) - 双模式导航说明
- [POSTMESSAGE_INTEGRATION.md](./POSTMESSAGE_INTEGRATION.md) - 跨窗口通信实现
