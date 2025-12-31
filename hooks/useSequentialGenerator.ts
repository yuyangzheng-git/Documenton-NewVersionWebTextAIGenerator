import { useEffect, useRef } from 'react';
import { useStore } from '@/store/useStore';
import { generateContent } from '@/store/useDocumentActions';
import { Editor } from '@tiptap/react';

export function useSequentialGenerator(editor: Editor | null) {
  const { outline, isGenerating, setIsGenerating, updateItemStatus } = useStore();
  const processingRef = useRef(false);

  useEffect(() => {
    if (!isGenerating || processingRef.current) return;

    const findPendingItem = (items: any[]): any => {
      for (const item of items) {
        if (item.status === 'pending') return item;
        if (item.children) {
          const found = findPendingItem(item.children);
          if (found) return found;
        }
      }
      return null;
    };

    const pendingItem = findPendingItem(outline);

    if (pendingItem && editor) {
      processingRef.current = true;
      processItem(pendingItem);
    }
  }, [outline, isGenerating, editor]);

  const processItem = async (item: any) => {
    updateItemStatus(item.id, 'generating');

    // Insert heading
    const headingTag = `h${item.level}`;
    editor?.chain().focus().insertContent(`<${headingTag}>${item.title}</${headingTag}>`).run();

    // Stream content
    await generateContent(
      item,
      (text) => {
        editor?.chain().focus().insertContent(text).run();
      },
      () => {
        updateItemStatus(item.id, 'completed');
        processingRef.current = false;
      }
    );
  };
}
