# 工作日志 (Work Log)

## 2026-01-28

### 初始化项目记忆系统
- 创建 `.codebuddy/docs/TODO.md` - 完整开发任务清单
- 创建 `.codebuddy/docs/project_notes/` - 项目记忆目录
- 创建 `decisions.md` - 架构决策记录
- 创建 `key_facts.md` - 项目关键信息
- 创建 `bugs.md` - Bug 日志

### Bug 修复
- ✅ BUG-001: 修复首页 `title is not defined` 错误
  - 问题: `setDocumentTitle` 未从 store 中获取
  - 解决: 添加 `const setDocumentTitle = useStore((state) => state.setDocumentTitle);`

- ✅ BUG-002: 解决 Localhost 连接问题
  - 问题: 开发服务器未启动
  - 解决: 运行 `npm run dev`

### Phase 1 核心骨架 - 完成
- ✅ 集成 Dexie.js (IndexedDB)
  - 安装依赖: `npm install dexie`
  - 创建 `lib/db.ts` - 定义数据库 schema (blocks 表)
  - 实现 `useAutoSave` hook - 监听 blocks 变化并自动保存
  - 实现 `useLoadFromDB` hook - 页面加载时从 IndexedDB 恢复数据

### Phase 2 AI 业务流 - 进行中
- ✅ HeadingBlock 自定义组件
  - 添加写作指导区 (Guidance Panel)
    - 实现可折叠区域 (默认显示, 黄色背景框)
    - 显示 AI 预生成的 guidance 文本
    - 用户可编辑指导文字
    - 编辑后同步到 store
  - 添加"✨ 生成/重写"按钮
    - 按钮样式和位置 (标题右侧)
    - 点击触发章节生成逻辑

- ✅ 暴力覆盖算法
  - 实现边界查找逻辑
  - 实现内容清空逻辑
  - 实现插入逻辑

- ✅ MarkdownParser 基础实现
  - 解析 `#`, `##`, `###` -> Heading Block
  - 解析 Text -> Paragraph Block

### 项目状态评估
- **Phase 1**: 70% 完成
  - ✅ Next.js 16 初始化
  - ✅ Tiptap 集成
  - ✅ Zustand 状态管理
  - ✅ Dify API 集成
  - ✅ Dexie.js 集成
  - ⚠️ 居中画布布局待优化
  - ⚠️ Block 基础功能完善待完成

- **Phase 2**: 40% 完成
  - ✅ Dify Workflow 1 (大纲生成)
  - ✅ HeadingBlock 自定义组件
  - ✅ 暴力覆盖算法
  - ✅ MarkdownParser 基础
  - ⏳ MarkdownParser 完善中
  - ⏳ 章节生成流程完善

- **Phase 3**: 0% 完成
  - ⏳ Slash 命令菜单
  - ⏳ 图片管理
  - ⏳ 表格处理
  - ⏳ RAG 助手
  - ⏳ 导出系统

- **Phase 4**: 0% 完成
  - ⏳ 性能优化
  - ⏳ 兼容性测试
  - ⏳ 安全性加固

### 下一步计划
1. **高优先级**: 完善 MarkdownParser (表格, 图片, 列表, 引用)
2. **高优先级**: 实现 Slash 命令菜单
3. **中优先级**: 实现图片拖拽上传
4. **中优先级**: 实现居中画布布局

---

**最后更新**: 2026-01-28
