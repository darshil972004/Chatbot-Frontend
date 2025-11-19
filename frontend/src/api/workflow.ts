// Lightweight mock workflow API used by the frontend when no backend is available.
// Stores workflows in localStorage under `mock_workflows` and active workflow under `mock_active_workflow`.

export type WorkflowNodeData = {
  id: string;
  type: string;
  label: string;
  question_text: string;
  position_x: number;
  position_y: number;
  options_json?: string | null;
  next_nodes_json?: string | null;
  order_index?: number;
  workflow_id?: string;
  created_at?: string;
};

export type WorkflowListItem = {
  workflow_id: string;
  workflow_name: string;
  node_count: number;
  created_at: string;
  updated_at?: string | null;
};

const STORAGE_KEY = 'mock_workflows_v1';
const ACTIVE_KEY = 'mock_active_workflow_v1';

type StoredWorkflow = {
  workflow_id: string;
  workflow_name: string;
  nodes: WorkflowNodeData[];
  created_at: string;
  updated_at?: string | null;
};

function readAll(): StoredWorkflow[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as StoredWorkflow[];
  } catch {
    return [];
  }
}

function writeAll(list: StoredWorkflow[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

function generateId(prefix = 'wf') {
  return `${prefix}-${Date.now().toString(36)}-${Math.floor(Math.random() * 10000)}`;
}

export async function getWorkflows(): Promise<{ success: true; workflows: WorkflowListItem[] } | { success: false; error: string }> {
  try {
    const list = readAll();
    const items: WorkflowListItem[] = list.map(w => ({
      workflow_id: w.workflow_id,
      workflow_name: w.workflow_name,
      node_count: w.nodes?.length || 0,
      created_at: w.created_at,
      updated_at: w.updated_at || null,
    }));
    return { success: true, workflows: items };
  } catch (e) {
    return { success: false, error: (e instanceof Error) ? e.message : 'Unknown error' };
  }
}

export async function getWorkflow(workflowId: string): Promise<{ success: true; nodes: WorkflowNodeData[]; workflow_name: string } | { success: false; error: string }> {
  try {
    const list = readAll();
    const wf = list.find(w => w.workflow_id === workflowId);
    if (!wf) return { success: false, error: 'Workflow not found' };
    return { success: true, nodes: wf.nodes || [], workflow_name: wf.workflow_name };
  } catch (e) {
    return { success: false, error: (e instanceof Error) ? e.message : 'Unknown error' };
  }
}

export async function saveWorkflow(workflowId: string | null, workflowName: string, nodes: WorkflowNodeData[]): Promise<{ success: true; workflow_id: string } | { success: false; error: string }> {
  try {
    const list = readAll();
    if (!workflowId) {
      workflowId = generateId('workflow');
      const now = new Date().toISOString();
      const newW: StoredWorkflow = {
        workflow_id: workflowId,
        workflow_name: workflowName,
        nodes: nodes || [],
        created_at: now,
        updated_at: now,
      };
      writeAll([newW, ...list]);
      return { success: true, workflow_id: workflowId };
    }

    const idx = list.findIndex(w => w.workflow_id === workflowId);
    const now = new Date().toISOString();
    if (idx === -1) {
      const newW: StoredWorkflow = {
        workflow_id: workflowId,
        workflow_name: workflowName,
        nodes: nodes || [],
        created_at: now,
        updated_at: now,
      };
      writeAll([newW, ...list]);
      return { success: true, workflow_id: workflowId };
    }

    list[idx].workflow_name = workflowName;
    list[idx].nodes = nodes || [];
    list[idx].updated_at = now;
    writeAll(list);
    return { success: true, workflow_id: workflowId };
  } catch (e) {
    return { success: false, error: (e instanceof Error) ? e.message : 'Unknown error' };
  }
}

export async function deleteWorkflow(workflowId: string): Promise<{ success: true } | { success: false; error: string }> {
  try {
    const list = readAll();
    const filtered = list.filter(w => w.workflow_id !== workflowId);
    writeAll(filtered);
    const active = localStorage.getItem(ACTIVE_KEY);
    if (active === workflowId) {
      localStorage.removeItem(ACTIVE_KEY);
    }
    return { success: true };
  } catch (e) {
    return { success: false, error: (e instanceof Error) ? e.message : 'Unknown error' };
  }
}

export async function setActiveWorkflow(workflowId: string, workflowName?: string): Promise<{ success: true; message?: string } | { success: false; error: string }> {
  try {
    localStorage.setItem(ACTIVE_KEY, workflowId);
    return { success: true, message: 'Active workflow updated' };
  } catch (e) {
    return { success: false, error: (e instanceof Error) ? e.message : 'Unknown error' };
  }
}

export async function getActiveWorkflow(): Promise<{ success: true; workflow_id?: string } | { success: false; error: string }> {
  try {
    const active = localStorage.getItem(ACTIVE_KEY);
    if (!active) return { success: true };
    return { success: true, workflow_id: active };
  } catch (e) {
    return { success: false, error: (e instanceof Error) ? e.message : 'Unknown error' };
  }
}

// Basic category options mock data. This can be extended or loaded from server if available.
const DEFAULT_CATEGORY_OPTIONS: Record<string, Array<{ id: number; text: string }>> = {
  'beds': [
    { id: 1, text: '1' },
    { id: 2, text: '2' },
    { id: 3, text: '3' },
    { id: 4, text: '4+' },
  ],
  'baths': [
    { id: 1, text: '1' },
    { id: 2, text: '2' },
    { id: 3, text: '3' },
    { id: 4, text: '4+' },
  ],
  'price': [
    { id: 1, text: 'Under $100k' },
    { id: 2, text: '$100k - $300k' },
    { id: 3, text: '$300k - $600k' },
    { id: 4, text: 'Above $600k' },
  ],
};

export async function getCategoryOptions(category: string): Promise<{ success: true; options: Array<{ id: number; text: string }>; category?: string } | { success: false; error: string }> {
  try {
    const key = category?.toLowerCase() || '';
    const options = DEFAULT_CATEGORY_OPTIONS[key] || [];
    return { success: true, options, category };
  } catch (e) {
    return { success: false, error: (e instanceof Error) ? e.message : 'Unknown error' };
  }
}

export default {};
