
// Dify Workflow API integration
// Default URL, can be overridden via getDifyApiBaseUrl()
const DEFAULT_DIFY_API_BASE_URL = 'http://your-dify-instance/v1';

/**
 * Get Dify API base URL from store or use default
 */
export function getDifyApiBaseUrl(): string {
  if (typeof window !== 'undefined') {
    // Try to get from store
    const { useStore } = require('@/store/useStore');
    const apiUrl = useStore.getState().apiUrl;
    if (apiUrl) {
      return apiUrl;
    }
  }
  // Fallback to env var or default
  return process.env.NEXT_PUBLIC_DIFY_API_URL || DEFAULT_DIFY_API_BASE_URL;
}

export interface DifyOutlineItem {
  id: string;
  title: string;
  level: number;
  children?: DifyOutlineItem[];
}

// Dify Workflow API Event Types
interface DifyWorkflowStartedEvent {
  event: 'workflow_started';
  task_id: string;
  workflow_run_id: string;
  data: {
    id: string;
    workflow_id: string;
    created_at: number;
  };
}

interface DifyNodeStartedEvent {
  event: 'node_started';
  task_id: string;
  workflow_run_id: string;
  data: {
    id: string;
    node_id: string;
    node_type: string;
    title: string;
    index: number;
    predecessor_node_id: string;
    inputs: object;
    created_at: number;
  };
}

interface DifyTextChunkEvent {
  event: 'text_chunk';
  task_id: string;
  workflow_run_id: string;
  data: {
    text: string;
    from_variable_selector: string[];
  };
}

interface DifyNodeFinishedEvent {
  event: 'node_finished';
  task_id: string;
  workflow_run_id: string;
  data: {
    id: string;
    node_id: string;
    index: number;
    predecessor_node_id?: string;
    inputs: object;
    process_data?: object;
    outputs?: object;
    status: 'running' | 'succeeded' | 'failed' | 'stopped';
    error?: string;
    elapsed_time: number;
    execution_metadata?: object;
    total_tokens?: number;
    total_price?: number;
    currency?: string;
    created_at: number;
  };
}

interface DifyWorkflowFinishedEvent {
  event: 'workflow_finished';
  task_id: string;
  workflow_run_id: string;
  data: {
    id: string;
    workflow_id: string;
    status: 'running' | 'succeeded' | 'failed' | 'stopped';
    outputs?: object;
    error?: string;
    elapsed_time: number;
    total_tokens: number;
    total_steps: number;
    created_at: number;
    finished_at: number;
  };
}

interface DifyPingEvent {
  event: 'ping';
}

// Export union type for external use if needed
export type DifyStreamEvent =
  | DifyWorkflowStartedEvent
  | DifyNodeStartedEvent
  | DifyTextChunkEvent
  | DifyNodeFinishedEvent
  | DifyWorkflowFinishedEvent
  | DifyPingEvent;

// File upload types
export interface DifyUploadedFile {
  id: string;
  name: string;
  size: number;
  extension: string;
  mime_type: string;
  created_by: string;
  created_at: number;
}

export interface DifyFileInput {
  type: 'document' | 'image' | 'audio' | 'video' | 'custom';
  transfer_method: 'remote_url' | 'local_file';
  url?: string;
  upload_file_id?: string;
}

/**
 * Upload file to Dify
 */
export async function uploadFileToDify(
  apiKey: string,
  file: File,
  user: string
): Promise<DifyUploadedFile> {
  const baseUrl = getDifyApiBaseUrl();
  const formData = new FormData();
  formData.append('file', file);
  formData.append('user', user);

  const response = await fetch(`${baseUrl}/files/upload`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`File upload error: ${response.status} - ${errorText}`);
  }

  return response.json();
}

/**
 * Call Planner API - Generate document outline (blocking mode)
 */
export async function generateOutlineWithPlanner(
  apiKey: string,
  topic: string,
  style: string = '专业严肃',
  files?: DifyFileInput[]
): Promise<DifyOutlineItem[]> {
  try {
    const baseUrl = getDifyApiBaseUrl();
    const body: any = {
      inputs: {
        topic,
        style,
      },
      response_mode: 'blocking',
      user: 'user-' + Date.now(),
    };

    // Add files if provided
    if (files && files.length > 0) {
      body.inputs.files = files;
    }

    const response = await fetch(`${baseUrl}/workflows/run`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Planner API error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();

    console.log('API Response:', JSON.stringify(result, null, 2));

    // Parse the LLM output text as JSON
    // Support multiple possible output field names
    const outputText = result.data?.outputs?.text ||
                      result.data?.outputs?.output ||
                      result.data?.outputs?.Construction ||
                      result.data?.outputs?.result ||
                      '';

    console.log('Output text:', outputText);

    // Check if outputText is empty
    if (!outputText) {
      console.error('Available output keys:', result.data?.outputs ? Object.keys(result.data.outputs) : 'no outputs object');
      throw new Error('API returned empty output. Please check your Dify workflow configuration.');
    }

    // Clean up the text - the API may return the full prompt + thinking + JSON
    // We need to extract the JSON array from the text
    let jsonStr = outputText;

    // Try to find a well-formed JSON array in the text
    // Use a more sophisticated approach to find complete JSON arrays
    const jsonMatches: string[] = [];
    let depth = 0;
    let startIdx = -1;
    let inString = false;
    let escapeNext = false;

    for (let i = 0; i < outputText.length; i++) {
      const char = outputText[i];

      if (escapeNext) {
        escapeNext = false;
        continue;
      }

      if (char === '\\') {
        escapeNext = true;
        continue;
      }

      if (char === '"') {
        inString = !inString;
        continue;
      }

      if (!inString) {
        if (char === '[') {
          if (depth === 0) {
            startIdx = i;
          }
          depth++;
        } else if (char === ']') {
          depth--;
          if (depth === 0 && startIdx >= 0) {
            const jsonCandidate = outputText.substring(startIdx, i + 1);
            jsonMatches.push(jsonCandidate);
            startIdx = -1;
          }
        }
      }
    }

    if (jsonMatches.length > 0) {
      // Use the last complete JSON array found
      jsonStr = jsonMatches[jsonMatches.length - 1];
      console.log('Found JSON in text:', jsonStr.substring(0, 200) + '...');
    } else {
      // If no JSON array found, try to clean up the text
      jsonStr = outputText
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();
    }

    console.log('Final JSON to parse:', jsonStr.substring(0, 300) + '...');

    // Parse JSON
    let outline;
    try {
      outline = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      console.error('Failed to parse:', jsonStr.substring(0, 500));
      throw new Error(`Failed to parse outline as JSON. Error: ${parseError}`);
    }

    // Validate outline structure
    if (!Array.isArray(outline)) {
      throw new Error('Outline should be an array of items');
    }

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
  onError?: (error: Error) => void,
  files?: DifyFileInput[]
) {
  try {
    const baseUrl = getDifyApiBaseUrl();

    // Build context summary from chapter information
    // Use short document topic as context_summary (max 48 chars)
    const shortContext = documentTopic ? documentTopic.substring(0, 45) : sectionTitle.substring(0, 45);
    const contextSummary = shortContext;

    const body: any = {
      inputs: {
        context_summary: contextSummary,
        document_topic: documentTopic,
        section_title: sectionTitle,
        full_outline: fullOutline,
      },
      response_mode: 'streaming',
      user: 'user-' + Date.now(),
    };

    // Add files if provided
    if (files && files.length > 0) {
      body.inputs.files = files;
    }

    console.log('Generating section with API key:', apiKey);
    console.log('Request body:', JSON.stringify(body, null, 2));

    const response = await fetch(`${baseUrl}/workflows/run`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Worker API error details:', errorText);
      throw new Error(`Worker API error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();

    if (!reader) {
      throw new Error('No response body');
    }

    let buffer = '';
    let taskId: string | undefined;

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
            const parsed = JSON.parse(data);

            // Handle different event types from Dify Workflow API
            if (parsed.event === 'text_chunk') {
              const text = parsed.data?.text || '';
              if (text) {
                onChunk(text);
              }
            } else if (parsed.event === 'workflow_finished') {
              taskId = parsed.task_id;
              onComplete();
              return;
            } else if (parsed.event === 'node_finished') {
              // Node finished - could be used to track progress
              console.log('Node finished:', parsed.data.title);
            } else if (parsed.event === 'workflow_started') {
              taskId = parsed.task_id;
              console.log('Workflow started:', taskId);
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
    const baseUrl = getDifyApiBaseUrl();
    // Use /info endpoint to validate API key
    const response = await fetch(`${baseUrl}/info`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
    });

    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Get application info
 */
export async function getDifyAppInfo(apiKey: string) {
  try {
    const baseUrl = getDifyApiBaseUrl();
    const response = await fetch(`${baseUrl}/info`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Get app info error: ${response.status}`);
    }

    return response.json();
  } catch (error) {
    console.error('Get app info error:', error);
    throw error;
  }
}

/**
 * Stop a running workflow task
 */
export async function stopWorkflowTask(
  apiKey: string,
  taskId: string,
  user: string
): Promise<boolean> {
  try {
    const baseUrl = getDifyApiBaseUrl();
    const response = await fetch(`${baseUrl}/workflows/tasks/${taskId}/stop`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ user }),
    });

    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Get workflow execution status
 */
export async function getWorkflowExecution(
  apiKey: string,
  workflowRunId: string
) {
  try {
    const baseUrl = getDifyApiBaseUrl();
    const response = await fetch(`${baseUrl}/workflows/run/${workflowRunId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Get workflow execution error: ${response.status}`);
    }

    return response.json();
  } catch (error) {
    console.error('Get workflow execution error:', error);
    throw error;
  }
}

/**
 * Legacy functions for backward compatibility
 * Note: Chat API is not available in Workflow mode, this function is for reference only
 */
export async function generateContentWithDify(
  apiKey: string,
  prompt: string,
  onChunk: (text: string) => void,
  onComplete: () => void,
  onError?: (error: Error) => void
) {
  // This function is legacy and should not be used with Workflow apps
  // Use generateSectionWithWorker instead
  console.warn('generateContentWithDify is legacy, use generateSectionWithWorker instead');

  try {
    const baseUrl = getDifyApiBaseUrl();
    const response = await fetch(`${baseUrl}/workflows/run`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: {
          prompt: prompt,
        },
        response_mode: 'streaming',
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
          const data = line.slice(6).trim();

          if (data === '[DONE]') {
            onComplete();
            return;
          }

          try {
            const parsed = JSON.parse(data);

            if (parsed.event === 'text_chunk') {
              const text = parsed.data?.text || '';
              if (text) {
                onChunk(text);
              }
            } else if (parsed.event === 'workflow_finished') {
              onComplete();
              return;
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

/**
 * Get application parameters (for UI configuration)
 */
export async function getDifyAppParameters(apiKey: string) {
  try {
    const baseUrl = getDifyApiBaseUrl();
    const response = await fetch(`${baseUrl}/parameters`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Get parameters error: ${response.status}`);
    }

    return response.json();
  } catch (error) {
    console.error('Get parameters error:', error);
    throw error;
  }
}

/**
 * Get WebApp settings
 */
export async function getDifyWebAppSettings(apiKey: string) {
  try {
    const baseUrl = getDifyApiBaseUrl();
    const response = await fetch(`${baseUrl}/site`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Get WebApp settings error: ${response.status}`);
    }

    return response.json();
  } catch (error) {
    console.error('Get WebApp settings error:', error);
    throw error;
  }
}
