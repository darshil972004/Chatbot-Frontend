import React, { useCallback, useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReactFlow, {
  Node,
  Edge,
  addEdge,
  Connection,
  useNodesState,
  useEdgesState,
  Controls,
  Background,
  BackgroundVariant,
  MiniMap,
  NodeTypes,
  ReactFlowInstance,
} from 'reactflow';
import 'reactflow/dist/style.css';
import './workflow.css';
import WorkflowNode from './WorkflowNode';
import { saveWorkflow, WorkflowNodeData, getWorkflow, getWorkflows } from '../api/workflow';

const nodeTypes: NodeTypes = {
  workflowNode: WorkflowNode,
};

const initialNodes: Node[] = [];
const initialEdges: Edge[] = [];

interface ComponentPaletteItem {
  id: string;
  type: string;
  label: string;
  icon: string;
}

const componentPalette: ComponentPaletteItem[] = [
  { id: 'button-list', type: 'button-list', label: 'Button List', icon: '☰' },
  { id: 'text-input', type: 'text-input', label: 'Text Input', icon: 'T' },
  { id: 'dropdown', type: 'dropdown', label: 'Dropdown', icon: '▼' },
  { id: 'message', type: 'message', label: 'Message', icon: '💬' },
  { id: 'get-user-details', type: 'get-user-details', label: 'Get User Details', icon: '👤' },
  { id: 'set-data', type: 'set-data', label: 'Set Data', icon: '📊' },
  { id: 'actions', type: 'actions', label: 'Actions', icon: '⚡' },
  { id: 'conditions', type: 'conditions', label: 'Conditions', icon: '🔀' },
  { id: 'rest-api', type: 'rest-api', label: 'Rest API', icon: '🔗' },
];

export default function WorkflowManagement() {
  const { workflowId: routeWorkflowId } = useParams<{ workflowId?: string }>();
  const navigate = useNavigate();
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null);
  const [showDataModal, setShowDataModal] = useState(false);
  const [workflowData, setWorkflowData] = useState<any>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingNode, setEditingNode] = useState<Node | null>(null);
  const [editPrompt, setEditPrompt] = useState('');
  const [editOptions, setEditOptions] = useState<Array<{ id: number; text: string; warning?: boolean }>>([]);
  const [editFormFields, setEditFormFields] = useState<Array<{ id: number; label: string; type: string; required?: boolean }>>([]);
  const [workflowId, setWorkflowId] = useState<string | null>(routeWorkflowId || null);
  const [workflowName, setWorkflowName] = useState<string>('Untitled Workflow');
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const getDefaultPrompt = (type: string): string => {
    const prompts: Record<string, string> = {
      'text-input': 'Please type your question:',
      'button-list': 'Please select an option:',
      'dropdown': 'Please select from dropdown:',
      'message': 'Enter your message:',
      'get-user-details': 'Get user information:',
      'set-data': 'Set data value:',
      'actions': 'Configure action:',
      'conditions': 'Set condition:',
      'rest-api': 'Configure API endpoint:',
    };
    return prompts[type] || 'Configure component:';
  };

  const handleDeleteNode = useCallback((nodeId: string) => {
    setNodes((nds) => nds.filter((node) => node.id !== nodeId));
    setEdges((eds) => eds.filter((edge) => edge.source !== nodeId && edge.target !== nodeId));
    if (selectedNode?.id === nodeId) {
      setSelectedNode(null);
    }
  }, [setNodes, setEdges, selectedNode]);

  const handleEditNode = useCallback((nodeId: string) => {
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return;

    setEditingNode(node);
    setEditPrompt(node.data.prompt || '');
    setEditOptions(node.data.options ? [...node.data.options] : []);
    setEditFormFields(node.data.formFields ? [...node.data.formFields] : []);
    setShowEditModal(true);
  }, [nodes]);

  const onDragStart = (event: React.DragEvent, componentType: string) => {
    event.dataTransfer.setData('application/reactflow', componentType);
    event.dataTransfer.effectAllowed = 'move';
  };

  const onInit = useCallback((instance: ReactFlowInstance) => {
    setReactFlowInstance(instance);
  }, []);

  const handleNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    setSelectedNode(node);
  }, []);

  // Load workflow function - defined after handlers
  const loadWorkflow = useCallback(async (id: string) => {
    setIsLoading(true);
    try {
      const result = await getWorkflow(id);
      if (result.success && result.nodes && result.workflow_name) {
        setWorkflowId(id);
        setWorkflowName(result.workflow_name);
        setNameError(null);
        
        // Transform database nodes to ReactFlow nodes
        const loadedNodes: Node[] = result.nodes.map((nodeData) => {
          let options: Array<{ id: number; text: string; warning?: boolean }> = [];
          if (nodeData.options_json) {
            try {
              options = JSON.parse(nodeData.options_json);
            } catch (e) {
              console.error('Error parsing options_json:', e);
            }
          }

          let formFields: Array<{ id: number; label: string; type: string; required?: boolean }> = [];
          if (nodeData.options_json) {
            try {
              formFields = JSON.parse(nodeData.options_json);
            } catch (e) {
              console.error('Error parsing form_fields_json:', e);
            }
          }

          return {
            id: nodeData.id,
            type: 'workflowNode',
            position: { x: nodeData.position_x, y: nodeData.position_y },
            data: {
              label: nodeData.label,
              type: nodeData.type,
              question_text: nodeData.question_text,
              options,
              formFields,
            },
          };
        });

        // Reconstruct edges from next_nodes_json
        const loadedEdges: Edge[] = [];
        result.nodes.forEach((nodeData) => {
          if (nodeData.next_nodes_json) {
            try {
              const nextNodes: string[] = JSON.parse(nodeData.next_nodes_json);
              nextNodes.forEach((targetId) => {
                loadedEdges.push({
                  id: `${nodeData.id}-${targetId}`,
                  source: nodeData.id,
                  target: targetId,
                });
              });
            } catch (e) {
              console.error('Error parsing next_nodes_json:', e);
            }
          }
        });

        setNodes(loadedNodes);
        setEdges(loadedEdges);
      } else {
        alert(`Failed to load workflow: ${result.error || 'Unknown error'}`);
        navigate('/workflows');
      }
    } catch (error) {
      console.error('Error loading workflow:', error);
      alert(`Error loading workflow: ${error instanceof Error ? error.message : 'Unknown error'}`);
      navigate('/workflows');
    } finally {
      setIsLoading(false);
    }
  }, [navigate, setNodes, setEdges]);

  // Load workflow when navigating via URL param
  useEffect(() => {
    if (routeWorkflowId) {
      loadWorkflow(routeWorkflowId);
    } else {
      // Reset state when creating a new workflow
      setWorkflowId(null);
      setWorkflowName('Untitled Workflow');
      setNameError(null);
      setNodes([]);
      setEdges([]);
    }
  }, [routeWorkflowId, loadWorkflow, setNodes, setEdges]);

  // Add drop handler to ReactFlow pane
  useEffect(() => {
    if (!reactFlowInstance) return;

    const pane = document.querySelector('.react-flow__pane');
    if (!pane) return;

    const handleDrop = (event: Event) => {
      const dragEvent = event as DragEvent;
      dragEvent.preventDefault();
      const componentType = dragEvent.dataTransfer?.getData('application/reactflow');
      if (!componentType || !reactFlowInstance) return;

      const reactFlowBounds = reactFlowWrapper.current?.getBoundingClientRect();
      if (!reactFlowBounds) return;

      const position = reactFlowInstance.project({
        x: dragEvent.clientX - reactFlowBounds.left,
        y: dragEvent.clientY - reactFlowBounds.top,
      });

      const newNode: Node = {
        id: `${componentType}-${Date.now()}`,
        type: 'workflowNode',
        position,
        data: {
          label: componentPalette.find((c) => c.type === componentType)?.label || componentType,
          type: componentType,
          prompt: getDefaultPrompt(componentType),
          options: (componentType === 'button-list' || componentType === 'dropdown') 
            ? [{ id: 1, text: 'Option 1', warning: true }] 
            : [],
          formFields: componentType === 'get-user-details'
            ? [{ id: 1, label: 'Name', type: 'text', required: true }]
            : [],
          onDelete: handleDeleteNode,
          onEdit: handleEditNode,
        },
      };

      setNodes((nds) => nds.concat(newNode));
    };

    const handleDragOver = (event: Event) => {
      const dragEvent = event as DragEvent;
      dragEvent.preventDefault();
      if (dragEvent.dataTransfer) {
        dragEvent.dataTransfer.dropEffect = 'move';
      }
    };

    pane.addEventListener('drop', handleDrop);
    pane.addEventListener('dragover', handleDragOver);

    return () => {
      pane.removeEventListener('drop', handleDrop);
      pane.removeEventListener('dragover', handleDragOver);
    };
  }, [reactFlowInstance, setNodes, handleDeleteNode, handleEditNode]);

  // Calculate topological order for nodes (BFS from nodes with no incoming edges)
  const calculateOrderIndex = (nodes: Node[], edges: Edge[]): Map<string, number> => {
    const orderMap = new Map<string, number>();
    const inDegree = new Map<string, number>();
    const adjacencyList = new Map<string, string[]>();

    // Initialize in-degree and adjacency list
    nodes.forEach(node => {
      inDegree.set(node.id, 0);
      adjacencyList.set(node.id, []);
    });

    edges.forEach(edge => {
      const currentInDegree = inDegree.get(edge.target) || 0;
      inDegree.set(edge.target, currentInDegree + 1);
      
      const neighbors = adjacencyList.get(edge.source) || [];
      neighbors.push(edge.target);
      adjacencyList.set(edge.source, neighbors);
    });

    // Find nodes with no incoming edges (start nodes)
    const queue: string[] = [];
    nodes.forEach(node => {
      if ((inDegree.get(node.id) || 0) === 0) {
        queue.push(node.id);
      }
    });

    // BFS to assign order
    let order = 0;
    while (queue.length > 0) {
      const current = queue.shift()!;
      orderMap.set(current, order++);

      const neighbors = adjacencyList.get(current) || [];
      neighbors.forEach(neighbor => {
        const currentInDegree = inDegree.get(neighbor) || 0;
        inDegree.set(neighbor, currentInDegree - 1);
        if (inDegree.get(neighbor) === 0) {
          queue.push(neighbor);
        }
      });
    }

    // For nodes not in the BFS (isolated or cycles), assign order based on position
    nodes.forEach(node => {
      if (!orderMap.has(node.id)) {
        orderMap.set(node.id, order++);
      }
    });

    return orderMap;
  };

  const handleSaveWorkflow = async () => {
    if (nodes.length === 0) {
      alert('Cannot save an empty workflow. Please add at least one node.');
      return;
    }

    const trimmedName = workflowName.trim();
    if (!trimmedName) {
      setNameError('Workflow name is required.');
      alert('Please enter a workflow name before saving.');
      return;
    }

    setIsSaving(true);
    setNameError(null);

    try {
      const listResponse = await getWorkflows();
      if (!listResponse.success) {
        const message = listResponse.error || 'Unknown error while validating workflow name.';
        setNameError('Unable to validate workflow name uniqueness. Please try again.');
        alert(`Unable to validate workflow name: ${message}`);
        return;
      }

      const duplicate = (listResponse.workflows || []).some((wf) =>
        wf.workflow_id !== workflowId && wf.workflow_name.trim().toLowerCase() === trimmedName.toLowerCase()
      );

      if (duplicate) {
        setNameError('Workflow name must be unique. Please choose a different name.');
        alert('Workflow name must be unique. Please choose a different name.');
        return;
      }

      if (workflowName !== trimmedName) {
        setWorkflowName(trimmedName);
      }

      // Calculate order index for each node
      const orderMap = calculateOrderIndex(nodes, edges);

      // Build next_nodes mapping from edges
      const nextNodesMap = new Map<string, string[]>();
      edges.forEach(edge => {
        const currentNext = nextNodesMap.get(edge.source) || [];
        currentNext.push(edge.target);
        nextNodesMap.set(edge.source, currentNext);
      });

      // Transform nodes to database format
      const workflowNodesData: WorkflowNodeData[] = nodes.map(node => {
        const nextNodes = nextNodesMap.get(node.id) || [];
        
        return {
          id: node.id,
          type: node.data.type,
          label: node.data.label,
          question_text: node.data.question_text || '',
          position_x: Math.round(node.position.x),
          position_y: Math.round(node.position.y),
          options_json:node.data.options && node.data.options.length > 0
            ? JSON.stringify(node.data.options)
            : node.data.formFields && node.data.formFields.length > 0
            ? JSON.stringify(node.data.formFields)
            : null,
          next_nodes_json: nextNodes.length > 0
            ? JSON.stringify(nextNodes)
            : null,
          order_index: orderMap.get(node.id) || 0,
          workflow_id: workflowId || '',
          created_at: new Date().toISOString(),
        };
      });

      // Save to backend
      const result = await saveWorkflow(workflowId, trimmedName, workflowNodesData);

      if (result.success) {
        // Update workflow ID if it was created
        if (result.workflow_id) {
          setWorkflowId(result.workflow_id);
        }

        // Also prepare data for modal display
        const dataToSave = {
          nodes: nodes.map(node => ({
            id: node.id,
            type: node.data.type,
            position: node.position,
            data: {
              label: node.data.label,
              type: node.data.type,
              question_text: node.data.question_text,
              options: node.data.options || [],
              formFields: node.data.formFields || [],
            },
          })),
          edges: edges.map(edge => ({
            id: edge.id,
            source: edge.source,
            target: edge.target,
            sourceHandle: edge.sourceHandle,
            targetHandle: edge.targetHandle,
          })),
          metadata: {
            createdAt: new Date().toISOString(),
            nodeCount: nodes.length,
            edgeCount: edges.length,
            workflowId: result.workflow_id || workflowId,
          },
        };

        setWorkflowData(dataToSave);
        setShowDataModal(true);
        
        // Update workflow ID in state and URL if it was created
        if (result.workflow_id) {
          setWorkflowId(result.workflow_id);
          // Update URL if this is a new workflow
          if (!routeWorkflowId) {
            navigate(`/workflow/${result.workflow_id}`, { replace: true });
          }
        }
        
        // Show success message and option to go to list
        const goToList = window.confirm(
          `Workflow saved successfully!${result.workflow_id ? `\nWorkflow ID: ${result.workflow_id}` : ''}\n\nWould you like to go back to the workflow list?`
        );
        if (goToList) {
          navigate('/workflows');
        }
      } else {
        alert(`Failed to save workflow: ${result.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error saving workflow:', error);
      alert(`Error saving workflow: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handlePreview = () => {
    // Handle preview logic here
    console.log('Preview workflow:', { nodes, edges });
    alert('Preview functionality coming soon!');
  };

  const handleSaveEdit = () => {
    if (!editingNode) return;

    setNodes((nds) =>
      nds.map((node) =>
        node.id === editingNode.id
          ? {
              ...node,
              data: {
                ...node.data,
                question_text: editPrompt,
                options: (editingNode.data.type === 'button-list' || editingNode.data.type === 'dropdown')
                  ? (editOptions.length > 0 ? editOptions : node.data.options)
                  : node.data.options,
                formFields: editingNode.data.type === 'get-user-details'
                  ? (editFormFields.length > 0 ? editFormFields : node.data.formFields)
                  : node.data.formFields,
              },
            }
          : node
      )
    );

    setShowEditModal(false);
    setEditingNode(null);
    setEditPrompt('');
    setEditOptions([]);
    setEditFormFields([]);
  };

  const handleAddOption = () => {
    const newId = editOptions.length > 0 ? Math.max(...editOptions.map(o => o.id)) + 1 : 1;
    setEditOptions([...editOptions, { id: newId, text: '', warning: false }]);
  };

  const handleUpdateOption = (id: number, field: 'text' | 'warning', value: string | boolean) => {
    setEditOptions(editOptions.map(opt =>
      opt.id === id ? { ...opt, [field]: value } : opt
    ));
  };

  const handleDeleteOption = (id: number) => {
    setEditOptions(editOptions.filter(opt => opt.id !== id));
  };

  const handleAddFormField = () => {
    const newId = editFormFields.length > 0 ? Math.max(...editFormFields.map(f => f.id)) + 1 : 1;
    setEditFormFields([...editFormFields, { id: newId, label: '', type: 'text', required: false }]);
  };

  const handleUpdateFormField = (id: number, field: 'label' | 'type' | 'required', value: string | boolean) => {
    setEditFormFields(editFormFields.map(f =>
      f.id === id ? { ...f, [field]: value } : f
    ));
  };

  const handleDeleteFormField = (id: number) => {
    setEditFormFields(editFormFields.filter(f => f.id !== id));
  };

  return (
    <div className="workflow-management">
      {/* Header Bar */}
      <div className="workflow-header">
        <div className="header-left">
          <button className="back-button" onClick={() => navigate('/workflows')}>
            <span>←</span> Back to List
          </button>
        </div>
        <div className="header-center">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', justifyContent: 'center' }}>
            {/* <h1 className="workflow-title">{workflowId ? 'Edit Workflow' : 'Create Workflow'}</h1> */}
            <input
              type="text"
              value={workflowName}
              onChange={(e) => {
                setWorkflowName(e.target.value);
                if (nameError) {
                  setNameError(null);
                }
              }}
              className="workflow-name-input"
              placeholder="Workflow Name"
              style={{
                padding: '6px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '16px',
                fontWeight: 600,
                minWidth: '200px',
                fontFamily: 'Times New Roman', 
                color: '#7f8286',              
              }}
              
            />
          </div>
          <p className="workflow-instructions">
            {/* Add steps → Edit options → Assign "Goes to Step" for each button → Preview */}
            Shape your chatbot experience — from creation to refinement
            {/* Build, customize, and optimize your conversation flow */}
          </p>
          {nameError && <p className="workflow-name-error">{nameError}</p>}
        </div>
        <div className="header-right">
          <button className="preview-button" onClick={handlePreview}>
            <span>👁</span> Preview
          </button>
          <button 
            className="save-button" 
            onClick={handleSaveWorkflow}
            disabled={isSaving}
          >
            <span>📄</span> {isSaving ? 'Saving...' : 'Save Workflow'}
          </button>
        </div>
      </div>

      {/* Component Palette */}
      <div className="component-palette">
        {componentPalette.map((component) => (
          <button
            key={component.id}
            className="palette-item"
            draggable
            onDragStart={(e) => onDragStart(e, component.type)}
          >
            <span className="palette-icon">{component.icon}</span>
            <span className="palette-label">{component.label}</span>
          </button>
        ))}
      </div>

      {/* Loading State */}
      {isLoading && (
        <div style={{ 
          position: 'absolute', 
          top: '50%', 
          left: '50%', 
          transform: 'translate(-50%, -50%)',
          zIndex: 1000,
          background: 'white',
          padding: '20px',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
        }}>
          <p>Loading workflow...</p>
        </div>
      )}

      {/* Canvas Area */}
      <div className="workflow-canvas" ref={reactFlowWrapper}>
        <ReactFlow
          nodes={nodes.map(node => ({
            ...node,
            data: {
              ...node.data,
              onDelete: handleDeleteNode,
              onEdit: handleEditNode,
            },
          }))}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={handleNodeClick}
          onInit={onInit}
          nodeTypes={nodeTypes}
          fitView={!isLoading}
          className="react-flow-canvas"
        >
          <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
          <Controls />
          <MiniMap
            nodeColor={(node) => {
              const typeColors: Record<string, string> = {
                'text-input': '#9333ea',
                'button-list': '#3b82f6',
                'dropdown': '#8b5cf6',
                'message': '#10b981',
                'get-user-details': '#f59e0b',
                'set-data': '#8b5cf6',
                'actions': '#ef4444',
                'conditions': '#06b6d4',
                'rest-api': '#6366f1',
              };
              return typeColors[node.data?.type] || '#6b7280';
            }}
            maskColor="rgba(0, 0, 0, 0.1)"
          />
        </ReactFlow>
      </div>

      {/* Data Modal */}
      {showDataModal && workflowData && (
        <div className="data-modal-overlay" onClick={() => setShowDataModal(false)}>
          <div className="data-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="data-modal-header">
              <h2>Workflow Data</h2>
              <button className="close-modal-btn" onClick={() => setShowDataModal(false)}>
                ×
              </button>
            </div>
            <div className="data-modal-body">
              <div className="data-info">
                <p><strong>Total Nodes:</strong> {workflowData.metadata.nodeCount}</p>
                <p><strong>Total Edges:</strong> {workflowData.metadata.edgeCount}</p>
                <p><strong>Created At:</strong> {new Date(workflowData.metadata.createdAt).toLocaleString()}</p>
              </div>
              <div className="data-json-container">
                <h3>JSON Data:</h3>
                <pre className="data-json">
                  {JSON.stringify(workflowData, null, 2)}
                </pre>
              </div>
              <div className="data-modal-actions">
                <button 
                  className="copy-btn" 
                  onClick={() => {
                    navigator.clipboard.writeText(JSON.stringify(workflowData, null, 2));
                    alert('Data copied to clipboard!');
                  }}
                >
                  📋 Copy to Clipboard
                </button>
                <button 
                  className="download-btn" 
                  onClick={() => {
                    const blob = new Blob([JSON.stringify(workflowData, null, 2)], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `workflow-${Date.now()}.json`;
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                >
                  💾 Download JSON
                </button>
                <button 
                  className="close-btn" 
                  onClick={() => setShowDataModal(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && editingNode && (
        <div className="data-modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="data-modal-content edit-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="data-modal-header">
              <h2>Edit {editingNode.data.label}</h2>
              <button className="close-modal-btn" onClick={() => setShowEditModal(false)}>
                ×
              </button>
            </div>
            <div className="data-modal-body">
              <div className="edit-form-group">
                <label htmlFor="edit-prompt">Question Text:</label>
                <input
                  id="edit-prompt"
                  type="text"
                  value={editPrompt}
                  onChange={(e) => setEditPrompt(e.target.value)}
                  className="edit-input"
                  placeholder="Enter prompt text"
                />
              </div>

              {(editingNode.data.type === 'button-list' || editingNode.data.type === 'dropdown') && (
                <div className="edit-form-group">
                  <div className="edit-options-header">
                    <label>Options:</label>
                    <button className="add-option-btn" onClick={handleAddOption}>
                      + Add Option
                    </button>
                  </div>
                  <div className="edit-options-list">
                    {editOptions.map((option) => (
                      <div key={option.id} className="edit-option-item">
                        <input
                          type="text"
                          value={option.text}
                          onChange={(e) => handleUpdateOption(option.id, 'text', e.target.value)}
                          className="edit-option-input"
                          placeholder={`Option ${option.id}`}
                        />
                        <label className="warning-checkbox">
                          <input
                            type="checkbox"
                            checked={option.warning || false}
                            onChange={(e) => handleUpdateOption(option.id, 'warning', e.target.checked)}
                          />
                          <span>Warning</span>
                        </label>
                        <button
                          className="delete-option-btn"
                          onClick={() => handleDeleteOption(option.id)}
                          title="Delete option"
                        >
                          🗑️
                        </button>
                      </div>
                    ))}
                    {editOptions.length === 0 && (
                      <p className="no-options-text">No options added. Click "Add Option" to add one.</p>
                    )}
                  </div>
                </div>
              )}

              {editingNode.data.type === 'get-user-details' && (
                <div className="edit-form-group">
                  <div className="edit-options-header">
                    <label>Form Fields:</label>
                    <button className="add-option-btn" onClick={handleAddFormField}>
                      + Add Field
                    </button>
                  </div>
                  <div className="edit-options-list">
                    {editFormFields.map((field) => (
                      <div key={field.id} className="edit-form-field-item">
                        <input
                          type="text"
                          value={field.label}
                          onChange={(e) => handleUpdateFormField(field.id, 'label', e.target.value)}
                          className="edit-option-input"
                          placeholder="Field label (e.g., Name, Email)"
                        />
                        <select
                          value={field.type}
                          onChange={(e) => handleUpdateFormField(field.id, 'type', e.target.value)}
                          className="edit-field-type-select"
                        >
                          <option value="text">Text</option>
                          <option value="email">Email</option>
                          <option value="tel">Phone</option>
                          <option value="number">Number</option>
                          <option value="date">Date</option>
                          <option value="textarea">Textarea</option>
                        </select>
                        <label className="warning-checkbox">
                          <input
                            type="checkbox"
                            checked={field.required || false}
                            onChange={(e) => handleUpdateFormField(field.id, 'required', e.target.checked)}
                          />
                          <span>Required</span>
                        </label>
                        <button
                          className="delete-option-btn"
                          onClick={() => handleDeleteFormField(field.id)}
                          title="Delete field"
                        >
                          🗑️
                        </button>
                      </div>
                    ))}
                    {editFormFields.length === 0 && (
                      <p className="no-options-text">No form fields added. Click "Add Field" to add one.</p>
                    )}
                  </div>
                </div>
              )}

              <div className="data-modal-actions">
                <button className="close-btn" onClick={() => setShowEditModal(false)}>
                  Cancel
                </button>
                <button className="save-button" onClick={handleSaveEdit}>
                  💾 Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

