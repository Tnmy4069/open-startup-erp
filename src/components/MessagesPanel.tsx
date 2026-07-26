'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useApp } from '@/context/AppContext';
import { AppConfig } from '@/lib/config';
import {
  MessageSquare, Search, Plus, Users, Send, Paperclip, MapPin,
  Image as ImageIcon, FileText, X, Check, CheckCheck, ArrowLeft,
  MoreVertical, UserPlus, LogOut, Trash2, Edit3, Download, ExternalLink,
  RotateCw, Ban, CornerDownLeft
} from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────────────────────
interface Conversation {
  id: string;
  name: string | null;
  isGroup: boolean;
  avatar: string | null;
  memberIds: string[];
  adminIds: string[];
  memberNames: string[];
  lastMessage: string | null;
  lastAt: string | null;
  unreadCount: number;
  createdBy: string;
}

interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  type: 'text' | 'file' | 'image' | 'location';
  content: string;
  fileName?: string;
  fileSize?: number;
  mimeType?: string;
  readBy: string[];
  isEdited?: boolean;
  editedAt?: string;
  isDeleted?: boolean;
  deletedFor?: string[];
  createdAt: string;
}

interface UserEntry {
  id: string;
  username: string;
  role: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'now';
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d`;
  return new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getInitials(name: string) {
  return name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2);
}

// ── Main Component ────────────────────────────────────────────────────────────
export function MessagesPanel() {
  const { user } = useApp();
  const userId = user?.userId || '';
  const username = user?.username || '';
  const role = user?.role || '';

  // State
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvo, setActiveConvo] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [msgInput, setMsgInput] = useState('');
  const [searchFilter, setSearchFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [msgLoading, setMsgLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Message Editing & Options Menu
  const [editingMsgId, setEditingMsgId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [activeMsgMenuId, setActiveMsgMenuId] = useState<string | null>(null);

  // New conversation modal
  const [showNewModal, setShowNewModal] = useState(false);
  const [newIsGroup, setNewIsGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [allUsers, setAllUsers] = useState<UserEntry[]>([]);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [userSearch, setUserSearch] = useState('');

  // Group settings
  const [showGroupSettings, setShowGroupSettings] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pollRef = useRef<NodeJS.Timeout | null>(null);

  // Track known message IDs to trigger push notification on new incoming message
  const knownMsgIdsRef = useRef<Set<string>>(new Set());
  const initialLoadDoneRef = useRef<boolean>(false);

  // ── Request Browser Notification Permission ─────────────────────────────
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().catch(() => {});
    }
  }, []);

  // ── Fetch conversations ─────────────────────────────────────────────────
  const fetchConversations = useCallback(async () => {
    try {
      const res = await fetch('/api/messages/conversations');
      if (res.ok) {
        const data = await res.json();
        setConversations(data);
      }
    } catch {
      // Quiet
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConversations();
    const iv = setInterval(fetchConversations, 5000);
    return () => clearInterval(iv);
  }, [fetchConversations]);

  // ── Fetch messages for active conversation ──────────────────────────────
  const fetchMessages = useCallback(async (convoId: string, isManualRefresh = false) => {
    try {
      const res = await fetch(`/api/messages/conversations/${convoId}/messages`);
      if (res.ok) {
        const data = await res.json();
        const incomingMsgs: Message[] = data.messages || [];

        // Check for new incoming messages for push notification
        if (initialLoadDoneRef.current && !isManualRefresh) {
          for (const msg of incomingMsgs) {
            if (!knownMsgIdsRef.current.has(msg.id) && msg.senderId !== userId) {
              // Trigger Browser Push Notification
              if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
                const body =
                  msg.type === 'file' ? `📎 ${msg.fileName || 'File'}` :
                  msg.type === 'image' ? '🖼️ Image' :
                  msg.type === 'location' ? '📍 Location' : msg.content;
                new Notification(`💬 ${msg.senderName}`, {
                  body,
                  icon: AppConfig.iconUrl || '/cyberx-logo.png',
                });
              }
            }
          }
        }

        // Update known IDs set
        knownMsgIdsRef.current = new Set(incomingMsgs.map((m) => m.id));
        initialLoadDoneRef.current = true;
        setMessages(incomingMsgs);
      }
    } catch {
      // Quiet
    }
  }, [userId]);

  // Poll messages every 2s when conversation is active + window focus listener
  useEffect(() => {
    if (pollRef.current) clearInterval(pollRef.current);
    if (!activeConvo) return;
    initialLoadDoneRef.current = false;
    knownMsgIdsRef.current.clear();
    fetchMessages(activeConvo.id);
    fetch(`/api/messages/conversations/${activeConvo.id}/read`, { method: 'POST' }).catch(() => {});

    pollRef.current = setInterval(() => {
      fetchMessages(activeConvo.id);
    }, 2000);

    const handleFocus = () => fetchMessages(activeConvo.id);
    window.addEventListener('focus', handleFocus);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
      window.removeEventListener('focus', handleFocus);
    };
  }, [activeConvo, fetchMessages]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ── Manual Refresh Handler ──────────────────────────────────────────────
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await Promise.all([
      fetchConversations(),
      activeConvo ? fetchMessages(activeConvo.id, true) : Promise.resolve(),
    ]);
    setTimeout(() => setIsRefreshing(false), 600);
  };

  // ── Fetch users for new conversation modal ─────────────────────────────
  const fetchUsers = useCallback(async () => {
    try {
      const res = await fetch('/api/messages/users');
      if (res.ok) {
        const data = await res.json();
        setAllUsers(
          (data || []).filter(
            (u: UserEntry) => u.id !== userId && u.username?.toLowerCase() !== username?.toLowerCase()
          )
        );
      }
    } catch {
      // Quiet
    }
  }, [userId, username]);

  // ── Send message ────────────────────────────────────────────────────────
  const handleSend = async () => {
    if (!activeConvo || !msgInput.trim() || sending) return;
    setSending(true);
    try {
      const res = await fetch(`/api/messages/conversations/${activeConvo.id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'text', content: msgInput.trim() }),
      });
      if (res.ok) {
        const msg = await res.json();
        setMessages((prev) => [...prev, msg]);
        setMsgInput('');
        fetchConversations();
      }
    } catch {
      // Quiet
    } finally {
      setSending(false);
    }
  };

  // ── Edit message ────────────────────────────────────────────────────────
  const handleSaveEdit = async (msgId: string) => {
    if (!activeConvo || !editText.trim()) return;
    try {
      const res = await fetch(`/api/messages/conversations/${activeConvo.id}/messages/${msgId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: editText.trim() }),
      });
      if (res.ok) {
        const updatedMsg = await res.json();
        setMessages((prev) => prev.map((m) => (m.id === msgId ? updatedMsg : m)));
        setEditingMsgId(null);
        setEditText('');
        setActiveMsgMenuId(null);
        fetchConversations();
      } else {
        const errData = await res.json().catch(() => ({}));
        alert(errData.error || 'Failed to update message.');
      }
    } catch (err) {
      alert((err as Error).message);
    }
  };


  // ── Delete message ──────────────────────────────────────────────────────
  const handleDeleteMessage = async (msgId: string, mode: 'me' | 'everyone') => {
    if (!activeConvo) return;
    if (mode === 'everyone' && !confirm('Delete this message for everyone?')) return;

    try {
      const res = await fetch(`/api/messages/conversations/${activeConvo.id}/messages/${msgId}?mode=${mode}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        if (mode === 'me') {
          setMessages((prev) => prev.filter((m) => m.id !== msgId));
        } else {
          const updatedMsg = await res.json();
          setMessages((prev) => prev.map((m) => (m.id === msgId ? updatedMsg : m)));
        }
        setActiveMsgMenuId(null);
        fetchConversations();
      }
    } catch {
      // Quiet
    }
  };

  // ── Send file ───────────────────────────────────────────────────────────
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeConvo) return;
    setSending(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      const uploadRes = await fetch('/api/settings/upload', { method: 'POST', body: formData });
      if (!uploadRes.ok) throw new Error('Upload failed');
      const uploadData = await uploadRes.json();

      const isImage = file.type.startsWith('image/');
      const res = await fetch(`/api/messages/conversations/${activeConvo.id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: isImage ? 'image' : 'file',
          content: uploadData.url || uploadData.fileUrl,
          fileName: file.name,
          fileSize: file.size,
          mimeType: file.type,
        }),
      });
      if (res.ok) {
        const msg = await res.json();
        setMessages((prev) => [...prev, msg]);
        fetchConversations();
      }
    } catch {
      // Quiet
    } finally {
      setSending(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // ── Send location ──────────────────────────────────────────────────────
  const handleShareLocation = () => {
    if (!activeConvo || !navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        setSending(true);
        try {
          const content = `${pos.coords.latitude},${pos.coords.longitude}`;
          const res = await fetch(`/api/messages/conversations/${activeConvo.id}/messages`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type: 'location', content }),
          });
          if (res.ok) {
            const msg = await res.json();
            setMessages((prev) => [...prev, msg]);
            fetchConversations();
          }
        } catch {
          // Quiet
        } finally {
          setSending(false);
        }
      },
      () => alert('Unable to access your location. Please enable location permissions.'),
      { enableHighAccuracy: true }
    );
  };

  // ── Create conversation ────────────────────────────────────────────────
  const handleCreateConversation = async () => {
    if (selectedUserIds.length === 0) return;
    try {
      const res = await fetch('/api/messages/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          isGroup: newIsGroup,
          name: newIsGroup ? newGroupName : undefined,
          memberIds: selectedUserIds,
        }),
      });
      if (res.ok) {
        const convo = await res.json();
        setShowNewModal(false);
        setSelectedUserIds([]);
        setNewGroupName('');
        setNewIsGroup(false);
        setUserSearch('');
        await fetchConversations();
        setActiveConvo(convo);
      }
    } catch {
      // Quiet
    }
  };

  // ── Leave group ─────────────────────────────────────────────────────────
  const handleLeaveGroup = async () => {
    if (!activeConvo) return;
    try {
      await fetch(`/api/messages/conversations/${activeConvo.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leave: true }),
      });
      setActiveConvo(null);
      setShowGroupSettings(false);
      fetchConversations();
    } catch {
      // Quiet
    }
  };

  // ── Delete conversation ─────────────────────────────────────────────────
  const handleDeleteConversation = async () => {
    if (!activeConvo) return;
    if (!confirm('Delete this entire conversation? All messages will be permanently removed.')) return;
    try {
      await fetch(`/api/messages/conversations/${activeConvo.id}`, { method: 'DELETE' });
      setActiveConvo(null);
      setShowGroupSettings(false);
      fetchConversations();
    } catch {
      // Quiet
    }
  };

  // ── Filter conversations ───────────────────────────────────────────────
  const filtered = conversations.filter((c) => {
    const q = searchFilter.toLowerCase();
    if (!q) return true;
    const name = c.isGroup ? c.name || '' : (c.memberNames || []).join(', ');
    return name.toLowerCase().includes(q);
  });

  const convoDisplayName = (c: Conversation) => {
    if (!c) return 'Chat';
    if (c.isGroup) return c.name || 'Unnamed Group';
    if (Array.isArray(c.memberNames) && c.memberNames.length > 0) {
      return c.memberNames.join(', ');
    }
    return 'Direct Message';
  };

  // Total unread badge count
  const totalUnread = conversations.reduce((sum, c) => sum + (c.unreadCount || 0), 0);

  // ── Render message bubble ──────────────────────────────────────────────
  const renderMessage = (msg: Message) => {
    const isMe = msg.senderId === userId;
    const isRead = msg.readBy.length > 1;
    const isEditing = editingMsgId === msg.id;
    const showMenu = activeMsgMenuId === msg.id;
    const isDeletedEveryone = msg.isDeleted;

    return (
      <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} mb-3 group relative`}>
        <div className={`max-w-[86%] sm:max-w-[75%] rounded-2xl px-3.5 sm:px-4 py-2.5 space-y-1 relative ${
          isDeletedEveryone
            ? 'bg-bg-elevated/40 border border-border-normal/40 text-text-muted italic'
            : isMe
            ? 'bg-primary/20 border border-primary/30 text-text-heading'
            : 'bg-bg-elevated border border-border-normal text-text-body'
        }`}>

          {/* Options button (three dots / hover action) */}
          {!isDeletedEveryone && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setActiveMsgMenuId(showMenu ? null : msg.id);
              }}
              className={`absolute top-2 ${isMe ? '-left-7' : '-right-7'} p-1.5 text-text-muted hover:text-text-heading transition-opacity cursor-pointer opacity-70 group-hover:opacity-100`}
              title="Message options"
            >
              <MoreVertical className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Options Dropdown Menu */}
          {showMenu && !isDeletedEveryone && (
            <div
              onClick={(e) => e.stopPropagation()}
              className={`absolute top-7 ${isMe ? 'right-0' : 'left-0'} z-30 bg-bg-surface border border-border-normal rounded-xl shadow-2xl py-1 min-w-[150px] text-xs`}
            >
              {isMe && msg.type === 'text' && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditingMsgId(msg.id);
                    setEditText(msg.content);
                    setActiveMsgMenuId(null);
                  }}
                  className="w-full text-left px-3 py-1.5 hover:bg-bg-elevated flex items-center gap-2 text-text-heading cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5 text-primary" /> Edit
                </button>
              )}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteMessage(msg.id, 'me');
                }}
                className="w-full text-left px-3 py-1.5 hover:bg-bg-elevated flex items-center gap-2 text-text-body cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5 text-cyber-danger" /> Delete for Me
              </button>
              {(isMe || role === 'Super Admin') && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteMessage(msg.id, 'everyone');
                  }}
                  className="w-full text-left px-3 py-1.5 hover:bg-bg-elevated flex items-center gap-2 text-cyber-danger font-semibold cursor-pointer"
                >
                  <Ban className="w-3.5 h-3.5" /> Delete for Everyone
                </button>
              )}
            </div>
          )}


          {/* Sender name (for group chats) */}
          {!isMe && activeConvo?.isGroup && (
            <p className="text-[10px] font-mono font-bold text-primary">{msg.senderName}</p>
          )}

          {/* Inline Edit Form */}
          {isEditing ? (
            <div className="space-y-2 pt-1" onClick={(e) => e.stopPropagation()}>
              <input
                type="text"
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                onKeyDown={(e) => {
                  e.stopPropagation();
                  if (e.key === 'Enter') handleSaveEdit(msg.id);
                  if (e.key === 'Escape') setEditingMsgId(null);
                }}
                className="w-full text-xs bg-bg-primary border border-primary/50 rounded-lg px-2.5 py-1 text-text-heading focus:outline-none"
                autoFocus
              />
              <div className="flex items-center justify-end gap-1.5">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditingMsgId(null);
                  }}
                  className="px-2 py-0.5 text-[10px] font-mono text-text-muted hover:text-text-heading cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSaveEdit(msg.id);
                  }}
                  className="px-2 py-0.5 text-[10px] font-mono bg-primary text-black rounded font-bold cursor-pointer hover:bg-opacity-90 transition-all"
                >
                  Save
                </button>
              </div>
            </div>
          ) : (

            <>
              {/* Deleted message text */}
              {isDeletedEveryone ? (
                <div className="flex items-center gap-1.5 text-xs text-text-muted">
                  <Ban className="w-3.5 h-3.5" />
                  <span>This message was deleted</span>
                </div>
              ) : (
                <>
                  {/* Text */}
                  {msg.type === 'text' && (
                    <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                  )}

                  {/* Image */}
                  {msg.type === 'image' && (
                    <div className="space-y-1">
                      <img src={msg.content} alt={msg.fileName || 'Image'} className="max-w-full max-h-64 rounded-lg object-contain cursor-pointer" onClick={() => window.open(msg.content, '_blank')} />
                      {msg.fileName && <p className="text-[10px] text-text-muted font-mono">{msg.fileName}</p>}
                    </div>
                  )}

                  {/* File */}
                  {msg.type === 'file' && (
                    <a href={msg.content} download={msg.fileName} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-3 p-2.5 bg-bg-primary rounded-xl border border-border-normal hover:border-primary transition-colors">
                      <div className="p-2 bg-primary/10 rounded-lg text-primary">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-text-heading truncate">{msg.fileName || 'File'}</p>
                        {msg.fileSize && <p className="text-[10px] text-text-muted font-mono">{formatFileSize(msg.fileSize)}</p>}
                      </div>
                      <Download className="w-4 h-4 text-text-muted shrink-0" />
                    </a>
                  )}

                  {/* Location */}
                  {msg.type === 'location' && (() => {
                    const [lat, lng] = msg.content.split(',');
                    const mapUrl = `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=15/${lat}/${lng}`;
                    return (
                      <a href={mapUrl} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-3 p-2.5 bg-bg-primary rounded-xl border border-border-normal hover:border-primary transition-colors">
                        <div className="p-2 bg-cyber-success/10 rounded-lg text-cyber-success">
                          <MapPin className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                          <p className="text-xs font-bold text-text-heading">📍 Shared Location</p>
                          <p className="text-[10px] text-text-muted font-mono">{lat}, {lng}</p>
                        </div>
                        <ExternalLink className="w-4 h-4 text-text-muted shrink-0" />
                      </a>
                    );
                  })()}
                </>
              )}
            </>
          )}

          {/* Timestamp, Edited Tag & Read receipt */}
          <div className={`flex items-center gap-1.5 ${isMe ? 'justify-end' : ''}`}>
            {msg.isEdited && !isDeletedEveryone && (
              <span className="text-[9px] text-primary italic font-mono">(edited)</span>
            )}
            <span className="text-[9px] text-text-muted font-mono">{timeAgo(msg.createdAt)}</span>
            {isMe && !isDeletedEveryone && (
              isRead
                ? <CheckCheck className="w-3 h-3 text-primary" />
                : <Check className="w-3 h-3 text-text-muted" />
            )}
          </div>
        </div>
      </div>
    );
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // ── RENDER ──────────────────────────────────────────────────────────────
  // ═══════════════════════════════════════════════════════════════════════════
  return (
    <div className="flex h-[calc(100vh-130px)] md:h-[calc(100vh-160px)] min-h-[460px] bg-bg-primary rounded-xl sm:rounded-2xl border border-border-normal overflow-hidden shadow-sm">

      {/* ──────────────── LEFT: CONVERSATION LIST ──────────────── */}
      <div className={`w-full md:w-80 lg:w-96 shrink-0 border-r border-border-normal flex flex-col bg-bg-surface ${activeConvo ? 'hidden md:flex' : 'flex'}`}>
        {/* Header */}
        <div className="px-3.5 sm:px-4 py-3.5 sm:py-4 border-b border-border-normal/60 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-primary" />
              <h2 className="font-display font-bold text-base text-text-heading">Messages</h2>
              {totalUnread > 0 && (
                <span className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-primary text-black rounded-full">{totalUnread}</span>
              )}
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={handleRefresh}
                className="p-2 rounded-lg bg-bg-elevated text-text-muted hover:text-text-heading transition-colors cursor-pointer"
                title="Refresh messages"
              >
                <RotateCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-primary' : ''}`} />
              </button>
              <button
                onClick={() => { setShowNewModal(true); fetchUsers(); }}
                className="p-2 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors cursor-pointer"
                title="New Conversation"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="w-full h-9 pl-9 pr-3 text-xs bg-bg-primary border border-border-normal rounded-lg text-text-heading focus:outline-none focus:border-primary transition-colors"
            />
          </div>
        </div>

        {/* Conversation list */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <span className="text-xs text-text-muted font-mono animate-pulse">Loading conversations...</span>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-6 text-center space-y-3">
              <MessageSquare className="w-12 h-12 text-text-muted opacity-30" />
              <p className="text-sm font-semibold text-text-heading">No conversations yet</p>
              <p className="text-xs text-text-muted">Start a new chat with a team member or create a group.</p>
            </div>
          ) : (
            filtered.map((c) => (
              <button
                key={c.id}
                onClick={() => { setActiveConvo(c); setMsgLoading(true); setTimeout(() => setMsgLoading(false), 300); }}
                className={`w-full flex items-center gap-3 px-3.5 sm:px-4 py-3.5 text-left transition-all duration-150 cursor-pointer border-b border-border-normal/30 ${
                  activeConvo?.id === c.id ? 'bg-primary/10 border-l-2 border-l-primary' : 'hover:bg-bg-elevated'
                }`}
              >
                {/* Avatar */}
                <div className={`w-10 h-10 rounded-full shrink-0 flex items-center justify-center text-xs font-bold ${
                  c.isGroup ? 'bg-primary/15 text-primary border border-primary/30' : 'bg-bg-elevated text-text-heading border border-border-normal'
                }`}>
                  {c.isGroup ? <Users className="w-4 h-4" /> : getInitials(c.memberNames?.[0] || '?')}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-text-heading truncate">{convoDisplayName(c)}</span>
                    {c.lastAt && <span className="text-[10px] text-text-muted font-mono shrink-0">{timeAgo(c.lastAt)}</span>}
                  </div>
                  <div className="flex items-center justify-between gap-2 mt-0.5">
                    <span className="text-[11px] text-text-muted truncate">{c.lastMessage || 'No messages yet'}</span>
                    {c.unreadCount > 0 && (
                      <span className="px-1.5 py-0.5 text-[9px] font-mono font-bold bg-primary text-black rounded-full shrink-0">{c.unreadCount}</span>
                    )}
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* ──────────────── RIGHT: CHAT VIEW ──────────────── */}
      <div className={`flex-1 flex flex-col h-full bg-bg-primary ${!activeConvo ? 'hidden md:flex' : 'flex'}`}>
        {!activeConvo ? (
          /* Empty state */
          <div className="flex-1 flex flex-col items-center justify-center text-center px-6 space-y-4">
            <div className="p-5 rounded-full bg-primary/10 border border-primary/30 text-primary">
              <MessageSquare className="w-10 h-10" />
            </div>
            <h3 className="text-lg font-bold text-text-heading font-display">Select a conversation</h3>
            <p className="text-xs text-text-muted max-w-sm">Choose a conversation from the left panel or start a new one to begin chatting.</p>
          </div>
        ) : (
          <>
            {/* Chat header */}
            <div className="px-3 sm:px-4 py-3 border-b border-border-normal/60 bg-bg-surface/50 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                {/* Back button (mobile) */}
                <button onClick={() => setActiveConvo(null)} className="md:hidden p-1.5 -ml-1 rounded-lg hover:bg-bg-elevated text-primary cursor-pointer active:scale-95 transition-all">
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div className={`w-9 h-9 rounded-full shrink-0 flex items-center justify-center text-xs font-bold ${
                  activeConvo.isGroup ? 'bg-primary/15 text-primary border border-primary/30' : 'bg-bg-elevated text-text-heading border border-border-normal'
                }`}>
                  {activeConvo.isGroup ? <Users className="w-4 h-4" /> : getInitials(activeConvo.memberNames?.[0] || '?')}
                </div>
                <div className="min-w-0">
                  <h3 className="text-xs sm:text-sm font-bold text-text-heading truncate">{convoDisplayName(activeConvo)}</h3>
                  <p className="text-[10px] text-text-muted font-mono truncate">
                    {activeConvo.isGroup ? `${activeConvo.memberIds.length} members` : 'Direct Message'}
                  </p>
                </div>
              </div>

              {/* Header Controls: Refresh & Options */}
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={handleRefresh}
                  className="p-1.5 sm:p-2 rounded-lg hover:bg-bg-elevated text-text-muted hover:text-text-heading transition-colors cursor-pointer"
                  title="Refresh chat messages"
                >
                  <RotateCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-primary' : ''}`} />
                </button>
                <button
                  onClick={() => setShowGroupSettings(!showGroupSettings)}
                  className="p-1.5 sm:p-2 rounded-lg hover:bg-bg-elevated text-text-muted hover:text-text-heading transition-colors cursor-pointer"
                >
                  <MoreVertical className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Group settings dropdown */}
            {showGroupSettings && (
              <div className="px-4 py-3 bg-bg-elevated/50 border-b border-border-normal/40 flex items-center gap-2 flex-wrap">
                {activeConvo.isGroup && (
                  <button onClick={handleLeaveGroup} className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-mono font-bold rounded-lg border border-cyber-danger/30 text-cyber-danger hover:bg-cyber-danger/10 transition-colors cursor-pointer">
                    <LogOut className="w-3.5 h-3.5" /> LEAVE GROUP
                  </button>
                )}
                <button onClick={handleDeleteConversation} className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-mono font-bold rounded-lg border border-cyber-danger/30 text-cyber-danger hover:bg-cyber-danger/10 transition-colors cursor-pointer">
                  <Trash2 className="w-3.5 h-3.5" /> DELETE
                </button>
              </div>
            )}

            {/* Messages area */}
            <div className="flex-1 overflow-y-auto px-3 sm:px-4 py-3 sm:py-4" onClick={() => setActiveMsgMenuId(null)}>
              {msgLoading ? (
                <div className="flex items-center justify-center h-full">
                  <span className="text-xs text-text-muted font-mono animate-pulse">Loading messages...</span>
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center space-y-2">
                  <MessageSquare className="w-8 h-8 text-text-muted opacity-30" />
                  <p className="text-xs text-text-muted font-mono">No messages yet. Say hello! 👋</p>
                </div>
              ) : (
                <>
                  {messages.map(renderMessage)}
                  <div ref={messagesEndRef} />
                </>
              )}
            </div>

            {/* Input bar */}
            <div className="px-2.5 sm:px-4 py-2.5 sm:py-3 border-t border-border-normal/60 bg-bg-surface/30 shrink-0">
              <div className="flex items-center gap-1.5 sm:gap-2">
                {/* File attachment */}
                <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileUpload} />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2 sm:p-2.5 rounded-lg hover:bg-bg-elevated text-text-muted hover:text-text-heading transition-colors cursor-pointer shrink-0"
                  title="Attach file"
                >
                  <Paperclip className="w-4 h-4" />
                </button>

                {/* Location */}
                <button
                  onClick={handleShareLocation}
                  className="p-2 sm:p-2.5 rounded-lg hover:bg-bg-elevated text-text-muted hover:text-text-heading transition-colors cursor-pointer shrink-0"
                  title="Share location"
                >
                  <MapPin className="w-4 h-4" />
                </button>

                {/* Text input */}
                <input
                  type="text"
                  placeholder="Type a message..."
                  value={msgInput}
                  onChange={(e) => setMsgInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                  className="flex-1 h-10 px-3 sm:px-4 text-xs sm:text-sm bg-bg-primary border border-border-normal rounded-xl text-text-heading focus:outline-none focus:border-primary transition-colors min-w-0"
                />

                {/* Send */}
                <button
                  onClick={handleSend}
                  disabled={!msgInput.trim() || sending}
                  className="p-2.5 rounded-xl bg-primary text-black hover:bg-opacity-90 transition-all cursor-pointer disabled:opacity-40 shrink-0"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>


      {/* ──────────────── NEW CONVERSATION MODAL ──────────────── */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-bg-surface border border-border-normal rounded-2xl w-full max-w-md shadow-2xl flex flex-col max-h-[80vh]">
            {/* Header */}
            <div className="px-5 py-4 border-b border-border-normal/60 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Plus className="w-5 h-5 text-primary" />
                <h3 className="font-display font-bold text-sm text-text-heading">New Conversation</h3>
              </div>
              <button onClick={() => { setShowNewModal(false); setSelectedUserIds([]); setNewIsGroup(false); setNewGroupName(''); }} className="text-text-muted hover:text-text-heading p-1 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Type toggle */}
            <div className="px-5 py-3 flex gap-2">
              <button
                onClick={() => setNewIsGroup(false)}
                className={`flex-1 py-2 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${!newIsGroup ? 'bg-primary text-black' : 'bg-bg-primary text-text-muted border border-border-normal hover:border-primary'}`}
              >
                Direct Message
              </button>
              <button
                onClick={() => setNewIsGroup(true)}
                className={`flex-1 py-2 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${newIsGroup ? 'bg-primary text-black' : 'bg-bg-primary text-text-muted border border-border-normal hover:border-primary'}`}
              >
                <Users className="w-3.5 h-3.5 inline mr-1" /> Group Chat
              </button>
            </div>

            {/* Group name */}
            {newIsGroup && (
              <div className="px-5 pb-2">
                <input
                  type="text"
                  placeholder="Group name..."
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  className="w-full h-9 px-3 text-xs bg-bg-primary border border-border-normal rounded-lg text-text-heading focus:outline-none focus:border-primary"
                />
              </div>
            )}

            {/* User search */}
            <div className="px-5 pb-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                <input
                  type="text"
                  placeholder="Search members..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="w-full h-9 pl-8 pr-3 text-xs bg-bg-primary border border-border-normal rounded-lg text-text-heading focus:outline-none focus:border-primary"
                />
              </div>
            </div>

            {/* Selected chips */}
            {selectedUserIds.length > 0 && (
              <div className="px-5 pb-2 flex flex-wrap gap-1.5">
                {selectedUserIds.map((uid) => {
                  const u = allUsers.find((x) => x.id === uid);
                  return (
                    <span key={uid} className="inline-flex items-center gap-1 px-2 py-1 bg-primary/15 text-primary border border-primary/30 rounded-full text-[10px] font-mono font-bold">
                      {u?.username || uid}
                      <button onClick={() => setSelectedUserIds((prev) => prev.filter((id) => id !== uid))} className="cursor-pointer">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  );
                })}
              </div>
            )}

            {/* User list */}
            <div className="flex-1 overflow-y-auto px-5 pb-3 space-y-1">
              {allUsers
                .filter((u) => u.username.toLowerCase().includes(userSearch.toLowerCase()))
                .map((u) => {
                  const selected = selectedUserIds.includes(u.id);
                  return (
                    <button
                      key={u.id}
                      onClick={() => {
                        if (!newIsGroup) {
                          setSelectedUserIds([u.id]);
                        } else {
                          setSelectedUserIds((prev) =>
                            selected ? prev.filter((id) => id !== u.id) : [...prev, u.id]
                          );
                        }
                      }}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all cursor-pointer ${
                        selected ? 'bg-primary/10 border border-primary/30' : 'hover:bg-bg-elevated border border-transparent'
                      }`}
                    >
                      <div className="w-8 h-8 rounded-full bg-bg-elevated border border-border-normal flex items-center justify-center text-[10px] font-bold text-text-heading">
                        {getInitials(u.username)}
                      </div>
                      <div className="flex-1">
                        <span className="text-xs font-bold text-text-heading">{u.username}</span>
                        <p className="text-[10px] text-text-muted font-mono">{u.role}</p>
                      </div>
                      {selected && <Check className="w-4 h-4 text-primary shrink-0" />}
                    </button>
                  );
                })}
            </div>

            {/* Footer */}
            <div className="px-5 py-3 border-t border-border-normal/60">
              <button
                onClick={handleCreateConversation}
                disabled={selectedUserIds.length === 0}
                className="w-full h-10 rounded-xl bg-primary text-black font-mono font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-40"
              >
                <Send className="w-4 h-4" />
                {newIsGroup ? 'CREATE GROUP' : 'START CHAT'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
