/**
 * HTML Security Tool
 * Prevents XSS attacks with isomorphic support (SSR + CSR)
 */

import DOMPurify from 'isomorphic-dompurify';

/**
 * Sanitize HTML content to prevent XSS attacks
 * @param dirty HTML string to sanitize
 * @param allowedTags Optional allowed tags
 * @returns Sanitized safe HTML
 */
export function sanitizeHtml(
  dirty: string,
  allowedTags?: string[]
): string {
  const config = {
    // Allowed tags
    ALLOWED_TAGS: allowedTags || [
      'p', 'br', 'strong', 'em', 'u', 's', 'code', 'pre',
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'ul', 'ol', 'li',
      'blockquote',
      'a', 'img',
      'table', 'thead', 'tbody', 'tr', 'th', 'td',
      'span', 'div'
    ],
    // Allowed attributes
    ALLOWED_ATTR: [
      'href', 'target', 'rel', 'src', 'alt', 'title',
      'class', 'id', 'style',
      'colspan', 'rowspan', 'align'
    ],
    // Allowed URI protocols
    ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|sms|cid|xmpp):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
    // Keep relative URLs
    ALLOW_DATA_ATTR: false,
    // Return trusted HTML
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
 * Sanitize table HTML (more relaxed configuration)
 * @param tableHtml Table HTML string
 * @returns Sanitized table HTML
 */
export function sanitizeTableHtml(tableHtml: string): string {
  return DOMPurify.sanitize(tableHtml, {
    ALLOWED_TAGS: ['table', 'thead', 'tbody', 'tr', 'th', 'td', 'caption'],
    ALLOWED_ATTR: ['colspan', 'rowspan', 'align', 'valign', 'style', 'class'],
    ALLOW_DATA_ATTR: false
  });
}
