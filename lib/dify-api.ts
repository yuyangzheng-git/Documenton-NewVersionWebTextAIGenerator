// Dify Workflow API integration
const DIFY_API_BASE_URL = 'https://api.dify.ai/v1';

export interface DifyOutlineItem {
  id: string;
  title: string;
  level: number;
  children?: DifyOutlineItem[];
}

interface DifyStreamEvent {
  event: string;
  message_id?: string;
  conversation_id?: string;
  answer?: string;
  data?: {
    text?: string;
  };
}

/**
 * Call Planner API - Generate document outline (blocking mode)
 */
export async function generateOutlineWithPlanner(
  apiKey: string,
  topic: string,
  style: string = '专业严肃'
): Promise<DifyOutlineItem[]> {
  try {
    const response = await fetch(`${DIFY_API_BASE_URL}/workflows/run`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: {
          topic,
          style,
        },
        response_mode: 'blocking',
        user: 'user-' + Date.now(),
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Planner API error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();

    // Parse the LLM output text as JSON
    const outputText = result.data?.outputs?.text || result.data?.outputs?.output || '';

    // Clean up the text - remove markdown code blocks if present
    const cleanedText = outputText
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();

    // Parse JSON
    const outline = JSON.parse(cleanedText);

    return outline;
  } catch (error) {
    console.error('Planner API error:', error);
    throw error;
  }
}

/**
 * Call Worker API - Generate section content (streaming mode)
 */
export async function generateSectionWithWorker(
  apiKey: string,
  sectionTitle: string,
  documentTopic: string,
  fullOutline: string,
  onChunk: (text: string) => void,
  onComplete: () => void,
  onError?: (error: Error) => void
) {
  try {
    const response = await fetch(`${DIFY_API_BASE_URL}/workflows/run`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: {
          section_title: sectionTitle,
          document_topic: documentTopic,
          full_outline: fullOutline,
        },
        response_mode: 'streaming',
        user: 'user-' + Date.now(),
      }),
    });

    if (!response.ok) {
      throw new Error(`Worker API error: ${response.status} ${response.statusText}`);
    }

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();

    if (!reader) {
      throw new Error('No response body');
    }

    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();

      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6).trim();

          if (data === '[DONE]') {
            onComplete();
            return;
          }

          try {
            const parsed: DifyStreamEvent = JSON.parse(data);

            // Handle different event types from Dify Workflow
            if (parsed.event === 'text_chunk' || parsed.event === 'agent_message' || parsed.event === 'message') {
              const text = parsed.data?.text || parsed.answer || '';
              if (text) {
                onChunk(text);
              }
            } else if (parsed.event === 'workflow_finished') {
              onComplete();
              return;
            }
          } catch (e) {
            console.error('Failed to parse SSE data:', e, 'Line:', data);
          }
        }
      }
    }

    onComplete();
  } catch (error) {
    console.error('Worker API error:', error);
    if (onError) {
      onError(error instanceof Error ? error : new Error('Unknown error'));
    }
  }
}

/**
 * Validate Dify Workflow API key
 */
export async function validateDifyWorkflowKey(apiKey: string): Promise<boolean> {
  try {
    const response = await fetch(`${DIFY_API_BASE_URL}/workflows/run`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: { topic: 'test' },
        response_mode: 'blocking',
        user: 'validation-user',
      }),
    });

    return response.ok || response.status === 400; // 400 might mean missing required inputs, but auth is OK
  } catch {
    return false;
  }
}

// Legacy functions for backward compatibility
export async function generateContentWithDify(
  apiKey: string,
  prompt: string,
  onChunk: (text: string) => void,
  onComplete: () => void,
  onError?: (error: Error) => void
) {
  try {
    const response = await fetch(`${DIFY_API_BASE_URL}/chat-messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: {},
        query: prompt,
        response_mode: 'streaming',
        conversation_id: '',
        user: 'user-' + Date.now(),
      }),
    });

    if (!response.ok) {
      throw new Error(`Dify API error: ${response.status} ${response.statusText}`);
    }

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();

    if (!reader) {
      throw new Error('No response body');
    }

    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();

      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);

          if (data === '[DONE]') {
            onComplete();
            return;
          }

          try {
            const parsed = JSON.parse(data);

            if (parsed.event === 'agent_message' || parsed.event === 'message') {
              if (parsed.answer) {
                onChunk(parsed.answer);
              }
            }
          } catch (e) {
            console.error('Failed to parse SSE data:', e);
          }
        }
      }
    }

    onComplete();
  } catch (error) {
    console.error('Dify API error:', error);
    if (onError) {
      onError(error instanceof Error ? error : new Error('Unknown error'));
    }
  }
}
