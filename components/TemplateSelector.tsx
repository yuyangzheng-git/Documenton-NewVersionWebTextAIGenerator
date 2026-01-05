'use client';

import { WORD_TEMPLATES, WordTemplate } from '@/lib/word-templates';

interface TemplateSelectorProps {
  selectedTemplate: WordTemplate;
  onSelectTemplate: (template: WordTemplate) => void;
}

export function TemplateSelector({ selectedTemplate, onSelectTemplate }: TemplateSelectorProps) {
  return (
    <div className="flex items-center gap-3 mb-4 px-4 py-3 border-b" style={{ borderColor: 'var(--notion-border)' }}>
      <span className="text-sm font-medium" style={{ color: 'var(--notion-text)' }}>
        选择模板：
      </span>
      <div className="flex gap-2 flex-wrap">
        {WORD_TEMPLATES.map((template) => (
          <button
            key={template.id}
            onClick={() => onSelectTemplate(template)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              selectedTemplate.id === template.id
                ? 'shadow-md scale-105'
                : 'hover:shadow-sm hover:scale-102'
            }`}
            style={{
              backgroundColor: selectedTemplate.id === template.id
                ? template.header.backgroundColor
                : 'var(--notion-bg-secondary)',
              color: selectedTemplate.id === template.id
                ? template.header.textColor
                : 'var(--notion-text)',
              border: `1px solid ${
                selectedTemplate.id === template.id
                  ? template.header.backgroundColor
                  : 'var(--notion-border)'
              }`,
            }}
            title={template.description}
          >
            {template.name}
          </button>
        ))}
      </div>
    </div>
  );
}
