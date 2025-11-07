import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getWorkflows, deleteWorkflow, WorkflowListItem, setActiveWorkflow, getActiveWorkflow } from '../api/workflow';
import './workflow.css';

export default function WorkflowList() {
  const [workflows, setWorkflows] = useState<WorkflowListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedWorkflowId, setSelectedWorkflowId] = useState<string | null>(null);
  const [activeWorkflowId, setActiveWorkflowId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [statusType, setStatusType] = useState<'success' | 'error' | null>(null);
  const [isSettingActive, setIsSettingActive] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadWorkflows();
    fetchActiveWorkflow();
  }, []);

  const loadWorkflows = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getWorkflows();
      if (result.success && result.workflows) {
        setWorkflows(result.workflows);
      } else {
        setError(result.error || 'Failed to load workflows');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const fetchActiveWorkflow = async () => {
    try {
      const result = await getActiveWorkflow();
      if (result.success && result.workflow_id) {
        setActiveWorkflowId(result.workflow_id);
        setSelectedWorkflowId(result.workflow_id);
        setStatusMessage(null);
        setStatusType(null);
      } else if (result.success) {
        setActiveWorkflowId(null);
      } else {
        setStatusType('error');
        setStatusMessage(result.error || 'Failed to fetch active workflow');
      }
    } catch (err) {
      setStatusType('error');
      setStatusMessage(err instanceof Error ? err.message : 'Failed to fetch active workflow');
    }
  };

  useEffect(() => {
    if (workflows.length === 0) return;
    if (selectedWorkflowId && !workflows.some((wf) => wf.workflow_id === selectedWorkflowId)) {
      setSelectedWorkflowId(null);
    }
  }, [workflows, selectedWorkflowId]);

  useEffect(() => {
    if (workflows.length === 0) return;
    if (activeWorkflowId && !workflows.some((wf) => wf.workflow_id === activeWorkflowId)) {
      setActiveWorkflowId(null);
    }
  }, [activeWorkflowId, workflows]);

  useEffect(() => {
    if (activeWorkflowId) {
      setSelectedWorkflowId(activeWorkflowId);
    }
  }, [activeWorkflowId]);

  const selectedWorkflow = useMemo(() => {
    if (!selectedWorkflowId) return null;
    return workflows.find((wf) => wf.workflow_id === selectedWorkflowId) || null;
  }, [workflows, selectedWorkflowId]);

  const handleCreateNew = () => {
    navigate('/workflow');
  };

  const handleEdit = (workflowId: string) => {
    navigate(`/workflow/${workflowId}`);
  };

  const handleDelete = async (workflowId: string, workflowName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm(`Are you sure you want to delete "${workflowName}"?`)) {
      try {
        const result = await deleteWorkflow(workflowId);
        if (result.success) {
          await loadWorkflows();
          setSelectedWorkflowId((current) => (current === workflowId ? null : current));
          setActiveWorkflowId((current) => (current === workflowId ? null : current));
        } else {
          alert(`Failed to delete workflow: ${result.error}`);
        }
      } catch (err) {
        alert(`Error deleting workflow: ${err instanceof Error ? err.message : 'Unknown error'}`);
      }
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return dateString;
    }
  };

  const handleSetActiveWorkflow = async (workflow: WorkflowListItem) => {
    const trimmedName = (workflow.workflow_name || '').trim();
    if (!trimmedName) {
      setStatusType('error');
      setStatusMessage('Workflow must have a name before it can be set as active.');
      return;
    }

    setIsSettingActive(true);
    setStatusMessage(null);
    setStatusType(null);

    try {
      const res = await setActiveWorkflow(workflow.workflow_id, trimmedName);
      if (res.success) {
        setActiveWorkflowId(workflow.workflow_id);
        setSelectedWorkflowId(workflow.workflow_id);
        setStatusType('success');
        setStatusMessage(res.message || `Active workflow set to "${trimmedName}".`);
      } else {
        setStatusType('error');
        setStatusMessage(res.error || 'Failed to set active workflow.');
      }
    } catch (err) {
      setStatusType('error');
      setStatusMessage(err instanceof Error ? err.message : 'Failed to set active workflow.');
    } finally {
      setIsSettingActive(false);
    }
  };

  const handleSelectWorkflow = async (workflowId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const workflow = workflows.find((w) => w.workflow_id === workflowId);
    if (!workflow) return;

    await handleSetActiveWorkflow(workflow);
  };

  const handleActiveWorkflowChange = async (event: React.ChangeEvent<HTMLSelectElement>) => {
    const workflow = workflows.find((w) => w.workflow_id === event.target.value);
    if (!workflow) return;

    await handleSetActiveWorkflow(workflow);
  };

  return (
    <div className="workflow-list-container">
      <div className="workflow-list-header">
        <div className="header-content">
          <h1>Saved Workflows</h1>
          <button className="create-workflow-btn" onClick={handleCreateNew}>
            + Create New Workflow
          </button>
        </div>
        <button className="back-to-home-btn" onClick={() => navigate('/')}>
          ← Back to Home
        </button>
      </div>

      <div className="workflow-list-content">
        {!loading && !error && (
          <div className="selected-workflow-section">
            <div className="selected-workflow-header">
              <h2>Selected Workflow</h2>
              {selectedWorkflow && (
                <button
                  className="selected-workflow-open-btn"
                  onClick={() => handleEdit(selectedWorkflow.workflow_id)}
                >
                  Open Workflow
                </button>
              )}
            </div>
            <div className="selected-workflow-controls">
              <label htmlFor="active-workflow-select">Chatbot Workflow</label>
              <select
                id="active-workflow-select"
                className="selected-workflow-select"
                value={activeWorkflowId ?? ''}
                onChange={handleActiveWorkflowChange}
                disabled={workflows.length === 0 || isSettingActive}
              >
                <option value="" disabled>
                  {workflows.length === 0 ? 'No workflows available' : 'Select a workflow'}
                </option>
                {workflows.map((wf) => (
                  <option key={wf.workflow_id} value={wf.workflow_id}>
                    {wf.workflow_name || 'Untitled Workflow'}
                  </option>
                ))}
              </select>
              {isSettingActive && <span className="selected-workflow-progress">Updating...</span>}
            </div>
            {statusMessage && (
              <div
                className={`selected-workflow-status ${statusType === 'error' ? 'error' : 'success'}`}
                role="status"
              >
                {statusMessage}
              </div>
            )}
            {selectedWorkflow ? (
              <div className="selected-workflow-details">
                <div className="selected-workflow-meta">
                  <span><strong>Name:</strong> {selectedWorkflow.workflow_name || 'Untitled Workflow'}</span>
                  <span><strong>Nodes:</strong> {selectedWorkflow.node_count}</span>
                  <span><strong>Created:</strong> {formatDate(selectedWorkflow.created_at)}</span>
                  {selectedWorkflow.updated_at && (
                    <span><strong>Updated:</strong> {formatDate(selectedWorkflow.updated_at)}</span>
                  )}
                </div>
              </div>
            ) : (
              <p className="selected-workflow-placeholder">
                No active workflow. Use the dropdown above to choose which workflow powers the chatbot.
              </p>
            )}
          </div>
        )}

        {loading && (
          <div className="loading-state">
            <p>Loading workflows...</p>
          </div>
        )}

        {error && (
          <div className="error-state">
            <p>Error: {error}</p>
            <button onClick={loadWorkflows}>Retry</button>
          </div>
        )}

        {!loading && !error && workflows.length === 0 && (
          <div className="empty-state">
            <p>No workflows saved yet.</p>
            <button className="create-workflow-btn" onClick={handleCreateNew}>
              Create Your First Workflow
            </button>
          </div>
        )}

        {!loading && !error && workflows.length > 0 && (
          <div className="workflow-grid">
            {workflows.map((workflow) => {
              const isActive = activeWorkflowId === workflow.workflow_id;
              const isSelected = selectedWorkflowId === workflow.workflow_id;

              return (
                <div
                  key={workflow.workflow_id}
                  className={`workflow-card${isSelected ? ' selected' : ''}${isActive ? ' active' : ''}`}
                  onClick={() => handleEdit(workflow.workflow_id)}
                >
                  <div className="workflow-card-header">
                    <h3 className="workflow-card-title">{workflow.workflow_name || 'Untitled Workflow'}</h3>
                    <div className="workflow-card-actions">
                      {isActive && <span className="workflow-active-badge">Active</span>}
                      <button
                        className="delete-workflow-btn"
                        onClick={(e) => handleDelete(workflow.workflow_id, workflow.workflow_name, e)}
                        title="Delete workflow"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                  <div className="workflow-card-body">
                    <div className="workflow-card-info">
                      <span className="info-item">
                        <strong>Nodes:</strong> {workflow.node_count}
                      </span>
                      <span className="info-item">
                        <strong>Created:</strong> {formatDate(workflow.created_at)}
                      </span>
                      {workflow.updated_at && (
                        <span className="info-item">
                          <strong>Updated:</strong> {formatDate(workflow.updated_at)}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="workflow-card-footer">
                    <button
                      className="select-workflow-btn"
                      onClick={(e) => handleSelectWorkflow(workflow.workflow_id, e)}
                      disabled={isActive || isSettingActive}
                    >
                      {isActive ? 'Active' : isSettingActive ? 'Setting...' : 'Set as Active'}
                    </button>
                    <button
                      className="edit-workflow-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEdit(workflow.workflow_id);
                      }}
                    >
                      Edit Workflow
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

