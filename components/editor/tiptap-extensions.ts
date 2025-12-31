import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import { Table } from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableHeader from '@tiptap/extension-table-header';
import TableCell from '@tiptap/extension-table-cell';
import TextAlign from '@tiptap/extension-text-align';
import { TextStyle } from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import FontFamily from '@tiptap/extension-font-family';
import { Extension } from '@tiptap/core';

// Custom extension for line height
export const LineHeight = Extension.create({
  name: 'lineHeight',
  addOptions() {
    return {
      types: ['paragraph', 'heading'],
      defaultLineHeight: 'normal',
    };
  },
  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          lineHeight: {
            default: this.options.defaultLineHeight,
            parseHTML: (element) => element.style.lineHeight || this.options.defaultLineHeight,
            renderHTML: (attributes) => {
              if (!attributes.lineHeight) return {};
              return { style: `line-height: ${attributes.lineHeight}` };
            },
          },
        },
      },
    ];
  },
  addCommands() {
    return {
      setLineHeight:
        (lineHeight: string) =>
        ({ commands }: any) => {
          return this.options.types.every((type: string) =>
            commands.updateAttributes(type, { lineHeight })
          );
        },
    };
  },
});

// Custom extension for text indent
export const Indent = Extension.create({
  name: 'indent',
  addOptions() {
    return {
      types: ['paragraph', 'heading'],
      indentUnit: '2em',
      defaultIndent: 0,
    };
  },
  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          indent: {
            default: this.options.defaultIndent,
            parseHTML: (element) => {
              const style = (element as HTMLElement).style;
              const value = style.textIndent || style.paddingLeft;
              if (!value) return this.options.defaultIndent;
              const match = value.match(/(\d+\.?\d*)(em|px|%)/);
              return match ? parseFloat(match[1]) : this.options.defaultIndent;
            },
            renderHTML: (attributes) => {
              if (!attributes.indent) return {};
              const { indentUnit } = this.options;
              return { style: `padding-left: ${attributes.indent}${indentUnit}` };
            },
          },
        },
      },
    ];
  },
  addCommands() {
    return {
      increaseIndent:
        () =>
        ({ commands }: any) => {
          return this.options.types.every((type: string) => {
            const currentIndent = commands.getAttributes(type)?.indent || this.options.defaultIndent;
            return commands.updateAttributes(type, { indent: currentIndent + 1 });
          });
        },
      decreaseIndent:
        () =>
        ({ commands }: any) => {
          return this.options.types.every((type: string) => {
            const currentIndent = commands.getAttributes(type)?.indent || this.options.defaultIndent;
            const newIndent = Math.max(0, currentIndent - 1);
            return commands.updateAttributes(type, { indent: newIndent });
          });
        },
    };
  },
});

export const getExtensions = () => [
  StarterKit.configure({
    heading: { levels: [1, 2, 3, 4, 5, 6] },
    bulletList: { keepMarks: true },
    orderedList: { keepMarks: true },
  }),
  Image.configure({
    inline: true,
    allowBase64: true,
  }),
  Table.configure({
    allowTableNodeSelection: true,
  }),
  TableRow,
  TableHeader,
  TableCell,
  TextAlign.configure({ types: ['heading', 'paragraph'] }),
  TextStyle,
  Color,
  FontFamily,
  LineHeight,
  Indent,
];
