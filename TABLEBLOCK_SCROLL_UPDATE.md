# TableBlock 水平滚动条更新

## 问题
当表格列数过多时，表格会超出页面宽度，破坏整体布局。

## 解决方案
为表格容器添加水平滚动条，限制表格最大宽度与其他块保持一致。

## 更改内容

### 1. 添加滚动容器样式
在 `TableBlock.tsx` 中定义了滚动容器的样式常量：

```typescript
const scrollContainerStyle: React.CSSProperties = {
  overflowX: 'auto',
  overflowY: 'visible',
  maxWidth: '100%',
  WebkitOverflowScrolling: 'touch',
  scrollbarWidth: 'thin' as const,
  scrollbarColor: '#cbd5e0 #f7fafc',
};
```

### 2. 自定义滚动条样式
添加了 WebKit 和 Firefox 的自定义滚动条样式：

**WebKit (Chrome, Safari, Edge):**
- 滚动条高度: 8px
- 轨道背景: #f7fafc（浅灰）
- 滑块背景: #cbd5e0（中灰）
- 滑块悬停: #a0aec0（深灰）
- 圆角: 4px

**Firefox:**
- `scrollbarWidth: 'thin'`
- `scrollbarColor: '#cbd5e0 #f7fafc'`

### 3. 修改容器结构

**只读模式:**
```tsx
<>
  <style jsx>{/* 自定义滚动条样式 */}</style>
  <div className="table-scroll-container" style={...}>
    <table style={{ minWidth: '100%' }}>
      {/* 表格内容 */}
    </table>
  </div>
</>
```

**编辑模式:**
```tsx
<>
  <style jsx>{/* 自定义滚动条样式 */}</style>
  <div style={{ position: 'relative', maxWidth: '100%' }}>
    <div className="table-scroll-container" style={scrollContainerStyle}>
      <table style={{ minWidth: '100%' }}>
        {/* 表格内容 */}
      </table>
    </div>
    {/* 添加行/列按钮 */}
  </div>
</>
```

### 4. 关键样式属性

**外层容器:**
- `maxWidth: '100%'` - 限制最大宽度
- `position: 'relative'` - 为绝对定位元素提供参考

**滚动容器:**
- `overflowX: 'auto'` - 内容溢出时显示水平滚动条
- `overflowY: 'visible'` - 垂直方向不裁剪（允许菜单显示）
- `maxWidth: '100%'` - 不超出父容器
- `WebkitOverflowScrolling: 'touch'` - iOS 平滑滚动

**表格:**
- `minWidth: '100%'` - 最小宽度为容器宽度
- 当内容超宽时，表格自动扩展，触发滚动条

## 效果

✅ **桌面端:**
- 表格列数少时：正常显示，无滚动条
- 表格列数多时：出现水平滚动条，可左右滑动
- 美观的自定义滚动条样式

✅ **移动端:**
- 支持触摸滚动（`-webkit-overflow-scrolling: touch`）
- 纤细的滚动条不占用太多空间

✅ **兼容性:**
- Chrome/Safari/Edge: 自定义滚动条样式
- Firefox: 纤细滚动条样式
- 其他浏览器: 默认滚动条

## 视觉示例

### 滚动条外观
```
┌─────────────────────────────────────┐
│  表格内容（可滚动）                    │
│  ┌───┬───┬───┬───┬───┬───┬──...     │
│  │   │   │   │   │   │   │          │
│  └───┴───┴───┴───┴───┴───┴──...     │
└─────────────────────────────────────┘
 ╞═══════════════════╡ ← 滚动条
  (可见部分)    (隐藏部分→)
```

### 颜色方案
- 轨道: #f7fafc (浅灰蓝)
- 滑块: #cbd5e0 (中灰)
- 悬停: #a0aec0 (深灰)

## 技术细节

### 为什么使用 `<style jsx>`?
Next.js 的 styled-jsx 支持组件级别的 CSS，可以：
1. 避免全局样式污染
2. 支持 CSS 伪元素（`::-webkit-scrollbar`）
3. 自动作用域隔离

### 为什么 `minWidth: '100%'` 而不是 `width: '100%'`?
- `width: '100%'` 会强制表格始终等于容器宽度，即使内容更宽
- `minWidth: '100%'` 确保表格至少填满容器，但可以根据内容扩展
- 这样才能正确触发滚动条

### Firefox 滚动条样式限制
Firefox 的 `scrollbar-width` 和 `scrollbar-color` 属性功能有限：
- 只能设置 `thin` 或 `auto`
- 只能设置两种颜色（滑块和轨道）
- 无法精确控制尺寸和圆角

## 测试建议

1. **列数测试:**
   - 3 列：无滚动条
   - 10 列：出现滚动条
   - 20 列：流畅滚动

2. **浏览器测试:**
   - Chrome: 查看自定义滚动条样式
   - Firefox: 查看纤细滚动条
   - Safari: 查看 WebKit 样式

3. **移动端测试:**
   - iOS Safari: 触摸滚动是否流畅
   - Android Chrome: 滚动是否响应

4. **交互测试:**
   - 编辑单元格时滚动条是否正常
   - 悬停菜单是否被滚动容器裁剪（应该不会）

## 文件变更

```
modified: components/blocks/TableBlock/TableBlock.tsx
  - 添加 scrollContainerStyle 常量
  - 添加 <style jsx> 自定义滚动条
  - 更新容器结构和样式
  - 表格从 width: '100%' 改为 minWidth: '100%'
```

## 代码质量

✅ **TypeScript 检查通过**
✅ **无编译错误**
✅ **响应式设计**
✅ **跨浏览器兼容**

## 后续优化建议

1. **虚拟滚动**: 对于超大表格（100+ 列），可考虑虚拟滚动
2. **固定首列**: 添加选项允许固定第一列（sticky column）
3. **滚动指示器**: 在有隐藏列时显示视觉提示
4. **键盘滚动**: 支持箭头键滚动到隐藏列
