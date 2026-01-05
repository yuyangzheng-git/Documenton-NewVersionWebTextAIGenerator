'use client';

import { NotionEditor } from '@/components/NotionEditor';
import { useState } from 'react';

export default function WordEditorPage() {
  const [title, setTitle] = useState('未命名文档');

  return <NotionEditor documentTitle={title} onTitleChange={setTitle} />;
}
