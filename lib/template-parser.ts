import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';

/**
 * 解析并渲染 Word 模板 (本地实现)
 * 基于 Carbone 的功能原理,使用 docxtemplater 实现
 */

export interface TemplateData {
  title?: string;
  date?: string;
  year?: string;
  today?: string;
  sections?: SectionData[];
  outline?: OutlineData[];
  htmlContent?: string;
  [key: string]: any;
}

export interface SectionData {
  heading: string;
  level: number;
  content: string;
  paragraphs: string[];
  lists?: Array<{ type: string; items: string[] }>;
  quotes?: string[];
  rawContent?: string;
}

export interface OutlineData {
  number: string;
  title: string;
  level: number;
}

/**
 * 从 Buffer 解析模板
 */
export function parseTemplate(templateBuffer: Buffer): Docxtemplater {
  const zip = new PizZip(templateBuffer);

  const doc = new Docxtemplater(zip, {
    paragraphLoop: true,
    linebreaks: true,
    delimiters: {
      start: '{',
      end: '}',
    },
  });

  return doc;
}

/**
 * 渲染模板 (本地实现)
 */
export function renderTemplate(
  templateBuffer: Buffer,
  data: TemplateData
): Buffer {
  try {
    // 解析模板
    const doc = parseTemplate(templateBuffer);

    // 应用格式化器
    const processedData = applyFormatters(data);

    // 渲染数据
    doc.render(processedData);

    // 生成输出
    const buffer = doc.getZip().generate({
      type: 'nodebuffer',
      compression: 'DEFLATE',
    });

    return buffer;
  } catch (error) {
    throw new Error(`Failed to render template: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * 应用格式化器 (基于 Carbone 的格式化器)
 */
function applyFormatters(data: TemplateData): any {
  return deepApplyFormatters(data);
}

/**
 * 递归应用格式化器
 */
function deepApplyFormatters(obj: any): any {
  if (typeof obj === 'string') {
    return processStringFormatters(obj);
  }

  if (Array.isArray(obj)) {
    return obj.map((item, index) => {
      const result = deepApplyFormatters(item);
      // 添加 @index 属性
      if (typeof result === 'object' && result !== null) {
        result['@index'] = index;
      }
      return result;
    });
  }

  if (obj !== null && typeof obj === 'object') {
    const result: any = {};
    for (const [key, value] of Object.entries(obj)) {
      result[key] = deepApplyFormatters(value);
    }
    return result;
  }

  return obj;
}

/**
 * 处理字符串格式化器
 * 注意: docxtemplater 会处理模板中的格式化器调用
 * 这里主要用于特殊处理 (如 convCRLF)
 */
function processStringFormatters(str: string): string {
  // docxtemplater 的 linebreaks: true 选项会自动处理换行
  // 这里可以添加额外的预处理逻辑
  return str;
}

/**
 * 获取模板占位符列表
 */
export function extractTemplatePlaceholders(templateBuffer: Buffer): string[] {
  try {
    const zip = new PizZip(templateBuffer);

    // 从文档中提取变量名 (简单实现)
    const xml = zip.file('word/document.xml')?.asText() || '';
    const matches = xml.match(/\{[^{}]+\}/g) || [];

    const uniquePlaceholders = new Set<string>();
    matches.forEach((match) => {
      // 移除格式化器部分,保留变量名
      const cleanMatch = match
        .replace(/\{d\./g, '')
        .replace(/:/g, ' ')
        .replace(/}/g, '')
        .split(' ')[0]
        .trim();
      if (cleanMatch) {
        uniquePlaceholders.add(cleanMatch);
      }
    });

    return Array.from(uniquePlaceholders);
  } catch {
    return [];
  }
}

/**
 * 验证模板数据
 */
export function validateTemplateData(data: TemplateData): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!data.title && !data.date) {
    errors.push('Missing required fields: title or date');
  }

  if (data.sections && !Array.isArray(data.sections)) {
    errors.push('sections must be an array');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
