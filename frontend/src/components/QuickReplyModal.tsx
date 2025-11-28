import React, { useState, useEffect } from 'react';
import { AgentQuickReply } from '../api/agent';

interface QuickReplyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (reply: Partial<AgentQuickReply>) => void;
  editingReply?: AgentQuickReply | null;
}

interface FormField {
  id: number;
  label: string;
  type: string;
  required: boolean;
}

const QuickReplyModal: React.FC<QuickReplyModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingReply
}) => {
  const [category, setCategory] = useState<string>('Greeting');
  const [text, setText] = useState<string>('');
  const [formFields, setFormFields] = useState<FormField[]>([]);

  useEffect(() => {
    if (editingReply) {
      console.log('Editing reply data:', editingReply);
      setCategory(editingReply.category || 'Greeting');
      setText(editingReply.template_text || '');
      
      // Try to extract form fields from different possible structures
      let existingFields: any[] = [];
      
      if ((editingReply as any).form_schema?.fields) {
        console.log('Found form_schema.fields:', (editingReply as any).form_schema.fields);
        existingFields = (editingReply as any).form_schema.fields;
      } else if ((editingReply as any).formFields) {
        console.log('Found formFields:', (editingReply as any).formFields);
        existingFields = (editingReply as any).formFields;
      } else if (typeof (editingReply as any).form_schema === 'string') {
        try {
          const parsed = JSON.parse((editingReply as any).form_schema);
          console.log('Parsed form_schema string:', parsed);
          existingFields = parsed.fields || [];
        } catch (e) {
          console.error('Failed to parse form_schema string:', e);
        }
      }
      
      const mappedFields = Array.isArray(existingFields)
        ? existingFields.map((f: any, idx: number) => ({
            id: Date.now() + idx, // Use unique IDs
            label: f.label || '',
            type: f.type || 'text',
            required: Boolean(f.required),
          }))
        : [];
        
      console.log('Mapped fields:', mappedFields);
      setFormFields(mappedFields);
    } else {
      console.log('No editing reply, resetting form');
      setCategory('');
      setText('');
      setFormFields([]);
    }
  }, [editingReply]);

  // Additional reset when modal opens for adding
  useEffect(() => {
    if (isOpen && !editingReply) {
      // Ensure clean state when opening add modal
      setCategory('Greeting');
      setText('');
      setFormFields([]);
    }
  }, [isOpen, editingReply]);

  const addFormField = () => {
    const newField: FormField = {
      id: Date.now(),
      label: '',
      type: 'text',
      required: false
    };
    setFormFields([...formFields, newField]);
  };

  const updateFormField = (id: number, updates: Partial<FormField>) => {
    setFormFields(formFields.map(field => 
      field.id === id ? { ...field, ...updates } : field
    ));
  };

  const removeFormField = (id: number) => {
    setFormFields(formFields.filter(field => field.id !== id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!text.trim()) {
      return;
    }

    let formSchema: any | undefined;
    if (category === 'Form') {
      const validFields = formFields.filter(f => f.label.trim());
      if (validFields.length === 0) {
        return;
      }
      formSchema = {
        fields: validFields.map(f => ({
          label: f.label.trim(),
          type: f.type || 'text',
          required: f.required,
        })),
      };
    }

    let saveCategory = category && category !== 'Select Category' ? category.trim() : 'Greeting';
    onSave({
      category: saveCategory,
      template_text: text.trim(),
      form_schema: formSchema,
    });
  };

  if (!isOpen) return null;

  return (
    <div className="quick-reply-modal-overlay">
      <div className="quick-reply-modal">
        <div className="quick-reply-modal-header">
          <h3 className="quick-reply-modal-title">
            {editingReply ? 'Edit Quick Reply' : 'Add Quick Reply'}
          </h3>
          <button 
            className="quick-reply-modal-close"
            onClick={onClose}
            aria-label="Close modal"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="quick-reply-form">
          <div className="quick-reply-form-group">
            <label className="quick-reply-label">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="quick-reply-select"
            >
              <option value="Greeting">Greeting</option>
              <option value="Form">Form</option>
              <option value="Closing">Closing</option>
              <option value="Information">Information</option>
            </select>
          </div>

          <div className="quick-reply-form-group">
            <label className="quick-reply-label">
              Message Text
            </label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="quick-reply-textarea"
              placeholder="Enter your quick reply message..."
              required
            />
          </div>

          {category === 'Form' && (
            <div className="quick-reply-form-builder">
              <div className="quick-reply-form-builder-header">
                <span>Form Fields</span>
                <button
                  type="button"
                  onClick={addFormField}
                  className="quick-reply-add-field-btn"
                >
                  + Add Field
                </button>
              </div>
              
              <div className="quick-reply-form-fields">
                {formFields.map((field) => (
                  <div key={field.id} className="quick-reply-form-field">
                    <div className="quick-reply-field-inputs">
                      <input
                        type="text"
                        value={field.label}
                        onChange={(e) => updateFormField(field.id, { label: e.target.value })}
                        placeholder="Field label (e.g., Name, Email)"
                        className="quick-reply-field-input"
                      />
                      <select
                        value={field.type}
                        onChange={(e) => updateFormField(field.id, { type: e.target.value })}
                        className="quick-reply-field-select"
                      >
                        <option value="text">Text</option>
                        <option value="email">Email</option>
                        <option value="number">Number</option>
                        <option value="textarea">Textarea</option>
                      </select>
                      <label className="quick-reply-field-checkbox">
                        <input
                          type="checkbox"
                          checked={field.required}
                          onChange={(e) => updateFormField(field.id, { required: e.target.checked })}
                        />
                        <span>Required</span>
                      </label>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFormField(field.id)}
                      className="quick-reply-remove-field-btn"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="18" y1="6" x2="6" y2="18"/>
                        <line x1="6" y1="6" x2="18" y2="18"/>
                      </svg>
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="quick-reply-modal-actions">
            <button
              type="button"
              onClick={onClose}
              className="quick-reply-btn quick-reply-btn-cancel"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="quick-reply-btn quick-reply-btn-submit"
            >
              {editingReply ? 'Update' : 'Add'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default QuickReplyModal;
