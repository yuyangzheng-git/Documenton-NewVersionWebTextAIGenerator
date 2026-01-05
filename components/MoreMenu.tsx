'use client';

import { useEffect, useRef, useState } from 'react';
import {
  Copy,
  Link as LinkIcon,
  FileCog,
  Folder,
  Trash2,
  Type,
  Maximize,
  Settings,
  Lock,
  Lightbulb,
  Languages,
  Undo,
  FileUp,
  Search,
} from 'lucide-react';

interface MoreMenuProps {
  onClose: () => void;
  onExport?: () => void;
  documentTitle?: string;
}

export function MoreMenu({ onClose }: MoreMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const menuItems = [
    { icon: Copy, label: '创建副本', shortcut: 'Ctrl+D' },
    { icon: LinkIcon, label: '拷贝链接', shortcut: 'Ctrl+C' },
    { icon: FileCog, label: '复制到剪贴板' },
    { icon: Folder, label: '移动到...' },
    { icon: Trash2, label: '移至垃圾箱', shortcut: 'Ctrl+Del', danger: true },
    { icon: Type, label: '小字号' },
    { icon: Maximize, label: '全宽' },
    { icon: Settings, label: '自定义页面' },
    { icon: Lock, label: '锁定页面' },
    { icon: Lightbulb, label: '编辑建议' },
    { icon: Languages, label: '翻译' },
    { icon: Undo, label: '撤销', shortcut: 'Ctrl+Z' },
    { icon: FileUp, label: '导入模板' },
  ];

  const filteredItems = menuItems.filter((item) =>
    item.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleItemClick = (item: { label: string }) => {
    if (item.label === '导入模板') {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.docx,.doc';
      input.onchange = (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (file) {
          console.log('导入模板:', file.name);
        }
      };
      input.click();
    }
    console.log('点击菜单项:', item.label);
    onClose();
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 50,
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'flex-end',
        paddingTop: '80px',
        paddingRight: '32px'
      }}
    >
      <div
        ref={menuRef}
        style={{
          width: '320px',
          backgroundColor: 'white',
          borderRadius: '16px',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
          border: '1px solid rgba(55, 53, 47, 0.09)',
          overflow: 'hidden',
          animation: 'fadeIn 200ms ease-in-out'
        }}
      >
        {/* 搜索栏 */}
        <div style={{ padding: '12px', borderBottom: '1px solid rgba(55, 53, 47, 0.09)' }}>
          <div style={{ position: 'relative' }}>
            <Search
              style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                width: '16px',
                height: '16px',
                color: 'rgba(55, 53, 47, 0.4)'
              }}
            />
            <input
              type="text"
              placeholder="搜索操作..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                paddingLeft: '40px',
                paddingRight: '16px',
                padding: '10px 12px',
                backgroundColor: '#F7F6F3',
                borderRadius: '8px',
                fontSize: '14px',
                border: '1px solid transparent',
                color: 'rgba(55, 53, 47, 1)',
                outline: 'none'
              }}
              onFocus={(e) => e.currentTarget.style.borderColor = 'rgba(35, 131, 226, 0.3)'}
              onBlur={(e) => e.currentTarget.style.borderColor = 'transparent'}
            />
          </div>
        </div>

        {/* 菜单项 */}
        <div style={{ maxHeight: '384px', overflowY: 'auto' }}>
          {filteredItems.map((item, index) => {
            const Icon = item.icon;
            return Icon ? (
              <button
                key={index}
                onClick={() => handleItemClick(item)}
                style={{
                  userSelect: 'none',
                  transition: 'background 20ms ease-in',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '10px 16px',
                  whiteSpace: 'nowrap',
                  fontSize: '14px',
                  fontWeight: 400,
                  lineHeight: 1.2,
                  color: item.danger ? '#e74c3c' : 'rgba(55, 53, 47, 1)',
                  backgroundColor: 'transparent',
                  border: 'none',
                  width: '100%',
                  textAlign: 'left'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = item.danger ? 'rgba(231, 76, 60, 0.04)' : 'rgba(0, 0, 0, 0.02)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <Icon style={{ width: '16px', height: '16px', flexShrink: 0 }} />
                <span style={{ flex: 1, textAlign: 'left' }}>{item.label}</span>
                {item.shortcut && (
                  <span style={{ fontSize: '11px', color: 'rgba(55, 53, 47, 0.4)', padding: '2px 8px', backgroundColor: '#F7F6F3', borderRadius: '4px' }}>
                    {item.shortcut}
                  </span>
                )}
              </button>
            ) : null;
          })}
        </div>

        {/* 底部提示 */}
        <div
          style={{
            padding: '12px',
            borderTop: '1px solid rgba(55, 53, 47, 0.09)',
            backgroundColor: '#F7F6F3',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px'
          }}
        >
          <span style={{ fontSize: '12px', color: 'rgba(55, 53, 47, 0.4)' }}>按</span>
          <kbd style={{ padding: '2px 6px', backgroundColor: 'white', borderRadius: '4px', fontSize: '11px', color: 'rgba(55, 53, 47, 0.6)', border: '1px solid rgba(55, 53, 47, 0.09)' }}>
            Esc
          </kbd>
          <span style={{ fontSize: '12px', color: 'rgba(55, 53, 47, 0.4)' }}>关闭</span>
        </div>

        <style>{`
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(-8px); }
            to { opacity: 1; transform: translateY(0); }
          }
        `}</style>
      </div>
    </div>
  );
}
