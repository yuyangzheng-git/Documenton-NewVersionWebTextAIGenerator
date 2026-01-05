// Word 模板配置

export interface WordTemplate {
  id: string;
  name: string;
  description: string;
  paperBg: string;
  coverImage?: string;
  header: {
    text: string;
    alignment: 'left' | 'center' | 'right';
    backgroundColor: string;
    textColor: string;
    height: string;
    fontSize: number;
    image?: string;
  };
  footer: {
    text: string;
    alignment: 'left' | 'center' | 'right';
    backgroundColor: string;
    textColor: string;
    height: string;
    fontSize: number;
    showPageNumber?: boolean;
    image?: string;
  };
  fontFamily?: string;
  fontSize?: number;
  lineHeight?: number;
  margins?: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  };
}

export const WORD_TEMPLATES: WordTemplate[] = [
  {
    id: 'simple-white',
    name: '简约白',
    description: '简洁干净的白色背景，适合通用文档',
    paperBg: '#ffffff',
    header: {
      text: '',
      alignment: 'center',
      backgroundColor: '#f5f5f5',
      textColor: '#333333',
      height: '40px',
      fontSize: 12,
    },
    footer: {
      text: '第 {page} 页',
      alignment: 'center',
      backgroundColor: '#f5f5f5',
      textColor: '#666666',
      height: '35px',
      fontSize: 10,
      showPageNumber: true,
    },
    fontFamily: 'Times New Roman',
    fontSize: 12,
    lineHeight: 1.6,
    margins: {
      top: 25.4,
      bottom: 25.4,
      left: 25.4,
      right: 25.4,
    },
  },
  {
    id: 'business-blue',
    name: '商务蓝',
    description: '蓝色页眉页脚，适合商务文档',
    paperBg: '#ffffff',
    header: {
      text: '商务文档',
      alignment: 'left',
      backgroundColor: '#2383E2',
      textColor: '#ffffff',
      height: '50px',
      fontSize: 14,
    },
    footer: {
      text: '© 2024 公司版权所有 | 第 {page} 页',
      alignment: 'right',
      backgroundColor: '#2383E2',
      textColor: '#ffffff',
      height: '40px',
      fontSize: 10,
      showPageNumber: true,
    },
    fontFamily: 'Arial',
    fontSize: 12,
    lineHeight: 1.5,
    margins: {
      top: 25.4,
      bottom: 25.4,
      left: 25.4,
      right: 25.4,
    },
  },
  {
    id: 'elegant-gray',
    name: '优雅灰',
    description: '深灰色页眉页脚，显得专业沉稳',
    paperBg: '#fafafa',
    header: {
      text: '',
      alignment: 'center',
      backgroundColor: '#2c3e50',
      textColor: '#ffffff',
      height: '45px',
      fontSize: 13,
    },
    footer: {
      text: '第 {page} 页',
      alignment: 'center',
      backgroundColor: '#2c3e50',
      textColor: '#ecf0f1',
      height: '35px',
      fontSize: 10,
      showPageNumber: true,
    },
    fontFamily: 'Calibri',
    fontSize: 12,
    lineHeight: 1.5,
    margins: {
      top: 25.4,
      bottom: 25.4,
      left: 25.4,
      right: 25.4,
    },
  },
  {
    id: 'fresh-green',
    name: '清新绿',
    description: '绿色页眉页脚，清新自然',
    paperBg: '#ffffff',
    header: {
      text: '',
      alignment: 'center',
      backgroundColor: '#27ae60',
      textColor: '#ffffff',
      height: '45px',
      fontSize: 13,
    },
    footer: {
      text: '第 {page} 页',
      alignment: 'center',
      backgroundColor: '#27ae60',
      textColor: '#ffffff',
      height: '35px',
      fontSize: 10,
      showPageNumber: true,
    },
    fontFamily: 'Arial',
    fontSize: 12,
    lineHeight: 1.5,
    margins: {
      top: 25.4,
      bottom: 25.4,
      left: 25.4,
      right: 25.4,
    },
  },
  {
    id: 'professional-black',
    name: '专业黑',
    description: '黑色页眉页脚，简洁专业',
    paperBg: '#ffffff',
    header: {
      text: '',
      alignment: 'center',
      backgroundColor: '#1a1a1a',
      textColor: '#ffffff',
      height: '45px',
      fontSize: 13,
    },
    footer: {
      text: '第 {page} 页',
      alignment: 'center',
      backgroundColor: '#1a1a1a',
      textColor: '#cccccc',
      height: '35px',
      fontSize: 10,
      showPageNumber: true,
    },
    fontFamily: 'Times New Roman',
    fontSize: 12,
    lineHeight: 1.6,
    margins: {
      top: 25.4,
      bottom: 25.4,
      left: 25.4,
      right: 25.4,
    },
  },
];

export const DEFAULT_TEMPLATE = WORD_TEMPLATES[0];
