/**
 * Carbone 风格的模板格式化器
 * 完全本地化实现,支持常用格式化功能
 */

/**
 * 大写转换
 */
export function upperCase(str: string): string {
  if (typeof str !== 'string') return '';
  return str.toUpperCase();
}

/**
 * 小写转换
 */
export function lowerCase(str: string): string {
  if (typeof str !== 'string') return '';
  return str.toLowerCase();
}

/**
 * 首字母大写
 */
export function ucFirst(str: string): string {
  if (typeof str !== 'string') return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * 每个单词首字母大写
 */
export function ucWords(str: string): string {
  if (typeof str !== 'string') return '';
  return str.replace(/\b\w/g, (char) => char.toUpperCase());
}

/**
 * 子字符串截取
 * @param str 原字符串
 * @param start 起始位置
 * @param length 截取长度
 * @param byWord 是否按单词截取
 */
export function substr(str: string, start: number, length?: number, byWord?: boolean): string {
  if (typeof str !== 'string') return '';

  let result = '';

  if (byWord && length) {
    // 按单词截取
    const words = str.split(/\s+/);
    let totalLength = 0;
    const selectedWords: string[] = [];

    for (const word of words) {
      if (totalLength + word.length > length) break;
      selectedWords.push(word);
      totalLength += word.length + 1; // +1 for space
    }

    result = selectedWords.join(' ');
  } else {
    // 直接截取 (使用 substring 替代 substr)
    result = length ? str.substring(start, start + length) : str.substring(start);
  }

  return result;
}

/**
 * 字符串替换
 * @param str 原字符串
 * @param search 搜索字符串
 * @param replace 替换字符串
 */
export function replace(str: string, search: string, replaceWith: string): string {
  if (typeof str !== 'string') return '';
  return str.replace(new RegExp(search, 'g'), replaceWith);
}

/**
 * 获取字符串长度
 */
export function len(str: string | any[]): number {
  if (typeof str === 'string') {
    return str.length;
  }
  if (Array.isArray(str)) {
    return str.length;
  }
  return String(str).length;
}

/**
 * 左填充
 * @param str 原字符串
 * @param length 目标长度
 * @param char 填充字符
 */
export function padl(str: string, length: number, char: string = ' '): string {
  if (typeof str !== 'string') str = String(str);
  while (str.length < length) {
    str = char + str;
  }
  return str;
}

/**
 * 右填充
 * @param str 原字符串
 * @param length 目标长度
 * @param char 填充字符
 */
export function padr(str: string, length: number, char: string = ' '): string {
  if (typeof str !== 'string') str = String(str);
  while (str.length < length) {
    str = str + char;
  }
  return str;
}

/**
 * 省略号截断
 * @param str 原字符串
 * @param maxLength 最大长度
 */
export function ellipsis(str: string, maxLength: number): string {
  if (typeof str !== 'string') return '';
  if (str.length <= maxLength) return str;
  return substr(str, 0, maxLength - 3) + '...';
}

/**
 * 换行符转换 (LF 到 CRLF)
 * 这是 Word 模板中最常用的格式化器
 */
export function convCRLF(str: string): string {
  if (typeof str !== 'string') return '';
  return str.replace(/\n/g, '\r\n');
}

/**
 * 格式化器集合
 */
export const formatters = {
  upperCase,
  lowerCase,
  ucFirst,
  ucWords,
  substr,
  replace,
  len,
  padl,
  padr,
  ellipsis,
  convCRLF,
};

/**
 * 格式化器类型
 */
export type FormatterName = keyof typeof formatters;

/**
 * 应用格式化器
 * @param value 原值
 * @param formatterName 格式化器名称
 * @param args 格式化器参数
 */
export function applyFormatter(
  value: any,
  formatterName: FormatterName,
  args: any[] = []
): any {
  const formatter = formatters[formatterName];
  if (!formatter) {
    console.warn(`Unknown formatter: ${formatterName}`);
    return value;
  }

  try {
    return (formatter as any)(value, ...args);
  } catch (error) {
    console.error(`Formatter ${formatterName} error:`, error);
    return value;
  }
}

/**
 * 解析模板中的格式化器调用
 * 示例: "{d.title:upperCase()}" -> ["upperCase", []]
 *       "{d.text:substr(0, 50, true)}" -> ["substr", [0, 50, true]]
 */
export function parseFormatterCall(expression: string): [string, any[]] | null {
  // 匹配格式: formatterName(arg1, arg2, ...)
  const match = expression.match(/^(\w+)\((.*)\)$/);
  if (!match) return null;

  const formatterName = match[1];
  const argsString = match[2];

  if (!argsString.trim()) {
    return [formatterName, []];
  }

  // 解析参数
  const args: any[] = [];
  let currentArg = '';
  let inString = false;
  let stringChar = '';

  for (let i = 0; i < argsString.length; i++) {
    const char = argsString[i];

    if ((char === "'" || char === '"') && !inString) {
      inString = true;
      stringChar = char;
      continue;
    }

    if (char === stringChar && inString) {
      inString = false;
      continue;
    }

    if (char === ',' && !inString) {
      args.push(parseArg(currentArg.trim()));
      currentArg = '';
      continue;
    }

    currentArg += char;
  }

  if (currentArg.trim()) {
    args.push(parseArg(currentArg.trim()));
  }

  return [formatterName, args];
}

/**
 * 解析单个参数
 */
function parseArg(arg: string): any {
  if (!arg) return null;

  // 字符串参数
  if ((arg.startsWith("'") && arg.endsWith("'")) || (arg.startsWith('"') && arg.endsWith('"'))) {
    return arg.slice(1, -1);
  }

  // 布尔值
  if (arg === 'true') return true;
  if (arg === 'false') return false;

  // 数字
  const num = Number(arg);
  if (!isNaN(num)) return num;

  return arg;
}
