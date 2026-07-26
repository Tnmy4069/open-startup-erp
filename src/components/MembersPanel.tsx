'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '@/context/AppContext';
import { AppConfig } from '@/lib/config';
import { Preloader } from './Preloader';
import {
  User,
  Plus,
  X,
  Search,
  Mail,
  Phone,
  Edit2,
  Trash2,
  Calendar,
  Globe,
  Award,
  CheckCircle,
  FileSpreadsheet,
  Clock,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  MapPin,
  ChevronDown,
  Upload,
  Share2,
  Link as LinkIcon
} from 'lucide-react';

interface Member {
  id: string;
  slug: string | null;
  name: string;
  photo: string | null;
  email: string;
  phone: string;
  college: string;
  department: string;
  year: string;
  orgName: string | null;
  designation: string | null;
  skills: string[];
  domains: string[];
  position: string;
  role: string;
  status: string;
  availability: string;
  bio: string | null;
  linkedin: string | null;
  github: string | null;
  portfolio: string | null;
  emergencyContact: string | null;
  joinedDate: string;
  notes: string | null;
  badges: string[];
  certificates: string[];
}

interface MemberActivity {
  id: string;
  action: string;
  date: string;
}

interface MemberDetail extends Member {
  activityHistory: MemberActivity[];
  stats: {
    eventsAttended: number;
    tasksCompleted: number;
    totalTasks: number;
    totalAssets: number;
    totalReceived: number;
    totalPaid: number;
  };
}

export function MembersPanel({ globalSearch }: { globalSearch: string }) {
  const { role, refreshTrigger, triggerNotification } = useApp();

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val);
  };

  const [members, setMembers] = useState<Member[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  // Filters
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [availabilityFilter, setAvailabilityFilter] = useState('');
  const [domainFilter, setDomainFilter] = useState('');
  const [localSearch, setLocalSearch] = useState('');

  // Selected Detail
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<MemberDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Modal forms
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formCollege, setFormCollege] = useState('');
  const [formDept, setFormDept] = useState('');
  const [formYear, setFormYear] = useState('1st Year');
  const [formPosition, setFormPosition] = useState('Volunteer');
  const [formRole, setFormRole] = useState('Volunteer');
  const [formStatus, setFormStatus] = useState('Active');
  const [formAvail, setFormAvail] = useState('High');
  const [formBio, setFormBio] = useState('');
  const [formLinkedin, setFormLinkedin] = useState('');
  const [formGithub, setFormGithub] = useState('');
  const [formPortfolio, setFormPortfolio] = useState('');
  const [formSkills, setFormSkills] = useState('');
  const [formDomains, setFormDomains] = useState('');
  const [formEmergency, setFormEmergency] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [formOrgName, setFormOrgName] = useState('');
  const [formDesignation, setFormDesignation] = useState('');
  const [formMemberType, setFormMemberType] = useState<'Student' | 'Professional'>('Student');
  const [formSlug, setFormSlug] = useState('');

  const fetchMembers = async () => {
    try {
      setMembers((prev) => {
        if (prev.length === 0) setLoading(true);
        return prev;
      });
      const activeSearch = globalSearch || localSearch;
      const params = new URLSearchParams({
        search: activeSearch,
        role: roleFilter,
        status: statusFilter,
        availability: availabilityFilter,
        domain: domainFilter,
        page: page.toString(),
        limit: '9'
      });
      const res = await fetch(`/api/members?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setMembers(data.members || []);
        setTotal(data.total || 0);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchDetail = async (id: string) => {
    try {
      setLoadingDetail(true);
      const res = await fetch(`/api/members/${id}`);
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

  useEffect(() => {
    fetchMembers();
  }, [page, roleFilter, statusFilter, availabilityFilter, domainFilter, localSearch, globalSearch, refreshTrigger]);

  useEffect(() => {
    if (selectedId) {
      fetchDetail(selectedId);
    } else {
      setDetail(null);
    }
  }, [selectedId]);

  const handleOpenAdd = () => {
    setEditingMember(null);
    setFormName('');
    setFormEmail('');
    setFormPhone('');
    setFormCollege(`${AppConfig.name.toUpperCase()} CAMPUS`);
    setFormDept('Computer Science');
    setFormYear('1st Year');
    setFormPosition('Volunteer');
    setFormRole('Volunteer');
    setFormStatus('Active');
    setFormAvail('High');
    setFormBio('');
    setFormLinkedin('');
    setFormGithub('');
    setFormPortfolio('');
    setFormSkills('React, Node.js');
    setFormDomains('Web Development');
    setFormEmergency('');
    setFormNotes('');
    setFormOrgName('');
    setFormDesignation('');
    setFormMemberType('Student');
    setFormSlug('');
    setShowAddModal(true);
  };

  const handleOpenEdit = (m: Member, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingMember(m);
    setFormName(m.name);
    setFormEmail(m.email);
    setFormPhone(m.phone);
    setFormCollege(m.college);
    setFormDept(m.department);
    setFormYear(m.year);
    setFormPosition(m.position);
    setFormRole(m.role);
    setFormStatus(m.status);
    setFormAvail(m.availability);
    setFormBio(m.bio || '');
    setFormLinkedin(m.linkedin || '');
    setFormGithub(m.github || '');
    setFormPortfolio(m.portfolio || '');
    setFormSkills(m.skills.join(', '));
    setFormDomains(m.domains.join(', '));
    setFormEmergency(m.emergencyContact || '');
    setFormNotes(m.notes || '');
    setFormOrgName(m.orgName || '');
    setFormDesignation(m.designation || '');
    setFormMemberType((m.orgName || m.designation) ? 'Professional' : 'Student');
    setFormSlug(m.slug || '');
    setShowAddModal(true);
  };

  const handleDelete = async (m: Member, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm(`Are you sure you want to remove ${m.name} from the registry?`)) return;

    try {
      const res = await fetch(`/api/members/${m.id}`, { method: 'DELETE' });
      if (res.ok) {
        triggerNotification(`Removed member profile for ${m.name}`, 'Deleted');
        if (selectedId === m.id) setSelectedId(null);
        fetchMembers();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to delete member profile');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      const url = editingMember ? `/api/members/${editingMember.id}` : '/api/members';
      const method = editingMember ? 'PUT' : 'POST';

      const payload = {
        name: formName,
        email: formEmail,
        phone: formPhone,
        college: formMemberType === 'Student' ? formCollege : '',
        department: formMemberType === 'Student' ? formDept : '',
        year: formMemberType === 'Student' ? formYear : '',
        orgName: formMemberType === 'Professional' ? formOrgName : '',
        designation: formMemberType === 'Professional' ? formDesignation : '',
        position: formPosition,
        role: formRole,
        status: formStatus,
        availability: formAvail,
        bio: formBio,
        linkedin: formLinkedin,
        github: formGithub,
        portfolio: formPortfolio,
        skills: formSkills.split(',').map((s) => s.trim()).filter(Boolean),
        domains: formDomains.split(',').map((d) => d.trim()).filter(Boolean),
        emergencyContact: formEmergency,
        notes: formNotes,
        slug: formSlug || null,
      };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setShowAddModal(false);
        triggerNotification(
          editingMember ? `Updated member profile ${formName}` : `Created member profile ${formName}`,
          editingMember ? 'Updated' : 'Created'
        );
        fetchMembers();
        if (selectedId && editingMember?.id === selectedId) {
          fetchDetail(selectedId);
        }
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to submit member details');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const exportCSV = () => {
    // Generate raw CSV content
    const headers = ['Name', 'Email', 'Phone', 'College', 'Department', 'Year', 'Organization Name', 'Designation', 'Role', 'Status', 'Availability'];
    const rows = members.map((m) => [
      m.name,
      m.email,
      m.phone,
      m.college || '',
      m.department || '',
      m.year || '',
      m.orgName || '',
      m.designation || '',
      m.role,
      m.status,
      m.availability
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' 
      + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${AppConfig.prefix}_member_registry_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const fileInputRef = useRef<HTMLInputElement>(null);

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const parseCSV = (text: string): string[][] => {
    const lines: string[][] = [];
    let row: string[] = [""];
    let inQuotes = false;

    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      const next = text[i + 1];
      if (c === '"') {
        if (inQuotes && next === '"') {
          row[row.length - 1] += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (c === ',' && !inQuotes) {
        row.push('');
      } else if ((c === '\r' || c === '\n') && !inQuotes) {
        if (c === '\r' && next === '\n') {
          i++;
        }
        lines.push(row);
        row = [''];
      } else {
        row[row.length - 1] += c;
      }
    }
    if (row.length > 1 || row[0] !== '') {
      lines.push(row);
    }
    return lines.filter(r => r.some(cell => cell.trim() !== ''));
  };

  const handleImportCSV = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    event.target.value = '';

    const reader = new FileReader();
    reader.onload = async (e) => {
      const text = e.target?.result as string;
      if (!text) return;

      try {
        const rows = parseCSV(text);
        if (rows.length < 2) {
          alert('CSV file is empty or invalid.');
          return;
        }

        const headers = rows[0].map((h) => h.trim().toLowerCase());
        const dataRows = rows.slice(1);

        const parsedMembers = dataRows.map((row) => {
          const m: any = {};
          headers.forEach((header, index) => {
            const val = row[index] ? row[index].trim() : '';
            if (header === 'name') m.name = val;
            else if (header === 'email') m.email = val;
            else if (header === 'phone') m.phone = val;
            else if (header === 'college') m.college = val;
            else if (header === 'department') m.department = val;
            else if (header === 'year') m.year = val;
            else if (header === 'organization name' || header === 'organizationname' || header === 'org name' || header === 'orgname' || header === 'company') m.orgName = val;
            else if (header === 'designation') m.designation = val;
            else if (header === 'position') m.position = val;
            else if (header === 'role') m.role = val;
            else if (header === 'status') m.status = val;
            else if (header === 'availability') m.availability = val;
            else if (header === 'bio') m.bio = val;
            else if (header === 'linkedin') m.linkedin = val;
            else if (header === 'github') m.github = val;
            else if (header === 'portfolio') m.portfolio = val;
            else if (header === 'emergency contact' || header === 'emergencycontact') m.emergencyContact = val;
            else if (header === 'notes') m.notes = val;
            else if (header === 'skills') {
              m.skills = val ? val.split(',').map((s: string) => s.trim()).filter(Boolean) : [];
            } else if (header === 'domains') {
              m.domains = val ? val.split(',').map((d: string) => d.trim()).filter(Boolean) : [];
            }
          });
          return m;
        }).filter((m: any) => m.name && m.email);

        if (parsedMembers.length === 0) {
          alert('No valid rows with Name and Email found in the CSV.');
          return;
        }

        const confirmMsg = `Found ${parsedMembers.length} member records. Do you want to proceed with the import?`;
        if (!confirm(confirmMsg)) return;

        setLoading(true);
        const res = await fetch('/api/members/import', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ members: parsedMembers })
        });

        if (res.ok) {
          const result = await res.json();
          alert(`Import Completed:\n- Imported: ${result.importedCount}\n- Skipped/Duplicates: ${result.skippedCount}${result.errors && result.errors.length > 0 ? '\n\nErrors/Skipped Details:\n' + result.errors.join('\n') : ''}`);
          triggerNotification(`Imported ${result.importedCount} members via CSV.`, 'Created');
          fetchMembers();
        } else {
          const errData = await res.json();
          alert(errData.error || 'Failed to import CSV.');
        }
      } catch (err: any) {
        console.error(err);
        alert(`Error parsing CSV file: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };
    reader.readAsText(file);
  };

  const totalPages = Math.ceil(total / 9);

  return (
    <div className="space-y-6">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-text-heading font-display tracking-wide">{"// Member Operating Directory"}</h2>
          <p className="text-[10px] text-text-muted font-mono mt-0.5 font-semibold">Track community profiles, domain skills and tasks</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={exportCSV}
            className="flex items-center gap-2 h-10 px-4 rounded-lg border border-border-normal text-text-body hover:bg-bg-elevated hover:text-text-heading text-xs font-semibold font-mono transition-all duration-150 cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-text-muted" />
            <span>EXPORT CSV</span>
          </button>
          
          {role !== 'Read Only' && (
            <>
              <button
                onClick={triggerFileInput}
                className="flex items-center gap-2 h-10 px-4 rounded-lg border border-border-normal text-text-body hover:bg-bg-elevated hover:text-text-heading text-xs font-semibold font-mono transition-all duration-150 cursor-pointer"
              >
                <Upload className="w-4 h-4 text-text-muted" />
                <span>IMPORT CSV</span>
              </button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImportCSV}
                accept=".csv"
                className="hidden"
              />
              <button
                onClick={handleOpenAdd}
                className="flex items-center gap-2 h-10 px-4 rounded-lg bg-primary hover:bg-opacity-95 text-black font-semibold text-xs font-sans transition-all duration-150 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Register Member</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* FILTER & SEARCH BAR */}
      <div className="bg-bg-surface border border-border-normal rounded-xl p-4 flex flex-col md:flex-row md:items-center gap-3.5">
        
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input
            type="text"
            placeholder="Filter by name, email, college, or skills..."
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            className="w-full h-10 pl-9 pr-4 bg-bg-primary border border-border-normal rounded-lg text-xs text-text-heading focus:outline-none focus:border-primary placeholder-text-muted font-sans"
          />
        </div>

        {/* Multi Filters */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 md:w-auto shrink-0 text-xs">
          <select
            value={roleFilter}
            onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
            className="h-10 px-3 bg-bg-primary border border-border-normal rounded-lg text-text-heading focus:outline-none focus:border-primary font-mono text-[11px]"
          >
            <option value="">All Roles</option>
            <option value="Founder">Founder</option>
            <option value="Core Team">Core Team</option>
            <option value="Lead">Lead</option>
            <option value="Executive">Executive</option>
            <option value="Volunteer">Volunteer</option>
            <option value="Member">Member</option>
            <option value="Alumni">Alumni</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="h-10 px-3 bg-bg-primary border border-border-normal rounded-lg text-text-heading focus:outline-none focus:border-primary font-mono text-[11px]"
          >
            <option value="">All Status</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>

          <select
            value={availabilityFilter}
            onChange={(e) => { setAvailabilityFilter(e.target.value); setPage(1); }}
            className="h-10 px-3 bg-bg-primary border border-border-normal rounded-lg text-text-heading focus:outline-none focus:border-primary font-mono text-[11px]"
          >
            <option value="">Availability</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>

          <input
            type="text"
            placeholder="Domain (e.g. Design)"
            value={domainFilter}
            onChange={(e) => { setDomainFilter(e.target.value); setPage(1); }}
            className="h-10 px-3 bg-bg-primary border border-border-normal rounded-lg text-text-heading focus:outline-none focus:border-primary text-[11px] placeholder-text-muted"
          />
        </div>
      </div>

      {/* CORE WORKSPACE GRID */}
      <div className="flex flex-col lg:flex-row gap-6">
        
        {/* MEMBERS CARD GRID */}
        <div className="flex-1 space-y-6">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-44 bg-bg-surface border border-border-normal/40 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : members.length === 0 ? (
            <div className="bg-bg-surface border border-border-normal rounded-xl py-16 text-center">
              <User className="w-10 h-10 text-text-muted mx-auto mb-2" />
              <p className="font-mono text-xs text-text-muted">{"// No members match search parameters."}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {members.map((m) => {
                const isSelected = selectedId === m.id;
                return (
                  <div
                    key={m.id}
                    onClick={() => setSelectedId(isSelected ? null : m.id)}
                    className={`bg-bg-surface border rounded-xl p-5 hover:border-primary transition-all duration-200 cursor-pointer flex flex-col justify-between h-52 relative group ${
                      isSelected ? 'border-primary shadow-sm bg-primary/2' : 'border-border-normal'
                    }`}
                  >
                    <div className="space-y-3.5">
                      {/* Name / Avatar / Actions */}
                      <div className="flex justify-between items-start gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold shrink-0">
                            {m.photo ? (
                              <img src={m.photo} alt={m.name} className="w-full h-full object-cover rounded-lg" />
                            ) : (
                              m.name.charAt(0).toUpperCase()
                            )}
                          </div>
                          <div className="min-w-0">
                            <h3 className="font-display font-bold text-text-heading text-sm truncate">{m.name}</h3>
                            <span className="text-[9px] text-text-muted font-mono tracking-wider truncate max-w-[150px]" title={m.designation || m.position}>
                              {(m.designation || m.position).toUpperCase()}
                            </span>
                          </div>
                        </div>

                        <div className="flex gap-1 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              const slugOrId = m.slug || m.id;
                              const publicUrl = `${window.location.origin}/public/members/${slugOrId}`;
                              navigator.clipboard.writeText(publicUrl);
                              triggerNotification('Public profile link copied!', 'Info');
                            }}
                            className="p-1 rounded hover:bg-bg-elevated hover:text-primary text-text-muted transition-colors"
                            title="Copy Public Profile Link"
                          >
                            <LinkIcon className="w-3.5 h-3.5" />
                          </button>
                          {role !== 'Read Only' && (
                            <>
                              <button
                                onClick={(e) => handleOpenEdit(m, e)}
                                className="p-1 rounded hover:bg-bg-elevated hover:text-text-heading text-text-muted transition-colors"
                                title="Edit Member"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              {(role === 'Super Admin' || role === 'Co-Founder') && (
                                <button
                                  onClick={(e) => handleDelete(m, e)}
                                  className="p-1 rounded hover:bg-cyber-danger/10 hover:text-cyber-danger text-text-muted transition-colors"
                                  title="Remove Member"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </div>

                      {/* Contact Info */}
                      <div className="space-y-1.5 text-xs text-text-body">
                        <div className="flex items-center gap-2">
                          <Mail className="w-3.5 h-3.5 text-text-muted shrink-0" />
                          <span className="truncate">{m.email}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone className="w-3.5 h-3.5 text-text-muted shrink-0" />
                          <span>{m.phone || 'No phone logs'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Metadata Badges */}
                    <div className="flex items-center justify-between pt-3.5 border-t border-border-normal/40 text-[9px] font-mono">
                      <span className={`px-2 py-0.5 rounded border ${
                        m.availability === 'High' 
                          ? 'bg-cyber-success/10 border-cyber-success/20 text-cyber-success'
                          : m.availability === 'Medium'
                            ? 'bg-cyber-warning/10 border-cyber-warning/20 text-cyber-warning'
                            : 'bg-cyber-danger/10 border-cyber-danger/20 text-cyber-danger'
                      }`}>
                        AVAIL: {m.availability.toUpperCase()}
                      </span>

                      <span className="text-text-muted truncate max-w-32" title={m.orgName || m.college}>
                        {(m.orgName || m.college || '').toUpperCase()}
                      </span>
                    </div>

                  </div>
                );
              })}
            </div>
          )}

          {/* PAGINATION ROW */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-border-normal/40 pt-4 font-mono text-xs">
              <span className="text-text-muted">Total Results: <span className="text-text-heading font-bold">{total}</span></span>

              <div className="flex gap-2">
                <button
                  disabled={page === 1}
                  onClick={() => setPage(p => p - 1)}
                  className="p-2 border border-border-normal hover:bg-bg-elevated text-text-body rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <div className="flex items-center px-3 border border-border-normal rounded-lg text-text-heading font-bold">
                  {page} / {totalPages}
                </div>
                <button
                  disabled={page === totalPages}
                  onClick={() => setPage(p => p + 1)}
                  className="p-2 border border-border-normal hover:bg-bg-elevated text-text-body rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* MEMBER DETAIL VIEW SIDEBAR */}
        {selectedId && (
          <div className="w-full lg:w-96 bg-bg-surface border border-border-normal rounded-xl p-6 flex flex-col justify-between min-h-[400px] shrink-0 animate-in fade-in slide-in-from-right-4 duration-200">
            {loadingDetail ? (
              <div className="py-20 flex items-center justify-center">
                <Preloader message="Fetching member profile logs..." size="sm" />
              </div>
            ) : detail ? (
              <div className="space-y-6">
                
                {/* Header Profile */}
                <div className="flex items-start justify-between">
                  <div className="flex gap-4">
                    <div className="w-14 h-14 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary text-xl font-bold font-mono">
                      {detail.photo ? (
                        <img src={detail.photo} alt={detail.name} className="w-full h-full object-cover rounded-xl" />
                      ) : (
                        detail.name.charAt(0).toUpperCase()
                      )}
                    </div>
                    <div>
                      <h3 className="font-display font-bold text-text-heading text-base">{detail.name}</h3>
                      <p className="text-[10px] text-text-muted font-mono">{detail.position} / {detail.role}</p>
                      
                      <div className="flex items-center gap-1.5 mt-2">
                        <span className={`w-1.5 h-1.5 rounded-full ${detail.status === 'Active' ? 'bg-cyber-success' : 'bg-text-muted'}`} />
                        <span className="text-[10px] font-mono text-text-muted">{detail.status}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        const slugOrId = detail.slug || detail.id;
                        const publicUrl = `${window.location.origin}/public/members/${slugOrId}`;
                        navigator.clipboard.writeText(publicUrl);
                        triggerNotification('Public profile link copied!', 'Info');
                      }}
                      className="p-1.5 hover:bg-primary/10 hover:text-primary text-text-muted rounded-lg transition-colors"
                      title="Copy Public Profile Link"
                    >
                      <LinkIcon className="w-4 h-4" />
                    </button>
                    <button
                      onClick={async (e) => {
                        e.stopPropagation();
                        const slugOrId = detail.slug || detail.id;
                        const publicUrl = `${window.location.origin}/public/members/${slugOrId}`;
                        if (navigator.share) {
                          try {
                            await navigator.share({
                              title: detail.name,
                              text: `Check out ${detail.name}'s ${AppConfig.name} Profile`,
                              url: publicUrl,
                            });
                          } catch (error) {
                            console.error('Error sharing:', error);
                          }
                        } else {
                          navigator.clipboard.writeText(publicUrl);
                          triggerNotification('Public profile link copied!', 'Info');
                        }
                      }}
                      className="p-1.5 hover:bg-primary/10 hover:text-primary text-text-muted rounded-lg transition-colors"
                      title="Share Profile Link"
                    >
                      <Share2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setSelectedId(null)}
                      className="p-1.5 hover:bg-bg-elevated hover:text-text-heading text-text-muted rounded-lg"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Bio text */}
                {detail.bio && (
                  <p className="text-xs text-text-body font-sans italic border-l-2 border-primary/40 pl-3">
                    "{detail.bio}"
                  </p>
                )}

                {/* Education / Professional Info */}
                {(detail.orgName || detail.designation) ? (
                  <div className="bg-bg-primary rounded-xl border border-border-normal/40 p-4 space-y-2 text-xs font-sans">
                    <div className="flex justify-between">
                      <span className="text-text-muted">Organization:</span>
                      <span className="text-text-heading font-semibold">{detail.orgName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-muted">Designation:</span>
                      <span className="text-text-heading font-semibold">{detail.designation}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-muted">Emergency Contact:</span>
                      <span className="text-text-heading font-semibold font-mono">{detail.emergencyContact || 'Not recorded'}</span>
                    </div>
                  </div>
                ) : (
                  <div className="bg-bg-primary rounded-xl border border-border-normal/40 p-4 space-y-2 text-xs font-sans">
                    <div className="flex justify-between">
                      <span className="text-text-muted">College:</span>
                      <span className="text-text-heading font-semibold">{detail.college}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-muted">Department:</span>
                      <span className="text-text-heading font-semibold">{detail.department} ({detail.year})</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-muted">Emergency Contact:</span>
                      <span className="text-text-heading font-semibold font-mono">{detail.emergencyContact || 'Not recorded'}</span>
                    </div>
                  </div>
                )}

                {/* Skills & Domains */}
                <div className="space-y-3 font-mono text-[10px]">
                  <div>
                    <span className="text-text-muted block mb-1.5">DOMAINS</span>
                    <div className="flex flex-wrap gap-1.5">
                      {detail.domains.map((d, i) => (
                        <span key={i} className="px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
                          {d.toUpperCase()}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <span className="text-text-muted block mb-1.5">SKILLS</span>
                    <div className="flex flex-wrap gap-1.5">
                      {detail.skills.map((s, i) => (
                        <span key={i} className="px-2 py-0.5 rounded bg-bg-elevated text-text-heading border border-border-normal">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Performance stats */}
                <div className="grid grid-cols-2 gap-2.5 text-center font-mono text-[10px]">
                  <div className="bg-bg-primary border border-border-normal/40 p-2.5 rounded-lg">
                    <span className="text-text-muted block">TASKS DONE</span>
                    <p className="text-sm font-bold text-cyber-success mt-1">{detail.stats.tasksCompleted}/{detail.stats.totalTasks}</p>
                  </div>
                  <div className="bg-bg-primary border border-border-normal/40 p-2.5 rounded-lg">
                    <span className="text-text-muted block">EVENTS</span>
                    <p className="text-sm font-bold text-cyber-info mt-1">{detail.stats.eventsAttended}</p>
                  </div>
                </div>

                {/* Ledger figures */}
                <div className="grid grid-cols-2 gap-2.5 text-center font-mono text-[10px]">
                  <div className="bg-bg-primary border border-border-normal/40 p-2.5 rounded-lg text-cyber-success">
                    <span className="text-text-muted block">TOTAL RECEIVED</span>
                    <p className="text-[11px] font-bold mt-1">{formatCurrency(detail.stats.totalReceived || 0)}</p>
                  </div>
                  <div className="bg-bg-primary border border-border-normal/40 p-2.5 rounded-lg text-cyber-danger">
                    <span className="text-text-muted block">TOTAL PAID OUT</span>
                    <p className="text-[11px] font-bold mt-1">{formatCurrency(detail.stats.totalPaid || 0)}</p>
                  </div>
                </div>

                {/* Badges / Awards */}
                {(detail.badges.length > 0 || detail.certificates.length > 0) && (
                  <div className="space-y-2.5 text-xs">
                    <span className="font-mono text-[10px] text-text-muted">AWARDS &amp; CERTIFICATIONS</span>
                    <div className="space-y-1.5">
                      {detail.badges.map((b, i) => (
                        <div key={i} className="flex items-center gap-2 bg-cyber-warning/5 border border-cyber-warning/20 p-2 rounded-lg text-cyber-warning">
                          <Award className="w-4 h-4 shrink-0" />
                          <span className="font-semibold text-[11px]">{b} Badge</span>
                        </div>
                      ))}
                      {detail.certificates.map((c, i) => (
                        <div key={i} className="flex items-center gap-2 bg-primary/5 border border-primary/20 p-2 rounded-lg text-primary">
                          <CheckCircle className="w-4 h-4 shrink-0" />
                          <span className="font-semibold text-[11px]">{c}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Social links */}
                <div className="flex gap-2 justify-center pt-2">
                  {detail.linkedin && (
                    <a href={detail.linkedin} target="_blank" rel="noopener noreferrer" className="p-2 border border-border-normal hover:border-primary text-text-muted hover:text-text-heading rounded-lg">
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
                        <rect x="2" y="9" width="4" height="12" />
                        <circle cx="4" cy="4" r="2" />
                      </svg>
                    </a>
                  )}
                  {detail.github && (
                    <a href={detail.github} target="_blank" rel="noopener noreferrer" className="p-2 border border-border-normal hover:border-primary text-text-muted hover:text-text-heading rounded-lg">
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
                      </svg>
                    </a>
                  )}
                  {detail.portfolio && (
                    <a href={detail.portfolio} target="_blank" rel="noopener noreferrer" className="p-2 border border-border-normal hover:border-primary text-text-muted hover:text-text-heading rounded-lg">
                      <Globe className="w-4 h-4" />
                    </a>
                  )}
                </div>

                {/* Timeline activity history */}
                <div className="space-y-3 pt-3 border-t border-border-normal/40 text-xs">
                  <span className="font-mono text-[10px] text-text-muted block">TIMELINE HISTORY</span>
                  <div className="space-y-3.5 max-h-48 overflow-y-auto pr-1">
                    {detail.activityHistory.map((act) => (
                      <div key={act.id} className="flex gap-2.5 items-start">
                        <Clock className="w-3.5 h-3.5 text-text-muted shrink-0 mt-0.5" />
                        <div>
                          <p className="text-text-heading font-medium leading-tight">{act.action}</p>
                          <span className="text-[9px] text-text-muted font-mono">{new Date(act.date).toLocaleDateString()}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            ) : null}
          </div>
        )}
      </div>

      {/* REGISTRATION & EDIT MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form
            onSubmit={handleSubmit}
            className="bg-bg-surface border border-border-normal rounded-xl max-w-2xl w-full flex flex-col shadow-2xl animate-in scale-in duration-200"
          >
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-border-normal flex items-center justify-between">
              <div>
                <h3 className="font-display font-bold text-text-heading text-base">
                  {editingMember ? "// Edit Member Profile" : "// Register Member Profile"}
                </h3>
                <p className="text-[10px] text-text-muted font-mono mt-0.5">
                  Input member coordinates, role assignment and domains parameters.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-text-muted hover:text-text-heading p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form Scrollable Area */}
            <div className="p-6 overflow-y-auto max-h-[70vh] space-y-4 text-xs">
              
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-text-heading font-semibold">Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="Tanmay Hirodkar"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="h-10 px-3 bg-bg-primary border border-border-normal rounded-lg text-text-heading placeholder-text-muted focus:border-primary focus:outline-none"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-text-heading font-semibold">Email Address *</label>
                  <input
                    type="email"
                    required
                    placeholder={`user@${AppConfig.orgDomain}`}
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    className="h-10 px-3 bg-bg-primary border border-border-normal rounded-lg text-text-heading placeholder-text-muted focus:border-primary focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-text-heading font-semibold">Phone Number</label>
                  <input
                    type="text"
                    placeholder="+91..."
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    className="h-10 px-3 bg-bg-primary border border-border-normal rounded-lg text-text-heading placeholder-text-muted focus:border-primary focus:outline-none"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-text-heading font-semibold font-mono text-[10px]">MEMBER TYPE</label>
                  <select
                    value={formMemberType}
                    onChange={(e) => setFormMemberType(e.target.value as 'Student' | 'Professional')}
                    className="h-10 px-3 bg-bg-primary border border-border-normal rounded-lg text-text-heading focus:border-primary focus:outline-none font-mono text-[11px]"
                  >
                    <option value="Student">Student</option>
                    <option value="Professional">Working Professional</option>
                  </select>
                </div>
              </div>

              {formMemberType === 'Student' ? (
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-text-heading font-semibold">College</label>
                    <input
                      type="text"
                      value={formCollege}
                      onChange={(e) => setFormCollege(e.target.value)}
                      className="h-10 px-3 bg-bg-primary border border-border-normal rounded-lg text-text-heading placeholder-text-muted focus:border-primary focus:outline-none"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-text-heading font-semibold">Department &amp; Year</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="e.g. IT"
                        value={formDept}
                        onChange={(e) => setFormDept(e.target.value)}
                        className="w-2/3 h-10 px-3 bg-bg-primary border border-border-normal rounded-lg text-text-heading focus:border-primary focus:outline-none"
                      />
                      <select
                        value={formYear}
                        onChange={(e) => setFormYear(e.target.value)}
                        className="w-1/3 h-10 px-2 bg-bg-primary border border-border-normal rounded-lg text-text-heading focus:border-primary focus:outline-none font-mono"
                      >
                        <option value="1st Year">1st Yr</option>
                        <option value="2nd Year">2nd Yr</option>
                        <option value="3rd Year">3rd Yr</option>
                        <option value="4th Year">4th Yr</option>
                        <option value="Alumni">Alumni</option>
                      </select>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-text-heading font-semibold">Organization / Company Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Google, Microsoft"
                      value={formOrgName}
                      onChange={(e) => setFormOrgName(e.target.value)}
                      className="h-10 px-3 bg-bg-primary border border-border-normal rounded-lg text-text-heading placeholder-text-muted focus:border-primary focus:outline-none"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-text-heading font-semibold">Designation</label>
                    <input
                      type="text"
                      placeholder="e.g. Software Engineer, Researcher"
                      value={formDesignation}
                      onChange={(e) => setFormDesignation(e.target.value)}
                      className="h-10 px-3 bg-bg-primary border border-border-normal rounded-lg text-text-heading placeholder-text-muted focus:border-primary focus:outline-none"
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-4 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-text-heading font-semibold font-mono">ROLE TYPE</label>
                  <select
                    value={formRole}
                    onChange={(e) => setFormRole(e.target.value)}
                    className="h-10 px-3 bg-bg-primary border border-border-normal rounded-lg text-text-heading focus:border-primary focus:outline-none font-mono text-[11px]"
                  >
                    <option value="Founder">Founder</option>
                    <option value="Core Team">Core Team</option>
                    <option value="Lead">Lead</option>
                    <option value="Executive">Executive</option>
                    <option value="Volunteer">Volunteer</option>
                    <option value="Member">Member</option>
                    <option value="Alumni">Alumni</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-text-heading font-semibold font-mono">POSITION</label>
                  <input
                    type="text"
                    value={formPosition}
                    onChange={(e) => setFormPosition(e.target.value)}
                    className="h-10 px-3 bg-bg-primary border border-border-normal rounded-lg text-text-heading focus:border-primary focus:outline-none"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-text-heading font-semibold font-mono">AVAILABILITY</label>
                  <select
                    value={formAvail}
                    onChange={(e) => setFormAvail(e.target.value)}
                    className="h-10 px-3 bg-bg-primary border border-border-normal rounded-lg text-text-heading focus:border-primary focus:outline-none font-mono text-[11px]"
                  >
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-text-heading font-semibold font-mono">STATUS</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value)}
                    className="h-10 px-3 bg-bg-primary border border-border-normal rounded-lg text-text-heading focus:border-primary focus:outline-none font-mono text-[11px]"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-text-heading font-semibold">Domains (comma separated)</label>
                  <input
                    type="text"
                    placeholder="Web Dev, Cyber Security, Designing"
                    value={formDomains}
                    onChange={(e) => setFormDomains(e.target.value)}
                    className="h-10 px-3 bg-bg-primary border border-border-normal rounded-lg text-text-heading focus:border-primary focus:outline-none font-mono"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-text-heading font-semibold">Skills (comma separated)</label>
                  <input
                    type="text"
                    placeholder="React, NextJS, Python, Figma"
                    value={formSkills}
                    onChange={(e) => setFormSkills(e.target.value)}
                    className="h-10 px-3 bg-bg-primary border border-border-normal rounded-lg text-text-heading focus:border-primary focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-text-heading font-semibold">Profile Bio</label>
                <textarea
                  rows={2}
                  placeholder="Tell us about yourself..."
                  value={formBio}
                  onChange={(e) => setFormBio(e.target.value)}
                  className="p-3 bg-bg-primary border border-border-normal rounded-lg text-text-heading focus:border-primary focus:outline-none resize-none font-sans"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-text-heading font-semibold">LinkedIn Profile URL</label>
                  <input
                    type="text"
                    placeholder="https://linkedin.com/in/..."
                    value={formLinkedin}
                    onChange={(e) => setFormLinkedin(e.target.value)}
                    className="h-10 px-3 bg-bg-primary border border-border-normal rounded-lg text-text-heading focus:border-primary focus:outline-none font-mono"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-text-heading font-semibold">GitHub Profile URL</label>
                  <input
                    type="text"
                    placeholder="https://github.com/..."
                    value={formGithub}
                    onChange={(e) => setFormGithub(e.target.value)}
                    className="h-10 px-3 bg-bg-primary border border-border-normal rounded-lg text-text-heading focus:border-primary focus:outline-none font-mono"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-text-heading font-semibold">Portfolio URL</label>
                  <input
                    type="text"
                    placeholder="https://..."
                    value={formPortfolio}
                    onChange={(e) => setFormPortfolio(e.target.value)}
                    className="h-10 px-3 bg-bg-primary border border-border-normal rounded-lg text-text-heading focus:border-primary focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-text-heading font-semibold">Emergency Contact</label>
                  <input
                    type="text"
                    placeholder="Relation - Phone number"
                    value={formEmergency}
                    onChange={(e) => setFormEmergency(e.target.value)}
                    className="h-10 px-3 bg-bg-primary border border-border-normal rounded-lg text-text-heading focus:border-primary focus:outline-none"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-text-heading font-semibold">Internal Notes</label>
                  <input
                    type="text"
                    placeholder="Internal reference details"
                    value={formNotes}
                    onChange={(e) => setFormNotes(e.target.value)}
                    className="h-10 px-3 bg-bg-primary border border-border-normal rounded-lg text-text-heading focus:border-primary focus:outline-none"
                  />
                </div>
              </div>

            </div>

            {/* Modal Actions */}
            <div className="px-6 py-4 border-t border-border-normal bg-bg-elevated/20 flex justify-end gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="h-10 px-4 rounded-lg border border-border-normal hover:bg-bg-elevated text-xs font-semibold font-mono transition-colors cursor-pointer"
              >
                CANCEL
              </button>
              
              <button
                type="submit"
                disabled={isSubmitting}
                className="h-10 px-6 rounded-lg bg-primary hover:bg-opacity-90 text-black font-bold text-xs transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {isSubmitting ? 'SAVING...' : (editingMember ? 'SAVE CHANGES' : 'CREATE PROFILE')}
              </button>
            </div>

          </form>
        </div>
      )}

    </div>
  );
}
