import React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';

interface WorkflowNodeData {
  label: string;
  type: string;
  question_text: string;
  options?: Array<{ id: number; text: string; warning?: boolean }>;
  formFields?: Array<{ id: number; label: string; type: string; required: boolean }>;
  onDelete?: (nodeId: string) => void;
  onEdit?: (nodeId: string) => void;
}

export default function WorkflowNode({ data, selected, id }: NodeProps<WorkflowNodeData>) {
  const getTypeColor = (type: string): string => {
    const colors: Record<string, string> = {
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
    return colors[type] || '#6b7280';
  };

  const getTypeLabel = (type: string): string => {
    const labels: Record<string, string> = {
      'text-input': 'Text input',
      'button-list': 'Button list',
      'dropdown': 'Dropdown',
      'message': 'Message',
      'get-user-details': 'Get User Details',
      'set-data': 'Set Data',
      'actions': 'Actions',
      'conditions': 'Conditions',
      'rest-api': 'Rest API',
    };
    return labels[type] || type;
  };

  const typeColor = getTypeColor(data.type);
  const typeLabel = getTypeLabel(data.type);

  return (
    <div className={`workflow-node ${selected ? 'selected' : ''}`} style={{ borderColor: selected ? typeColor : 'transparent' }}>
      <Handle type="target" position={Position.Left} className="node-handle" />
      
      <div className="node-header">
        <span className="node-type-badge" style={{ backgroundColor: typeColor }}>
          {typeLabel}
        </span>
        <div className="node-actions">
          <button 
            className="node-action-btn edit-btn" 
            title="Edit"
            onClick={(e) => {
              e.stopPropagation();
              data.onEdit?.(id);
            }}
          >
            ✏️
          </button>
          <button 
            className="node-action-btn delete-btn" 
            title="Delete"
            onClick={(e) => {
              e.stopPropagation();
              data.onDelete?.(id);
            }}
          >
            🗑️
          </button>
        </div>
      </div>

      <div className="node-content">
        <p className="node-prompt">{data.question_text}</p>
        
        {data.type === 'text-input' && (
          <p className="node-subtext">Awaits user input</p>
        )}

        {(data.type === 'button-list' || data.type === 'dropdown') && data.options && (
          <div className="node-options">
            {data.options.map((option) => (
              <div key={option.id} className="node-option-item">
                <span>{option.id} {option.text || 'Empty option'}</span>
                {option.warning && (
                  <span className="warning-icon" title="Warning">⚠️</span>
                )}
              </div>
            ))}
            {data.options.length === 0 && (
              <p className="node-subtext">No options configured. Click edit to add options.</p>
            )}
          </div>
        )}

        {data.type === 'get-user-details' && data.formFields && (
          <div className="node-form-fields">
            {data.formFields.map((field) => (
              <div key={field.id} className="node-form-field-item">
                <span className="field-label">{field.label || 'Unnamed field'}</span>
                <span className="field-type-badge">{field.type}</span>
                {field.required && (
                  <span className="required-badge" title="Required">*</span>
                )}
              </div>
            ))}
            {data.formFields.length === 0 && (
              <p className="node-subtext">No form fields configured. Click edit to add fields.</p>
            )}
          </div>
        )}
      </div>

      <Handle type="source" position={Position.Right} className="node-handle" />
    </div>
  );
}

