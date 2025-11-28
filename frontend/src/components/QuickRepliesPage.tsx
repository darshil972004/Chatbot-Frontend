import { useState, useEffect, useCallback, useMemo } from 'react';
import { apiClient } from '../api/adminApi';
import QuickReplyModal from './QuickReplyModal';

// QuickRepliesPage Component
function QuickRepliesPage() {
  const [quickReplyTemplates, setQuickReplyTemplates] = useState<any[]>([]);
  const [quickReplyModalOpen, setQuickReplyModalOpen] = useState(false);
  const [editingQuickReply, setEditingQuickReply] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  // Hardcoded agent ID for admin
  const ADMIN_AGENT_ID = 1;

  // Derived state for filtering and stats
  const categories = useMemo(() => {
    const uniqueCategories = [...new Set(quickReplyTemplates.map(template => template.category).filter(Boolean))];
    return uniqueCategories.sort();
  }, [quickReplyTemplates]);

  const formRepliesCount = useMemo(() => {
    return quickReplyTemplates.filter(template => template.form_schema).length;
  }, [quickReplyTemplates]);

  const filteredQuickReplies = useMemo(() => {
    return quickReplyTemplates.filter(template => {
      const matchesSearch = searchTerm === '' || 
        template.template_text?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        template.category?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesCategory = selectedCategory === '' || template.category === selectedCategory;
      
      return matchesSearch && matchesCategory;
    });
  }, [quickReplyTemplates, searchTerm, selectedCategory]);

  // Load quick replies for admin (agent ID = 0)
  const loadQuickReplies = useCallback(async () => {
    try {
      const response = await apiClient.get(`/agents/${ADMIN_AGENT_ID}/quick-replies`);
      if (response.data?.success) {
        setQuickReplyTemplates(response.data.data || []);
      }
    } catch (error) {
      console.error('Error loading quick replies:', error);
      setQuickReplyTemplates([]);
    }
  }, []);

  useEffect(() => {
    loadQuickReplies();
  }, [loadQuickReplies]);

  const openAddQuickReplyModal = useCallback(() => {
    setEditingQuickReply(null);
    setQuickReplyModalOpen(true);
  }, []);

  const openEditQuickReplyModal = useCallback((reply: any) => {
    setEditingQuickReply(reply);
    setQuickReplyModalOpen(true);
  }, []);

  const closeQuickReplyModal = useCallback(() => {
    setQuickReplyModalOpen(false);
    setEditingQuickReply(null);
  }, []);

  const handleQuickReplySave = useCallback(async (replyData: any) => {
    try {
      if (editingQuickReply) {
        // Update existing reply
        await apiClient.put(`/agents/${ADMIN_AGENT_ID}/quick-replies/${editingQuickReply.id}`, replyData);
      } else {
        // Create new reply
        await apiClient.post(`/agents/${ADMIN_AGENT_ID}/quick-replies`, replyData);
      }
      
      await loadQuickReplies(); // Reload the list
      closeQuickReplyModal();
    } catch (error) {
      console.error('Error saving quick reply:', error);
      alert('Error saving quick reply. Please try again.');
    }
  }, [editingQuickReply, loadQuickReplies, closeQuickReplyModal]);

  const handleDeleteQuickReply = useCallback(async (replyId: number) => {
    if (!confirm('Are you sure you want to delete this quick reply?')) {
      return;
    }

    try {
      await apiClient.delete(`/agents/${ADMIN_AGENT_ID}/quick-replies/${replyId}`);
      await loadQuickReplies(); // Reload the list
    } catch (error) {
      console.error('Error deleting quick reply:', error);
      alert('Error deleting quick reply. Please try again.');
    }
  }, [loadQuickReplies]);

  return (
    <div className="admin-agents-page">
      <div className="admin-page-header">
        <div className="admin-page-title-section">
          <h2 className="admin-page-title">Quick Replies</h2>
          <p className="admin-page-subtitle">Manage quick reply templates for agents</p>
        </div>
        <button 
          onClick={openAddQuickReplyModal}
          className="admin-button admin-button-primary admin-button-small"
          style={{ minWidth: '80px', width: 'auto' }}
        >
          <span className="admin-button-icon">+</span>
          Add Reply
        </button>
      </div>

      <div className="admin-quick-replies-container admin-tab-card">
        <div className="admin-quick-replies-grid">
          {filteredQuickReplies.length === 0 ? (
            <div className="admin-empty-state">
              <div className="admin-empty-state-icon">💬</div>
              <div className="admin-empty-state-title">
                {quickReplyTemplates.length === 0 ? 'No Quick Replies Yet' : 'No Matching Replies'}
              </div>
              <div className="admin-empty-state-description">
                {quickReplyTemplates.length === 0 
                  ? 'Create your first quick reply template to help agents respond faster.'
                  : 'Try adjusting your search terms or filters.'
                }
              </div>
              {quickReplyTemplates.length === 0 && (
                <button 
                  onClick={openAddQuickReplyModal}
                  className="admin-button admin-button-primary admin-button-small"
                >
                  <span className="admin-button-icon">+</span>
                  Create First Reply
                </button>
              )}
            </div>
          ) : (
            filteredQuickReplies.map((template) => (
              <div key={template.id} className="admin-quick-reply-card">
                <div className="admin-quick-reply-header">
                  <div className="admin-quick-reply-category-section">
                    <span className="admin-quick-reply-category">{template.category}</span>
                  </div>
                  <div className="admin-quick-reply-actions">
                    <button 
                      onClick={() => openEditQuickReplyModal(template)}
                      className="admin-button admin-button-secondary admin-button-small"
                      title="Edit quick reply"
                    >
                      Edit
                    </button>
                    <button 
                      onClick={() => handleDeleteQuickReply(template.id)}
                      className="admin-button admin-button-danger admin-button-small"
                      title="Delete quick reply"
                    >
                      Delete
                    </button>
                  </div>
                </div>
                <div className="admin-quick-reply-content">
                  <div className="admin-quick-reply-text">
                    {template.template_text}
                  </div>
                  {template.form_schema && (
                    <div className="admin-quick-reply-form-details">
                      <div className="admin-form-info">
                        <span className="admin-form-icon">📝</span>
                        <span className="admin-form-text">
                          {template.form_schema.fields?.length || 0} form fields
                        </span>
                      </div>
                      {template.form_schema.fields && (
                        <div className="admin-form-fields-preview">
                          {template.form_schema.fields.slice(0, 3).map((field: any, idx: number) => (
                            <span key={idx} className="admin-form-field-tag">
                              {field.name || field.label || `Field ${idx + 1}`}
                            </span>
                          ))}
                          {template.form_schema.fields.length > 3 && (
                            <span className="admin-form-field-more">
                              +{template.form_schema.fields.length - 3} more
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <div className="admin-quick-reply-footer">
                  <div className="admin-quick-reply-meta">
                    <span className="admin-meta-item">
                      <span className="admin-meta-icon">📅</span>
                      {template.created_at ? new Date(template.created_at).toLocaleDateString() : 'Unknown'}
                    </span>
                    {template.updated_at && template.updated_at !== template.created_at && (
                      <span className="admin-meta-item">
                        <span className="admin-meta-icon">🔄</span>
                        {new Date(template.updated_at).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <QuickReplyModal
        isOpen={quickReplyModalOpen}
        onClose={closeQuickReplyModal}
        onSave={handleQuickReplySave}
        editingReply={editingQuickReply}
      />
    </div>
  );
}

export default QuickRepliesPage;
