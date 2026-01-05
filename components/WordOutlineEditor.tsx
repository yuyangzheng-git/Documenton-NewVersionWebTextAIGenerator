'use client';

import { useState } from 'react';
import { OutlineBlock } from '@/components/editor/OutlineBlock';
import { WORD_TEMPLATES } from '@/lib/word-templates';
import { Download, ChevronLeft, Type, Plus } from 'lucide-react';
import { exportToDocx } from '@/lib/export-utils';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { OutlineItem } from '@/store/useStore';
import { MoreMenu } from '@/components/MoreMenu';
import { TextFormatBar } from '@/components/TextFormatBar';

interface WordOutlineEditorProps {
  documentTitle?: string;
  onTitleChange?: (title: string) => void;
}

export function WordOutlineEditor({ documentTitle = '未命名文档', onTitleChange }: WordOutlineEditorProps) {
  const [outline, setOutline] = useState<OutlineItem[]>([
    {
      id: '1',
      title: '示例标题 1',
      level: 1,
      status: 'idle',
      content: '这是第一级标题下的内容。可以点击编辑文本，或者按回车键创建新的文本块。',
    },
    {
      id: '2',
      title: '示例标题 2',
      level: 1,
      status: 'idle',
      content: '',
    },
    {
      id: '3',
      title: '子标题 2.1',
      level: 2,
      status: 'idle',
      content: '这是第二级标题下的内容。',
    },
    {
      id: '4',
      title: '三级标题',
      level: 3,
      status: 'idle',
      content: '这是第三级标题的内容。',
    },
  ]);
  const [selectedTemplate, setSelectedTemplate] = useState(WORD_TEMPLATES[0]);
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  const [textFormatBar, setTextFormatBar] = useState({ visible: false, x: 0, y: 0 });

  const sensors = useSensors(useSensor(PointerSensor));

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = outline.findIndex((item) => item.id === active.id);
      const newIndex = outline.findIndex((item) => item.id === over.id);
      const reordered = arrayMove(outline, oldIndex, newIndex);
      setOutline(reordered);
    }
  };

  const handleUpdate = (id: string, updates: Partial<OutlineItem>) => {
    setOutline((prev) => prev.map((item) => (item.id === id ? { ...item, ...updates } : item)));
  };

  const handleDelete = (id: string) => {
    setOutline((prev) => prev.filter((item) => item.id !== id));
  };

  const handleAddBelow = (id: string, title = '新段落') => {
    const block = outline.find((b) => b.id === id);
    if (!block) return;

    const newBlock: OutlineItem = {
      id: `new-${Date.now()}`,
      title,
      level: block.level,
      status: 'idle',
      content: '',
    };

    const index = outline.findIndex((item) => item.id === id);
    const reordered = [...outline.slice(0, index + 1), newBlock, ...outline.slice(index + 1)];
    setOutline(reordered);
  };

  const handleEnterPress = (id: string) => {
    handleAddBelow(id, '');
  };

  const handleAddNew = (level: 1 | 2 | 3) => {
    const newBlock: OutlineItem = {
      id: `new-${Date.now()}`,
      title: `标题 ${outline.length + 1}`,
      level,
      status: 'idle',
      content: '',
    };
    setOutline((prev) => [...prev, newBlock]);
  };

  const handleImportTemplate = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.docx,.doc';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        console.log('导入模板:', file.name);
        // TODO: 实现模板导入逻辑
      }
    };
    input.click();
  };

  const handleExport = async () => {
    const html = outline
      .map((item) => {
        const content = item.content || '';
        let heading = 'p';
        if (item.level === 1) heading = 'h1';
        else if (item.level === 2) heading = 'h2';
        else if (item.level === 3) heading = 'h3';
        return `<${heading}>${item.number || ''} ${item.title}</${heading}><p>${content}</p>`;
      })
      .join('');

    await exportToDocx(html, documentTitle, selectedTemplate);
  };

  const handleDropImage = (e: React.DragEvent, blockId: string) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        handleUpdate(blockId, { content: (outline.find((b) => b.id === blockId)?.content || '') + `\n![图片](${base64})` });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleTextSelection = () => {
    const selection = window.getSelection();
    if (selection && selection.toString().trim()) {
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      setTextFormatBar({
        visible: true,
        x: rect.left + rect.width / 2,
        y: rect.top,
      });
    }
  };

  const handleFormat = (format: string) => {
    console.log('应用格式:', format);
    setTextFormatBar({ visible: false, x: 0, y: 0 });
  };

  const generateNumbers = (items: OutlineItem[]): OutlineItem[] => {
    const level1Counters: { [key: string]: number } = {};
    const level2Counters: { [key: string]: number } = {};
    const level3Counters: { [key: string]: number } = {};
    let lastLevel1Id: string | null = null;
    let lastLevel2Id: string | null = null;

    return items.map((item) => {
      if (item.level === 1) {
        lastLevel1Id = item.id;
        lastLevel2Id = null;
        level1Counters[item.id] = (level1Counters[item.id] || 0) + 1;
        return {
          ...item,
          number: `${level1Counters[item.id]}`,
        };
      } else if (item.level === 2 && lastLevel1Id) {
        lastLevel2Id = item.id;
        level2Counters[item.id] = (level2Counters[item.id] || 0) + 1;
        const level1Num = level1Counters[lastLevel1Id];
        return {
          ...item,
          number: `${level1Num}.${level2Counters[item.id]}`,
        };
      } else if (item.level === 3 && lastLevel2Id) {
        level3Counters[item.id] = (level3Counters[item.id] || 0) + 1;
        const level1Num = level1Counters[lastLevel1Id!];
        const level2Num = level2Counters[lastLevel2Id];
        return {
          ...item,
          number: `${level1Num}.${level2Num}.${level3Counters[item.id]}`,
        };
      }
      return item;
    });
  };

  const outlineWithNumbers = generateNumbers(outline);

  return (
    <div className="h-screen flex flex-col" style={{ backgroundColor: 'var(--notion-bg-primary)' }}>
      {/* 顶部导航栏 */}
      <header
        className="flex-shrink-0 px-4 py-2 flex items-center justify-between border-b"
        style={{ backgroundColor: 'var(--notion-bg-primary)', borderColor: 'var(--notion-border)' }}
      >
        <div className="flex items-center gap-2">
          <button
            onClick={() => window.history.back()}
            className="p-1.5 rounded transition-colors hover:bg-[rgba(55,53,47,0.08)]"
            style={{ color: 'var(--notion-text-secondary)' }}
            title="返回"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="h-5 w-px mx-1" style={{ backgroundColor: 'var(--notion-border)' }}></div>
          <input
            type="text"
            value={documentTitle}
            onChange={(e) => onTitleChange?.(e.target.value)}
            className="text-lg font-semibold bg-transparent border-none focus:outline-none px-2 py-1"
            style={{ color: 'var(--notion-text)' }}
            placeholder="文档标题"
          />
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setShowTemplateSelector(!showTemplateSelector)}
            className="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors hover:bg-[rgba(55,53,47,0.08)]"
            style={{ color: 'var(--notion-text)' }}
          >
            {selectedTemplate.name}
          </button>
          <MoreMenu onImportTemplate={handleImportTemplate} />
        </div>
      </header>

      {/* 模板选择器 */}
      {showTemplateSelector && (
        <div
          className="flex items-center gap-2 px-6 py-3 border-b"
          style={{ borderColor: 'var(--notion-border)' }}
        >
          {WORD_TEMPLATES.map((template) => (
            <button
              key={template.id}
              onClick={() => {
                setSelectedTemplate(template);
                setShowTemplateSelector(false);
              }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                selectedTemplate.id === template.id ? 'shadow-md' : 'hover:shadow-sm'
              }`}
              style={{
                backgroundColor: selectedTemplate.id === template.id
                  ? template.header.backgroundColor
                  : 'var(--notion-bg-secondary)',
                color: selectedTemplate.id === template.id
                  ? template.header.textColor
                  : 'var(--notion-text)',
                border: `1px solid ${selectedTemplate.id === template.id ? template.header.backgroundColor : 'var(--notion-border)'}`,
              }}
            >
              {template.name}
            </button>
          ))}
        </div>
      )}

      {/* 主内容区域 */}
      <div className="flex-1 overflow-y-auto" onMouseUp={handleTextSelection}>
        <div className="max-w-[900px] mx-auto py-6 px-4">
          {/* 快捷工具栏 */}
          <div
            className="flex items-center gap-2 px-4 py-2 mb-4 rounded-lg"
            style={{
              backgroundColor: 'var(--notion-bg-secondary)',
            }}
          >
            <button
              onClick={() => handleAddNew(1)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium text-sm transition-colors hover:bg-[rgba(55,53,47,0.08)]"
              style={{ color: 'var(--notion-text)' }}
            >
              <Type className="w-3.5 h-3.5" />
              H1
            </button>
            <button
              onClick={() => handleAddNew(2)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium text-sm transition-colors hover:bg-[rgba(55,53,47,0.08)]"
              style={{ color: 'var(--notion-text)' }}
            >
              <Type className="w-3.5 h-3.5" />
              H2
            </button>
            <button
              onClick={() => handleAddNew(3)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium text-sm transition-colors hover:bg-[rgba(55,53,47,0.08)]"
              style={{ color: 'var(--notion-text)' }}
            >
              <Type className="w-3.5 h-3.5" />
              H3
            </button>
            <div className="w-px h-6 mx-1" style={{ backgroundColor: 'var(--notion-border)' }}></div>
            <button
              onClick={() => handleAddNew(1)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium text-sm transition-colors hover:bg-[rgba(55,53,47,0.08)]"
              style={{ color: 'var(--notion-text)' }}
            >
              <Plus className="w-3.5 h-3.5" />
              段落
            </button>
            <button
              onClick={handleExport}
              className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-white transition-colors hover:opacity-90"
              style={{ background: 'linear-gradient(135deg, #2383E2 0%, #1A6FC4 100%)' }}
            >
              <Download className="w-4 h-4" />
              导出
            </button>
          </div>

          {/* A4 纸张容器 */}
          <div
            className="relative mx-auto rounded-lg"
            style={{
              width: '210mm',
              minHeight: '297mm',
              backgroundColor: selectedTemplate.paperBg,
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
            }}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => e.preventDefault()}
          >
            {/* 页眉 */}
            <div
              className="flex items-center border-b"
              style={{
                backgroundColor: selectedTemplate.header.backgroundColor,
                color: selectedTemplate.header.textColor,
                height: selectedTemplate.header.height,
                textAlign: selectedTemplate.header.alignment,
                paddingLeft: '20mm',
                paddingRight: '20mm',
                fontSize: `${selectedTemplate.header.fontSize}pt`,
                borderColor: 'transparent',
              }}
            >
              {selectedTemplate.header.text}
            </div>

            {/* 编辑器内容 */}
            <div
              style={{
                paddingLeft: '20mm',
                paddingRight: '20mm',
                paddingTop: '10mm',
                paddingBottom: '10mm',
              }}
            >
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={outlineWithNumbers.map((i) => i.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-1">
                    {outlineWithNumbers.map((block) => (
                      <OutlineBlock
                        key={block.id}
                        block={block}
                        onUpdate={handleUpdate}
                        onDelete={handleDelete}
                        onAddBelow={handleAddBelow}
                        onEnterPress={handleEnterPress}
                        onDropImage={handleDropImage}
                        number={block.number}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            </div>

            {/* 页脚 */}
            <div
              className="flex items-center border-t"
              style={{
                backgroundColor: selectedTemplate.footer.backgroundColor,
                color: selectedTemplate.footer.textColor,
                height: selectedTemplate.footer.height,
                textAlign: selectedTemplate.footer.alignment,
                paddingLeft: '20mm',
                paddingRight: '20mm',
                fontSize: `${selectedTemplate.footer.fontSize}pt`,
                borderColor: 'transparent',
              }}
            >
              {selectedTemplate.footer.text.replace('{page}', '1')}
            </div>
          </div>
        </div>
      </div>

      {/* 文本格式栏 */}
      <TextFormatBar
        x={textFormatBar.x}
        y={textFormatBar.y}
        visible={textFormatBar.visible}
        onClose={() => setTextFormatBar({ visible: false, x: 0, y: 0 })}
        onFormat={handleFormat}
      />
    </div>
  );
}
