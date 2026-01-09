# Dify Workflow 配置指南

## 概述

本指南提供了为 AI 文档生成系统配置 Dify Workflow 的详细说明,包括代码节点和 LLM 提示词的最佳实践。

## 工作流架构

```
用户输入 → LLM节点(规划) → 输出大纲
                  ↓
            LLM节点(内容生成) → 流式输出内容
```

---

## 一、大纲生成工作流 (Planner)

### 1.1 工作流配置

**触发方式**: 手动触发
**输出变量**:
- `Construction`: 大纲数组 (JSON 格式)

### 1.2 输入变量

| 变量名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| `topic` | String | 是 | 文档主题 |
| `style` | String | 否 | 写作风格 (默认: 专业严肃) |
| `files` | Array | 否 | 参考文件数组 |

### 1.3 LLM 节点配置

#### 模型选择
- 推荐模型: GPT-4, Claude 3.5 Sonnet, 或同等能力模型
- 温度: 0.3 (低温度确保结构稳定)
- 最大 tokens: 4000

#### 系统提示词 (System Prompt)

```markdown
你是一位专业的文档结构规划专家。你的任务是根据用户提供的主题,创建一个完整、专业、逻辑清晰的大纲。

## 输出要求

1. **输出格式**: 必须是有效的 JSON 数组
2. **不包含任何其他文本**: 只输出 JSON,不要解释、不要 markdown 代码块
3. **结构规范**:
   - 数组中每个元素代表一个章节
   - 每个元素包含: id, title, level, content
   - level: 1 = 一级标题, 2 = 二级标题, 3 = 三级标题
   - id: 唯一标识符 (如 "1", "1.1", "1.1.1")

## JSON 格式示例

```json
[
  {
    "id": "1",
    "title": "项目背景",
    "level": 1,
    "content": "概述项目的背景信息和重要性"
  },
  {
    "id": "1.1",
    "title": "当前现状",
    "level": 2,
    "content": "分析当前的实际情况"
  },
  {
    "id": "1.2",
    "title": "面临挑战",
    "level": 2,
    "content": "列举主要挑战和问题"
  }
]
```

## 输入处理

如果用户提供了参考文件,请参考文件内容来丰富大纲。

## 写作风格

根据 style 变量调整大纲风格:
- "专业严肃": 使用专业术语,结构严谨
- "通俗易懂": 使用平实语言,结构清晰
- "学术研究": 引用数据,注重逻辑

## 重要提示

- 不要在 JSON 前后添加任何文字说明
- 不要使用 markdown 的代码块标记 (```json, ```)
- 确保 JSON 格式完全正确,可以被程序直接解析
- id 必须是唯一且具有层级关系
```

#### 用户提示词 (User Prompt)

```markdown
请为主题 "{{topic}}" 生成一个专业的文档大纲。

写作风格: {{style}}

{{#files}}
参考文件已提供,请参考这些内容。
{{/files}}
```

### 1.4 输出节点配置

**变量名称**: `Construction` (必须与 LLM 输出字段匹配)

---

## 二、内容生成工作流 (Worker)

### 2.1 工作流配置

**触发方式**: 手动触发
**输出模式**: 流式输出 (Streaming)

### 2.2 输入变量

| 变量名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| `context_summary` | String | 是 | 上下文摘要 (最多48字符) |
| `document_topic` | String | 是 | 文档主题 |
| `section_title` | String | 是 | 当前章节标题 |
| `full_outline` | String | 是 | 完整大纲 (JSON 字符串) |
| `files` | Array | 否 | 参考文件数组 |

### 2.3 LLM 节点配置

#### 模型选择
- 推荐模型: GPT-4, Claude 3.5 Sonnet
- 温度: 0.7 (适中温度保证质量同时保持流畅)
- 最大 tokens: 8000
- 流式输出: ✅

#### 系统提示词 (System Prompt)

```markdown
你是一位专业的文档写作助手。你的任务是根据提供的大纲和章节信息,撰写高质量的专业文档内容。

## 写作规范

### 内容要求

1. **结构清晰**: 段落分明,逻辑连贯
2. **专业准确**: 使用准确的专业术语和表达
3. **详实具体**: 提供具体的数据、案例和说明
4. **自然流畅**: 语言自然,避免重复和生硬表达

### 格式要求

- **不使用 Markdown 格式符号**: 不要使用 `#`, `**`, `*`, `-` 等 Markdown 符号
- **使用中文标点**: 使用中文全角标点符号
- **段落分明**: 每段之间空一行
- **段落长度**: 每段建议 50-200 字,避免过长段落

### 禁止事项

- ❌ 不要在输出中包含任何思考过程 (Thinking Process)
- ❌ 不要包含大纲或结构说明
- ❌ 不要使用 Markdown 格式 (如 **加粗**, ## 标题)
- ❌ 不要包含"好的"、"以下是我生成的内容"等开场白
- ❌ 不要重复章节标题

### 输出内容

直接输出章节正文内容,从第一个段落开始,不需要任何前导文字。

## 上下文理解

- `document_topic`: 了解文档的整体主题,确保内容一致性
- `section_title`: 当前要写的章节,确保内容聚焦
- `full_outline`: 了解文档整体结构,确保内容衔接自然

## 写作风格

根据文档类型和章节内容,选择合适的写作风格:
- 技术文档: 精确、逻辑严密
- 商业报告: 简洁、数据驱动
- 学术论文: 严谨、引用规范
- 概述性内容: 通俗、易于理解

## 质量标准

1. **准确性**: 信息准确,无错误
2. **完整性**: 内容完整,覆盖要点
3. **连贯性**: 段落之间逻辑连贯
4. **专业性**: 使用专业术语,表达规范
5. **可读性**: 语言流畅,易于理解

## 示例

### 输入
章节标题: "1.1 当前安全运营面临的挑战"
文档主题: "AI XDR 解决方案"

### 输出 (应直接从正文开始)

随着数字化转型的深入,企业网络安全边界日益模糊,传统的安全运营体系面临前所未有的挑战。安全设备数量激增,形成了严重的防御碎片化问题。防火墙、入侵检测系统、终端防护等安全工具各自独立运行,数据无法有效关联,形成了数据孤岛。这不仅降低了检测效率,也增加了安全分析师的工作负担。

与此同时,网络攻击手段持续演进,高级持续性威胁(APT)、零日漏洞利用等新型攻击方式层出不穷。基于规则和签名的传统检测方法已难以应对这些隐蔽性极强的攻击。攻击者利用社会工程学、供应链攻击等手段,能够在企业网络中长期潜伏而不被发现。

告警风暴也是安全运营面临的重要问题。安全设备每天产生海量告警,其中大量为误报,导致安全分析师需要花费大量时间在无效告警上。真正重要的威胁可能淹没在海量噪音中,增加了漏报的风险。

响应处置效率同样滞后。传统的安全响应流程依赖人工协调,从发现到处置往往需要数小时甚至数天。而现代攻击者的攻击速度极快,能够在短时间内完成横向移动和数据窃取。这种时间差给企业带来了巨大的安全风险。

此外,安全人才短缺问题日益突出。培养和留住高水平的安全分析师成本高昂,很多企业面临安全团队人手不足的问题。这进一步加剧了运营压力,使得安全团队难以及时响应和处理所有的安全事件。
```

#### 用户提示词 (User Prompt)

```markdown
请为章节 "{{section_title}}" 撰写内容。

文档主题: {{document_topic}}

完整大纲:
{{full_outline}}

{{#files}}
参考文件已提供,请参考这些内容来丰富章节内容。
{{/files}}

要求:
- 直接输出正文内容,不要包含任何思考过程
- 不要使用 Markdown 格式符号
- 使用中文标点符号
- 段落分明,逻辑连贯
- 内容详实具体
```

---

## 三、代码节点配置 (可选)

### 3.1 输出格式化代码节点 (用于 Planner)

如果需要清理 LLM 输出,可以添加代码节点:

**节点类型**: 代码节点 (Code)
**语言**: Python 3.10

```python
def main(args):
    """
    清理并验证大纲 JSON 输出
    """
    output = args.get('output', '')
    text = args.get('text', '')
    result = args.get('result', '')
    
    # 获取实际输出文本
    content = output or text or result or ''
    
    # 移除可能的 markdown 代码块标记
    content = content.replace('```json', '').replace('```', '').strip()
    
    # 尝试找到 JSON 数组
    import json
    import re
    
    # 查找完整的 JSON 数组
    json_pattern = r'\[.*?\]'
    matches = re.findall(json_pattern, content, re.DOTALL)
    
    if matches:
        # 使用最后一个完整的 JSON 数组
        final_json = matches[-1]
    else:
        final_json = content
    
    # 解析并验证 JSON
    try:
        parsed = json.loads(final_json)
        
        # 确保是数组
        if not isinstance(parsed, list):
            parsed = [parsed]
            
        # 验证每个元素的基本结构
        validated = []
        for item in parsed:
            if isinstance(item, dict):
                validated.append({
                    'id': item.get('id', ''),
                    'title': item.get('title', ''),
                    'level': item.get('level', 1),
                    'content': item.get('content', '')
                })
        
        return {
            'status': 'success',
            'outline': validated,
            'count': len(validated)
        }
        
    except json.JSONDecodeError as e:
        return {
            'status': 'error',
            'error': f'JSON 解析失败: {str(e)}',
            'raw_content': content[:500]
        }

# 输入参数映射
{
    'output': '{{#LLM.outputs#text}}',
    'text': '{{#LLM.outputs#output}}',
    'result': '{{#LLM.outputs#result}}'
}
```

---

## 四、最佳实践

### 4.1 大纲生成

1. **保持简洁**: 大纲不要太细,2-3 级即可
2. **逻辑清晰**: 确保章节之间有逻辑关系
3. **ID 规范**: 使用 "1", "1.1", "1.2" 这样的编号系统
4. **内容描述**: content 字段简要说明章节内容

### 4.2 内容生成

1. **流式输出**: 启用流式输出提升用户体验
2. **无 Markdown**: 坚决不使用 Markdown 格式符号
3. **直接输出**: 不要任何开场白或结束语
4. **控制长度**: 根据章节重要性合理分配内容长度
5. **保持一致**: 使用统一的术语和风格

### 4.3 性能优化

1. **模型选择**: 大纲用低温度模型,内容用适温度模型
2. **Token 限制**: 合理设置最大 tokens,避免超时
3. **缓存策略**: 对相同大纲可以缓存结果
4. **并发控制**: 不要同时生成太多章节

---

## 五、常见问题

### Q1: LLM 输出包含 JSON 以外的文本怎么办?

A: 在 LLM 系统提示词中强调"只输出 JSON",或使用代码节点清理输出。

### Q2: 内容生成太慢怎么办?

A: 考虑:
- 使用更快的模型 (如 GPT-3.5)
- 减少 max_tokens 设置
- 启用流式输出

### Q3: 生成的内容不够专业怎么办?

A: 优化系统提示词:
- 添加更多专业术语示例
- 强调数据驱动
- 提供具体的写作质量标准

### Q4: 大纲结构不合理怎么办?

A: 在系统提示词中:
- 强调逻辑性和连贯性
- 提供更多格式要求
- 添加结构检查步骤

---

## 六、变量映射参考

### Planner 工作流

```
输入 → LLM 节点
├── topic → {{topic}}
├── style → {{style}}
└── files → {{#files}}

LLM 节点 → 输出
└── outputs.Construction → 最终大纲
```

### Worker 工作流

```
输入 → LLM 节点
├── context_summary → {{context_summary}}
├── document_topic → {{document_topic}}
├── section_title → {{section_title}}
├── full_outline → {{full_outline}}
└── files → {{#files}}

LLM 节点 → 输出
└── outputs.text / outputs.output → 流式文本内容
```

---

## 七、测试建议

### 7.1 大纲生成测试

**测试输入**:
```json
{
  "topic": "AI XDR 解决方案",
  "style": "专业严肃"
}
```

**预期输出格式**:
```json
[
  {
    "id": "1",
    "title": "项目背景",
    "level": 1,
    "content": "..."
  }
]
```

### 7.2 内容生成测试

**测试输入**:
```json
{
  "section_title": "1.1 当前挑战",
  "document_topic": "AI XDR 解决方案",
  "full_outline": "[...JSON 大纲...]",
  "context_summary": "AI XDR 安全方案"
}
```

**预期输出**:
- 纯文本内容
- 无 Markdown 符号
- 无开场白
- 段落分明

---

## 八、进阶配置

### 8.1 添加代码节点进行内容优化

可以添加代码节点对生成的内容进行后处理:

```python
def main(args):
    content = args.get('text', '')
    
    # 统一标点符号
    content = content.replace('。', '。')
    
    # 移除多余空行
    lines = [line.strip() for line in content.split('\n') if line.strip()]
    content = '\n\n'.join(lines)
    
    return {'optimized_text': content}
```

### 8.2 多模型组合

可以使用多个 LLM 节点:
1. 第一个节点生成内容草稿
2. 第二个节点进行润色和优化
3. 第三个节点进行格式检查

---

## 附录: 快速配置检查清单

- [ ] Planner 工作流的 LLM 系统提示词已配置
- [ ] Planner 输出变量名称为 `Construction`
- [ ] Worker 工作流启用流式输出
- [ ] Worker 的 LLM 系统提示词禁止 Markdown 格式
- [ ] 所有变量映射正确
- [ ] 已测试两个工作流的基本功能
- [ ] 已测试完整的文档生成流程
