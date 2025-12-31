'use client';

import { useState, useRef, useEffect } from 'react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { OutlineBlock, OutlineBlockData } from '@/components/editor/OutlineBlock';
import { DraggableAIButton } from '@/components/ai/DraggableAIButton';
import { ApiKeySettings } from '@/components/settings/ApiKeySettings';
import { exportToDocx, exportToPdf } from '@/lib/export-utils';
import { generateOutlineWithPlanner, generateSectionWithWorker, DifyOutlineItem } from '@/lib/dify-api';
import { MoreHorizontal, Plus, X } from 'lucide-react';

// Sample outline data with nested structure
const SAMPLE_OUTLINE: OutlineBlockData[] = [
  {
    id: '1',
    level: 1,
    title: 'Introduction to Artificial Intelligence',
    content: '',
    status: 'idle'
  },
  {
    id: '2',
    level: 2,
    title: 'What is AI?',
    content: '',
    status: 'idle'
  },
  {
    id: '3',
    level: 2,
    title: 'Brief History of AI',
    content: '',
    status: 'idle'
  },
  {
    id: '4',
    level: 1,
    title: 'Core Concepts of AI',
    content: '',
    status: 'idle'
  },
  {
    id: '5',
    level: 2,
    title: 'Machine Learning',
    content: '',
    status: 'idle'
  },
  {
    id: '6',
    level: 2,
    title: 'Deep Learning',
    content: '',
    status: 'idle'
  },
  {
    id: '7',
    level: 2,
    title: 'Natural Language Processing',
    content: '',
    status: 'idle'
  },
  {
    id: '8',
    level: 1,
    title: 'Applications of AI',
    content: '',
    status: 'idle'
  },
  {
    id: '9',
    level: 2,
    title: 'AI in Healthcare',
    content: '',
    status: 'idle'
  },
  {
    id: '10',
    level: 2,
    title: 'AI in Finance',
    content: '',
    status: 'idle'
  },
  {
    id: '11',
    level: 2,
    title: 'AI in Transportation',
    content: '',
    status: 'idle'
  },
  {
    id: '12',
    level: 1,
    title: 'Future of AI',
    content: '',
    status: 'idle'
  },
  {
    id: '13',
    level: 2,
    title: 'Emerging Trends',
    content: '',
    status: 'idle'
  },
  {
    id: '14',
    level: 2,
    title: 'Ethical Considerations',
    content: '',
    status: 'idle'
  },
];

export default function Editor() {
  const [documentTitle, setDocumentTitle] = useState('AI Document - Artificial Intelligence Guide');
  const [blocks, setBlocks] = useState<OutlineBlockData[]>(SAMPLE_OUTLINE);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGeneratingOutline, setIsGeneratingOutline] = useState(false);
  const [showOutlineGenerator, setShowOutlineGenerator] = useState(false);
  const [outlineTopic, setOutlineTopic] = useState('');
  const [outlineStyle, setOutlineStyle] = useState('专业严肃');
  const [plannerKey, setPlannerKey] = useState('');
  const [workerKey, setWorkerKey] = useState('');
  const [error, setError] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Load API keys from localStorage on mount
  useEffect(() => {
    const savedPlannerKey = localStorage.getItem('dify-planner-key');
    const savedWorkerKey = localStorage.getItem('dify-worker-key');
    if (savedPlannerKey) setPlannerKey(savedPlannerKey);
    if (savedWorkerKey) setWorkerKey(savedWorkerKey);
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setBlocks((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const handleUpdateBlock = (id: string, updates: Partial<OutlineBlockData>) => {
    setBlocks((items) =>
      items.map((item) => (item.id === id ? { ...item, ...updates } : item))
    );
  };

  const handleDeleteBlock = (id: string) => {
    setBlocks((items) => items.filter((item) => item.id !== id));
  };

  const handleAddBlock = (afterId: string) => {
    const index = blocks.findIndex((item) => item.id === afterId);
    const currentBlock = blocks[index];
    const newBlock: OutlineBlockData = {
      id: `block-${Date.now()}`,
      level: currentBlock.level,
      title: 'New Section',
      content: '',
      status: 'idle'
    };
    const newBlocks = [...blocks];
    newBlocks.splice(index + 1, 0, newBlock);
    setBlocks(newBlocks);
  };

  const handleAddBlockAtEnd = () => {
    const newBlock: OutlineBlockData = {
      id: `block-${Date.now()}`,
      level: 1,
      title: 'New Section',
      content: '',
      status: 'idle'
    };
    setBlocks([...blocks, newBlock]);
  };

  const handleGenerateOutline = async () => {
    if (isGeneratingOutline) return;

    // Check API key
    if (!plannerKey) {
      setError('Please configure your Planner API key first');
      setTimeout(() => setError(null), 3000);
      return;
    }

    if (!outlineTopic.trim()) {
      setError('Please enter a topic for the outline');
      setTimeout(() => setError(null), 3000);
      return;
    }

    setIsGeneratingOutline(true);
    setError(null);

    try {
      // Call Planner API to generate outline
      const outline = await generateOutlineWithPlanner(
        plannerKey,
        outlineTopic,
        outlineStyle
      );

      // Convert DifyOutlineItem[] to OutlineBlockData[]
      const convertToBlocks = (items: DifyOutlineItem[]): OutlineBlockData[] => {
        const result: OutlineBlockData[] = [];

        const processItem = (item: DifyOutlineItem) => {
          result.push({
            id: item.id || `block-${Date.now()}-${Math.random()}`,
            level: item.level,
            title: item.title,
            content: '',
            status: 'idle'
          });

          if (item.children) {
            item.children.forEach(processItem);
          }
        };

        items.forEach(processItem);
        return result;
      };

      const newBlocks = convertToBlocks(outline);
      setBlocks(newBlocks);
      setDocumentTitle(outlineTopic);
      setShowOutlineGenerator(false);
      setOutlineTopic('');
    } catch (err) {
      console.error('Outline generation error:', err);
      setError('Failed to generate outline. Please check your API key and try again.');
    } finally {
      setIsGeneratingOutline(false);
    }
  };

  const handleGenerateContent = async () => {
    if (isGenerating) return;

    // Check API keys
    if (!workerKey) {
      setError('Please configure your Worker API key first');
      setTimeout(() => setError(null), 3000);
      return;
    }

    setIsGenerating(true);
    setError(null);

    // Generate full outline text for context
    const fullOutline = blocks
      .map((block) => `${'  '.repeat(block.level - 1)}- ${block.title}`)
      .join('\n');

    try {
      // Generate content for each block using real Dify Worker API (streaming)
      for (let i = 0; i < blocks.length; i++) {
        const block = blocks[i];

        // Mark as generating
        setBlocks((items) =>
          items.map((item) =>
            item.id === block.id ? { ...item, status: 'generating', content: '' } : item
          )
        );

        try {
          // Call Worker API with streaming
          await new Promise<void>((resolve, reject) => {
            generateSectionWithWorker(
              workerKey,
              block.title,
              documentTitle,
              fullOutline,
              // onChunk: append streaming text
              (chunk: string) => {
                setBlocks((items) =>
                  items.map((item) =>
                    item.id === block.id
                      ? { ...item, content: (item.content || '') + chunk }
                      : item
                  )
                );
              },
              // onComplete: mark as completed
              () => {
                setBlocks((items) =>
                  items.map((item) =>
                    item.id === block.id ? { ...item, status: 'completed' } : item
                  )
                );
                resolve();
              },
              // onError: handle error
              (error: Error) => {
                console.error(`Failed to generate content for block ${block.id}:`, error);
                setBlocks((items) =>
                  items.map((item) =>
                    item.id === block.id ? { ...item, status: 'idle' } : item
                  )
                );
                setError(`Failed to generate content for "${block.title}"`);
                reject(error);
              }
            );
          });
        } catch (err) {
          console.error(`Error generating block ${block.id}:`, err);
          // Continue to next block even if one fails
        }

        // Small delay between blocks
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    } catch (err) {
      console.error('Generation error:', err);
      setError('Failed to generate content. Please check your API key.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleExportDocx = () => {
    // Convert blocks to HTML for export
    const html = blocks
      .map((block) => {
        const heading = `<h${block.level}>${block.title}</h${block.level}>`;
        const content = block.content ? `<p>${block.content}</p>` : '';
        return heading + content;
      })
      .join('');
    exportToDocx(html, documentTitle);
    setMenuOpen(false);
  };

  const handleExportPdf = () => {
    exportToPdf(documentTitle);
    setMenuOpen(false);
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: 'var(--notion-bg)' }}>
      {/* Header - Notion style */}
      <header className="flex-shrink-0 px-8 py-3 flex items-center justify-between sticky top-0 z-40 bg-[var(--notion-bg)]/95 backdrop-blur-sm" style={{ borderBottom: '1px solid var(--notion-border)' }}>
        <div className="flex items-center gap-3">
          <div className="text-xl">📄</div>
          <input
            type="text"
            value={documentTitle}
            onChange={(e) => setDocumentTitle(e.target.value)}
            className="text-base font-medium bg-transparent border-none focus:outline-none"
            style={{ color: 'var(--notion-text)', caretColor: 'var(--notion-blue)' }}
            placeholder="Untitled"
          />
        </div>

        <div className="flex items-center gap-1">
          {/* Generate Outline Button */}
          <button
            onClick={() => setShowOutlineGenerator(true)}
            className="px-3 py-1.5 text-sm rounded hover:bg-[var(--notion-gray-hover)] transition-colors"
            style={{ color: 'var(--notion-text-secondary)' }}
            title="Generate new outline with AI"
          >
            Generate Outline
          </button>

          {/* API Key Settings */}
          <ApiKeySettings
            plannerKey={plannerKey}
            workerKey={workerKey}
            onSave={(planner, worker) => {
              setPlannerKey(planner);
              setWorkerKey(worker);
            }}
          />

          {/* Menu - Notion style text button */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-1.5 rounded hover:bg-[var(--notion-gray-hover)] transition-colors"
              style={{ color: 'var(--notion-text-secondary)' }}
            >
              <MoreHorizontal className="w-5 h-5" />
            </button>

            {menuOpen && (
              <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded shadow-xl border overflow-hidden z-50" style={{ borderColor: 'var(--notion-border-strong)', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
                <button
                  onClick={handleExportDocx}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-[var(--notion-gray-hover)] transition-colors"
                  style={{ color: 'var(--notion-text)' }}
                >
                  Export as DOCX
                </button>
                <button
                  onClick={handleExportPdf}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-[var(--notion-gray-hover)] transition-colors"
                  style={{ color: 'var(--notion-text)' }}
                >
                  Export as PDF
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Error Toast */}
      {error && (
        <div className="fixed top-20 right-6 z-50 bg-white rounded shadow-lg px-4 py-3 animate-fade-in" style={{ border: '1px solid var(--notion-border-strong)' }}>
          <p className="text-sm" style={{ color: 'var(--notion-text)' }}>{error}</p>
        </div>
      )}

      {/* Outline Generator Modal */}
      {showOutlineGenerator && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div
            className="bg-white rounded shadow-2xl max-w-md w-full"
            style={{ border: '1px solid var(--notion-border)' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid var(--notion-border)' }}>
              <h2 className="text-base font-medium" style={{ color: 'var(--notion-text)' }}>
                Generate Outline
              </h2>
              <button
                onClick={() => setShowOutlineGenerator(false)}
                className="p-1 rounded hover:bg-[var(--notion-gray-hover)] transition-colors"
                style={{ color: 'var(--notion-text-secondary)' }}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              <div>
                <input
                  type="text"
                  value={outlineTopic}
                  onChange={(e) => setOutlineTopic(e.target.value)}
                  placeholder="Document topic..."
                  className="w-full px-3 py-2 bg-transparent border rounded-sm focus:outline-none focus:ring-1"
                  style={{
                    color: 'var(--notion-text)',
                    borderColor: 'var(--notion-border)',
                    caretColor: 'var(--notion-blue)'
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleGenerateOutline();
                  }}
                />
              </div>

              <div>
                <select
                  value={outlineStyle}
                  onChange={(e) => setOutlineStyle(e.target.value)}
                  className="w-full px-3 py-2 bg-transparent border rounded-sm focus:outline-none focus:ring-1"
                  style={{
                    color: 'var(--notion-text)',
                    borderColor: 'var(--notion-border)'
                  }}
                >
                  <option value="专业严肃">Professional & Serious</option>
                  <option value="通俗易懂">Easy to Understand</option>
                  <option value="学术研究">Academic Research</option>
                  <option value="简洁明了">Concise & Clear</option>
                </select>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <button
                  onClick={handleGenerateOutline}
                  disabled={!outlineTopic.trim() || isGeneratingOutline}
                  className="flex-1 px-4 py-2.5 rounded-lg font-medium transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{ backgroundColor: 'var(--notion-text)', color: 'white' }}
                >
                  {isGeneratingOutline ? 'Generating...' : 'Generate'}
                </button>
                <button
                  onClick={() => setShowOutlineGenerator(false)}
                  className="px-4 py-2.5 rounded-lg font-medium hover:bg-[var(--notion-gray-hover)] transition-colors"
                  style={{ color: 'var(--notion-text-secondary)' }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-[800px] mx-auto py-16 px-8">
          {/* Document Title */}
          <h1 className="text-4xl font-bold mb-8 cursor-text" style={{ color: 'var(--notion-text)' }}>
            {documentTitle}
          </h1>

          {/* Draggable Outline Blocks */}
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext items={blocks.map(b => b.id)} strategy={verticalListSortingStrategy}>
              <div>
                {blocks.map((block) => (
                  <OutlineBlock
                    key={block.id}
                    block={block}
                    onUpdate={handleUpdateBlock}
                    onDelete={handleDeleteBlock}
                    onAddBelow={handleAddBlock}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>

          {/* Add Block Button - Notion style */}
          <button
            onClick={handleAddBlockAtEnd}
            className="mt-2 px-3 py-1.5 text-sm rounded hover:bg-[var(--notion-gray-hover)] transition-all flex items-center gap-2"
            style={{ color: 'var(--notion-text-secondary)' }}
          >
            <Plus className="w-4 h-4" />
            <span>New block</span>
          </button>
        </div>
      </main>

      {/* Draggable AI Button */}
      <DraggableAIButton onGenerate={handleGenerateContent} isGenerating={isGenerating} />
    </div>
  );
}
