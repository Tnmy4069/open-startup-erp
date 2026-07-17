'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { Preloader } from './Preloader';
import {
  ListTodo,
  Plus,
  X,
  Search,
  Calendar,
  User,
  CheckSquare,
  AlertTriangle,
  CornerDownRight,
  MessageSquare,
  Paperclip,
  CheckCircle,
  Tag,
  Clock,
  ArrowRight,
  ArrowLeft,
  Edit2,
  Trash2
} from 'lucide-react';

interface Member {
  id: string;
  name: string;
}

interface TaskComment {
  id: string;
  author: string;
  text: string;
  createdAt: string;
}

interface TaskChecklistItem {
  id: string;
  title: string;
  isCompleted: boolean;
}

interface TaskActivity {
  id: string;
  user: string;
  change: string;
  createdAt: string;
}

interface Task {
  id: string;
  title: string;
  description: string | null;
  priority: string;
  status: string;
  dueDate: string | null;
  assigneeIds: string[];
  assignees: Member[];
  reporterId: string | null;
  reporter: Member | null;
  labels: string[];
  attachments: string[];
  isRecurring: boolean;
  recurringPattern: string | null;
  createdAt: string;
}

interface TaskDetail extends Task {
  comments: TaskComment[];
  checklist: TaskChecklistItem[];
  activity: TaskActivity[];
}

const COLUMNS = ['Backlog', 'Todo', 'In Progress', 'Review', 'Completed'];

const PRIORITY_COLORS: Record<string, string> = {
  'Low':    'bg-bg-elevated border-border-normal text-text-muted',
  'Medium': 'bg-blue-500/10 border-blue-500/20 text-blue-400',
  'High':   'bg-cyber-warning/10 border-cyber-warning/20 text-cyber-warning',
  'Urgent': 'bg-cyber-danger/10 border-cyber-danger/20 text-cyber-danger',
};

export function TasksPanel() {
  const { role, refreshTrigger, triggerNotification, user: sessionUser } = useApp();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'board' | 'list'>('board');

  // Filters
  const [search, setSearch] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [assigneeFilter, setAssigneeFilter] = useState('');

  // Selected Detail
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [detail, setDetail] = useState<TaskDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Members list (for dropdowns)
  const [members, setMembers] = useState<Member[]>([]);

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);

  // Form States
  const [formTitle, setFormTitle] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formPriority, setFormPriority] = useState('Medium');
  const [formStatus, setFormStatus] = useState('Todo');
  const [formDueDate, setFormDueDate] = useState('');
  const [formAssigneeIds, setFormAssigneeIds] = useState<string[]>([]);
  const [formLabels, setFormLabels] = useState('');
  const [formIsRecurring, setFormIsRecurring] = useState(false);
  const [formRecurringPattern, setFormRecurringPattern] = useState('Weekly');

  // Comment & Checklist Item creation states
  const [commentText, setCommentText] = useState('');
  const [checklistItemTitle, setChecklistItemTitle] = useState('');

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        search,
        priority: priorityFilter,
        assigneeId: assigneeFilter,
      });
      const res = await fetch(`/api/tasks?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setTasks(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchTaskDetail = async (id: string) => {
    try {
      setLoadingDetail(true);
      const res = await fetch(`/api/tasks/${id}`);
      if (res.ok) {
        const data = await res.json();
        setDetail(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingDetail(false);
    }
  };

  const fetchMembers = async () => {
    try {
      const res = await fetch('/api/members?limit=100');
      if (res.ok) {
        const data = await res.json();
        setMembers(data.members || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [search, priorityFilter, assigneeFilter, refreshTrigger]);

  useEffect(() => {
    if (selectedTaskId) {
      fetchTaskDetail(selectedTaskId);
    } else {
      setDetail(null);
    }
  }, [selectedTaskId, refreshTrigger]);

  useEffect(() => {
    fetchMembers();
  }, []);

  const handleOpenAdd = (columnName?: string) => {
    setEditingTaskId(null);
    setFormTitle('');
    setFormDesc('');
    setFormPriority('Medium');
    setFormStatus(columnName || 'Todo');
    setFormDueDate('');
    setFormAssigneeIds([]);
    setFormLabels('');
    setFormIsRecurring(false);
    setFormRecurringPattern('Weekly');
    setShowAddModal(true);
  };

  const handleOpenEdit = (task: TaskDetail) => {
    setEditingTaskId(task.id);
    setFormTitle(task.title);
    setFormDesc(task.description || '');
    setFormPriority(task.priority);
    setFormStatus(task.status);
    setFormDueDate(task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '');
    setFormAssigneeIds(task.assignees.map(a => a.id));
    setFormLabels(task.labels.join(', '));
    setFormIsRecurring(task.isRecurring);
    setFormRecurringPattern(task.recurringPattern || 'Weekly');
    setShowAddModal(true);
  };

  const handleSubmitTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      const isEdit = !!editingTaskId;
      const url = isEdit ? `/api/tasks/${editingTaskId}` : '/api/tasks';
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formTitle,
          description: formDesc,
          priority: formPriority,
          status: formStatus,
          dueDate: formDueDate || null,
          assigneeIds: formAssigneeIds,
          labels: formLabels.split(',').map((l) => l.trim()).filter(Boolean),
          isRecurring: formIsRecurring,
          recurringPattern: formIsRecurring ? formRecurringPattern : null,
        }),
      });

      if (res.ok) {
        setShowAddModal(false);
        triggerNotification(isEdit ? `Updated task: ${formTitle}` : `Created task: ${formTitle}`, isEdit ? 'Updated' : 'Created');
        fetchTasks();
        if (isEdit && selectedTaskId === editingTaskId) {
          fetchTaskDetail(editingTaskId);
        }
      } else {
        const err = await res.json();
        alert(err.error || (isEdit ? 'Failed to update task' : 'Failed to create task'));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMoveStatus = async (task: Task, nextStatus: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const res = await fetch(`/api/tasks/${task.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      });

      if (res.ok) {
        triggerNotification(`Moved task to ${nextStatus}`, 'Updated');
        fetchTasks();
        if (selectedTaskId === task.id) {
          fetchTaskDetail(task.id);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText || !detail) return;

    try {
      const res = await fetch(`/api/tasks/${detail.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: commentText }),
      });

      if (res.ok) {
        setCommentText('');
        fetchTaskDetail(detail.id);
        triggerNotification('Added comment', 'Updated');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddChecklist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!checklistItemTitle || !detail) return;

    try {
      const res = await fetch(`/api/tasks/${detail.id}/checklist`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: checklistItemTitle }),
      });

      if (res.ok) {
        setChecklistItemTitle('');
        fetchTaskDetail(detail.id);
        triggerNotification('Added checklist item', 'Updated');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleChecklist = async (itemId: string) => {
    if (!detail) return;

    try {
      const res = await fetch(`/api/tasks/${detail.id}/checklist`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId }),
      });

      if (res.ok) {
        fetchTaskDetail(detail.id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteTask = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to delete task "${title}"?`)) return;

    try {
      const res = await fetch(`/api/tasks/${id}`, { method: 'DELETE' });
      if (res.ok) {
        triggerNotification(`Deleted task: ${title}`, 'Deleted');
        setSelectedTaskId(null);
        fetchTasks();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-text-heading font-display tracking-wide">{"// Sprint Kanban Task Board"}</h2>
          <p className="text-[10px] text-text-muted font-mono mt-0.5 font-semibold">Organize operational tasks, coding assignments, sponsorship outreach and marketing goals</p>
        </div>

        <div className="flex items-center gap-3">
          {role !== 'Read Only' && (
            <button
              onClick={() => handleOpenAdd()}
              className="flex items-center gap-2 h-10 px-4 rounded-lg bg-primary hover:bg-opacity-95 text-black font-semibold text-xs font-sans transition-all duration-150 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Create Task</span>
            </button>
          )}
        </div>
      </div>

      {/* FILTERS CONTROLS */}
      <div className="bg-bg-surface border border-border-normal rounded-xl p-4 flex flex-col md:flex-row md:items-center gap-3.5">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input
            type="text"
            placeholder="Search tasks by title, labels or details..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-10 pl-9 pr-4 bg-bg-primary border border-border-normal rounded-lg text-xs text-text-heading focus:outline-none focus:border-primary placeholder-text-muted"
          />
        </div>

        <div className="grid grid-cols-2 gap-2 md:w-80 shrink-0 text-xs">
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="h-10 px-2 bg-bg-primary border border-border-normal rounded-lg text-text-heading focus:outline-none focus:border-primary font-mono text-[11px]"
          >
            <option value="">All Priorities</option>
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
            <option value="Urgent">Urgent</option>
          </select>

          <select
            value={assigneeFilter}
            onChange={(e) => setAssigneeFilter(e.target.value)}
            className="h-10 px-2 bg-bg-primary border border-border-normal rounded-lg text-text-heading focus:outline-none focus:border-primary font-mono text-[11px]"
          >
            <option value="">All Assignees</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>
          
          <button
            onClick={() => {
              const myId = members.find(m => m.name.toLowerCase() === sessionUser?.username.toLowerCase())?.id;
              if (myId) {
                setAssigneeFilter(assigneeFilter === myId ? '' : myId);
              } else {
                triggerNotification('Could not find your member profile.', 'Error');
              }
            }}
            className={`h-10 px-2 border rounded-lg text-[11px] font-mono font-semibold transition-colors ${assigneeFilter === members.find(m => m.name.toLowerCase() === sessionUser?.username.toLowerCase())?.id ? 'bg-primary/20 text-primary border-primary' : 'bg-bg-primary border-border-normal text-text-muted hover:text-text-heading'}`}
          >
            My Tasks
          </button>
        </div>
      </div>

      {/* BOARD LAYOUT CONTENT */}
      <div className="flex flex-col lg:flex-row gap-6">
        
        {/* KANBAN BOARD COLUMNS */}
        <div className="flex-1 overflow-x-auto pb-4 snap-x snap-mandatory">
          <div className="flex gap-4 sm:gap-5 w-max min-w-full h-[600px] items-stretch px-2 sm:px-0">
            {COLUMNS.map((colName) => {
              const colTasks = tasks.filter((t) => t.status === colName);
              return (
                <div key={colName} className="w-[85vw] sm:w-auto sm:flex-1 shrink-0 snap-center bg-bg-surface/30 border border-border-normal/60 rounded-xl p-4 flex flex-col justify-between select-none">
                  
                  {/* Column Title */}
                  <div className="flex items-center justify-between border-b border-border-normal/40 pb-3 mb-4">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-primary" />
                      <h3 className="font-display font-bold text-text-heading text-xs uppercase tracking-wider">{colName}</h3>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-bg-elevated border border-border-normal text-[9px] font-mono font-semibold text-text-muted">
                      {colTasks.length}
                    </span>
                  </div>

                  {/* Tasks Container */}
                  <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                    {colTasks.map((t) => (
                      <div
                        key={t.id}
                        onClick={() => setSelectedTaskId(t.id)}
                        className={`bg-bg-surface border rounded-xl p-4 hover:border-primary transition-all duration-150 cursor-pointer relative group space-y-3.5 ${
                          selectedTaskId === t.id ? 'border-primary shadow-sm bg-primary/2' : 'border-border-normal'
                        }`}
                      >
                        
                        {/* Title & Priority */}
                        <div className="space-y-1">
                          <div className="flex justify-between items-start gap-2">
                            <h4 className="font-display font-bold text-text-heading text-xs leading-snug truncate max-w-44">
                              {t.title}
                            </h4>
                            <span className={`px-1.5 py-0.5 rounded border text-[8px] font-mono font-bold ${PRIORITY_COLORS[t.priority]}`}>
                              {t.priority.toUpperCase()}
                            </span>
                          </div>
                          {t.description && (
                            <p className="text-[10px] text-text-muted line-clamp-2 leading-relaxed">{t.description}</p>
                          )}
                        </div>

                        {/* Labels & Tags */}
                        {t.labels.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {t.labels.slice(0, 2).map((l, i) => (
                              <span key={i} className="px-1.5 py-0.5 rounded bg-bg-elevated border border-border-normal text-[8px] text-text-muted font-mono">
                                {l}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Card Footer / Assignee / Due Date */}
                        <div className="flex items-center justify-between border-t border-border-normal/40 pt-3.5 text-[9px] font-mono">
                          
                          {/* Due Date & Checklist */}
                          <div className="flex items-center gap-3 shrink-0">
                            <div className={`flex items-center gap-1 ${
                              t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'Completed' ? 'text-cyber-danger font-bold' : 
                              t.dueDate && new Date(t.dueDate) < new Date(Date.now() + 172800000) && t.status !== 'Completed' ? 'text-cyber-warning font-bold' : 
                              'text-text-muted'
                            }`}>
                              <Calendar className="w-3 h-3" />
                              <span>{t.dueDate ? new Date(t.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'No Due'}</span>
                            </div>
                            
                            {/* We don't have checklist count in summary tasks list currently, unless we add it to the API response. */}
                          </div>

                          {/* Assignees Avatars */}
                          <div className="flex items-center gap-1 min-w-0">
                            {t.assignees && t.assignees.length > 0 ? (
                              <div className="flex -space-x-1.5">
                                {t.assignees.slice(0, 3).map((a, i) => (
                                  <div key={a.id} title={a.name} className="w-5 h-5 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-[9px] text-primary font-bold z-10">
                                    {a.name.charAt(0).toUpperCase()}
                                  </div>
                                ))}
                                {t.assignees.length > 3 && (
                                  <div className="w-5 h-5 rounded-full bg-bg-elevated border border-border-normal flex items-center justify-center text-[8px] text-text-muted z-0">
                                    +{t.assignees.length - 3}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span className="text-text-muted text-[10px]">Unassigned</span>
                            )}
                          </div>
                        </div>

                        {/* Column Transition arrows (Accessible status changes for Mobile) */}
                        {role !== 'Read Only' && (
                          <div className="absolute right-2 top-2 sm:opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 bg-bg-surface p-1 rounded-lg border border-border-normal shadow-sm">
                            {colName !== 'Backlog' && (
                              <button
                                onClick={(e) => {
                                  const idx = COLUMNS.indexOf(colName);
                                  handleMoveStatus(t, COLUMNS[idx - 1], e);
                                }}
                                className="p-1 text-text-muted hover:text-text-heading"
                                title="Move Left"
                              >
                                <ArrowLeft className="w-3 h-3" />
                              </button>
                            )}
                            {colName !== 'Completed' && (
                              <button
                                onClick={(e) => {
                                  const idx = COLUMNS.indexOf(colName);
                                  handleMoveStatus(t, COLUMNS[idx + 1], e);
                                }}
                                className="p-1 text-text-muted hover:text-text-heading"
                                title="Move Right"
                              >
                                <ArrowRight className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        )}

                      </div>
                    ))}
                  </div>

                  {/* Add task shortcut button */}
                  {role !== 'Read Only' && (
                    <button
                      onClick={() => handleOpenAdd(colName)}
                      className="mt-3 w-full h-8 flex items-center justify-center gap-1.5 border border-dashed border-border-normal hover:border-primary text-[10px] font-mono text-text-muted hover:text-text-heading rounded-lg transition-colors cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                      <span>NEW TASK</span>
                    </button>
                  )}

                </div>
              );
            })}
          </div>
        </div>

        {/* TASK DETAILS VIEW SIDEBAR */}
        {selectedTaskId && (
          <div className="w-full lg:w-96 bg-bg-surface border border-border-normal rounded-xl p-6 flex flex-col justify-between min-h-[400px] shrink-0 animate-in fade-in slide-in-from-right-4 duration-200">
            {loadingDetail ? (
              <div className="py-20 flex items-center justify-center">
                <Preloader message="Fetching task coordinates..." size="sm" />
              </div>
            ) : detail ? (
              <div className="space-y-6">
                
                {/* Header */}
                <div className="flex items-start justify-between border-b border-border-normal/40 pb-3">
                  <div className="min-w-0">
                    <h3 className="font-display font-bold text-text-heading text-base leading-snug">{detail.title}</h3>
                    <div className="flex gap-2 items-center mt-2 text-[10px] font-mono">
                      <span className={`px-2 py-0.5 rounded border ${PRIORITY_COLORS[detail.priority]}`}>
                        {detail.priority.toUpperCase()}
                      </span>
                      <span className="text-text-muted uppercase px-2 py-0.5 rounded bg-bg-elevated border border-border-normal">
                        {detail.status}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-1 shrink-0">
                    {role !== 'Read Only' && (
                      <>
                        <button
                          onClick={() => handleOpenEdit(detail)}
                          className="p-1.5 text-text-muted hover:text-primary hover:bg-primary/10 rounded transition-colors"
                          title="Edit Task"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteTask(detail.id, detail.title)}
                          className="p-1.5 text-text-muted hover:text-cyber-danger hover:bg-cyber-danger/10 rounded transition-colors"
                          title="Delete Task"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                    <button onClick={() => setSelectedTaskId(null)} className="p-1 text-text-muted hover:text-text-heading rounded">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Description */}
                {detail.description && (
                  <p className="text-xs text-text-body leading-relaxed font-sans bg-bg-primary p-3 rounded-lg border border-border-normal/40">
                    {detail.description}
                  </p>
                )}

                {/* Properties details */}
                <div className="bg-bg-primary rounded-xl border border-border-normal/40 p-4 space-y-2 text-xs font-mono">
                  <div className="flex justify-between">
                    <span className="text-text-muted">ASSIGNEES:</span>
                    <span className="text-text-heading font-semibold text-right max-w-[60%]">
                      {detail.assignees && detail.assignees.length > 0 
                        ? detail.assignees.map(a => a.name).join(', ') 
                        : 'Unassigned'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-muted">DUE DATE:</span>
                    <span className="text-text-heading font-semibold">{detail.dueDate ? new Date(detail.dueDate).toLocaleDateString() : 'No date'}</span>
                  </div>
                  {detail.isRecurring && (
                    <div className="flex justify-between text-primary">
                      <span className="text-text-muted">RECURRING:</span>
                      <span className="font-semibold">{detail.recurringPattern}</span>
                    </div>
                  )}
                </div>

                {/* Checklist widget */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="font-mono text-[10px] text-text-muted font-bold block">SUBTASKS CHECKLIST</span>
                    {detail.checklist.length > 0 && (
                      <span className="text-[10px] font-mono font-bold text-primary">
                        {detail.checklist.filter(c => c.isCompleted).length}/{detail.checklist.length}
                      </span>
                    )}
                  </div>
                  
                  {detail.checklist.length > 0 && (
                    <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                      {detail.checklist.map((item) => (
                        <div key={item.id} className="flex items-center gap-2 text-xs">
                          <input
                            type="checkbox"
                            checked={item.isCompleted}
                            disabled={role === 'Read Only'}
                            onChange={() => handleToggleChecklist(item.id)}
                            className="w-3.5 h-3.5 accent-primary cursor-pointer"
                          />
                          <span className={`text-text-heading ${item.isCompleted ? 'line-through text-text-muted' : ''}`}>
                            {item.title}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {role !== 'Read Only' && (
                    <form onSubmit={handleAddChecklist} className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Add subtask checklist item..."
                        value={checklistItemTitle}
                        onChange={(e) => setChecklistItemTitle(e.target.value)}
                        className="flex-1 h-9 px-3 bg-bg-primary border border-border-normal rounded-lg text-xs text-text-heading focus:outline-none"
                      />
                      <button type="submit" className="h-9 px-3 rounded-lg bg-primary hover:bg-opacity-90 text-black font-semibold text-xs cursor-pointer">
                        ADD
                      </button>
                    </form>
                  )}
                </div>

                {/* Comments widgets */}
                <div className="space-y-3.5 pt-3 border-t border-border-normal/40">
                  <span className="font-mono text-[10px] text-text-muted font-bold block">COMMENTS FEED</span>

                  {/* List of comments */}
                  <div className="space-y-3.5 max-h-48 overflow-y-auto pr-1">
                    {detail.comments.length === 0 ? (
                      <p className="text-[10px] text-text-muted font-mono">// No discussion logs yet.</p>
                    ) : (
                      detail.comments.map((c) => (
                        <div key={c.id} className="bg-bg-primary/50 border border-border-normal/40 p-3 rounded-lg text-xs space-y-1">
                          <div className="flex justify-between items-center font-mono text-[9px] text-text-muted">
                            <span className="font-bold text-text-heading">{c.author}</span>
                            <span>{new Date(c.createdAt).toLocaleDateString()}</span>
                          </div>
                          <p className="text-text-body font-sans leading-tight">{c.text}</p>
                        </div>
                      ))
                    )}
                  </div>

                  {role !== 'Read Only' && (
                    <form onSubmit={handleAddComment} className="flex gap-2 pt-1.5">
                      <input
                        type="text"
                        placeholder="Write a comment query..."
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        className="flex-1 h-9 px-3 bg-bg-primary border border-border-normal rounded-lg text-xs text-text-heading focus:outline-none"
                      />
                      <button type="submit" className="h-9 px-3.5 rounded-lg bg-primary hover:bg-opacity-90 text-black font-semibold text-xs cursor-pointer">
                        POST
                      </button>
                    </form>
                  )}
                </div>

              </div>
            ) : null}
          </div>
        )}
      </div>

      {/* ADD/EDIT TASK MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form
            onSubmit={handleSubmitTask}
            className="bg-bg-surface border border-border-normal rounded-xl max-w-md w-full flex flex-col shadow-2xl animate-in scale-in duration-200"
          >
            <div className="px-6 py-4 border-b border-border-normal flex items-center justify-between">
              <div>
                <h3 className="font-display font-bold text-text-heading text-base">
                  {editingTaskId ? "// Edit Sprint Task" : "// Initialize Sprint Task"}
                </h3>
                <p className="text-[10px] text-text-muted font-mono mt-0.5">
                  {editingTaskId ? "Update task details, assignees, and due dates." : "Assign backlog tasks, set priority logs and due dates."}
                </p>
              </div>
              <button type="button" onClick={() => setShowAddModal(false)} className="text-text-muted hover:text-text-heading">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="flex flex-col gap-1.5">
                <label className="text-text-heading font-semibold">Task Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Design sponsorship brochure"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="h-10 px-3 bg-bg-primary border border-border-normal rounded-lg text-text-heading focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-text-heading font-semibold">Assignees</label>
                  <div className="border border-border-normal bg-bg-primary rounded-lg max-h-32 overflow-y-auto p-2 space-y-1">
                    {members.map(m => (
                      <label key={m.id} className="flex items-center gap-2 cursor-pointer p-1 hover:bg-bg-elevated rounded">
                        <input
                          type="checkbox"
                          checked={formAssigneeIds.includes(m.id)}
                          onChange={(e) => {
                            if (e.target.checked) setFormAssigneeIds([...formAssigneeIds, m.id]);
                            else setFormAssigneeIds(formAssigneeIds.filter(id => id !== m.id));
                          }}
                          className="w-3.5 h-3.5 accent-primary"
                        />
                        <span className="text-text-heading">{m.name}</span>
                      </label>
                    ))}
                    {members.length === 0 && (
                      <span className="text-text-muted text-[10px] p-1">No members found</span>
                    )}
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-text-heading font-semibold">Due Date</label>
                  <input
                    type="date"
                    value={formDueDate}
                    onChange={(e) => setFormDueDate(e.target.value)}
                    className="h-10 px-3 bg-bg-primary border border-border-normal rounded-lg text-text-heading focus:outline-none font-mono text-[11px]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-text-heading font-semibold">Priority</label>
                  <select
                    value={formPriority}
                    onChange={(e) => setFormPriority(e.target.value)}
                    className="h-10 px-3 bg-bg-primary border border-border-normal rounded-lg text-text-heading focus:outline-none font-mono text-[11px]"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Urgent">Urgent</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-text-heading font-semibold">Labels (comma separated)</label>
                  <input
                    type="text"
                    placeholder="Sponsorship, Marketing"
                    value={formLabels}
                    onChange={(e) => setFormLabels(e.target.value)}
                    className="h-10 px-3 bg-bg-primary border border-border-normal rounded-lg text-text-heading focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div className="bg-bg-primary/50 border border-border-normal p-4 rounded-xl space-y-3">
                <div className="flex items-center gap-2">
                  <input
                    id="is-recurring-check"
                    type="checkbox"
                    checked={formIsRecurring}
                    onChange={(e) => setFormIsRecurring(e.target.checked)}
                    className="w-4 h-4 accent-primary cursor-pointer"
                  />
                  <label htmlFor="is-recurring-check" className="text-text-heading font-semibold font-mono text-[11px] cursor-pointer">
                    RECURRING CRON TASK
                  </label>
                </div>
                {formIsRecurring && (
                  <div className="flex flex-col gap-1.5 text-xs">
                    <label className="text-text-heading font-semibold">Pattern</label>
                    <select
                      value={formRecurringPattern}
                      onChange={(e) => setFormRecurringPattern(e.target.value)}
                      className="h-9 px-3 bg-bg-primary border border-border-normal rounded-lg text-text-heading focus:outline-none font-mono"
                    >
                      <option value="Weekly">Weekly</option>
                      <option value="Monthly">Monthly</option>
                      <option value="Fortnightly">Fortnightly</option>
                    </select>
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-text-heading font-semibold">Task Details / Description</label>
                <textarea
                  rows={3}
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  className="p-3 bg-bg-primary border border-border-normal rounded-lg text-text-heading focus:outline-none resize-none"
                />
              </div>
            </div>

            <div className="px-6 py-4 border-t border-border-normal bg-bg-elevated/20 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="h-10 px-4 rounded-lg border border-border-normal hover:bg-bg-elevated text-xs font-semibold font-mono transition-colors"
              >
                CANCEL
              </button>
              
              <button
                type="submit"
                disabled={isSubmitting}
                className="h-10 px-6 rounded-lg bg-primary hover:bg-opacity-90 text-black font-bold text-xs transition-all disabled:opacity-50"
              >
                {isSubmitting ? 'SAVING...' : (editingTaskId ? 'UPDATE TASK' : 'CREATE TASK')}
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}
