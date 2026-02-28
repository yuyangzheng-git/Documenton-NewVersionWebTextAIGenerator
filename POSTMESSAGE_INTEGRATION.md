# 📡 跨窗口通信实现文档 (PostMessage Integration)

## 概述

本文档说明如何使用 `postMessage` API 在不同端口的应用之间传递数据。

## 架构图

```
┌─────────────────────────────────────────────────────────────────┐
│  父页面 (http://10.23.22.37:3000)                               │
│  ├─ 用户输入主题                                                 │
│  ├─ 调用 Dify API 生成大纲                                      │
│  ├─ 打开新窗口 window.open('http://10.23.22.37:3001/word-editor') │
│  └─ 通过 postMessage 发送数据                                    │
│      ↓                                                           │
│      postMessage({                                               │
│        type: 'INIT_WORD_EDITOR',                                 │
│        payload: { outline, documentTitle }                       │
│      }, 'http://10.23.22.37:3001')                              │
└─────────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────────┐
│  子页面 (http://10.23.22.37:3001/word-editor)                  │
│  ├─ 显示加载界面 (isInitializing = true)                        │
│  ├─ 发送 CHILD_READY 消息给父窗口                               │
│  ├─ 监听 message 事件                                           │
│  ├─ 接收大纲数据并更新 Zustand Store                            │
│  ├─ 生成 NotionBlocks                                           │
│  └─ 渲染编辑器                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 实现步骤

### 1️⃣ 父页面发送数据 (app/page.tsx)

```typescript
const handleGenerate = async () => {
  // ... 生成大纲逻辑 ...

  const storeState = useStore.getState();

  // ✅ 打开子窗口
  const childWindow = window.open('http://10.23.22.37:3001/word-editor', '_blank');

  // ✅ 发送数据到子窗口
  const sendDataToChild = () => {
    if (childWindow && !childWindow.closed) {
      childWindow.postMessage(
        {
          type: 'INIT_WORD_EDITOR',
          payload: {
            outline: storeState.outline,
            documentTitle: storeState.documentTitle,
          },
        },
        'http://10.23.22.37:3001' // ⚠️ 目标源，确保安全
      );
      console.log('[Parent] Data sent to child window');
    }
  };

  // ✅ 延迟发送，确保子窗口已加载
  setTimeout(sendDataToChild, 1000);

  // ✅ 监听子窗口的 ready 消息（更可靠）
  const handleChildReady = (event: MessageEvent) => {
    if (event.origin !== 'http://10.23.22.37:3001') return;
    if (event.data.type === 'CHILD_READY') {
      console.log('[Parent] Child window ready, sending data...');
      sendDataToChild();
      window.removeEventListener('message', handleChildReady);
    }
  };
  window.addEventListener('message', handleChildReady);
};
```

---

### 2️⃣ 子页面接收数据 (app/word-editor/page.tsx)

```typescript
export default function WordEditorPage() {
  const { outline, setOutline, documentTitle, setDocumentTitle } = useStore();
  const [blocks, setBlocks] = useState<NotionBlock[]>([]);
  const [isInitializing, setIsInitializing] = useState(true); // 🔥 初始化状态

  // ✅ 监听来自父页面的 postMessage
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // ⚠️ 安全校验：只接受来自父页面的消息
      if (event.origin !== 'http://10.23.22.37:3000') {
        console.warn('[Child] Received message from unknown origin:', event.origin);
        return;
      }

      console.log('[Child] Received message:', event.data);

      if (event.data.type === 'INIT_WORD_EDITOR') {
        const { outline: newOutline, documentTitle: newTitle } = event.data.payload;

        // ✅ 更新子应用的 Store
        if (newOutline && newOutline.length > 0) {
          setOutline(newOutline);
        }

        if (newTitle) {
          setDocumentTitle(newTitle);
        }

        // ✅ 数据到齐，关闭加载态
        setIsInitializing(false);
      }
    };

    window.addEventListener('message', handleMessage);

    // ✅ 通知父窗口：子窗口已准备好接收数据
    if (window.opener) {
      window.opener.postMessage({ type: 'CHILD_READY' }, 'http://10.23.22.37:3000');
      console.log('[Child] Sent CHILD_READY message to parent');
    }

    // ✅ 超时处理：3秒内没收到数据，尝试使用本地 outline
    const timeout = setTimeout(() => {
      if (outline.length > 0) {
        console.log('[Child] Using existing outline from store');
        setIsInitializing(false);
      } else {
        console.warn('[Child] No data received after 3 seconds');
        setIsInitializing(false);
      }
    }, 3000);

    return () => {
      window.removeEventListener('message', handleMessage);
      clearTimeout(timeout);
    };
  }, [setOutline, setDocumentTitle, outline.length]);

  // ✅ 重定向逻辑：初始化完成后，如果没数据则关闭窗口
  useEffect(() => {
    if (!isInitializing && outline.length === 0) {
      console.warn('[Child] No outline found after initialization');
      alert('未找到文档数据，请从主页生成大纲');
      if (window.opener) {
        window.close();
      } else {
        router.push('/');
      }
    }
  }, [outline, isInitializing, router]);

  // ✅ 生成 Blocks：依赖 outline 变化
  useEffect(() => {
    if (blocks.length > 0) return;
    if (outline.length === 0) return;

    console.log('[Child] Generating blocks from outline');
    const notionBlocks: NotionBlock[] = [];

    outline.forEach((item) => {
      // 生成标题块
      const titleWithNumber = item.number ? `${item.number} ${item.title}` : item.title;
      const headingType = item.level === 1 ? 'h1' : item.level === 2 ? 'h2' : 'h3';

      notionBlocks.push({
        id: generateBlockId(headingType),
        type: headingType,
        content: titleWithNumber,
        properties: {},
        children: [],
      });

      // 添加写作指导块
      if (item.requirements) {
        notionBlocks.push({
          id: generateBlockId('guide'),
          type: 'guide',
          content: item.requirements,
          properties: {},
          children: [],
        });
      }
    });

    setBlocks(notionBlocks);
    console.log('[Child] Blocks generated:', notionBlocks.length);
  }, [outline]); // 🔥 依赖 outline

  // ✅ 加载状态 UI
  if (isInitializing && outline.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-zinc-600 text-base font-medium">正在同步文档数据...</p>
          <p className="text-zinc-400 text-sm mt-2">请稍候，正在接收来自父页面的大纲数据</p>
        </div>
      </div>
    );
  }

  return (
    // ... 编辑器 JSX ...
  );
}
```

---

## 关键技术点

### 1. 安全性 (Origin 校验)

```typescript
// ⚠️ 始终校验消息来源
if (event.origin !== 'http://10.23.22.37:3000') {
  console.warn('Received message from unknown origin:', event.origin);
  return; // 拒绝未授权的消息
}
```

### 2. 消息类型约定

```typescript
// 消息格式
interface MessageData {
  type: 'INIT_WORD_EDITOR' | 'CHILD_READY';
  payload?: {
    outline: OutlineItem[];
    documentTitle: string;
  };
}
```

### 3. 握手机制 (Child Ready)

```typescript
// 子窗口通知父窗口已准备好
if (window.opener) {
  window.opener.postMessage({ type: 'CHILD_READY' }, targetOrigin);
}

// 父窗口收到 ready 后再发送数据
window.addEventListener('message', (event) => {
  if (event.data.type === 'CHILD_READY') {
    sendDataToChild(); // 此时发送更可靠
  }
});
```

### 4. 超时处理

```typescript
// 3秒内没收到数据，使用本地 store 或提示错误
const timeout = setTimeout(() => {
  if (outline.length > 0) {
    setIsInitializing(false); // 使用本地数据
  } else {
    alert('未收到数据');
  }
}, 3000);
```

---

## 调试技巧

### 1. Chrome DevTools 控制台

```javascript
// 父窗口
console.log('[Parent] Sending data to child:', data);

// 子窗口
console.log('[Child] Received data:', event.data);
console.log('[Child] Origin:', event.origin);
```

### 2. 检查 window.opener

```javascript
// 子窗口
if (window.opener) {
  console.log('Parent window exists');
} else {
  console.log('No parent window (直接打开)');
}
```

### 3. 监听所有消息

```javascript
window.addEventListener('message', (event) => {
  console.log('Message received:', {
    origin: event.origin,
    data: event.data,
    source: event.source === window.opener ? 'parent' : 'unknown'
  });
});
```

---

## 常见问题

### Q1: 子窗口没收到消息？

**可能原因**：
1. 子窗口还未加载完成
2. Origin 校验失败
3. postMessage 的目标源写错

**解决方案**：
- 使用 `CHILD_READY` 握手机制
- 检查控制台的 origin 警告
- 确保 `targetOrigin` 参数正确

### Q2: 消息发送时机不对？

**解决方案**：
```typescript
// ❌ 不要立即发送
childWindow.postMessage(data, targetOrigin); // 可能太快

// ✅ 延迟发送或等待 ready
setTimeout(() => childWindow.postMessage(data, targetOrigin), 1000);

// ✅ 更好的方式：等待子窗口 ready
window.addEventListener('message', (e) => {
  if (e.data.type === 'CHILD_READY') {
    childWindow.postMessage(data, targetOrigin);
  }
});
```

### Q3: 如何支持 iframe？

```typescript
// 父页面
const iframe = document.getElementById('myIframe') as HTMLIFrameElement;
iframe.contentWindow?.postMessage(data, targetOrigin);

// iframe 内
window.parent.postMessage({ type: 'CHILD_READY' }, parentOrigin);
```

---

## 安全最佳实践

1. **始终指定 targetOrigin**
   ```typescript
   // ❌ 不要用通配符
   window.postMessage(data, '*');

   // ✅ 指定明确的域名
   window.postMessage(data, 'http://10.23.22.37:3001');
   ```

2. **验证消息来源**
   ```typescript
   if (event.origin !== 'http://10.23.22.37:3000') {
     return; // 拒绝
   }
   ```

3. **验证消息结构**
   ```typescript
   if (!event.data || typeof event.data.type !== 'string') {
     return; // 非法消息
   }
   ```

4. **不要发送敏感信息**
   - 不要通过 postMessage 传递密码、Token
   - 只传递必要的业务数据

---

## 测试清单

- [ ] 父窗口能成功打开子窗口
- [ ] 子窗口发送 CHILD_READY 消息
- [ ] 父窗口收到 ready 后发送数据
- [ ] 子窗口接收到正确的 outline 和 title
- [ ] Origin 校验生效（拒绝非法来源）
- [ ] 超时机制生效（3秒后使用本地数据）
- [ ] 加载界面正常显示
- [ ] blocks 正确生成
- [ ] 控制台无错误日志

---

## 参考资料

- [MDN: Window.postMessage()](https://developer.mozilla.org/zh-CN/docs/Web/API/Window/postMessage)
- [MDN: message event](https://developer.mozilla.org/zh-CN/docs/Web/API/Window/message_event)
- [Web Security: Cross-Origin Communication](https://developer.mozilla.org/zh-CN/docs/Web/Security/Same-origin_policy)

---

**完成时间**: 2026-02-28
**版本**: 1.0.0
**维护者**: Documenton Team
