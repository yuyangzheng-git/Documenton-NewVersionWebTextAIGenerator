# Dify 代码节点快速参考 - 解决 LLM 输出包含思考过程的问题

## 问题描述

Worker 节点的 LLM 可能会输出类似这样的内容:

```
{
  "output": ", I understand the task. I need to write content for section \"1.1 当前安全运营面临的挑战\"...

  Here is a breakdown of thinking process:

  1. Analyze Request:
     - Role: Professional document writing assistant
     - ...

  2. Determine Scope and Tone:
     - ...

  9. Final Output Generation:

  随着企业数字化转型的深入推进以及云计算、物联网、移动办公等新技术的广泛应用，组织的网络边界正在迅速瓦解..."
}
```

这包含了思考过程、开场白等不需要的内容,我们需要只保留实际的文档正文。

## 解决方案

在 Worker 工作流中添加一个代码节点,放在 LLM 节点之后:

### 工作流结构

```
用户输入
  ↓
LLM 节点 (生成内容,含思考过程)
  ↓
代码节点 (text_cleaner_worker) ← 新增
  ↓
输出清理后的纯文本
```

### 代码节点配置

**节点名称**: `text_cleaner_worker`
**节点类型**: 代码节点 (Code)
**语言**: Python 3.10

#### 输入变量映射

从 LLM 节点获取输出,根据实际情况选择:
- `text` → `{{#llm_worker.outputs#text}}`
- `output` → `{{#llm_worker.outputs#output}}`
- `result` → `{{#llm_worker.outputs#result}}`

#### 代码逻辑

```python
import re

def main(args):
    """
    清理 Worker LLM 的输出,移除思考过程和开场白
    只保留实际的文档内容
    """
    # 获取输入文本
    text = args.get('text', '')
    output = args.get('output', '')
    result = args.get('result', '')
    
    content = output or text or result or ''
    
    if not content:
        return {
            'status': 'error',
            'error': '输入为空',
            'content': ''
        }
    
    # 1. 移除章节标题(如果重复)
    # 移除以数字+点开头的标题行 (如 "1.1 当前安全运营面临的挑战")
    lines = content.split('\n')
    cleaned_lines = []
    
    for line in lines:
        stripped = line.strip()
        # 跳过看起来像章节标题的行
        if re.match(r'^\d+\.\d+\s+', stripped):
            continue
        # 跳过空行
        if not stripped:
            continue
        cleaned_lines.append(stripped)
    
    # 2. 重新组合文本
    cleaned_text = '\n\n'.join(cleaned_lines)
    
    # 3. 移除可能的 markdown 格式符号
    cleaned_text = cleaned_text.replace('**', '').replace('*', '')
    cleaned_text = re.sub(r'^#+\s*', '', cleaned_text, flags=re.MULTILINE)
    
    # 4. 清理多余空格
    cleaned_text = re.sub(r'\n{3,}', '\n\n', cleaned_text)
    
    return {
        'status': 'success',
        'content': cleaned_text,
        'original_length': len(content),
        'cleaned_length': len(cleaned_text),
        'paragraph_count': len(cleaned_lines)
    }
```

#### 输出变量

**变量名**: `content`
**类型**: String

## 完整配置步骤

### Step 1: 在 Dify 中打开 Worker 工作流

### Step 2: 添加代码节点

1. 点击 LLM 节点后面的 "+"
2. 选择 "代码节点" (Code)
3. 配置节点:
   - 名称: `text_cleaner_worker`
   - 语言: Python 3.10
   - 粘贴上面的代码

### Step 3: 连接节点

- LLM 节点的输出 → 代码节点的输入
- 代码节点的输出 → 最终输出

### Step 4: 配置输入变量

在代码节点的"输入变量"部分:
- 选择从 LLM 节点获取输出
- 映射到代码中的参数

### Step 5: 测试

使用测试输入验证输出是否正确:

**测试输入**:
```json
{
  "section_title": "1.1 当前安全运营面临的挑战",
  "document_topic": "AI XDR 解决方案",
  "full_outline": "...",
  "context_summary": "AI XDR 安全方案"
}
```

**预期输出**:
- 只包含正文段落
- 没有思考过程
- 没有开场白
- 没有重复的章节标题

## 代码逻辑说明

### 1. 移除章节标题

正则表达式 `^\d+\.\d+\s+` 匹配类似:
- "1.1 当前安全运营面临的挑战"
- "2.1 技术架构"
- "3.2 实施方案"

这些标题在大纲中已经存在,不需要在正文中重复。

### 2. 移除 Markdown 符号

- 移除 `**` (粗体标记)
- 移除 `*` (斜体标记)
- 移除 `#` (标题标记)

### 3. 清理空行

- 移除连续 3 个以上的空行
- 保留段落之间的单个空行

### 4. 返回统计信息

返回的信息包括:
- `content`: 清理后的文本
- `original_length`: 原始长度
- `cleaned_length`: 清理后长度
- `paragraph_count`: 段落数量

## 前端适配

如果使用了代码节点,前端需要相应调整:

### 原来的代码

```typescript
// 直接使用 LLM 输出
if (parsed.event === 'text_chunk') {
  const text = parsed.data?.text || '';
  if (text) {
    onChunk(text);
  }
}
```

### 调整后的代码

如果代码节点使用 `text_cleaner_worker`,前端无需改动,因为代码节点会输出清理后的文本。

但如果代码节点输出到不同的变量名,需要调整:

```typescript
// 检查输出来源
if (parsed.event === 'text_chunk') {
  let text = parsed.data?.text || '';
  
  // 如果是 LLM 直接输出,跳过
  // 如果是代码节点输出,使用清理后的内容
  
  // 实际上代码节点的输出也会通过 text_chunk 事件
  if (text) {
    onChunk(text);
  }
}
```

## 进阶: 更智能的清理

如果需要更智能的清理,可以改进代码:

### 识别思考过程标记

```python
# 移除包含以下标记的段落
thinking_keywords = [
    'thinking process',
    '分析请求',
    '确定范围',
    '思考过程',
    'drafting',
    'refining'
]

lines = content.split('\n')
cleaned_lines = []
skip_section = False

for line in lines:
    lower = line.lower()
    if any(keyword in lower for keyword in thinking_keywords):
        skip_section = True
        continue
    
    if skip_section:
        # 跳过思考过程中的内容
        if line.strip() and not any(kw in lower for kw in thinking_keywords):
            # 遇到实际内容,开始记录
            skip_section = False
            cleaned_lines.append(line)
    else:
        cleaned_lines.append(line)
```

### 移除开场白

```python
# 常见开场白
openings = [
    '以下是生成的内容:',
    '好的,我将为您生成:',
    '这是我的回答:',
    'output:',
    '回答:'
]

for opening in openings:
    if content.startswith(opening):
        content = content[len(opening):].strip()
        break
```

## 常见问题

### Q1: 代码节点输出空白?

A: 检查输入变量映射是否正确,确保从 LLM 节点获取了输出。

### Q2: 段落被意外删除?

A: 检查正则表达式,确保不会误删正常的段落。可以添加更精确的匹配条件。

### Q3: 仍然包含 markdown 符号?

A: 检查代码中的替换逻辑,确保所有的 markdown 符号都被处理。可能需要添加更多的替换规则。

### Q4: 如何调试?

A: 在代码节点中添加日志输出:

```python
print(f"原始内容长度: {len(content)}")
print(f"清理后长度: {len(cleaned_text)}")
print(f"移除段落数: {len(lines) - len(cleaned_lines)}")
```

## 快速复制

直接复制以下代码到 Dify 的代码节点:

```python
import re

def main(args):
    """
    清理 Worker LLM 的输出,移除思考过程和开场白
    """
    text = args.get('text', '') or args.get('output', '') or args.get('result', '')
    
    if not text:
        return {'status': 'error', 'error': '输入为空', 'content': ''}
    
    lines = text.split('\n')
    cleaned_lines = []
    
    for line in lines:
        stripped = line.strip()
        if not stripped:
            continue
        # 跳过章节标题和思考过程
        if re.match(r'^\d+\.\d+\s+', stripped):
            continue
        cleaned_lines.append(stripped)
    
    cleaned_text = '\n\n'.join(cleaned_lines)
    cleaned_text = cleaned_text.replace('**', '').replace('*', '')
    
    return {
        'status': 'success',
        'content': cleaned_text,
        'paragraph_count': len(cleaned_lines)
    }
```

---

## 总结

通过添加 `text_cleaner_worker` 代码节点,可以:

✅ 自动移除 LLM 的思考过程
✅ 移除重复的章节标题
✅ 清理 Markdown 格式符号
✅ 保留纯净的文档内容
✅ 提供内容统计信息

这样就无需每次都在系统提示词中强调,由代码节点自动处理!
