export interface WorkflowNodeData {
  id: string;
  type: string;
  label: string;
  question_text: string;
  position_x: number;
  position_y: number;
  options_json: string | null;
  next_nodes_json: string | null;
  order_index: number;
  workflow_id: string;
  created_at: string;
}

export interface SaveWorkflowRequest {
  workflow_id?: string;
  workflow_name?: string;
  nodes: WorkflowNodeData[];
}

export interface SaveWorkflowResponse {
  success: boolean;
  workflow_id?: string;
  message?: string;
  error?: string;
}

export interface WorkflowListItem {
  workflow_id: string;
  workflow_name: string;
  created_at: string;
  updated_at: string;
  node_count: number;
}

export interface WorkflowListResponse {
  success: boolean;
  workflows?: WorkflowListItem[];
  error?: string;
}

export interface WorkflowResponse {
  success: boolean;
  workflow_id?: string;
  workflow_name?: string;
  nodes?: WorkflowNodeData[];
  error?: string;
}

export interface ActiveWorkflowResponse {
  success: boolean;
  workflow_id?: string;
  workflow_name?: string;
  message?: string;
  error?: string;
}

const API_BASE = (window as any).VITE_CHATBOT_API_BASE || 'http://localhost:8000';
const CHATBOT_TOKEN = (window as any).VITE_CHATBOT_TOKEN || 'chatbot-api-token-2024';

export async function saveWorkflow(
  workflowId: string | null,
  workflowName: string,
  nodes: WorkflowNodeData[]
): Promise<SaveWorkflowResponse> {
  const payload: SaveWorkflowRequest = {
    workflow_id: workflowId || undefined,
    workflow_name: workflowName,
    nodes,
  };

  try {
    const res = await fetch(`${API_BASE}/workflow_save`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${CHATBOT_TOKEN}`,
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      let detail = '';
      try {
        const j = await res.json();
        detail = (j as any)?.detail || JSON.stringify(j);
      } catch {
        detail = res.statusText;
      }
      console.error('Workflow API error', res.status, detail);
      return { success: false, error: detail };
    }

    const result = await res.json();
    return result as SaveWorkflowResponse;
  } catch (error) {
    console.error('Error saving workflow:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

export async function getWorkflows(): Promise<WorkflowListResponse> {
  try {
    const res = await fetch(`${API_BASE}/workflow/list`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${CHATBOT_TOKEN}`,
      },
    });

    if (!res.ok) {
      let detail = '';
      try {
        const j = await res.json();
        detail = (j as any)?.detail || JSON.stringify(j);
      } catch {
        detail = res.statusText;
      }
      console.error('Workflow list API error', res.status, detail);
      return { success: false, error: detail };
    }

    const result = await res.json();
    return result as WorkflowListResponse;
  } catch (error) {
    console.error('Error fetching workflows:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

export async function getWorkflow(workflowId: string): Promise<WorkflowResponse> {
  try {
    const res = await fetch(`${API_BASE}/workflow/${workflowId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${CHATBOT_TOKEN}`,
      },
    });

    if (!res.ok) {
      let detail = '';
      try {
        const j = await res.json();
        detail = (j as any)?.detail || JSON.stringify(j);
      } catch {
        detail = res.statusText;
      }
      console.error('Get workflow API error', res.status, detail);
      return { success: false, error: detail };
    }

    const result = await res.json();
    return result as WorkflowResponse;
  } catch (error) {
    console.error('Error fetching workflow:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

export async function deleteWorkflow(workflowId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch(`${API_BASE}/workflow/${workflowId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${CHATBOT_TOKEN}`,
      },
    });

    if (!res.ok) {
      let detail = '';
      try {
        const j = await res.json();
        detail = (j as any)?.detail || JSON.stringify(j);
      } catch {
        detail = res.statusText;
      }
      console.error('Delete workflow API error', res.status, detail);
      return { success: false, error: detail };
    }

    const result = await res.json();
    return result;
  } catch (error) {
    console.error('Error deleting workflow:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

// Retrieve the active workflow used by the chatbot
export async function getActiveWorkflow(): Promise<ActiveWorkflowResponse> {
  try {
    console.log("CHATBOT_TOKEN:", CHATBOT_TOKEN);
    console.log("Authorization header:", `Bearer ${CHATBOT_TOKEN}`);
    console.log("Calling:", `${API_BASE}/workflows/active`);
    const res = await fetch(`${API_BASE}/workflows/active`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${CHATBOT_TOKEN}`,
      },
    });

    if (!res.ok) {
      let detail = '';
      try {
        const j = await res.json();
        detail = (j as any)?.detail || JSON.stringify(j);
      } catch {
        detail = res.statusText;
      }
      console.error('Get active workflow API error', res.status, detail);
      return { success: false, error: detail };
    }

    const result = await res.json();
    return result as ActiveWorkflowResponse;
  } catch (error) {
    console.error('Error fetching active workflow:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

// Sets the active workflow (by id and/or name) for the chatbot to use
export async function setActiveWorkflow(
  workflowId?: string,
  workflowName?: string
): Promise<ActiveWorkflowResponse> {
  const payload: Record<string, string> = {};
  if (workflowId) {
    payload.workflow_id = workflowId;
  }
  if (workflowName) {
    payload.workflow_name = workflowName;
  }

  try {
    const res = await fetch(`${API_BASE}/workflow/active`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${CHATBOT_TOKEN}`,
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      let detail = '';
      try {
        const j = await res.json();
        detail = (j as any)?.detail || JSON.stringify(j);
      } catch {
        detail = res.statusText;
      }
      console.error('Set active workflow API error', res.status, detail);
      return { success: false, error: detail };
    }

    const result = await res.json();
    return result as ActiveWorkflowResponse;
  } catch (error) {
    console.error('Error setting active workflow:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

export interface CategoryOptionsResponse {
  success: boolean;
  category?: string;
  options?: Array<{ id: number; text: string }>;
  error?: string;
}

// Get category options from database for workflow editor
export async function getCategoryOptions(category: string): Promise<CategoryOptionsResponse> {
  try {
    const res = await fetch(`${API_BASE}/workflow/category-options/${encodeURIComponent(category)}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${CHATBOT_TOKEN}`,
      },
    });

    if (!res.ok) {
      let detail = '';
      try {
        const j = await res.json();
        detail = (j as any)?.detail || (j as any)?.error || JSON.stringify(j);
      } catch {
        detail = res.statusText;
      }
      console.error('Get category options API error', res.status, detail);
      return { success: false, error: detail };
    }

    const result = await res.json();
    return result as CategoryOptionsResponse;
  } catch (error) {
    console.error('Error fetching category options:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

