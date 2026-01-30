/**
 * HTML 安全工具
 * 用于防止 XSS 攻击
 */

import DOMPurify from 'dompurify';

/**
 * 清洗 HTML 内容，防止 XSS 攻击
 * @param dirty 待清洗的 HTML 字符串
 * @param allowedTags 允许的标签（可选）
 * @returns 清洗后的安全 HTML
 */
export function sanitizeHtml(
  dirty: string,
  allowedTags?: string[]
): string {
  if (typeof window === 'undefined') {
    // 服务端渲染时直接返回（不执行脚本）
    return dirty;
  }

  const config = {
    // 允许的标签
    ALLOWED_TAGS: allowedTags || [
      'p', 'br', 'strong', 'em', 'u', 's', 'code', 'pre',
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'ul', 'ol', 'li',
      'blockquote',
      'a', 'img',
      'table', 'thead', 'tbody', 'tr', 'th', 'td',
      'span', 'div'
    ],
    // 允许的属性
    ALLOWED_ATTR: [
      'href', 'target', 'rel', 'src', 'alt', 'title',
      'class', 'id', 'style',
      'colspan', 'rowspan', 'align'
    ],
    // 允许的 URI 协议
    ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|sms|cid|xmpp):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
    // 保持相对 URL
    ALLOW_DATA_ATTR: false,
    // 返回可信任的 HTML
    RETURN_TRUSTED_TYPE: false
  };

  return DOMPurify.sanitize(dirty, config);
}

/**
 * 创建安全的内联 HTML 对象（用于 dangerouslySetInnerHTML）
 * @param html HTML 字符串
 * @returns 安全的 __html 对象
 */
export function createSafeHtml(html: string): { __html: string } {
  return {
    __html: sanitizeHtml(html)
  };
}

/**
 * 清洗表格 HTML（更宽松的配置）
 * @param tableHtml 表格 HTML 字符串
 * @returns 清洗后的表格 HTML
 */
export function sanitizeTableHtml(tableHtml: string): string {
  if (typeof window === 'undefined') {
    return tableHtml;
  }

  return DOMPurify.sanitize(tableHtml, {
    ALLOWED_TAGS: ['table', 'thead', 'tbody', 'tr', 'th', 'td', 'caption'],
    ALLOWED_ATTR: ['colspan', 'rowspan', 'align', 'valign', 'style', 'class'],
    ALLOW_DATA_ATTR: false
  });
}
