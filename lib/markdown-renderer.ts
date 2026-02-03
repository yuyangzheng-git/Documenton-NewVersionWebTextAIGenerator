/**
 * 简单的Markdown到HTML转换器
 * 支持：加粗、斜体、下划线、删除线、代码
 */
export function markdownToHtml(markdown: string): string {
  if (!markdown) return '';

  let html = markdown;

  // 转义HTML标签（防止XSS），但需要保护现有的 HTML 标签
  // 首先保存 <u> 和 </u> 标签
  const uTags = [];
  let uTagIndex = 0;
  html = html.replace(/<u>(.*?)<\/u>/gi, (match) => {
    uTags.push(match);
    return `__UTAG_${uTagIndex++}__`;
  });

  // 转义其他 HTML
  html = html
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // 加粗: **text** 或 __text__ (需要在转义后处理)
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  // 对于 __ 包裹的，由于已被转义，这里不处理

  // 斜体: *text* (但不包括已经变成 **text** 的)
  html = html.replace(/\*([^\*]+?)\*/g, '<em>$1</em>');

  // 单下划线 _text_ 用于斜体
  html = html.replace(/_([^_]+?)_/g, '<em>$1</em>');

  // 删除线: ~~text~~
  html = html.replace(/~~(.+?)~~/g, '<del>$1</del>');

  // 行内代码: `code`
  html = html.replace(/`(.+?)`/g, '<code style="background: rgba(135, 131, 120, 0.15); color: #eb5757; padding: 2px 4px; border-radius: 3px; font-family: \'SFMono-Regular\', Consolas, \'Liberation Mono\', Menlo, Courier, monospace; font-size: 85%;">$1</code>');

  // 恢复 <u> 标签
  html = html.replace(/__UTAG_(\d+)__/g, (match, index) => uTags[parseInt(index)] || match);

  // 换行
  html = html.replace(/\n/g, '<br>');

  return html;
}

/**
 * HTML到Markdown转换器（用于编辑后保存）
 */
export function htmlToMarkdown(html: string): string {
  if (!html) return '';

  let markdown = html;

  // 移除br标签
  markdown = markdown.replace(/<br\s*\/?>/gi, '\n');

  // 加粗
  markdown = markdown.replace(/<strong>(.*?)<\/strong>/gi, '**$1**');
  markdown = markdown.replace(/<b>(.*?)<\/b>/gi, '**$1**');

  // 斜体
  markdown = markdown.replace(/<em>(.*?)<\/em>/gi, '*$1*');
  markdown = markdown.replace(/<i>(.*?)<\/i>/gi, '*$1*');

  // 下划线
  markdown = markdown.replace(/<u>(.*?)<\/u>/gi, '<u>$1</u>');

  // 删除线
  markdown = markdown.replace(/<del>(.*?)<\/del>/gi, '~~$1~~');
  markdown = markdown.replace(/<s>(.*?)<\/s>/gi, '~~$1~~');

  // 行内代码
  markdown = markdown.replace(/<code[^>]*>(.*?)<\/code>/gi, '`$1`');

  // 取消转义
  markdown = markdown
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');

  return markdown;
}

/**
 * 检测文本是否包含Markdown格式
 */
export function hasMarkdownFormatting(text: string): boolean {
  if (!text) return false;

  return (
    text.includes('**') ||
    text.includes('__') ||
    text.includes('*') ||
    text.includes('_') ||
    text.includes('~~') ||
    text.includes('`') ||
    text.includes('<u>') ||
    text.includes('</u>')
  );
}
