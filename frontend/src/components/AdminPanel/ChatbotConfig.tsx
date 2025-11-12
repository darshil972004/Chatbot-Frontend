import React, { useEffect, useMemo, useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  fetchSequenceGroupsWithItems,
  reorderSequenceItem,
  updateSequenceItemDetails,
  deleteSequenceItem,
  fetchSequenceGroupsOnly,
  createSequenceItem,
  type SequenceGroup,
  type SequenceGroupWithItems,
  type SequenceItem,
  type SequenceResponseType,
} from '../../api/Admin-Panel/sequenceApi';

interface GroupSummary {
  totalGroups: number;
  totalItems: number;
  responseTypeBreakdown: Record<SequenceResponseType, number>;
}

const responseBadges: Record<SequenceResponseType, string> = {
  Dropdown: 'badge badge--dropdown',
  Button: 'badge badge--button',
  Text: 'badge badge--text',
  Form: 'badge badge--form',
};

interface SortableRowProps {
  item: SequenceItem;
  onEdit: (item: SequenceItem) => void;
  onDelete: (item: SequenceItem) => void;
}

const SortableRow: React.FC<SortableRowProps> = ({ item, onEdit, onDelete }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id.toString() });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <tr
      ref={setNodeRef}
      style={style}
      className={isDragging ? 'sequence-row--dragging' : ''}
      {...attributes}
    >
      <td>
        <div className="sequence-table__sequenceId">
          <button className="drag-handle" {...listeners}>
            ⋮⋮
          </button>
          {item.itemSequencePosition}
        </div>
      </td>
      <td>{item.itemName}</td>
      <td>
        <span className={responseBadges[item.itemResponseType]}>{item.itemResponseType}</span>
      </td>
      <td>
        <div className="item-options">
          {item.options.length === 0 ? (
            <small>No predefined options</small>
          ) : (
            <>
              {item.options.slice(0, 3).map((option) => (
                <span key={option}>{option}</span>
              ))}
              {item.options.length > 3 && <small>+{item.options.length - 3} more</small>}
            </>
          )}
        </div>
      </td>
      <td>
        <div className="sequence-actions">
          <button
            type="button"
            className="action-button"
            onClick={() => onEdit(item)}
          >
            ✏️ Edit
          </button>
          <button
            type="button"
            className="action-button action-button--delete"
            onClick={() => onDelete(item)}
          >
            🗑️ Delete
          </button>
        </div>
      </td>
    </tr>
  );
};

const ChatbotConfig: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<SequenceGroupWithItems | null>(null);
  const [availableGroups, setAvailableGroups] = useState<SequenceGroup[]>([]);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<SequenceItem | null>(null);
  const [editingItem, setEditingItem] = useState<SequenceItem | null>(null);
  const [editingOptionIndex, setEditingOptionIndex] = useState<number | null>(null);
  const [editingOptionValue, setEditingOptionValue] = useState<string>('');
  const [editingNewOptionIndex, setEditingNewOptionIndex] = useState<number | null>(null);
  const [editingNewOptionValue, setEditingNewOptionValue] = useState<string>('');
  const [newItem, setNewItem] = useState<SequenceItem>({
    id: 0,
    sequenceGroupId: 0,
    itemName: '',
    itemSequencePosition: 1,
    itemResponseType: 'Text',
    options: [],
    requestParameter: '',
    formParameters: [],
    rawReqParameters: null,
    createdAt: '',
    updatedAt: '',
  });

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    if (!selectedGroup) return;

    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const activeId = parseInt(active.id as string);
    const overId = parseInt(over.id as string);

    const sourceIndex = selectedGroup.items.findIndex(item => item.id === activeId);
    const targetIndex = selectedGroup.items.findIndex(item => item.id === overId);

    if (sourceIndex === -1 || targetIndex === -1) return;

    const newItems = arrayMove(selectedGroup.items, sourceIndex, targetIndex);

    // Update positions
    const updatedItems = newItems.map((item, index) => ({
      ...item,
      itemSequencePosition: index + 1,
    }));

    setSelectedGroup({ ...selectedGroup, items: updatedItems });

    // Update editingItem position if it's being edited
    if (editingItem) {
      const updatedEditingItem = updatedItems.find(item => item.id === editingItem.id);
      if (updatedEditingItem) {
        setEditingItem(updatedEditingItem);
      }
    }

    try {
      await reorderSequenceItem({
        groupId: selectedGroup.id,
        oldPosition: sourceIndex + 1,
        newPosition: targetIndex + 1,
      });
    } catch (err) {
      // Revert on error
      setSelectedGroup(selectedGroup);
      // Also revert editingItem if it was updated
      if (editingItem) {
        const originalItem = selectedGroup.items.find(item => item.id === editingItem.id);
        if (originalItem) {
          setEditingItem(originalItem);
        }
      }
    }
  };

  const handleDelete = (item: SequenceItem) => {
    setSelectedItem(item);
    setDeleteModalOpen(true);
  };

  const handleEdit = (item: SequenceItem) => {
    setSelectedItem(item);
    setEditingItem({ ...item });
    setEditModalOpen(true);
  };

  const handleEditOption = (index: number, currentValue: string) => {
    setEditingOptionIndex(index);
    setEditingOptionValue(currentValue);
  };

  const handleSaveOption = () => {
    if (editingItem && editingOptionIndex !== null) {
      const newOptions = [...editingItem.options];
      newOptions[editingOptionIndex] = editingOptionValue;
      setEditingItem({ ...editingItem, options: newOptions });
    }
    setEditingOptionIndex(null);
    setEditingOptionValue('');
  };

  const handleCancelOptionEdit = () => {
    setEditingOptionIndex(null);
    setEditingOptionValue('');
  };

  const handleDeleteOption = (index: number) => {
    if (editingItem) {
      const newOptions = editingItem.options.filter((_, i) => i !== index);
      setEditingItem({ ...editingItem, options: newOptions });
    }
  };

  const handleEditNewOption = (index: number, currentValue: string) => {
    setEditingNewOptionIndex(index);
    setEditingNewOptionValue(currentValue);
  };

  const handleSaveNewOption = () => {
    if (editingNewOptionIndex !== null) {
      const newOptions = [...newItem.options];
      newOptions[editingNewOptionIndex] = editingNewOptionValue;
      setNewItem({ ...newItem, options: newOptions });
    }
    setEditingNewOptionIndex(null);
    setEditingNewOptionValue('');
  };

  const handleCancelNewOptionEdit = () => {
    setEditingNewOptionIndex(null);
    setEditingNewOptionValue('');
  };

  const handleDeleteNewOption = (index: number) => {
    const newOptions = newItem.options.filter((_, i) => i !== index);
    setNewItem({ ...newItem, options: newOptions });
  };

  const handleSaveEdit = async () => {
    if (!editingItem || !selectedItem) return;

    try {
      await updateSequenceItemDetails({
        itemId: editingItem.id,
        itemName: editingItem.itemName,
        itemSequencePosition: editingItem.itemSequencePosition,
        itemResponseType: editingItem.itemResponseType,
        options: editingItem.options,
        requestParameter: editingItem.requestParameter,
        formParameters: editingItem.formParameters,
      });

      setSelectedGroup(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          items: prev.items.map((item: SequenceItem) =>
            item.id === editingItem.id ? editingItem : item
          ),
        };
      });

      setEditModalOpen(false);
      setSelectedItem(null);
      setEditingItem(null);
    } catch (err) {
      // Handle error
    }
  };

  const handleConfirmDelete = async () => {
    if (!selectedItem) return;

    try {
      await deleteSequenceItem(selectedItem.id);

      setSelectedGroup(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          items: prev.items.filter((item: SequenceItem) => item.id !== selectedItem.id),
        };
      });

      setDeleteModalOpen(false);
      setSelectedItem(null);
    } catch (err) {
      // Handle error
    }
  };

  useEffect(() => {
    let isMounted = true;

    async function loadGroups() {
      setIsLoading(true);
      setError(null);

      try {
        const groups = await fetchSequenceGroupsOnly();
        if (isMounted) {
          setAvailableGroups(groups);
          if (groups.length > 0) {
            const selected = await fetchSequenceGroupsWithItems(groups[0].id);
            if (selected.length > 0) {
              setSelectedGroup(selected[0]);
            }
          }
        }
      } catch (err) {
        if (!isMounted) {
          return;
        }

        const message = err instanceof Error ? err.message : 'Unable to load groups.';
        setError(message);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadGroups();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleGroupChange = async (groupId: number) => {
    try {
      const selected = await fetchSequenceGroupsWithItems(groupId);
      if (selected.length > 0) {
        setSelectedGroup(selected[0]);
      }
    } catch (err) {
      setError('Unable to load selected group.');
    }
  };

  const handleAdd = () => {
    setNewItem({
      ...newItem,
      sequenceGroupId: selectedGroup?.id || 0,
      itemSequencePosition: (selectedGroup?.items.length || 0) + 1,
    });
    setAddModalOpen(true);
  };

  const handleSaveAdd = async () => {
    if (!selectedGroup || !newItem) return;

    try {
      await createSequenceItem({
        groupId: selectedGroup.id,
        itemName: newItem.itemName,
        itemSequencePosition: newItem.itemSequencePosition,
        itemResponseType: newItem.itemResponseType,
        options: newItem.options,
        requestParameter: newItem.requestParameter,
        formParameters: newItem.formParameters,
      });

      // Reload the group
      const updated = await fetchSequenceGroupsWithItems(selectedGroup.id);
      if (updated.length > 0) {
        setSelectedGroup(updated[0]);
      }

      setAddModalOpen(false);
      setNewItem({
        id: 0,
        sequenceGroupId: 0,
        itemName: '',
        itemSequencePosition: 1,
        itemResponseType: 'Text',
        options: [],
        requestParameter: '',
        formParameters: [],
        rawReqParameters: null,
        createdAt: '',
        updatedAt: '',
      });
    } catch (err) {
      // Handle error
    }
  };

  const summary = useMemo<GroupSummary>(() => {
    if (!selectedGroup) return { totalGroups: 0, totalItems: 0, responseTypeBreakdown: { Dropdown: 0, Button: 0, Text: 0, Form: 0 } };

    const breakdown: Record<SequenceResponseType, number> = {
      Dropdown: 0,
      Button: 0,
      Text: 0,
      Form: 0,
    };

    let totalItems = 0;

    selectedGroup.items.forEach((item) => {
      totalItems += 1;
      breakdown[item.itemResponseType] += 1;
    });

    return {
      totalGroups: 1,
      totalItems,
      responseTypeBreakdown: breakdown,
    };
  }, [selectedGroup]);

  return (
    <div className="config-view">
      <section className="group-selector-section">
        <div className="group-selector">
          <label htmlFor="group-select">Select Sequence Group:</label>
          <select
            id="group-select"
            value={selectedGroup?.id || ''}
            onChange={(e) => handleGroupChange(parseInt(e.target.value))}
            className="group-select"
          >
            {availableGroups.map((group) => (
              <option key={group.id} value={group.id}>
                {group.name}
              </option>
            ))}
          </select>
        </div>
      </section>

      {isLoading && <div className="empty-state">Loading chatbot sequences…</div>}
      {error && <div className="empty-state">{error}</div>}

      {!isLoading && !error && selectedGroup && (
        <section className="sequence-group">
          <div className="sequence-group__header">
            <div className="sequence-group__title">
              <h3>{selectedGroup.name}</h3>
              {selectedGroup.description && <p>{selectedGroup.description}</p>}
            </div>

            <div className="sequence-group__meta">
              <div className="sequence-group__dates">
                <div>
                  <span>Created</span>
                  <strong>{new Date(selectedGroup.createdAt).toLocaleString()}</strong>
                </div>
                <div>
                  <span>Last Updated</span>
                  <strong>{new Date(selectedGroup.updatedAt).toLocaleString()}</strong>
                </div>
                <div>
                  <span>Steps</span>
                  <strong>{selectedGroup.items.length}</strong>
                </div>
              </div>

              <div className="sequence-group__actions">
                <button type="button" className="btn btn-secondary" onClick={handleAdd}>
                  Add step
                </button>
              </div>
            </div>
          </div>

          <div className="sequence-table-wrapper">
            <table className="sequence-table">
              <thead>
                <tr>
                  <th style={{ width: '12%' }}>Position</th>
                  <th style={{ width: '30%' }}>Name</th>
                  <th style={{ width: '20%' }}>Type</th>
                  <th style={{ width: '38%' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={selectedGroup.items.map(item => item.id.toString())}
                    strategy={verticalListSortingStrategy}
                  >
                    {selectedGroup.items.map((item) => (
                      <SortableRow
                        key={item.id}
                        item={item}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                      />
                    ))}
                  </SortableContext>
                </DndContext>
              </tbody>
            </table>
          </div>
        </section>
      )}
      
      {/* Edit Modal */}
      {editModalOpen && editingItem && (
        <div className="admin-modal">
          <div className="admin-modal__card">
            <div className="admin-modal__header">
              <h3>Edit Items</h3>
              <button
                className="admin-modal__close"
                onClick={() => setEditModalOpen(false)}
              >
                ×
              </button>
            </div>
            <div className="admin-modal__body">
              <div className="admin-modal__section">
                <h4>Item Name</h4>
                <input
                  type="text"
                  className="modal-text-input"
                  value={editingItem.itemName}
                  onChange={(e) => setEditingItem({ ...editingItem, itemName: e.target.value })}
                />
              </div>
              
              <div className="admin-modal__section">
                <h4>ChatBot Response</h4>
                <div className="response-type-buttons">
                  {(['Text', 'Button', 'Dropdown', 'Form'] as SequenceResponseType[]).map((type) => (
                    <button
                      key={type}
                      type="button"
                      className={`response-type-button ${editingItem.itemResponseType === type ? 'response-type-button--active' : ''}`}
                      onClick={() => setEditingItem({ ...editingItem, itemResponseType: type })}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>
              
              {editingItem.itemResponseType !== 'Form' && (
                <div className="admin-modal__section">
                  <h4>Options</h4>
                  <div className="option-grid">
                    <button
                      type="button"
                      className="option-chip option-chip--add"
                      onClick={() => {
                        const newOptions = [...editingItem.options, ''];
                        setEditingItem({ ...editingItem, options: newOptions });
                      }}
                    >
                      +
                    </button>
                    {editingItem.options.map((option, index) => (
                      <div key={index} className="option-item">
                        {editingOptionIndex === index ? (
                          <div className="option-edit-input">
                            <input
                              type="text"
                              value={editingOptionValue}
                              onChange={(e) => setEditingOptionValue(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSaveOption();
                                if (e.key === 'Escape') handleCancelOptionEdit();
                              }}
                              autoFocus
                              className="option-edit-field"
                            />
                            <button
                              type="button"
                              onClick={handleSaveOption}
                              className="option-save-btn"
                            >
                              ✓
                            </button>
                            <button
                              type="button"
                              onClick={handleCancelOptionEdit}
                              className="option-cancel-btn"
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <div className="option-display">
                            <span className="option-text">{option || 'Empty option'}</span>
                            <div className="option-actions">
                              <button
                                type="button"
                                onClick={() => handleEditOption(index, option)}
                                className="option-edit-icon"
                                title="Edit option"
                              >
                                ✏️
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteOption(index)}
                                className="option-delete-icon"
                                title="Delete option"
                              >
                                🗑️
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="admin-modal__section">
                <h4>Request Parameters</h4>
                <input
                  type="text"
                  className="modal-text-input"
                  placeholder="Enter request parameter"
                  value={editingItem.requestParameter || ''}
                  onChange={(e) => setEditingItem({ ...editingItem, requestParameter: e.target.value })}
                />
              </div>
              
              {editingItem.itemResponseType === 'Form' && (
                <div className="admin-modal__section">
                  <h4>Form Parameters</h4>
                  <div className="form-parameters">
                    {editingItem.formParameters.map((param, index) => (
                      <div key={index} className="form-parameter-item">
                        <div className="form-parameter-header">
                          <input
                            type="text"
                            className="form-parameter-key-input"
                            placeholder="Parameter Key (e.g., name, location)"
                            value={param.key}
                            onChange={(e) => {
                              const newParams = [...editingItem.formParameters];
                              newParams[index].key = e.target.value;
                              setEditingItem({ ...editingItem, formParameters: newParams });
                            }}
                          />
                          <button
                            type="button"
                            className="form-parameter-remove-btn"
                            onClick={() => {
                              const newParams = editingItem.formParameters.filter((_, i) => i !== index);
                              setEditingItem({ ...editingItem, formParameters: newParams });
                            }}
                            title="Remove parameter"
                          >
                            ×
                          </button>
                        </div>
                        <div className="form-parameter-properties">
                          <h5>Properties:</h5>
                          {Object.entries(param.properties).map(([propKey, propValue]) => (
                            <div key={propKey} className="form-property-row">
                              <input
                                type="text"
                                className="form-property-key"
                                placeholder="Property key (e.g., optional)"
                                value={propKey}
                                onChange={(e) => {
                                  const newParams = [...editingItem.formParameters];
                                  const newProperties = { ...newParams[index].properties };
                                  delete newProperties[propKey];
                                  newProperties[e.target.value] = propValue;
                                  newParams[index].properties = newProperties;
                                  setEditingItem({ ...editingItem, formParameters: newParams });
                                }}
                              />
                              <input
                                type="text"
                                className="form-property-value"
                                placeholder="Property value (e.g., True)"
                                value={propValue}
                                onChange={(e) => {
                                  const newParams = [...editingItem.formParameters];
                                  newParams[index].properties = {
                                    ...newParams[index].properties,
                                    [propKey]: e.target.value,
                                  };
                                  setEditingItem({ ...editingItem, formParameters: newParams });
                                }}
                              />
                              <button
                                type="button"
                                className="form-property-remove"
                                onClick={() => {
                                  const newParams = [...editingItem.formParameters];
                                  const newProperties = { ...newParams[index].properties };
                                  delete newProperties[propKey];
                                  newParams[index].properties = newProperties;
                                  setEditingItem({ ...editingItem, formParameters: newParams });
                                }}
                                title="Remove property"
                              >
                                ×
                              </button>
                            </div>
                          ))}
                          <button
                            type="button"
                            className="btn btn-outline"
                            onClick={() => {
                              const newParams = [...editingItem.formParameters];
                              const currentProperties = newParams[index].properties;
                              const newPropKey = `property${Object.keys(currentProperties).length + 1}`;
                              newParams[index].properties = {
                                ...currentProperties,
                                [newPropKey]: '',
                              };
                              setEditingItem({ ...editingItem, formParameters: newParams });
                            }}
                          >
                            Add Property
                          </button>
                        </div>
                      </div>
                    ))}
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => {
                        const newParams = [...editingItem.formParameters, { key: '', properties: { 'optional': 'False' } }];
                        setEditingItem({ ...editingItem, formParameters: newParams });
                      }}
                    >
                      Add Form Parameter
                    </button>
                  </div>
                </div>
              )}
            </div>
            <div className="modal-actions">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setEditModalOpen(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleSaveEdit}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Delete Modal */}
      {deleteModalOpen && selectedItem && (
        <div className="admin-modal">
          <div className="admin-modal__card">
            <div className="admin-modal__header">
              <h3>Delete Sequence Item</h3>
              <button
                className="admin-modal__close"
                onClick={() => setDeleteModalOpen(false)}
              >
                ×
              </button>
            </div>
            <div className="admin-modal__body">
              <p className="delete-confirmation">
                Are you sure you want to delete the sequence item <strong>{selectedItem.itemName}</strong>? This action cannot be undone.
              </p>
            </div>
            <div className="modal-actions">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setDeleteModalOpen(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-danger"
                onClick={handleConfirmDelete}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Add Modal */}
      {addModalOpen && (
        <div className="admin-modal">
          <div className="admin-modal__card">
            <div className="admin-modal__header">
              <h3>Add Sequence Item</h3>
              <button
                className="admin-modal__close"
                onClick={() => setAddModalOpen(false)}
              >
                ×
              </button>
            </div>
            <div className="admin-modal__body">
              <div className="admin-modal__section">
                <h4>Item Name</h4>
                <input
                  type="text"
                  className="modal-text-input"
                  value={newItem.itemName}
                  onChange={(e) => setNewItem({ ...newItem, itemName: e.target.value })}
                />
              </div>
              
              <div className="admin-modal__section">
                <h4>ChatBot Response</h4>
                <div className="response-type-buttons">
                  {(['Text', 'Button', 'Dropdown', 'Form'] as SequenceResponseType[]).map((type) => (
                    <button
                      key={type}
                      type="button"
                      className={`response-type-button ${newItem.itemResponseType === type ? 'response-type-button--active' : ''}`}
                      onClick={() => setNewItem({ ...newItem, itemResponseType: type })}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>
              
              {newItem.itemResponseType !== 'Form' && (
                <div className="admin-modal__section">
                  <h4>Options</h4>
                  <div className="option-grid">
                    <button
                      type="button"
                      className="option-chip option-chip--add"
                      onClick={() => {
                        const newOptions = [...newItem.options, ''];
                        setNewItem({ ...newItem, options: newOptions });
                      }}
                    >
                      +
                    </button>
                    {newItem.options.map((option, index) => (
                      <div key={index} className="option-item">
                        {editingNewOptionIndex === index ? (
                          <div className="option-edit-input">
                            <input
                              type="text"
                              value={editingNewOptionValue}
                              onChange={(e) => setEditingNewOptionValue(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSaveNewOption();
                                if (e.key === 'Escape') handleCancelNewOptionEdit();
                              }}
                              autoFocus
                              className="option-edit-field"
                            />
                            <button
                              type="button"
                              onClick={handleSaveNewOption}
                              className="option-save-btn"
                            >
                              ✓
                            </button>
                            <button
                              type="button"
                              onClick={handleCancelNewOptionEdit}
                              className="option-cancel-btn"
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <div className="option-display">
                            <span className="option-text">{option || 'Empty option'}</span>
                            <div className="option-actions">
                              <button
                                type="button"
                                onClick={() => handleEditNewOption(index, option)}
                                className="option-edit-icon"
                                title="Edit option"
                              >
                                ✏️
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteNewOption(index)}
                                className="option-delete-icon"
                                title="Delete option"
                              >
                                🗑️
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="admin-modal__section">
                <h4>Request Parameters</h4>
                <input
                  type="text"
                  className="modal-text-input"
                  placeholder="Enter request parameter"
                  value={newItem.requestParameter || ''}
                  onChange={(e) => setNewItem({ ...newItem, requestParameter: e.target.value })}
                />
              </div>
              
              {newItem.itemResponseType === 'Form' && (
                <div className="admin-modal__section">
                  <h4>Form Parameters</h4>
                  <div className="form-parameters">
                    {newItem.formParameters.map((param, index) => (
                      <div key={index} className="form-parameter-item">
                        <div className="form-parameter-header">
                          <input
                            type="text"
                            className="form-parameter-key-input"
                            placeholder="Parameter Key (e.g., name, location)"
                            value={param.key}
                            onChange={(e) => {
                              const newParams = [...newItem.formParameters];
                              newParams[index].key = e.target.value;
                              setNewItem({ ...newItem, formParameters: newParams });
                            }}
                          />
                          <button
                            type="button"
                            className="form-parameter-remove-btn"
                            onClick={() => {
                              const newParams = newItem.formParameters.filter((_, i) => i !== index);
                              setNewItem({ ...newItem, formParameters: newParams });
                            }}
                            title="Remove parameter"
                          >
                            ×
                          </button>
                        </div>
                        <div className="form-parameter-properties">
                          <h5>Properties:</h5>
                          {Object.entries(param.properties).map(([propKey, propValue]) => (
                            <div key={propKey} className="form-property-row">
                              <input
                                type="text"
                                className="form-property-key"
                                placeholder="Property key (e.g., optional)"
                                value={propKey}
                                onChange={(e) => {
                                  const newParams = [...newItem.formParameters];
                                  const newProperties = { ...newParams[index].properties };
                                  delete newProperties[propKey];
                                  newProperties[e.target.value] = propValue;
                                  newParams[index].properties = newProperties;
                                  setNewItem({ ...newItem, formParameters: newParams });
                                }}
                              />
                              <input
                                type="text"
                                className="form-property-value"
                                placeholder="Property value (e.g., True)"
                                value={propValue}
                                onChange={(e) => {
                                  const newParams = [...newItem.formParameters];
                                  newParams[index].properties = {
                                    ...newParams[index].properties,
                                    [propKey]: e.target.value,
                                  };
                                  setNewItem({ ...newItem, formParameters: newParams });
                                }}
                              />
                              <button
                                type="button"
                                className="form-property-remove"
                                onClick={() => {
                                  const newParams = [...newItem.formParameters];
                                  const newProperties = { ...newParams[index].properties };
                                  delete newProperties[propKey];
                                  newParams[index].properties = newProperties;
                                  setNewItem({ ...newItem, formParameters: newParams });
                                }}
                                title="Remove property"
                              >
                                ×
                              </button>
                            </div>
                          ))}
                          <button
                            type="button"
                            className="btn btn-outline"
                            onClick={() => {
                              const newParams = [...newItem.formParameters];
                              const currentProperties = newParams[index].properties;
                              const newPropKey = `property${Object.keys(currentProperties).length + 1}`;
                              newParams[index].properties = {
                                ...currentProperties,
                                [newPropKey]: '',
                              };
                              setNewItem({ ...newItem, formParameters: newParams });
                            }}
                          >
                            Add Property
                          </button>
                        </div>
                      </div>
                    ))}
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => {
                        const newParams = [...newItem.formParameters, { key: '', properties: { 'optional': 'False' } }];
                        setNewItem({ ...newItem, formParameters: newParams });
                      }}
                    >
                      Add Form Parameter
                    </button>
                  </div>
                </div>
              )}
            </div>
            <div className="modal-actions">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setAddModalOpen(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleSaveAdd}
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatbotConfig;