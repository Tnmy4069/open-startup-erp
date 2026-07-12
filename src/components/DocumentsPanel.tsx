'use client';

import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useApp } from '@/context/AppContext';
import {
  Folder,
  FileText,
  Plus,
  X,
  Search,
  Pin,
  Star,
  Clock,
  ChevronRight,
  ChevronDown,
  Edit,
  Trash2,
  ChevronLeft,
  Calendar,
  Save,
  CheckCircle,
  Eye,
  ArrowLeftRight
} from 'lucide-react';

interface DocFile {
  id: string;
  name: string;
  folderId: string;
  content: string;
  tags: string[];
  isPinned: boolean;
  isFavorite: boolean;
  createdAt: string;
  updatedAt: string;
}

interface DocFolder {
  id: string;
  name: string;
  parentId: string | null;
  files: DocFile[];
}

interface DocVersion {
  id: string;
  version: number;
  content: string;
  updatedBy: string;
  createdAt: string;
}

interface DocFileDetail extends DocFile {
  versions: DocVersion[];
}

export function DocumentsPanel() {
  const { role, refreshTrigger, triggerNotification, user: sessionUser } = useApp();

  const [folders, setFolders] = useState<DocFolder[]>([]);
  const [recentFiles, setRecentFiles] = useState<DocFile[]>([]);
  const [pinnedFiles, setPinnedFiles] = useState<DocFile[]>([]);
  
  const [loading, setLoading] = useState(true);

  // Selected File details
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);
  const [fileDetail, setFileDetail] = useState<DocFileDetail | null>(null);
  const [loadingFile, setLoadingFile] = useState(false);

  // View state
  const [editMode, setEditMode] = useState(false);
  const [previewSplit, setPreviewSplit] = useState(true);
  const [editorContent, setEditorContent] = useState('');
  const [editorName, setEditorName] = useState('');

  // Modals
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [showFileModal, setShowFileModal] = useState(false);
  
  // Folder/File Form States
  const [newFolderName, setNewFolderName] = useState('');
  const [selectedParentFolderId, setSelectedParentFolderId] = useState('');
  const [newFileName, setNewFileName] = useState('');
  const [targetFolderId, setTargetFolderId] = useState('');

  // Local search
  const [searchQuery, setSearchQuery] = useState('');

  const fetchDocumentStructure = async () => {
    try {
      setLoading(true);
      const foldersRes = await fetch('/api/documents/folders');
      if (foldersRes.ok) {
        const foldersData = await foldersRes.json();
        setFolders(foldersData);
      }

      // Fetch Pinned
      const pinnedRes = await fetch('/api/documents/files?isPinned=true');
      if (pinnedRes.ok) {
        const pinnedData = await pinnedRes.json();
        setPinnedFiles(pinnedData);
      }

      // Fetch Recent
      const recentRes = await fetch('/api/documents/files?recent=true');
      if (recentRes.ok) {
        const recentData = await recentRes.json();
        setRecentFiles(recentData);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchFileDetail = async (id: string) => {
    try {
      setLoadingFile(true);
      const res = await fetch(`/api/documents/files/${id}`);
      if (res.ok) {
        const data = await res.json();
        setFileDetail(data);
        setEditorContent(data.content);
        setEditorName(data.name);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingFile(false);
    }
  };

  useEffect(() => {
    fetchDocumentStructure();
  }, [refreshTrigger]);

  useEffect(() => {
    if (selectedFileId) {
      fetchFileDetail(selectedFileId);
      setEditMode(false);
    } else {
      setFileDetail(null);
    }
  }, [selectedFileId]);

  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName) return;

    try {
      const res = await fetch('/api/documents/folders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newFolderName, parentId: selectedParentFolderId || null }),
      });

      if (res.ok) {
        setShowFolderModal(false);
        setNewFolderName('');
        setSelectedParentFolderId('');
        triggerNotification('Created new document directory', 'Created');
        fetchDocumentStructure();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateFile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFileName || !targetFolderId) return;

    try {
      const res = await fetch('/api/documents/files', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newFileName.endsWith('.md') ? newFileName : `${newFileName}.md`,
          folderId: targetFolderId,
          content: `# ${newFileName}\n\nStart writing documentation here...`,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setShowFileModal(false);
        setNewFileName('');
        setTargetFolderId('');
        triggerNotification(`Created document: ${data.name}`, 'Created');
        fetchDocumentStructure();
        setSelectedFileId(data.id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveFileContent = async () => {
    if (!fileDetail) return;

    try {
      const res = await fetch(`/api/documents/files/${fileDetail.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editorName, content: editorContent }),
      });

      if (res.ok) {
        triggerNotification('Document updates saved', 'Updated');
        setEditMode(false);
        fetchFileDetail(fileDetail.id);
        fetchDocumentStructure();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleTogglePin = async (file: DocFile) => {
    try {
      const res = await fetch(`/api/documents/files/${file.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPinned: !file.isPinned }),
      });

      if (res.ok) {
        triggerNotification(file.isPinned ? 'Unpinned document' : 'Pinned document to top', 'Updated');
        fetchDocumentStructure();
        if (selectedFileId === file.id) {
          fetchFileDetail(file.id);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleFavorite = async (file: DocFile) => {
    try {
      const res = await fetch(`/api/documents/files/${file.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isFavorite: !file.isFavorite }),
      });

      if (res.ok) {
        triggerNotification(file.isFavorite ? 'Removed from favorites' : 'Added to favorites', 'Updated');
        fetchDocumentStructure();
        if (selectedFileId === file.id) {
          fetchFileDetail(file.id);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleRollback = async (verNum: number) => {
    if (!fileDetail) return;
    if (!confirm(`Are you sure you want to rollback this document to Version ${verNum}?`)) return;

    try {
      const res = await fetch(`/api/documents/files/${fileDetail.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rollbackVersion: verNum }),
      });

      if (res.ok) {
        triggerNotification(`Rolled back document to Version ${verNum}`, 'Updated');
        fetchFileDetail(fileDetail.id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteFile = async (file: DocFile) => {
    if (!confirm(`Are you sure you want to delete "${file.name}"? This action is permanent.`)) return;

    try {
      const res = await fetch(`/api/documents/files/${file.id}`, { method: 'DELETE' });
      if (res.ok) {
        triggerNotification(`Deleted document file: ${file.name}`, 'Deleted');
        setSelectedFileId(null);
        fetchDocumentStructure();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Filter structures based on search input
  const filteredFolders = folders.map((f) => {
    const matchingFiles = f.files.filter((file) => 
      file.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      file.content.toLowerCase().includes(searchQuery.toLowerCase())
    );
    return { ...f, files: matchingFiles };
  }).filter((f) => f.files.length > 0 || f.name.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="space-y-6">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-text-heading font-display tracking-wide">{"// Internal Document Repository"}</h2>
          <p className="text-[10px] text-text-muted font-mono mt-0.5 font-semibold">Store technical specifications, meeting logs and brand guidelines in markdown format</p>
        </div>

        {role !== 'Read Only' && (
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowFolderModal(true)}
              className="flex items-center gap-2 h-10 px-4 rounded-lg border border-border-normal text-text-body hover:bg-bg-elevated hover:text-text-heading text-xs font-semibold font-mono transition-all cursor-pointer"
            >
              <Folder className="w-4 h-4 text-text-muted" />
              <span>NEW FOLDER</span>
            </button>
            <button
              onClick={() => setShowFileModal(true)}
              className="flex items-center gap-2 h-10 px-4 rounded-lg bg-primary hover:bg-opacity-95 text-black font-semibold text-xs font-sans transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>New Document</span>
            </button>
          </div>
        )}
      </div>

      {/* CORE WORKSPACE SPLIT AREA */}
      <div className="flex flex-col lg:flex-row gap-6 min-h-[550px] items-stretch">
        
        {/* LEFT NAV SIDEBAR COLUMN (Directories & Pinned list) */}
        <div className="w-full lg:w-72 flex flex-col gap-6 shrink-0 select-none">
          
          {/* SEARCH BAR */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <input
              type="text"
              placeholder="Search docs or content..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-10 pl-9 pr-4 bg-bg-surface border border-border-normal rounded-lg text-xs text-text-heading focus:outline-none focus:border-primary"
            />
          </div>

          {/* FOLDERS DIRECTORY TREE */}
          <div className="bg-bg-surface border border-border-normal rounded-xl p-5 flex-1 flex flex-col justify-between">
            <div className="space-y-4">
              <span className="font-mono text-[10px] text-text-muted font-bold block tracking-wider">DIRECTORIES</span>
              
              {loading ? (
                <div className="text-center py-12 font-mono text-[11px] text-text-muted animate-pulse">Scanning directories...</div>
              ) : filteredFolders.length === 0 ? (
                <div className="text-center py-6 text-text-muted font-mono text-[10px]">// Empty repository</div>
              ) : (
                <div className="space-y-3 font-sans text-xs">
                  {filteredFolders.map((fold) => (
                    <div key={fold.id} className="space-y-1.5">
                      <div className="flex items-center gap-2 text-text-heading font-semibold">
                        <Folder className="w-4 h-4 text-primary shrink-0" />
                        <span>{fold.name}</span>
                      </div>

                      {/* Files list inside folder */}
                      <div className="pl-6 space-y-1 border-l border-border-normal/40">
                        {fold.files.map((file) => {
                          const isSelected = selectedFileId === file.id;
                          return (
                            <div
                              key={file.id}
                              onClick={() => setSelectedFileId(file.id)}
                              className={`group py-1 px-2 rounded-lg cursor-pointer flex items-center justify-between transition-colors ${
                                isSelected ? 'bg-primary/10 text-primary font-semibold' : 'text-text-body hover:bg-bg-elevated hover:text-text-heading'
                              }`}
                            >
                              <div className="flex items-center gap-1.5 min-w-0">
                                <FileText className="w-3.5 h-3.5 shrink-0" />
                                <span className="truncate">{file.name}</span>
                              </div>

                              <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                  onClick={(e) => { e.stopPropagation(); handleTogglePin(file); }}
                                  className={`p-0.5 rounded ${file.isPinned ? 'text-primary' : 'text-text-muted hover:text-text-heading'}`}
                                >
                                  <Pin className="w-3 h-3" />
                                </button>
                                {role !== 'Read Only' && (
                                  <button
                                    onClick={(e) => { e.stopPropagation(); handleDeleteFile(file); }}
                                    className="p-0.5 rounded text-text-muted hover:text-cyber-danger"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                        {fold.files.length === 0 && (
                          <span className="text-[10px] text-text-muted font-mono italic pl-2">Empty folder</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Pinned quick access at bottom */}
            {pinnedFiles.length > 0 && (
              <div className="pt-4 border-t border-border-normal/40 mt-4 space-y-2">
                <span className="font-mono text-[9px] text-text-muted block font-semibold">PINNED DOCUMENTS</span>
                <div className="space-y-1.5 text-xs text-text-body">
                  {pinnedFiles.map((file) => (
                    <div
                      key={file.id}
                      onClick={() => setSelectedFileId(file.id)}
                      className="flex items-center gap-2 hover:text-text-heading cursor-pointer"
                    >
                      <Pin className="w-3 h-3 text-primary shrink-0" />
                      <span className="truncate">{file.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        </div>

        {/* RIGHT SIDE WORKSPACE (Editor & Live Markdown Previews) */}
        <div className="flex-1 bg-bg-surface border border-border-normal rounded-xl p-6 flex flex-col justify-between items-stretch">
          {selectedFileId ? (
            loadingFile ? (
              <div className="text-center py-24 font-mono text-xs text-text-muted animate-pulse">
                {"// Fetching markdown file contents..."}
              </div>
            ) : fileDetail ? (
              <div className="h-full flex flex-col justify-between space-y-4">
                
                {/* File Header Panel */}
                <div className="flex items-center justify-between border-b border-border-normal pb-3">
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-primary" />
                    {editMode ? (
                      <input
                        type="text"
                        value={editorName}
                        onChange={(e) => setEditorName(e.target.value)}
                        className="bg-bg-primary border border-border-normal rounded px-2 py-1 text-sm font-semibold text-text-heading focus:outline-none focus:border-primary font-mono"
                      />
                    ) : (
                      <h3 className="font-display font-bold text-text-heading text-sm sm:text-base font-mono">{fileDetail.name}</h3>
                    )}
                  </div>

                  <div className="flex items-center gap-2.5 text-xs">
                    {/* Favorite pin */}
                    <button
                      onClick={() => handleToggleFavorite(fileDetail)}
                      className={`p-2 border border-border-normal hover:border-primary rounded-lg transition-colors ${
                        fileDetail.isFavorite ? 'text-primary' : 'text-text-muted hover:text-text-heading'
                      }`}
                      title={fileDetail.isFavorite ? "Remove Favorite" : "Add Favorite"}
                    >
                      <Star className="w-4 h-4" />
                    </button>

                    {role !== 'Read Only' && (
                      <>
                        {editMode ? (
                          <>
                            <button
                              onClick={() => setPreviewSplit(!previewSplit)}
                              className="h-9 px-3 border border-border-normal hover:bg-bg-elevated text-text-body font-mono text-[11px] rounded-lg transition-colors flex items-center gap-1.5"
                            >
                              <ArrowLeftRight className="w-3.5 h-3.5" />
                              <span>{previewSplit ? 'PREVIEW ONLY' : 'SPLIT VIEW'}</span>
                            </button>
                            
                            <button
                              onClick={handleSaveFileContent}
                              className="h-9 px-4 rounded-lg bg-primary hover:bg-opacity-90 text-black font-bold font-mono text-[11px] flex items-center gap-1.5"
                            >
                              <Save className="w-3.5 h-3.5" />
                              <span>SAVE</span>
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => setEditMode(true)}
                            className="h-9 px-4 rounded-lg border border-border-normal hover:bg-bg-elevated text-text-body font-mono text-[11px] flex items-center gap-1.5"
                          >
                            <Edit className="w-3.5 h-3.5 text-text-muted" />
                            <span>EDIT</span>
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>

                {/* Main Content Area */}
                <div className="flex-1 min-h-[350px] grid grid-cols-1 lg:grid-cols-2 gap-4 items-stretch">
                  
                  {/* Markdown Text Area Editor */}
                  {editMode ? (
                    <div className="flex flex-col gap-2">
                      <span className="font-mono text-[9px] text-text-muted">EDIT MARKDOWN CODE</span>
                      <textarea
                        value={editorContent}
                        onChange={(e) => setEditorContent(e.target.value)}
                        className="w-full flex-1 p-4 bg-bg-primary border border-border-normal rounded-xl text-xs text-text-heading font-mono focus:outline-none focus:border-primary resize-none"
                      />
                    </div>
                  ) : null}

                  {/* Markdown Live Preview Viewer */}
                  {(!editMode || previewSplit) ? (
                    <div className="flex flex-col gap-2 min-h-[300px]">
                      <span className="font-mono text-[9px] text-text-muted">PREVIEW COMPILED</span>
                      <div className="prose prose-sm prose-invert max-w-none w-full flex-1 p-5 bg-bg-primary/50 border border-border-normal/60 rounded-xl overflow-y-auto font-sans text-xs text-text-body leading-relaxed markdown-body">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {editMode ? editorContent : fileDetail.content}
                        </ReactMarkdown>
                      </div>
                    </div>
                  ) : null}

                </div>

                {/* Version rollback control */}
                <div className="border-t border-border-normal/40 pt-4 flex flex-col sm:flex-row justify-between gap-3 items-center text-[10px] font-mono">
                  <div className="flex items-center gap-1.5 text-text-muted">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Last modified {new Date(fileDetail.updatedAt).toLocaleString()}</span>
                  </div>

                  {fileDetail.versions.length > 1 && (
                    <div className="flex items-center gap-2">
                      <span className="text-text-muted">VERSION SYSTEM:</span>
                      <select
                        onChange={(e) => {
                          if (e.target.value) {
                            handleRollback(parseInt(e.target.value, 10));
                            e.target.value = '';
                          }
                        }}
                        className="px-2 py-1 bg-bg-primary border border-border-normal rounded text-[10px] text-text-heading focus:outline-none"
                      >
                        <option value="">History Rollback...</option>
                        {fileDetail.versions.map((ver) => (
                          <option key={ver.id} value={ver.version}>
                            V{ver.version} - by {ver.updatedBy} ({new Date(ver.createdAt).toLocaleDateString()})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

              </div>
            ) : null
          ) : (
            <div className="flex flex-col items-center justify-center text-center py-24 select-none">
              <FileText className="w-12 h-12 text-text-muted mb-3" />
              <h3 className="font-display font-bold text-text-heading text-sm">// Select Document File</h3>
              <p className="text-[11px] text-text-muted font-mono max-w-sm mt-1 leading-relaxed">
                Choose a markdown document from the folder directory structure or create a new file to write brand assets, minutes or guidelines.
              </p>
            </div>
          )}
        </div>

      </div>

      {/* CREATE FOLDER MODAL */}
      {showFolderModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={handleCreateFolder} className="bg-bg-surface border border-border-normal rounded-xl max-w-sm w-full p-6 space-y-4 animate-in scale-in duration-200">
            <div className="flex items-center justify-between border-b border-border-normal pb-3">
              <h3 className="font-display font-bold text-text-heading text-sm">{"// Create Document Directory"}</h3>
              <button type="button" onClick={() => setShowFolderModal(false)} className="text-text-muted hover:text-text-heading">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs text-sans">
              <div className="flex flex-col gap-1.5">
                <label className="text-text-heading font-semibold">Folder Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Legal Documents"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  className="h-10 px-3 bg-bg-primary border border-border-normal rounded-lg text-text-heading focus:outline-none"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-text-heading font-semibold">Parent Directory (Optional)</label>
                <select
                  value={selectedParentFolderId}
                  onChange={(e) => setSelectedParentFolderId(e.target.value)}
                  className="h-10 px-3 bg-bg-primary border border-border-normal rounded-lg text-text-heading focus:outline-none"
                >
                  <option value="">Root Level</option>
                  {folders.map((f) => (
                    <option key={f.id} value={f.id}>{f.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 text-xs">
              <button
                type="button"
                onClick={() => setShowFolderModal(false)}
                className="h-9 px-4 rounded-lg border border-border-normal hover:bg-bg-elevated font-mono"
              >
                CANCEL
              </button>
              <button
                type="submit"
                className="h-9 px-5 rounded-lg bg-primary hover:bg-opacity-90 text-black font-bold font-mono"
              >
                CREATE
              </button>
            </div>
          </form>
        </div>
      )}

      {/* CREATE FILE MODAL */}
      {showFileModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={handleCreateFile} className="bg-bg-surface border border-border-normal rounded-xl max-w-sm w-full p-6 space-y-4 animate-in scale-in duration-200">
            <div className="flex items-center justify-between border-b border-border-normal pb-3">
              <h3 className="font-display font-bold text-text-heading text-sm">{"// Create Markdown Document"}</h3>
              <button type="button" onClick={() => setShowFileModal(false)} className="text-text-muted hover:text-text-heading">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs text-sans">
              <div className="flex flex-col gap-1.5">
                <label className="text-text-heading font-semibold">File Title Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. meeting_notes_12_04.md"
                  value={newFileName}
                  onChange={(e) => setNewFileName(e.target.value)}
                  className="h-10 px-3 bg-bg-primary border border-border-normal rounded-lg text-text-heading focus:outline-none font-mono"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-text-heading font-semibold">Destination Folder Directory *</label>
                <select
                  required
                  value={targetFolderId}
                  onChange={(e) => setTargetFolderId(e.target.value)}
                  className="h-10 px-3 bg-bg-primary border border-border-normal rounded-lg text-text-heading focus:outline-none"
                >
                  <option value="">Choose directory...</option>
                  {folders.map((f) => (
                    <option key={f.id} value={f.id}>{f.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 text-xs">
              <button
                type="button"
                onClick={() => setShowFileModal(false)}
                className="h-9 px-4 rounded-lg border border-border-normal hover:bg-bg-elevated font-mono"
              >
                CANCEL
              </button>
              <button
                type="submit"
                disabled={!targetFolderId}
                className="h-9 px-5 rounded-lg bg-primary hover:bg-opacity-90 text-black font-bold font-mono disabled:opacity-50"
              >
                CREATE FILE
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}
