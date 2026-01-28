'use client';

import { useState, useRef, useEffect } from 'react';
import { Image as ImageIcon, Upload, Trash2, AlignLeft, AlignCenter, AlignRight, Maximize2 } from 'lucide-react';

/**
 * 图片块组件
 * 参考 AppFlowy 的 custom_image_block_component 实现
 *
 * 功能：
 * - 图片上传（本地文件、URL）
 * - 拖拽调整大小
 * - 三向对齐（左、中、右）
 * - 双击全屏查看
 * - 支持标题/描述
 */

export enum ImageType {
  Local = 'local',      // 本地文件
  Internal = 'internal', // 自托管（未实现）
  External = 'external'  // 外部URL
}

export interface ImageBlockData {
  id: string;
  type: 'image';
  url: string;
  imageType: ImageType;
  align: 'left' | 'center' | 'right';
  width?: number;
  height?: number;
  caption?: string;
}

interface ImageBlockProps {
  block: ImageBlockData;
  editable?: boolean;
  onUpdate?: (id: string, updates: Partial<ImageBlockData>) => void;
  onDelete?: (id: string) => void;
}

export function ImageBlock({
  block,
  editable = true,
  onUpdate,
  onDelete
}: ImageBlockProps) {
  const [imageUrl, setImageUrl] = useState(block.url);
  const [imageWidth, setImageWidth] = useState(block.width);
  const [align, setAlign] = useState<'left' | 'center' | 'right'>(block.align || 'center');
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartX, setDragStartX] = useState(0);
  const [dragStartWidth, setDragStartWidth] = useState(0);
  const [isHovering, setIsHovering] = useState(false);
  const [showFullscreen, setShowFullscreen] = useState(false);
  const [caption, setCaption] = useState(block.caption || '');
  const [isEditingCaption, setIsEditingCaption] = useState(false);

  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // 加载图片自然尺寸
  useEffect(() => {
    if (imageUrl && !imageWidth) {
      const img = new Image();
      img.src = imageUrl;
      img.onload = () => {
        const maxWidth = 800; // 最大宽度
        const naturalWidth = img.naturalWidth;
        const initialWidth = Math.min(naturalWidth, maxWidth);
        setImageWidth(initialWidth);
        onUpdate?.(block.id, { width: initialWidth, height: img.naturalHeight });
      };
    }
  }, [imageUrl]);

  // 处理文件上传
  const handleFileUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const url = e.target?.result as string;
      setImageUrl(url);
      onUpdate?.(block.id, {
        url,
        imageType: ImageType.Local
      });
    };
    reader.readAsDataURL(file);
  };

  // 处理URL输入
  const handleUrlInput = (url: string) => {
    setImageUrl(url);
    onUpdate?.(block.id, {
      url,
      imageType: ImageType.External
    });
  };

  // 开始拖拽调整大小
  const handleDragStart = (e: React.MouseEvent, side: 'left' | 'right') => {
    e.preventDefault();
    setIsDragging(true);
    setDragStartX(e.clientX);
    setDragStartWidth(imageWidth || 0);
  };

  // 拖拽中
  useEffect(() => {
    if (!isDragging) return;

    const handleDragMove = (e: MouseEvent) => {
      const deltaX = e.clientX - dragStartX;
      // 中心对齐时，增量翻倍（因为两边都在变化）
      const multiplier = align === 'center' ? 2 : 1;
      const newWidth = Math.max(30, dragStartWidth + deltaX * multiplier);
      setImageWidth(newWidth);
    };

    const handleDragEnd = () => {
      setIsDragging(false);
      if (imageWidth) {
        onUpdate?.(block.id, { width: imageWidth });
      }
    };

    document.addEventListener('mousemove', handleDragMove);
    document.addEventListener('mouseup', handleDragEnd);

    return () => {
      document.removeEventListener('mousemove', handleDragMove);
      document.removeEventListener('mouseup', handleDragEnd);
    };
  }, [isDragging, dragStartX, dragStartWidth, align]);

  // 改变对齐方式
  const handleAlignChange = (newAlign: 'left' | 'center' | 'right') => {
    setAlign(newAlign);
    onUpdate?.(block.id, { align: newAlign });
  };

  // 保存标题
  const handleCaptionSave = () => {
    setIsEditingCaption(false);
    onUpdate?.(block.id, { caption });
  };

  // 如果没有图片，显示上传占位符
  if (!imageUrl) {
    return (
      <div
        style={{
          width: '100%',
          padding: '48px 24px',
          border: '2px dashed #e0e0e0',
          borderRadius: '8px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '16px',
          backgroundColor: '#fafafa',
          cursor: 'pointer'
        }}
        onClick={() => {
          const input = document.createElement('input');
          input.type = 'file';
          input.accept = 'image/*';
          input.onchange = (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (file) handleFileUpload(file);
          };
          input.click();
        }}
      >
        <Upload size={48} color="#999" />
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>
            点击上传图片
          </div>
          <div style={{ fontSize: '12px', color: '#999' }}>
            或粘贴图片URL
          </div>
        </div>

        <input
          type="text"
          placeholder="粘贴图片URL..."
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              const url = (e.target as HTMLInputElement).value;
              if (url) handleUrlInput(url);
            }
          }}
          style={{
            width: '300px',
            padding: '8px 12px',
            border: '1px solid #e0e0e0',
            borderRadius: '4px',
            fontSize: '14px'
          }}
        />
      </div>
    );
  }

  return (
    <>
      <div
        ref={containerRef}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
        style={{
          width: '100%',
          display: 'flex',
          justifyContent: align === 'left' ? 'flex-start' : align === 'right' ? 'flex-end' : 'center',
          position: 'relative',
          marginTop: '8px',
          marginBottom: '8px'
        }}
      >
        <div
          style={{
            position: 'relative',
            display: 'inline-block',
            width: imageWidth ? `${imageWidth}px` : 'auto'
          }}
        >
          {/* 图片 */}
          <img
            ref={imageRef}
            src={imageUrl}
            alt={caption || 'Image'}
            onDoubleClick={() => setShowFullscreen(true)}
            style={{
              width: '100%',
              height: 'auto',
              display: 'block',
              borderRadius: '4px',
              cursor: 'pointer',
              border: isHovering ? '2px solid #3b82f6' : '2px solid transparent',
              transition: 'border 0.2s'
            }}
          />

          {/* 左侧调整句柄 */}
          {editable && isHovering && (align === 'left' || align === 'center') && (
            <div
              onMouseDown={(e) => handleDragStart(e, 'left')}
              style={{
                position: 'absolute',
                left: -2,
                top: 0,
                bottom: 0,
                width: '5px',
                cursor: 'ew-resize',
                backgroundColor: isDragging ? '#3b82f6' : 'rgba(0,0,0,0.5)',
                border: '1px solid #fff',
                zIndex: 10
              }}
            />
          )}

          {/* 右侧调整句柄 */}
          {editable && isHovering && (align === 'right' || align === 'center') && (
            <div
              onMouseDown={(e) => handleDragStart(e, 'right')}
              style={{
                position: 'absolute',
                right: -2,
                top: 0,
                bottom: 0,
                width: '5px',
                cursor: 'ew-resize',
                backgroundColor: isDragging ? '#3b82f6' : 'rgba(0,0,0,0.5)',
                border: '1px solid #fff',
                zIndex: 10
              }}
            />
          )}

          {/* 工具栏 */}
          {editable && isHovering && (
            <div
              style={{
                position: 'absolute',
                top: '8px',
                right: '8px',
                display: 'flex',
                gap: '4px',
                backgroundColor: 'rgba(0, 0, 0, 0.7)',
                borderRadius: '4px',
                padding: '4px'
              }}
            >
              {/* 对齐按钮 */}
              <button
                onClick={() => handleAlignChange('left')}
                style={{
                  padding: '4px',
                  backgroundColor: align === 'left' ? '#3b82f6' : 'transparent',
                  border: 'none',
                  borderRadius: '2px',
                  cursor: 'pointer',
                  color: '#fff'
                }}
                title="左对齐"
              >
                <AlignLeft size={16} />
              </button>
              <button
                onClick={() => handleAlignChange('center')}
                style={{
                  padding: '4px',
                  backgroundColor: align === 'center' ? '#3b82f6' : 'transparent',
                  border: 'none',
                  borderRadius: '2px',
                  cursor: 'pointer',
                  color: '#fff'
                }}
                title="居中"
              >
                <AlignCenter size={16} />
              </button>
              <button
                onClick={() => handleAlignChange('right')}
                style={{
                  padding: '4px',
                  backgroundColor: align === 'right' ? '#3b82f6' : 'transparent',
                  border: 'none',
                  borderRadius: '2px',
                  cursor: 'pointer',
                  color: '#fff'
                }}
                title="右对齐"
              >
                <AlignRight size={16} />
              </button>

              {/* 全屏按钮 */}
              <button
                onClick={() => setShowFullscreen(true)}
                style={{
                  padding: '4px',
                  backgroundColor: 'transparent',
                  border: 'none',
                  borderRadius: '2px',
                  cursor: 'pointer',
                  color: '#fff'
                }}
                title="全屏查看"
              >
                <Maximize2 size={16} />
              </button>

              {/* 删除按钮 */}
              <button
                onClick={() => onDelete?.(block.id)}
                style={{
                  padding: '4px',
                  backgroundColor: 'transparent',
                  border: 'none',
                  borderRadius: '2px',
                  cursor: 'pointer',
                  color: '#ef4444'
                }}
                title="删除"
              >
                <Trash2 size={16} />
              </button>
            </div>
          )}

          {/* 标题 */}
          {(caption || isEditingCaption) && (
            <div style={{ marginTop: '8px', textAlign: 'center' }}>
              {isEditingCaption ? (
                <input
                  autoFocus
                  type="text"
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  onBlur={handleCaptionSave}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleCaptionSave();
                    if (e.key === 'Escape') {
                      setCaption(block.caption || '');
                      setIsEditingCaption(false);
                    }
                  }}
                  style={{
                    width: '100%',
                    padding: '4px 8px',
                    fontSize: '13px',
                    color: '#666',
                    border: '1px solid #e0e0e0',
                    borderRadius: '4px',
                    textAlign: 'center'
                  }}
                />
              ) : (
                <div
                  onClick={() => editable && setIsEditingCaption(true)}
                  style={{
                    fontSize: '13px',
                    color: '#666',
                    cursor: editable ? 'text' : 'default',
                    fontStyle: 'italic'
                  }}
                >
                  {caption}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 全屏查看器 */}
      {showFullscreen && (
        <div
          onClick={() => setShowFullscreen(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.9)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            cursor: 'zoom-out'
          }}
        >
          <img
            src={imageUrl}
            alt={caption || 'Image'}
            style={{
              maxWidth: '90%',
              maxHeight: '90%',
              objectFit: 'contain'
            }}
          />
        </div>
      )}
    </>
  );
}
