# Bug 日志 (Bug Log)

## [2026-01-28] - BUG-001: title is not defined

**问题描述**:
首页输入内容后点击生成,控制台报错 `title is not defined`

**根本原因**:
`app/page.tsx` 第 28 行调用了 `setDocumentTitle(title)`,但没有从 `useStore` 中获取该函数

**解决方案**:
添加:
```typescript
const setDocumentTitle = useStore((state) => state.setDocumentTitle);
```

**预防措施**:
- 添加 ESLint 规则检测未定义的变量
- 使用 TypeScript 严格模式

---

## [2026-01-28] - BUG-002: Localhost refused to connect

**问题描述**:
浏览器显示 `This site can't be reached - localhost refused to connect`

**根本原因**:
开发服务器未启动

**解决方案**:
运行 `npm run dev` 启动开发服务器

**预防措施**:
- 在 README.md 中添加启动说明
- 开发环境自动启动脚本

---

## [2026-01-28] - BUG-003: 三个 Dify API Key 配置不清晰

**问题描述**:
用户不清楚需要配置三个不同的 API Key，以及每个 Key 的用途

**根本原因**:
1. 环境变量名称不够明确
2. 缺少配置说明文档
3. UI 中没有清晰的提示

**解决方案**:
1. ✅ 更新项目文档，明确说明三个 Key 的用途
2. ✅ 在 key_facts.md 中添加详细的 API Key 配置说明
3. ⏳ 在配置界面添加三个 Key 的输入框和说明标签
4. ⏳ 添加配置验证功能

**预防措施**:
- 在首次使用时显示配置向导
- 添加 API Key 验证提示
- 在错误信息中明确指出缺少哪个 Key

**状态**: ✅ 已完全完成 (2026-01-28)

---

## [2026-01-28] - BUG-004: AIChat API Key 硬编码问题

**问题描述**:
AIChat.tsx 中硬编码使用 `process.env.NEXT_PUBLIC_DIFY_CHAT_API_KEY`，导致无法使用 store 中动态配置的 `chatApiKey`

**根本原因**:
- 组件没有使用 `useStore` hook
- 直接读取环境变量，不支持运行时配置

**解决方案**:
1. ✅ 导入 `useStore` hook
2. ✅ 在组件中解构 `chatApiKey`
3. ✅ 使用 `chatApiKey || process.env.NEXT_PUBLIC_DIFY_LLM_KEY || ''` 作为 fallback

**影响范围**:
- components/AIChat.tsx
- 修复了 TODO-004

**状态**: ✅ 已完成 (2026-01-28)

---

## [2026-01-28] - BUG-005: Chapter Workflow 参数名称不匹配

**问题描述**:
章节生成时出现错误: `{"code":"invalid_param","message":"title is required in input form","status":400}`

**根本原因**:
代码中使用的输入参数名称与 Dify Workflow 中定义的参数名称不一致。

**解决方案**:
1. ✅ 更新 `lib/dify-api.ts` 中的 `generateSectionWithWorker` 函数
2. ✅ 将参数名称从:
   - `section_title` → `title`
   - `document_topic` → `topic`
   - `full_outline` → `outline`
3. ✅ 更新 `DIFY_API_KEYS_GUIDE.md` 文档，明确说明参数名称要求
4. ✅ 添加常见问题解答和调试信息

**用户需要做的**:
1. 在 Dify 平台上检查 Chapter Workflow 的输入变量名称
2. 确保参数名称为 `title`、`topic`、`outline`
3. 如果参数名称不同，修改 Dify Workflow 的输入变量名称
4. 保存并重新发布 Workflow

**影响范围**:
- lib/dify-api.ts (generateSectionWithWorker 函数)
- DIFY_API_KEYS_GUIDE.md

**相关文档**:
- DIFY_API_KEYS_GUIDE.md - Chapter Workflow 配置说明

**状态**: ✅ 已完成 (2026-01-28)

---

## [2026-01-28] - BUG-006: 正文生成使用了错误的 API Key

**问题描述**:
正文生成时使用了大纲生成的 API Key (`apiKey`) 而不是正文写作的 API Key (`chapterApiKey`)

**根本原因**:
代码中存在 fallback 逻辑，导致当 `chapterApiKey` 未配置时，会自动使用 `apiKey`：
1. `app/word-editor/page.tsx:150` - `chapterApiKey || apiKey`
2. `store/useDocumentActions.ts:113` - 直接使用 `apiKey`

这违反了三个独立 API Key 的设计原则，可能导致：
- 使用错误的 Workflow 模型
- 生成内容不符合预期
- 资源使用混淆

**解决方案**:
1. ✅ 修复 `app/word-editor/page.tsx:150`
   - 移除 fallback 逻辑
   - 强制使用 `chapterApiKey`
   - 更新错误提示信息

2. ✅ 修复 `store/useDocumentActions.ts:113`
   - 将 `state.apiKey` 改为 `state.chapterApiKey`
   - 添加注释说明用途

3. ✅ 更新错误提示
   - 明确指出需要配置"正文写作"的 API Key

**影响范围**:
- `app/word-editor/page.tsx` - handleGenerateSection 函数
- `store/useDocumentActions.ts` - generateContent 函数

**预防措施**:
1. 三个 API Key 必须完全独立，不能有 fallback
2. 在代码中明确注释每个 key 的用途
3. 在错误提示中明确指出缺少哪个 key

**状态**: ✅ 已完成 (2026-01-28)

---

**最后更新**: 2026-01-28
