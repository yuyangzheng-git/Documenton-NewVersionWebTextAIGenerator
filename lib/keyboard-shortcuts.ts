export interface KeyboardShortcut {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  meta?: boolean;
  description: string;
  action: () => void;
}

export const defaultShortcuts: KeyboardShortcut[] = [
  {
    key: 'b',
    meta: true,
    description: 'Bold',
    action: () => document.execCommand('bold'),
  },
  {
    key: 'i',
    meta: true,
    description: 'Italic',
    action: () => document.execCommand('italic'),
  },
  {
    key: 'u',
    meta: true,
    description: 'Underline',
    action: () => document.execCommand('underline'),
  },
  {
    key: 'k',
    meta: true,
    description: 'Link',
    action: () => {
      const url = prompt('Enter URL:');
      if (url) {
        document.execCommand('createLink', false, url);
      }
    },
  },
  {
    key: 'ArrowUp',
    meta: true,
    description: 'Move block up',
    action: () => {
      // This would be handled by drag-and-drop
    },
  },
  {
    key: 'ArrowDown',
    meta: true,
    description: 'Move block down',
    action: () => {
      // This would be handled by drag-and-drop
    },
  },
  {
    key: 'Enter',
    shift: true,
    description: 'Create new block',
    action: () => {
      // This would trigger block creation
    },
  },
  {
    key: 'Backspace',
    meta: true,
    description: 'Delete block',
    action: () => {
      // This would trigger block deletion
    },
  },
];

export function matchesShortcut(event: KeyboardEvent, shortcut: KeyboardShortcut): boolean {
  const metaMatch = shortcut.meta ? (event.metaKey || event.ctrlKey) : !(event.metaKey || event.ctrlKey);
  const shiftMatch = shortcut.shift ? event.shiftKey : !event.shiftKey;
  const altMatch = shortcut.alt ? event.altKey : !event.altKey;
  const keyMatch = event.key.toLowerCase() === shortcut.key.toLowerCase();

  return metaMatch && shiftMatch && altMatch && keyMatch;
}

export function handleKeyboardShortcut(event: KeyboardEvent, shortcuts: KeyboardShortcut[]): boolean {
  for (const shortcut of shortcuts) {
    if (matchesShortcut(event, shortcut)) {
      event.preventDefault();
      shortcut.action();
      return true;
    }
  }
  return false;
}
