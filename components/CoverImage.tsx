'use client';

import { useState } from 'react';
import { X, Upload } from 'lucide-react';

interface CoverImageProps {
  imageUrl?: string;
  onChange: (url: string | undefined) => void;
  onDrop: (e: React.DragEvent) => void;
}

export function CoverImage({ imageUrl, onChange, onDrop }: CoverImageProps) {
  const [isHovered, setIsHovered] = useState(false);

  const handleRemove = () => {
    onChange(undefined);
  };

  const handleAddImage = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          onChange(event.target?.result as string);
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  };

  return (
    <div
      style={{ position: 'relative' }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onDragOver={(e) => e.preventDefault()}
      onDrop={onDrop}
    >
      {imageUrl ? (
        <div style={{ position: 'relative', height: '256px', width: '100%', overflow: 'hidden' }}>
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(to bottom, transparent, rgba(0, 0, 0, 0.2))'
            }}
          />
          <img
            src={imageUrl}
            alt="Cover"
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
          {isHovered && (
            <div
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                display: 'flex',
                gap: '8px'
              }}
            >
              <button
                onClick={handleRemove}
                style={{
                  userSelect: 'none',
                  transition: 'background 20ms ease-in',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 0,
                  height: '28px',
                  paddingInline: 0,
                  borderRadius: '50%',
                  whiteSpace: 'nowrap',
                  fontSize: '14px',
                  fontWeight: 500,
                  lineHeight: 1.2,
                  width: '28px',
                  color: 'white',
                  flexShrink: 0,
                  background: 'rgba(0, 0, 0, 0.6)',
                  border: 'none'
                }}
                title="移除封面"
              >
                <X style={{ width: '20px', height: '20px', display: 'block', flexShrink: 0 }} />
              </button>
            </div>
          )}
        </div>
      ) : (
        <div
          onClick={handleAddImage}
          style={{
            height: '192px',
            width: '100%',
            border: '1px dashed rgba(55, 53, 47, 0.2)',
            borderRadius: '16px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'background 20ms ease-in',
            backgroundColor: 'transparent'
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(35, 131, 226, 0.04)'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
        >
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', color: 'rgba(55, 53, 47, 0.4)' }}>
            <div style={{ padding: '12px', backgroundColor: '#F7F6F3', borderRadius: '12px' }}>
              <Upload style={{ width: '32px', height: '32px', display: 'block' }} />
            </div>
            <span style={{ fontSize: '12px', fontWeight: 500 }}>添加封面图片</span>
            <span style={{ fontSize: '11px', color: 'rgba(55, 53, 47, 0.3)' }}>或拖拽图片到此处</span>
          </div>
        </div>
      )}
    </div>
  );
}
