'use client';

import { useState, useRef, useEffect } from 'react';
import { Copy, Check, ChevronDown } from 'lucide-react';
import Prism from 'prismjs';
import { createSafeHtml } from '@/lib/html-sanitizer';

// 导入常用语言的语法高亮
import 'prismjs/themes/prism-tomorrow.css';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-java';
import 'prismjs/components/prism-csharp';
import 'prismjs/components/prism-c';  // Must load C before C++
import 'prismjs/components/prism-cpp';
import 'prismjs/components/prism-go';
import 'prismjs/components/prism-rust';
import 'prismjs/components/prism-php';
import 'prismjs/components/prism-ruby';
import 'prismjs/components/prism-bash';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-markdown';
import 'prismjs/components/prism-css';
import 'prismjs/components/prism-sql';
import 'prismjs/components/prism-yaml';
import 'prismjs/components/prism-markup';  // Required for XML
import 'prismjs/components/prism-xml-doc';
import 'prismjs/components/prism-jsx';
import 'prismjs/components/prism-tsx';

/**
 * 代码块组件
 * 参考 AppFlowy 的 code_block 实现
 *
 * 功能：
 * - 语法高亮（20+ 语言）
 * - 语言选择器（搜索、键盘导航）
 * - 一键复制
 * - 行号显示
 * - 自动检测语言
 */

// ==================== 支持的语言列表 ====================

export const SUPPORTED_LANGUAGES = [
  'auto',        // 自动检测
  'javascript',
  'typescript',
  'python',
  'java',
  'csharp',
  'cpp',
  'c',
  'go',
  'rust',
  'php',
  'ruby',
  'bash',
  'shell',
  'json',
  'markdown',
  'html',
  'css',
  'sql',
  'yaml',
  'xml',
  'jsx',
  'tsx',
  'dart',
  'kotlin',
  'swift',
  'scala',
  'r',
  'matlab',
  'plaintext'
];

const LANGUAGE_DISPLAY_NAMES: Record<string, string> = {
  auto: 'Auto',
  javascript: 'JavaScript',
  typescript: 'TypeScript',
  python: 'Python',
  java: 'Java',
  csharp: 'C#',
  cpp: 'C++',
  c: 'C',
  go: 'Go',
  rust: 'Rust',
  php: 'PHP',
  ruby: 'Ruby',
  bash: 'Bash',
  shell: 'Shell',
  json: 'JSON',
  markdown: 'Markdown',
  html: 'HTML',
  css: 'CSS',
  sql: 'SQL',
  yaml: 'YAML',
  xml: 'XML',
  jsx: 'JSX',
  tsx: 'TSX',
  dart: 'Dart',
  kotlin: 'Kotlin',
  swift: 'Swift',
  scala: 'Scala',
  r: 'R',
  matlab: 'MATLAB',
  plaintext: 'Plain Text'
};

// ==================== 类型定义 ====================

export interface CodeBlockData {
  id: string;
  type: 'code';
  content: string;
  language?: string;
  showLineNumbers?: boolean;
}

interface CodeBlockProps {
  block: CodeBlockData;
  editable?: boolean;
  onUpdate?: (id: string, updates: Partial<CodeBlockData>) => void;
  onDelete?: (id: string) => void;
}

// ==================== 代码块主组件 ====================

export function CodeBlock({
  block,
  editable = true,
  onUpdate
}: CodeBlockProps) {
  const [code, setCode] = useState(block.content || '');
  const [language, setLanguage] = useState(block.language || 'auto');
  const [showLineNumbers, setShowLineNumbers] = useState(block.showLineNumbers ?? true);
  const [copied, setCopied] = useState(false);
  const [showLanguagePicker, setShowLanguagePicker] = useState(false);
  const [highlightedCode, setHighlightedCode] = useState('');

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const codeRef = useRef<HTMLElement>(null);
  const languagePickerRef = useRef<HTMLDivElement>(null);

  // 语法高亮
  useEffect(() => {
    if (!code) {
      setHighlightedCode('');
      return;
    }

    const effectiveLanguage = language === 'auto' ? detectLanguage(code) : language;
    const prismLanguage = getPrismLanguage(effectiveLanguage);

    try {
      if (prismLanguage && Prism.languages[prismLanguage]) {
        const highlighted = Prism.highlight(
          code,
          Prism.languages[prismLanguage],
          prismLanguage
        );
        setHighlightedCode(highlighted);
      } else {
        setHighlightedCode(escapeHtml(code));
      }
    } catch (e) {
      console.error('Syntax highlighting error:', e);
      setHighlightedCode(escapeHtml(code));
    }
  }, [code, language]);

  // 同步到父组件
  useEffect(() => {
    onUpdate?.(block.id, { content: code, language, showLineNumbers });
  }, [code, language, showLineNumbers]);

  // 关闭语言选择器（点击外部）
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (languagePickerRef.current && !languagePickerRef.current.contains(e.target as Node)) {
        setShowLanguagePicker(false);
      }
    };

    if (showLanguagePicker) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showLanguagePicker]);

  // 复制代码
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error('Copy failed:', e);
    }
  };

  // 处理代码输入
  const handleCodeChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newCode = e.target.value;
    setCode(newCode);
  };

  // 处理 Tab 键
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const start = e.currentTarget.selectionStart;
      const end = e.currentTarget.selectionEnd;
      const newCode = code.substring(0, start) + '  ' + code.substring(end);
      setCode(newCode);

      // 恢复光标位置
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.selectionStart = textareaRef.current.selectionEnd = start + 2;
        }
      }, 0);
    }
  };

  // 计算行数
  const lineCount = code.split('\n').length;
  const lines = Array.from({ length: lineCount }, (_, i) => i + 1);

  return (
    <div
      style={{
        width: '100%',
        backgroundColor: '#2d2d2d',
        borderRadius: '8px',
        overflow: 'hidden',
        marginTop: '8px',
        marginBottom: '8px',
        border: '1px solid #3d3d3d'
      }}
    >
      {/* 工具栏 */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '8px 12px',
          borderBottom: '1px solid #3d3d3d',
          backgroundColor: '#252525'
        }}
      >
        {/* 语言选择器 */}
        <div style={{ position: 'relative' }} ref={languagePickerRef}>
          <button
            onClick={() => setShowLanguagePicker(!showLanguagePicker)}
            style={{
              padding: '4px 12px',
              fontSize: '12px',
              backgroundColor: '#3d3d3d',
              color: '#ccc',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            {LANGUAGE_DISPLAY_NAMES[language] || language}
            <ChevronDown size={14} />
          </button>

          {showLanguagePicker && (
            <LanguagePicker
              currentLanguage={language}
              onSelect={(lang) => {
                setLanguage(lang);
                setShowLanguagePicker(false);
              }}
            />
          )}
        </div>

        {/* 右侧按钮 */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {/* 行号切换 */}
          <button
            onClick={() => setShowLineNumbers(!showLineNumbers)}
            style={{
              padding: '4px 8px',
              fontSize: '11px',
              backgroundColor: showLineNumbers ? '#3b82f6' : '#3d3d3d',
              color: '#ccc',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            行号
          </button>

          {/* 复制按钮 */}
          <button
            onClick={handleCopy}
            style={{
              padding: '4px 8px',
              fontSize: '11px',
              backgroundColor: '#3d3d3d',
              color: copied ? '#10b981' : '#ccc',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            {copied ? (
              <>
                <Check size={14} />
                已复制
              </>
            ) : (
              <>
                <Copy size={14} />
                复制
              </>
            )}
          </button>
        </div>
      </div>

      {/* 代码区域 */}
      <div
        style={{
          display: 'flex',
          position: 'relative',
          overflow: 'auto',
          maxHeight: '500px'
        }}
      >
        {/* 行号 */}
        {showLineNumbers && (
          <div
            style={{
              padding: '16px 12px',
              backgroundColor: '#1e1e1e',
              color: '#858585',
              fontSize: '13px',
              fontFamily: 'monospace',
              lineHeight: '1.6',
              textAlign: 'right',
              userSelect: 'none',
              minWidth: '40px',
              borderRight: '1px solid #3d3d3d'
            }}
          >
            {lines.map(line => (
              <div key={line}>{line}</div>
            ))}
          </div>
        )}

        {/* 代码编辑器 + 高亮显示 */}
        <div style={{ flex: 1, position: 'relative' }}>
          {editable ? (
            <>
              {/* 高亮层（背景） */}
              <pre
                style={{
                  margin: 0,
                  padding: '16px',
                  color: 'transparent',
                  fontSize: '13px',
                  fontFamily: 'monospace',
                  lineHeight: '1.6',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  pointerEvents: 'none',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0
                }}
              >
                <code
                  ref={codeRef}
                  className={`language-${getPrismLanguage(language)}`}
                  dangerouslySetInnerHTML={createSafeHtml(highlightedCode)}
                />
              </pre>

              {/* 输入层（前景） */}
              <textarea
                ref={textareaRef}
                value={code}
                onChange={handleCodeChange}
                onKeyDown={handleKeyDown}
                placeholder="输入代码..."
                spellCheck={false}
                style={{
                  margin: 0,
                  padding: '16px',
                  width: '100%',
                  minHeight: '200px',
                  backgroundColor: 'transparent',
                  color: 'transparent',
                  caretColor: '#fff',
                  fontSize: '13px',
                  fontFamily: 'monospace',
                  lineHeight: '1.6',
                  border: 'none',
                  outline: 'none',
                  resize: 'vertical',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  position: 'relative'
                }}
              />
            </>
          ) : (
            <pre
              style={{
                margin: 0,
                padding: '16px',
                fontSize: '13px',
                fontFamily: 'monospace',
                lineHeight: '1.6',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word'
              }}
            >
              <code
                className={`language-${getPrismLanguage(language)}`}
                dangerouslySetInnerHTML={createSafeHtml(highlightedCode)}
              />
            </pre>
          )}
        </div>
      </div>
    </div>
  );
}

// ==================== 语言选择器组件 ====================

interface LanguagePickerProps {
  currentLanguage: string;
  onSelect: (language: string) => void;
}

function LanguagePicker({ currentLanguage, onSelect }: LanguagePickerProps) {
  const [search, setSearch] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(
    SUPPORTED_LANGUAGES.indexOf(currentLanguage)
  );

  const filteredLanguages = SUPPORTED_LANGUAGES.filter(lang =>
    LANGUAGE_DISPLAY_NAMES[lang]?.toLowerCase().includes(search.toLowerCase())
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % filteredLanguages.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + filteredLanguages.length) % filteredLanguages.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex >= 0 && selectedIndex < filteredLanguages.length) {
        onSelect(filteredLanguages[selectedIndex]);
      }
    }
  };

  return (
    <div
      style={{
        position: 'absolute',
        top: '100%',
        left: 0,
        marginTop: '4px',
        width: '200px',
        maxHeight: '300px',
        backgroundColor: '#2d2d2d',
        border: '1px solid #3d3d3d',
        borderRadius: '8px',
        overflow: 'hidden',
        zIndex: 1000,
        boxShadow: '0 4px 12px rgba(0,0,0,0.5)'
      }}
    >
      {/* 搜索框 */}
      <input
        autoFocus
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="搜索语言..."
        style={{
          width: '100%',
          padding: '8px 12px',
          backgroundColor: '#252525',
          color: '#ccc',
          border: 'none',
          borderBottom: '1px solid #3d3d3d',
          outline: 'none',
          fontSize: '12px'
        }}
      />

      {/* 语言列表 */}
      <div
        style={{
          maxHeight: '250px',
          overflowY: 'auto'
        }}
      >
        {filteredLanguages.map((lang, index) => (
          <div
            key={lang}
            onClick={() => onSelect(lang)}
            style={{
              padding: '8px 12px',
              fontSize: '12px',
              color: '#ccc',
              cursor: 'pointer',
              backgroundColor: index === selectedIndex ? '#3b82f6' : 'transparent'
            }}
            onMouseEnter={() => setSelectedIndex(index)}
          >
            {LANGUAGE_DISPLAY_NAMES[lang]}
          </div>
        ))}
      </div>
    </div>
  );
}

// ==================== 工具函数 ====================

/**
 * 简单的语言自动检测（基于关键字）
 */
function detectLanguage(code: string): string {
  const trimmed = code.trim();

  // JavaScript/TypeScript
  if (/^(import|export|const|let|var|function|class)\s/.test(trimmed)) {
    if (trimmed.includes(':') && (trimmed.includes('interface') || trimmed.includes('type'))) {
      return 'typescript';
    }
    return 'javascript';
  }

  // Python
  if (/^(def|class|import|from|if __name__)\s/.test(trimmed)) {
    return 'python';
  }

  // JSON
  if (/^[\{\[]/.test(trimmed) && /[\}\]]$/.test(trimmed)) {
    try {
      JSON.parse(trimmed);
      return 'json';
    } catch (e) {
      // Not JSON
    }
  }

  // HTML
  if (/^<!DOCTYPE|^<html|^<\w+/.test(trimmed)) {
    return 'html';
  }

  // CSS
  if (/^[\w-]+\s*\{/.test(trimmed) || /^@(media|keyframes|import)/.test(trimmed)) {
    return 'css';
  }

  return 'plaintext';
}

/**
 * 获取 Prism 语言标识符
 */
function getPrismLanguage(language: string): string {
  const mapping: Record<string, string> = {
    auto: 'javascript',
    js: 'javascript',
    ts: 'typescript',
    py: 'python',
    cpp: 'cpp',
    c: 'c',
    shell: 'bash'
  };

  return mapping[language] || language;
}

/**
 * 转义 HTML
 */
function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };

  return text.replace(/[&<>"']/g, m => map[m]);
}
