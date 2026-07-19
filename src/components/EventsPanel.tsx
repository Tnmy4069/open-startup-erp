'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import {
  Calendar,
  Plus,
  X,
  Search,
  MapPin,
  Clock,
  Users,
  DollarSign,
  Share2,
  QrCode,
  Award,
  Mail,
  Edit2,
  Trash2,
  AlertCircle,
  FileText,
  TrendingUp,
  Tag,
  CheckCircle,
  Upload,
  Image as ImageIcon,
  RefreshCw,
  LayoutGrid,
  Table as TableIcon,
  Maximize2,
  Eye,
  Download,
  Check,
  Copy,
  PhoneCall,
  UserCheck,
  UserX,
  Star
} from 'lucide-react';

interface EventRegistration {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  status: string;
  qrCode: string | null;
  feedback: string | null;
  rating: number | null;
  createdAt?: string;
}

interface EventStats {
  total: number;
  attended: number;
  registered: number;
  noShow: number;
  capacity: number;
  spotsRemaining: number;
}

interface Event {
  id: string;
  title: string;
  slug: string;
  banner: string | null;
  description: string;
  category: string;
  eventType?: string | null;
  venue: string;
  startDate: string;
  endDate: string;
  registrationDeadline: string;
  capacity: number;
  status: string;
  visibility: string;
  budget: number;
  expectedRevenue: number;
  sponsors: string[];
  speakers: string[];
  volunteers: string[];
  organizers: string[];
  agenda: string | null;
  resources: string | null;
  registrations: EventRegistration[];
}

export function EventsPanel() {
  const { role, refreshTrigger, triggerNotification } = useApp();

  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'Upcoming' | 'Past' | 'Draft'>('Upcoming');
  
  // Selected detail
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [registrations, setRegistrations] = useState<EventRegistration[]>([]);
  const [loadingRegs, setLoadingRegs] = useState(false);

  // Full Screen View Attendees Dashboard state
  const [showAttendeesModal, setShowAttendeesModal] = useState(false);
  const [attendeesViewMode, setAttendeesViewMode] = useState<'table' | 'card'>('table');
  const [attendeesSearch, setAttendeesSearch] = useState('');
  const [attendeesFilter, setAttendeesFilter] = useState<'ALL' | 'Attended' | 'Registered' | 'No-Show'>('ALL');
  const [isRefreshingData, setIsRefreshingData] = useState(false);
  const [attendeesStats, setAttendeesStats] = useState<EventStats | null>(null);
  const [copiedQrId, setCopiedQrId] = useState<string | null>(null);

  // Forms
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // QR scanner simulation
  const [showQrModal, setShowQrModal] = useState(false);
  const [qrCodeInput, setQrCodeInput] = useState('');
  const [qrMessage, setQrMessage] = useState('');
  const [qrSuccess, setQrSuccess] = useState(false);

  // Event form states
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [banner, setBanner] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Technical');
  const [eventType, setEventType] = useState('Offline');
  const [venue, setVenue] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [regDeadline, setRegDeadline] = useState('');
  const [capacity, setCapacity] = useState('100');
  const [eventStatus, setEventStatus] = useState('Upcoming');
  const [visibility, setVisibility] = useState('Public');
  const [budget, setBudget] = useState('0');
  const [expectedRevenue, setExpectedRevenue] = useState('0');
  const [sponsors, setSponsors] = useState('');
  const [speakers, setSpeakers] = useState('');
  const [volunteers, setVolunteers] = useState('');
  const [organizers, setOrganizers] = useState('');
  const [agenda, setAgenda] = useState('');
  const [resources, setResources] = useState('');

  // Register Form modal
  const [showRegModal, setShowRegModal] = useState(false);
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');

  const handleCopyEventLink = (eventItem: Event) => {
    const slugOrId = eventItem.slug || eventItem.id;
    const publicUrl = `${window.location.origin}/public/events/${slugOrId}`;
    navigator.clipboard.writeText(publicUrl);
    triggerNotification(`Copied event link: ${eventItem.title}`, 'Copied');
  };

  const handlePosterUpload = (file: File) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert('Poster image must be less than 5MB.');
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        setBanner(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/events?status=${activeTab}`);
      if (res.ok) {
        const data = await res.json();
        setEvents(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchEventRegistrations = async (id: string, isRefresh = false) => {
    try {
      if (isRefresh) setIsRefreshingData(true);
      else setLoadingRegs(true);

      const res = await fetch(`/api/events/${id}/registrations`);
      if (res.ok) {
        const data = await res.json();
        setRegistrations(data.registrations || []);
        setAttendeesStats(data.stats || null);
        if (data.event) {
          setSelectedEvent((prev) => (prev?.id === id ? { ...prev, ...data.event } : prev));
        }
        if (isRefresh) {
          triggerNotification(`Refreshed attendee data (${data.registrations.length} total)`, 'Synced');
        }
      } else {
        // Fallback to basic endpoint
        const fallbackRes = await fetch(`/api/events/${id}`);
        if (fallbackRes.ok) {
          const fallbackData = await fallbackRes.json();
          setRegistrations(fallbackData.registrations || []);
          setSelectedEvent(fallbackData);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingRegs(false);
      setIsRefreshingData(false);
    }
  };

  const handleOpenAttendeesDashboard = (eventItem: Event) => {
    setSelectedEvent(eventItem);
    setShowAttendeesModal(true);
    fetchEventRegistrations(eventItem.id);
  };

  useEffect(() => {
    fetchEvents();
    setSelectedEvent(null);
  }, [activeTab, refreshTrigger]);

  useEffect(() => {
    if (selectedEvent) {
      fetchEventRegistrations(selectedEvent.id);
    }
  }, [refreshTrigger]);

  const handleOpenForm = (e?: Event) => {
    if (e) {
      setEditingEvent(e);
      setTitle(e.title);
      setSlug(e.slug);
      setBanner(e.banner || '');
      setDescription(e.description);
      setCategory(e.category);
      setEventType(e.eventType || 'Offline');
      setVenue(e.venue);
      setStartDate(new Date(e.startDate).toISOString().slice(0, 16));
      setEndDate(new Date(e.endDate).toISOString().slice(0, 16));
      setRegDeadline(new Date(e.registrationDeadline).toISOString().slice(0, 16));
      setCapacity(e.capacity.toString());
      setEventStatus(e.status);
      setVisibility(e.visibility);
      setBudget(e.budget.toString());
      setExpectedRevenue(e.expectedRevenue.toString());
      setSponsors(e.sponsors.join(', '));
      setSpeakers(e.speakers.join(', '));
      setVolunteers(e.volunteers.join(', '));
      setOrganizers(e.organizers.join(', '));
      setAgenda(e.agenda || '');
      setResources(e.resources || '');
    } else {
      setEditingEvent(null);
      setTitle('');
      setSlug('');
      setBanner('');
      setDescription('');
      setCategory('Technical');
      setEventType('Offline');
      setVenue('');
      setStartDate('');
      setEndDate('');
      setRegDeadline('');
      setCapacity('100');
      setEventStatus(activeTab);
      setVisibility('Public');
      setBudget('0');
      setExpectedRevenue('0');
      setSponsors('');
      setSpeakers('');
      setVolunteers('');
      setOrganizers('');
      setAgenda('');
      setResources('');
    }
    setShowFormModal(true);
  };

  const handleDelete = async (e: Event) => {
    if (!confirm(`Are you sure you want to delete ${e.title}?`)) return;

    try {
      const res = await fetch(`/api/events/${e.id}`, { method: 'DELETE' });
      if (res.ok) {
        triggerNotification(`Deleted event: ${e.title}`, 'Deleted');
        if (selectedEvent?.id === e.id) setSelectedEvent(null);
        fetchEvents();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      const url = editingEvent ? `/api/events/${editingEvent.id}` : '/api/events';
      const method = editingEvent ? 'PUT' : 'POST';

      const payload = {
        title,
        slug,
        banner,
        description,
        category,
        eventType,
        venue,
        startDate,
        endDate,
        registrationDeadline: regDeadline,
        capacity,
        status: eventStatus,
        visibility,
        budget,
        expectedRevenue,
        sponsors: sponsors.split(',').map((s) => s.trim()).filter(Boolean),
        speakers: speakers.split(',').map((s) => s.trim()).filter(Boolean),
        volunteers: volunteers.split(',').map((s) => s.trim()).filter(Boolean),
        organizers: organizers.split(',').map((s) => s.trim()).filter(Boolean),
        agenda,
        resources,
      };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setShowFormModal(false);
        triggerNotification(
          editingEvent ? `Updated event: ${title}` : `Created event draft: ${title}`,
          editingEvent ? 'Updated' : 'Created'
        );
        fetchEvents();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to save event parameters');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEvent) return;

    try {
      const res = await fetch(`/api/events/${selectedEvent.id}/registrations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: regName, email: regEmail, phone: regPhone, status: 'Registered' }),
      });

      if (res.ok) {
        setShowRegModal(false);
        setRegName('');
        setRegEmail('');
        setRegPhone('');
        triggerNotification(`Registered ${regName} successfully`, 'Registered');
        fetchEventRegistrations(selectedEvent.id, true);
      } else {
        const data = await res.json();
        alert(data.error || 'Registration failed');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleAttendanceStatus = async (reg: EventRegistration, targetStatus: string) => {
    if (!selectedEvent) return;

    try {
      const res = await fetch(`/api/events/${selectedEvent.id}/attendance`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ registrationId: reg.id, status: targetStatus }),
      });

      if (res.ok) {
        fetchEventRegistrations(selectedEvent.id, true);
        triggerNotification(`Marked ${reg.name} as ${targetStatus}`, 'Updated');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteRegistration = async (regId: string, regName: string) => {
    if (!selectedEvent || !confirm(`Delete RSVP record for ${regName}?`)) return;

    try {
      const res = await fetch(`/api/events/${selectedEvent.id}/registrations/${regId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        fetchEventRegistrations(selectedEvent.id, true);
        triggerNotification(`Deleted RSVP for ${regName}`, 'Deleted');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleMockQrScan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!qrCodeInput) return;

    setQrMessage('');
    setQrSuccess(false);

    try {
      const res = await fetch('/api/events/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ qrCode: qrCodeInput }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setQrSuccess(true);
        setQrMessage(data.message || `Check-in Successful! Attended: ${data.registration.name}`);
        setQrCodeInput('');
        triggerNotification(`Check-in: ${data.registration.name}`, 'Attended');
        if (selectedEvent) {
          fetchEventRegistrations(selectedEvent.id, true);
        }
      } else {
        setQrSuccess(false);
        setQrMessage(data.error || 'Check-in failed');
      }
    } catch (err) {
      console.error(err);
      setQrSuccess(false);
      setQrMessage('Network error processing QR check-in.');
    }
  };

  const handleExportCSV = () => {
    if (!selectedEvent || registrations.length === 0) return;
    const headers = ['Name', 'Email', 'Phone', 'Status', 'QR Code', 'Feedback', 'Rating', 'Created At'];
    const rows = registrations.map((r) => [
      `"${r.name}"`,
      `"${r.email}"`,
      `"${r.phone || ''}"`,
      `"${r.status}"`,
      `"${r.qrCode || ''}"`,
      `"${r.feedback || ''}"`,
      `"${r.rating || ''}"`,
      `"${r.createdAt ? new Date(r.createdAt).toLocaleString() : ''}"`,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${selectedEvent.slug}_attendees.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    triggerNotification(`Exported ${registrations.length} attendee records to CSV`, 'Exported');
  };

  const triggerEmailMock = () => {
    alert(`Emailed all ${registrations.length} registered participants with the event details.`);
  };

  const copyQrCodeString = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedQrId(id);
    setTimeout(() => setCopiedQrId(null), 2000);
    triggerNotification('Copied QR code pass string', 'Copied');
  };

  // Filtered registrations for Attendees Modal
  const filteredRegistrations = registrations.filter((r) => {
    const matchesSearch =
      !attendeesSearch ||
      r.name.toLowerCase().includes(attendeesSearch.toLowerCase()) ||
      r.email.toLowerCase().includes(attendeesSearch.toLowerCase()) ||
      (r.phone && r.phone.includes(attendeesSearch));

    const matchesFilter =
      attendeesFilter === 'ALL' || r.status.toLowerCase() === attendeesFilter.toLowerCase();

    return matchesSearch && matchesFilter;
  });

  const totalCount = attendeesStats?.total ?? registrations.length;
  const attendedCount = attendeesStats?.attended ?? registrations.filter((r) => r.status === 'Attended').length;
  const registeredCount = attendeesStats?.registered ?? registrations.filter((r) => r.status === 'Registered').length;
  const noShowCount = attendeesStats?.noShow ?? registrations.filter((r) => r.status === 'No-Show').length;
  const capacityNum = selectedEvent?.capacity || 100;
  const spotsLeft = attendeesStats?.spotsRemaining ?? Math.max(0, capacityNum - totalCount);

  return (
    <div className="space-y-6">
      
      {/* HEADER ROW */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-text-heading font-display tracking-wide">{"// Event Operating Lifecycle"}</h2>
          <p className="text-[10px] text-text-muted font-mono mt-0.5 font-semibold">Organize campus workshops, sponsorship drives, RSVPs, and live gate attendance</p>
        </div>

        {role !== 'Read Only' && (
          <button
            onClick={() => handleOpenForm()}
            className="flex items-center gap-2 h-10 px-4 rounded-lg bg-primary hover:bg-opacity-90 text-black font-semibold text-xs font-sans transition-all duration-150 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create Event</span>
          </button>
        )}
      </div>

      {/* FILTER SUBTABS */}
      <div className="flex justify-between items-center border-b border-border-normal/40 pb-px">
        <div className="flex gap-4 text-xs font-semibold">
          {(['Upcoming', 'Past', 'Draft'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => { setActiveTab(tab); setSelectedEvent(null); }}
              className={`pb-3 relative transition-colors cursor-pointer ${
                activeTab === tab ? 'text-primary font-bold border-b-2 border-primary' : 'text-text-body hover:text-text-heading'
              }`}
            >
              {tab.toUpperCase()} EVENTS
            </button>
          ))}
        </div>
      </div>

      {/* MAIN CONTAINER */}
      <div className="flex flex-col lg:flex-row gap-6">
        
        {/* LISTING COLS */}
        <div className="flex-1 space-y-4">
          {loading ? (
            <div className="space-y-3.5">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-32 bg-bg-surface border border-border-normal/40 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : events.length === 0 ? (
            <div className="bg-bg-surface border border-border-normal rounded-xl py-16 text-center font-mono text-xs text-text-muted">
              {"// No events found under this status."}
            </div>
          ) : (
            <div className="space-y-4">
              {events.map((e) => {
                const isSelected = selectedEvent?.id === e.id;
                return (
                  <div
                    key={e.id}
                    onClick={() => fetchEventRegistrations(e.id)}
                    className={`bg-bg-surface border rounded-xl p-5 hover:border-primary transition-all duration-200 cursor-pointer flex flex-col md:flex-row justify-between md:items-center gap-4 ${
                      isSelected ? 'border-primary shadow-sm bg-primary/2' : 'border-border-normal'
                    }`}
                  >
                    <div className="space-y-3">
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="px-2 py-0.5 rounded bg-bg-elevated border border-border-normal text-[9px] font-mono font-semibold text-primary uppercase">
                            {e.category}
                          </span>
                          <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold border ${
                            e.eventType === 'Online' ? 'bg-blue-500/10 border-blue-500/30 text-blue-400' :
                            e.eventType === 'Hybrid' ? 'bg-purple-500/10 border-purple-500/30 text-purple-400' :
                            'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                          }`}>
                            {e.eventType === 'Online' ? '🌐 ONLINE' : e.eventType === 'Hybrid' ? '⚡ HYBRID' : '📍 OFFLINE'}
                          </span>
                        </div>
                        <h3 className="font-display font-bold text-text-heading text-sm mt-1">{e.title}</h3>
                      </div>

                      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs text-text-body">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-text-muted" />
                          <span>{new Date(e.startDate).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-text-muted" />
                          <span className="truncate max-w-36">{e.venue}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex md:flex-col justify-between items-end gap-3.5 pt-3 md:pt-0 border-t md:border-t-0 border-border-normal/40 text-xs font-mono">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-text-muted" />
                        <span>{e.registrations.length} / {e.capacity}</span>
                      </div>
                      
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {/* VIEW ATTENDEES FULLSCREEN BUTTON */}
                        <button
                          title="View Attendees Fullscreen Dashboard"
                          onClick={(event) => {
                            event.stopPropagation();
                            handleOpenAttendeesDashboard(e);
                          }}
                          className="px-2.5 py-1 bg-primary/10 border border-primary/30 hover:bg-primary hover:text-black text-primary rounded-lg text-[10px] font-bold font-mono transition-all flex items-center gap-1 cursor-pointer"
                        >
                          <Users className="w-3 h-3" />
                          <span>VIEW ATTENDEES</span>
                        </button>

                        <button
                          title="Copy Public Event Link"
                          onClick={(event) => { event.stopPropagation(); handleCopyEventLink(e); }}
                          className="p-1.5 border border-border-normal hover:border-primary text-text-muted hover:text-primary rounded-lg transition-colors cursor-pointer"
                        >
                          <Share2 className="w-3.5 h-3.5" />
                        </button>

                        {role !== 'Read Only' && (
                          <>
                            <button
                              title="Edit Event"
                              onClick={(event) => { event.stopPropagation(); handleOpenForm(e); }}
                              className="p-1.5 border border-border-normal hover:border-primary text-text-muted hover:text-text-heading rounded-lg transition-colors cursor-pointer"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            {(role === 'Super Admin' || role === 'Co-Founder') && (
                              <button
                                title="Delete Event"
                                onClick={(event) => { event.stopPropagation(); handleDelete(e); }}
                                className="p-1.5 border border-border-normal hover:border-cyber-danger text-text-muted hover:text-cyber-danger rounded-lg transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* DETAILS SIDEBAR PANEL */}
        {selectedEvent && (
          <div className="w-full lg:w-96 bg-bg-surface border border-border-normal rounded-xl p-6 flex flex-col justify-between min-h-[400px] shrink-0 animate-in fade-in slide-in-from-right-4 duration-200">
            <div className="space-y-5">
              
              {/* Header title */}
              <div className="flex justify-between items-start gap-4 pb-3 border-b border-border-normal/40">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20 text-[9px] font-mono font-bold tracking-wider">
                      {selectedEvent.category.toUpperCase()}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-bg-elevated text-text-muted border border-border-normal text-[9px] font-mono font-bold">
                      {selectedEvent.eventType || 'Offline'}
                    </span>
                  </div>
                  <h3 className="font-display font-bold text-text-heading text-base mt-1.5">{selectedEvent.title}</h3>
                  <span className="text-[10px] text-text-muted font-mono">{selectedEvent.slug}</span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    title="Open Fullscreen Attendees Dashboard"
                    onClick={() => handleOpenAttendeesDashboard(selectedEvent)}
                    className="p-1.5 hover:bg-bg-elevated hover:text-primary text-text-muted rounded-lg transition-colors cursor-pointer"
                  >
                    <Maximize2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setSelectedEvent(null)}
                    className="p-1.5 hover:bg-bg-elevated hover:text-text-heading text-text-muted rounded-lg transition-colors cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* View Attendees Banner Button */}
              <button
                onClick={() => handleOpenAttendeesDashboard(selectedEvent)}
                className="w-full py-2.5 bg-primary/10 border border-primary/30 hover:bg-primary hover:text-black text-primary font-bold font-mono text-xs rounded-xl flex items-center justify-center gap-2 transition-all shadow-sm cursor-pointer"
              >
                <Users className="w-4 h-4" />
                <span>OPEN FULL ATTENDEES DASHBOARD ({registrations.length})</span>
              </button>

              {/* Description */}
              <p className="text-xs text-text-body font-sans leading-relaxed">
                {selectedEvent.description}
              </p>

              {/* Timing detail card */}
              <div className="bg-bg-primary rounded-xl border border-border-normal/40 p-4 space-y-2 text-xs font-sans">
                <div className="flex justify-between">
                  <span className="text-text-muted">Start:</span>
                  <span className="text-text-heading font-semibold font-mono">{new Date(selectedEvent.startDate).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-muted">End:</span>
                  <span className="text-text-heading font-semibold font-mono">{new Date(selectedEvent.endDate).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-muted">Venue:</span>
                  <span className="text-text-heading font-semibold">{selectedEvent.venue}</span>
                </div>
              </div>

              {/* Attendee Registry list */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-mono text-[10px] text-text-muted font-bold">REGISTRATIONS ({registrations.length})</span>
                  
                  {role !== 'Read Only' && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => fetchEventRegistrations(selectedEvent.id, true)}
                        className="text-[10px] text-primary hover:underline font-mono flex items-center gap-1"
                      >
                        <RefreshCw className={`w-3 h-3 ${isRefreshingData ? 'animate-spin' : ''}`} />
                        <span>REFRESH</span>
                      </button>
                      <button
                        onClick={() => setShowQrModal(true)}
                        className="text-[10px] text-primary hover:underline font-mono"
                      >
                        QR SCAN
                      </button>
                      <button
                        onClick={() => setShowRegModal(true)}
                        className="text-[10px] text-primary hover:underline font-mono"
                      >
                        ADD
                      </button>
                    </div>
                  )}
                </div>

                <div className="bg-bg-primary border border-border-normal/40 rounded-xl overflow-hidden max-h-48 overflow-y-auto divide-y divide-border-normal/40 text-xs">
                  {loadingRegs ? (
                    <div className="text-center py-6 font-mono text-text-muted animate-pulse">Syncing...</div>
                  ) : registrations.length === 0 ? (
                    <div className="text-center py-6 text-text-muted font-mono text-[11px]">No registrants yet</div>
                  ) : (
                    registrations.map((reg) => (
                      <div key={reg.id} className="p-3 flex justify-between items-center">
                        <div className="min-w-0">
                          <p className="text-text-heading font-semibold truncate leading-tight">{reg.name}</p>
                          <p className="text-[9px] text-text-muted font-mono truncate">{reg.email}</p>
                          {reg.phone && <span className="text-[9px] text-primary font-mono block truncate">{reg.phone}</span>}
                        </div>
                        
                        <button
                          disabled={role === 'Read Only'}
                          onClick={() => handleToggleAttendanceStatus(reg, reg.status === 'Attended' ? 'Registered' : 'Attended')}
                          className={`px-2 py-1 rounded text-[9px] font-mono font-bold border transition-colors ${
                            reg.status === 'Attended'
                              ? 'bg-cyber-success/15 border-cyber-success/30 text-cyber-success'
                              : 'bg-bg-elevated border-border-normal text-text-body hover:bg-primary hover:text-black hover:border-primary'
                          }`}
                        >
                          {reg.status.toUpperCase()}
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Actions row */}
              <div className="pt-2 border-t border-border-normal/40 flex flex-wrap gap-2">
                <button
                  onClick={() => handleCopyEventLink(selectedEvent)}
                  className="flex-1 h-9 flex items-center justify-center gap-1.5 rounded-lg bg-primary/10 border border-primary/30 text-primary hover:bg-primary hover:text-black text-[10px] font-bold font-mono transition-all cursor-pointer"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>COPY PUBLIC LINK</span>
                </button>

                {role !== 'Read Only' && registrations.length > 0 && (
                  <button
                    onClick={triggerEmailMock}
                    className="flex-1 h-9 flex items-center justify-center gap-1.5 rounded-lg border border-border-normal hover:bg-bg-elevated hover:text-text-heading text-[10px] font-bold font-mono transition-colors cursor-pointer"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    <span>EMAIL ALL</span>
                  </button>
                )}
              </div>

            </div>
          </div>
        )}
      </div>

      {/* FULL SCREEN ATTENDEES DASHBOARD MODAL */}
      {showAttendeesModal && selectedEvent && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex flex-col p-3 sm:p-6 overflow-hidden animate-in fade-in duration-200">
          <div className="bg-bg-surface border border-border-normal rounded-2xl flex-1 flex flex-col overflow-hidden shadow-2xl">
            
            {/* DASHBOARD TOP HEADER */}
            <div className="p-4 sm:p-6 border-b border-border-normal flex flex-col md:flex-row justify-between md:items-center gap-4 bg-bg-elevated/20">
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20 text-[10px] font-mono font-bold tracking-wider">
                    {selectedEvent.category.toUpperCase()}
                  </span>
                  <span className="px-2.5 py-0.5 rounded bg-bg-elevated border border-border-normal text-text-heading text-[10px] font-mono font-bold">
                    {selectedEvent.eventType || 'Offline'}
                  </span>
                  <span className="text-text-muted font-mono text-xs">ID: {selectedEvent.id}</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-extrabold text-text-heading font-display">
                  {selectedEvent.title} — Attendees Dashboard
                </h2>
                <p className="text-xs text-text-muted font-mono">
                  Live participant management, status toggles, ticket pass verification, and analytics
                </p>
              </div>

              {/* STATS BADGES */}
              <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
                <div className="px-3 py-1.5 rounded-xl bg-bg-primary border border-border-normal/60 flex items-center gap-1.5">
                  <span className="text-text-muted">TOTAL:</span>
                  <span className="font-bold text-text-heading">{totalCount}</span>
                </div>
                <div className="px-3 py-1.5 rounded-xl bg-cyber-success/10 border border-cyber-success/30 flex items-center gap-1.5 text-cyber-success font-bold">
                  <span>ATTENDED:</span>
                  <span>{attendedCount}</span>
                </div>
                <div className="px-3 py-1.5 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center gap-1.5 text-blue-400 font-bold">
                  <span>REGISTERED:</span>
                  <span>{registeredCount}</span>
                </div>
                <div className="px-3 py-1.5 rounded-xl bg-cyber-danger/10 border border-cyber-danger/30 flex items-center gap-1.5 text-cyber-danger font-bold">
                  <span>NO-SHOW:</span>
                  <span>{noShowCount}</span>
                </div>
                <div className="px-3 py-1.5 rounded-xl bg-bg-primary border border-border-normal/60 flex items-center gap-1.5 text-text-muted">
                  <span>SPOTS LEFT:</span>
                  <span className="text-primary font-bold">{spotsLeft} / {capacityNum}</span>
                </div>
              </div>

              {/* TOP ACTION BUTTONS */}
              <div className="flex items-center gap-2 self-end md:self-auto">
                <button
                  onClick={() => setShowAttendeesModal(false)}
                  className="p-2 text-text-muted hover:text-text-heading hover:bg-bg-elevated rounded-xl transition-colors cursor-pointer"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* CONTROLS TOOLBAR: REFRESH, SEARCH, FILTER, VIEW SWITCHER, EXPORT, ADD */}
            <div className="p-4 border-b border-border-normal/60 bg-bg-primary/50 flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-4">
              
              {/* Left: Search & Filter Tabs */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1">
                
                {/* Search Box */}
                <div className="relative flex-1 max-w-xs">
                  <Search className="w-4 h-4 text-text-muted absolute left-3 top-3" />
                  <input
                    type="text"
                    placeholder="Search name, email, or phone..."
                    value={attendeesSearch}
                    onChange={(e) => setAttendeesSearch(e.target.value)}
                    className="w-full h-10 pl-9 pr-3 bg-bg-surface border border-border-normal rounded-xl text-xs font-sans text-text-heading focus:outline-none focus:border-primary"
                  />
                </div>

                {/* Filter Pills */}
                <div className="flex items-center gap-1 font-mono text-xs bg-bg-surface border border-border-normal p-1 rounded-xl">
                  {(['ALL', 'Attended', 'Registered', 'No-Show'] as const).map((st) => (
                    <button
                      key={st}
                      onClick={() => setAttendeesFilter(st)}
                      className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                        attendeesFilter === st
                          ? 'bg-primary text-black shadow-sm'
                          : 'text-text-muted hover:text-text-heading'
                      }`}
                    >
                      {st.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              {/* Right: Actions (Refresh, View Mode, Export, Gate Scan, Add) */}
              <div className="flex items-center gap-2 flex-wrap justify-end">
                
                {/* REFRESH DATA BUTTON */}
                <button
                  onClick={() => fetchEventRegistrations(selectedEvent.id, true)}
                  disabled={isRefreshingData}
                  className="h-10 px-3.5 rounded-xl bg-primary/10 border border-primary/30 hover:bg-primary hover:text-black text-primary font-mono font-bold text-xs flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                  title="Sync Realtime Attendees Data"
                >
                  <RefreshCw className={`w-4 h-4 ${isRefreshingData ? 'animate-spin' : ''}`} />
                  <span>{isRefreshingData ? 'SYNCING...' : 'REFRESH DATA'}</span>
                </button>

                {/* VIEW MODE TOGGLE (TABLE vs CARD) */}
                <div className="flex items-center bg-bg-surface border border-border-normal p-1 rounded-xl font-mono text-xs">
                  <button
                    onClick={() => setAttendeesViewMode('table')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                      attendeesViewMode === 'table' ? 'bg-primary text-black shadow-sm' : 'text-text-muted hover:text-text-heading'
                    }`}
                  >
                    <TableIcon className="w-3.5 h-3.5" />
                    <span>TABLE</span>
                  </button>
                  <button
                    onClick={() => setAttendeesViewMode('card')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                      attendeesViewMode === 'card' ? 'bg-primary text-black shadow-sm' : 'text-text-muted hover:text-text-heading'
                    }`}
                  >
                    <LayoutGrid className="w-3.5 h-3.5" />
                    <span>CARDS</span>
                  </button>
                </div>

                {/* EXPORT CSV */}
                <button
                  onClick={handleExportCSV}
                  disabled={registrations.length === 0}
                  className="h-10 px-3 py-1.5 rounded-xl border border-border-normal hover:bg-bg-elevated text-text-heading font-mono font-semibold text-xs flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-40"
                  title="Export Attendees Roster to CSV"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>EXPORT CSV</span>
                </button>

                {role !== 'Read Only' && (
                  <>
                    <button
                      onClick={() => setShowQrModal(true)}
                      className="h-10 px-3 rounded-xl border border-border-normal hover:bg-bg-elevated text-text-heading font-mono font-semibold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      <QrCode className="w-3.5 h-3.5 text-primary" />
                      <span>GATE SCAN</span>
                    </button>

                    <button
                      onClick={() => setShowRegModal(true)}
                      className="h-10 px-4 rounded-xl bg-primary hover:bg-opacity-95 text-black font-bold font-mono text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>ADD ATTENDEE</span>
                    </button>
                  </>
                )}
              </div>

            </div>

            {/* DASHBOARD CONTENT BODY (TABLE OR CARDS) */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-[#070708]">
              
              {loadingRegs || isRefreshingData ? (
                <div className="py-20 flex flex-col items-center justify-center gap-3 text-text-muted font-mono text-xs">
                  <RefreshCw className="w-8 h-8 text-primary animate-spin" />
                  <p>{"// Syncing real-time event participant roster..."}</p>
                </div>
              ) : filteredRegistrations.length === 0 ? (
                <div className="py-20 text-center font-mono text-xs text-text-muted space-y-2">
                  <Users className="w-10 h-10 text-border-normal mx-auto" />
                  <p className="font-bold text-text-heading text-sm">No attendee records found</p>
                  <p className="text-[11px] text-text-muted">Try adjusting your search query or status filter.</p>
                </div>
              ) : attendeesViewMode === 'table' ? (

                /* 📊 TABLE VIEW */
                <div className="border border-border-normal/60 rounded-xl overflow-hidden shadow-lg bg-bg-surface font-sans text-xs">
                  <table className="w-full text-left divide-y divide-border-normal/40">
                    <thead className="bg-bg-elevated/40 text-text-muted font-mono text-[10px] uppercase tracking-wider">
                      <tr>
                        <th className="p-3.5 w-12 text-center">#</th>
                        <th className="p-3.5">ATTENDEE NAME</th>
                        <th className="p-3.5">CONTACT &amp; EMAIL</th>
                        <th className="p-3.5">STATUS</th>
                        <th className="p-3.5">TICKET QR CODE</th>
                        <th className="p-3.5">FEEDBACK &amp; RATING</th>
                        <th className="p-3.5 text-right">ACTIONS</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border-normal/30 bg-[#070708]">
                      {filteredRegistrations.map((reg, idx) => {
                        const statusColor =
                          reg.status === 'Attended' ? 'bg-cyber-success/15 border-cyber-success/30 text-cyber-success' :
                          reg.status === 'Registered' ? 'bg-blue-500/15 border-blue-500/30 text-blue-400' :
                          'bg-cyber-danger/15 border-cyber-danger/30 text-cyber-danger';

                        return (
                          <tr key={reg.id} className="hover:bg-bg-surface/50 transition-colors">
                            <td className="p-3.5 text-center font-mono text-text-muted">{idx + 1}</td>
                            <td className="p-3.5">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center font-bold text-primary font-display text-xs shrink-0">
                                  {reg.name.charAt(0)}
                                </div>
                                <span className="font-bold text-text-heading text-sm">{reg.name}</span>
                              </div>
                            </td>
                            <td className="p-3.5 font-mono text-[11px]">
                              <p className="text-text-heading font-semibold">{reg.email}</p>
                              {reg.phone && <p className="text-text-muted text-[10px]">{reg.phone}</p>}
                            </td>
                            <td className="p-3.5">
                              <span className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold border uppercase ${statusColor}`}>
                                {reg.status}
                              </span>
                            </td>
                            <td className="p-3.5 font-mono text-[10px]">
                              {reg.qrCode ? (
                                <button
                                  onClick={() => copyQrCodeString(reg.qrCode!, reg.id)}
                                  className="px-2 py-1 bg-bg-primary border border-border-normal hover:border-primary rounded text-text-muted hover:text-primary transition-all flex items-center gap-1 cursor-pointer select-all"
                                  title="Click to copy QR Code"
                                >
                                  {copiedQrId === reg.id ? <Check className="w-3 h-3 text-cyber-success" /> : <Copy className="w-3 h-3" />}
                                  <span className="truncate max-w-32">{reg.qrCode}</span>
                                </button>
                              ) : (
                                <span className="text-text-muted opacity-50">NO QR</span>
                              )}
                            </td>
                            <td className="p-3.5 font-mono text-[11px]">
                              {reg.rating ? (
                                <div className="flex items-center gap-1 text-yellow-400">
                                  <Star className="w-3.5 h-3.5 fill-current" />
                                  <span className="font-bold text-text-heading">{reg.rating}/5</span>
                                  {reg.feedback && <span className="text-text-muted text-[10px] font-sans truncate max-w-28 ml-1">"{reg.feedback}"</span>}
                                </div>
                              ) : (
                                <span className="text-text-muted opacity-50 text-[10px]">-</span>
                              )}
                            </td>
                            <td className="p-3.5 text-right font-mono text-xs">
                              {role !== 'Read Only' && (
                                <div className="flex items-center justify-end gap-1.5">
                                  <button
                                    onClick={() => handleToggleAttendanceStatus(reg, 'Attended')}
                                    disabled={reg.status === 'Attended'}
                                    className={`px-2 py-1 rounded text-[9px] font-bold border transition-colors cursor-pointer ${
                                      reg.status === 'Attended'
                                        ? 'opacity-40 cursor-not-allowed bg-cyber-success/10 border-cyber-success/30 text-cyber-success'
                                        : 'bg-bg-elevated border-border-normal text-text-body hover:bg-cyber-success hover:text-black'
                                    }`}
                                  >
                                    ATTENDED
                                  </button>
                                  <button
                                    onClick={() => handleToggleAttendanceStatus(reg, 'Registered')}
                                    disabled={reg.status === 'Registered'}
                                    className={`px-2 py-1 rounded text-[9px] font-bold border transition-colors cursor-pointer ${
                                      reg.status === 'Registered'
                                        ? 'opacity-40 cursor-not-allowed bg-blue-500/10 border-blue-500/30 text-blue-400'
                                        : 'bg-bg-elevated border-border-normal text-text-body hover:bg-blue-500 hover:text-white'
                                    }`}
                                  >
                                    REGISTERED
                                  </button>
                                  <button
                                    onClick={() => handleDeleteRegistration(reg.id, reg.name)}
                                    className="p-1 text-text-muted hover:text-cyber-danger rounded transition-colors cursor-pointer"
                                    title="Delete RSVP Record"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

              ) : (

                /* 🎴 CARD GRID VIEW */
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {filteredRegistrations.map((reg) => {
                    const statusColor =
                      reg.status === 'Attended' ? 'bg-cyber-success/15 border-cyber-success/30 text-cyber-success' :
                      reg.status === 'Registered' ? 'bg-blue-500/15 border-blue-500/30 text-blue-400' :
                      'bg-cyber-danger/15 border-cyber-danger/30 text-cyber-danger';

                    return (
                      <div
                        key={reg.id}
                        className="bg-bg-surface border border-border-normal/70 hover:border-primary/60 rounded-2xl p-4 space-y-3 shadow-md flex flex-col justify-between transition-all"
                      >
                        <div className="space-y-2.5">
                          {/* Card Top Row */}
                          <div className="flex justify-between items-start gap-2">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="w-9 h-9 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center font-bold text-primary font-display text-sm shrink-0">
                                {reg.name.charAt(0)}
                              </div>
                              <div className="min-w-0">
                                <h4 className="font-bold text-text-heading text-sm truncate leading-tight">{reg.name}</h4>
                                <p className="text-[10px] text-text-muted font-mono truncate">{reg.email}</p>
                              </div>
                            </div>
                          </div>

                          {/* Status & Phone */}
                          <div className="flex items-center justify-between text-xs font-mono pt-1">
                            <span className={`px-2 py-0.5 rounded text-[9px] font-bold border uppercase ${statusColor}`}>
                              {reg.status}
                            </span>
                            {reg.phone && (
                              <span className="text-[10px] text-text-muted flex items-center gap-1">
                                <PhoneCall className="w-3 h-3 text-primary shrink-0" />
                                <span>{reg.phone}</span>
                              </span>
                            )}
                          </div>

                          {/* QR Code Pass */}
                          {reg.qrCode && (
                            <button
                              onClick={() => copyQrCodeString(reg.qrCode!, reg.id)}
                              className="w-full p-2 bg-bg-primary border border-border-normal hover:border-primary/60 rounded-xl text-text-muted hover:text-primary font-mono text-[9px] flex items-center justify-between transition-all cursor-pointer select-all"
                              title="Click to copy QR Code string"
                            >
                              <span className="truncate">{reg.qrCode}</span>
                              {copiedQrId === reg.id ? <Check className="w-3.5 h-3.5 text-cyber-success shrink-0" /> : <Copy className="w-3.5 h-3.5 shrink-0" />}
                            </button>
                          )}
                        </div>

                        {/* Card Actions Footer */}
                        {role !== 'Read Only' && (
                          <div className="pt-2 border-t border-border-normal/40 flex items-center justify-between gap-1.5 font-mono text-[9px]">
                            <button
                              onClick={() => handleToggleAttendanceStatus(reg, reg.status === 'Attended' ? 'Registered' : 'Attended')}
                              className={`flex-1 py-1.5 rounded-lg font-bold border transition-colors cursor-pointer ${
                                reg.status === 'Attended'
                                  ? 'bg-cyber-success/15 border-cyber-success/40 text-cyber-success'
                                  : 'bg-bg-elevated border-border-normal text-text-heading hover:bg-primary hover:text-black'
                              }`}
                            >
                              {reg.status === 'Attended' ? 'ATTENDED ✅' : 'MARK ATTENDED'}
                            </button>

                            <button
                              onClick={() => handleDeleteRegistration(reg.id, reg.name)}
                              className="p-1.5 border border-border-normal hover:border-cyber-danger text-text-muted hover:text-cyber-danger rounded-lg transition-colors cursor-pointer"
                              title="Delete RSVP Record"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}

                      </div>
                    );
                  })}
                </div>

              )}

            </div>

            {/* DASHBOARD FOOTER */}
            <div className="p-3 sm:p-4 border-t border-border-normal bg-bg-elevated/20 flex flex-col sm:flex-row justify-between items-center gap-2 text-[10px] font-mono text-text-muted">
              <span>Showing {filteredRegistrations.length} of {registrations.length} attendees</span>
              <span>🔒 Real-time CyberX Gate &amp; Registration Node</span>
            </div>

          </div>
        </div>
      )}

      {/* QR SCAN CHECK-IN MODAL */}
      {showQrModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-bg-surface border border-border-normal rounded-xl max-w-sm w-full p-6 space-y-4 animate-in scale-in duration-200">
            <div className="flex items-center justify-between border-b border-border-normal pb-3">
              <div className="flex items-center gap-2">
                <QrCode className="w-5 h-5 text-primary" />
                <h3 className="font-display font-bold text-text-heading text-sm">{"// QR Check-in Terminal"}</h3>
              </div>
              <button onClick={() => setShowQrModal(false)} className="text-text-muted hover:text-text-heading">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleMockQrScan} className="space-y-4">
              <p className="text-[11px] text-text-body font-sans leading-relaxed">
                Check-in participants using their registered CyberX QR code strings (Simulated scanner input).
              </p>
              
              <div className="flex flex-col gap-1.5 text-xs">
                <label className="text-text-heading font-semibold font-mono">INPUT QR STRING</label>
                <input
                  type="text"
                  placeholder="e.g. CYBERX-PASS-..."
                  value={qrCodeInput}
                  onChange={(e) => setQrCodeInput(e.target.value)}
                  className="h-10 px-3 bg-bg-primary border border-border-normal rounded-lg text-text-heading font-mono focus:outline-none"
                />
              </div>

              {qrMessage && (
                <div className={`p-3 border rounded-lg flex items-center gap-2 text-xs font-mono ${
                  qrSuccess 
                    ? 'bg-cyber-success/10 border-cyber-success/30 text-cyber-success'
                    : 'bg-cyber-danger/10 border-cyber-danger/30 text-cyber-danger'
                }`}>
                  {qrSuccess ? <CheckCircle className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
                  <span>{qrMessage}</span>
                </div>
              )}

              <button
                type="submit"
                className="w-full h-10 rounded-lg bg-primary hover:bg-opacity-95 text-black text-xs font-bold font-mono transition-all"
              >
                CHECK-IN
              </button>
            </form>
          </div>
        </div>
      )}

      {/* CREATE EVENT MODAL */}
      {showFormModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form
            onSubmit={handleSubmit}
            className="bg-bg-surface border border-border-normal rounded-xl max-w-2xl w-full flex flex-col shadow-2xl animate-in scale-in duration-200"
          >
            <div className="px-4 sm:px-6 py-4 border-b border-border-normal flex items-center justify-between">
              <div>
                <h3 className="font-display font-bold text-text-heading text-base">
                  {editingEvent ? "// Edit Event Details" : "// Create New Event Draft"}
                </h3>
                <p className="text-[10px] text-text-muted font-mono mt-0.5">Define event categories, agenda, dates, and organizers.</p>
              </div>
              <button type="button" onClick={() => setShowFormModal(false)} className="text-text-muted hover:text-text-heading">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 sm:p-6 overflow-y-auto max-h-[75vh] space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-text-heading font-semibold">Event Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="Sponsorship Summit 2026"
                    value={title}
                    onChange={(e) => { setTitle(e.target.value); setSlug(e.target.value.toLowerCase().replace(/ /g, '-')); }}
                    className="h-10 px-3 bg-bg-primary border border-border-normal rounded-lg text-text-heading focus:outline-none"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-text-heading font-semibold">Event Slug *</label>
                  <input
                    type="text"
                    required
                    placeholder="summit-2026"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    className="h-10 px-3 bg-bg-primary border border-border-normal rounded-lg text-text-heading focus:outline-none font-mono"
                  />
                </div>
              </div>

              {/* Event Poster Upload */}
              <div className="flex flex-col gap-1.5 p-3.5 bg-bg-primary/60 border border-border-normal/60 rounded-xl space-y-2">
                <label className="text-text-heading font-semibold flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <ImageIcon className="w-4 h-4 text-primary" />
                    <span>Event Poster / Banner Image</span>
                  </span>
                  {banner && (
                    <button
                      type="button"
                      onClick={() => setBanner('')}
                      className="text-[10px] text-cyber-danger hover:underline font-mono"
                    >
                      REMOVE POSTER
                    </button>
                  )}
                </label>

                {banner ? (
                  <div className="relative w-full h-36 rounded-lg overflow-hidden border border-border-normal group">
                    <img src={banner} alt="Poster preview" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                      <label className="px-3 py-1.5 bg-primary text-black font-bold font-mono text-[10px] rounded-lg cursor-pointer hover:bg-opacity-90">
                        CHANGE POSTER
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            if (e.target.files?.[0]) handlePosterUpload(e.target.files[0]);
                          }}
                        />
                      </label>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="text"
                      placeholder="Paste Image URL (e.g. https://...)"
                      value={banner}
                      onChange={(e) => setBanner(e.target.value)}
                      className="flex-1 h-10 px-3 bg-bg-surface border border-border-normal rounded-lg text-text-heading focus:outline-none font-mono text-[11px]"
                    />
                    <label className="h-10 px-4 bg-bg-elevated hover:bg-primary hover:text-black border border-border-normal text-text-heading rounded-lg font-mono text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all shrink-0">
                      <Upload className="w-3.5 h-3.5" />
                      <span>UPLOAD FILE</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files?.[0]) handlePosterUpload(e.target.files[0]);
                        }}
                      />
                    </label>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-text-heading font-semibold">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="h-10 px-3 bg-bg-primary border border-border-normal rounded-lg text-text-heading focus:outline-none font-mono"
                  >
                    <option value="Technical">Technical</option>
                    <option value="Non-Technical">Non-Technical</option>
                    <option value="Workshop">Workshop</option>
                    <option value="Cultural">Cultural</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-text-heading font-semibold">Event Type</label>
                  <select
                    value={eventType}
                    onChange={(e) => setEventType(e.target.value)}
                    className="h-10 px-3 bg-bg-primary border border-border-normal rounded-lg text-text-heading focus:outline-none font-mono"
                  >
                    <option value="Offline">📍 Offline</option>
                    <option value="Online">🌐 Online</option>
                    <option value="Hybrid">⚡ Hybrid</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-text-heading font-semibold">Venue / Link</label>
                  <input
                    type="text"
                    placeholder="Seminar Hall 1 / Zoom Link"
                    value={venue}
                    onChange={(e) => setVenue(e.target.value)}
                    className="h-10 px-3 bg-bg-primary border border-border-normal rounded-lg text-text-heading focus:outline-none"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-text-heading font-semibold">Capacity Limit</label>
                  <input
                    type="number"
                    value={capacity}
                    onChange={(e) => setCapacity(e.target.value)}
                    className="h-10 px-3 bg-bg-primary border border-border-normal rounded-lg text-text-heading focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-text-heading font-semibold">Start Timestamp *</label>
                  <input
                    type="datetime-local"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="h-10 px-3 bg-bg-primary border border-border-normal rounded-lg text-text-heading focus:outline-none font-mono"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-text-heading font-semibold">End Timestamp *</label>
                  <input
                    type="datetime-local"
                    required
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="h-10 px-3 bg-bg-primary border border-border-normal rounded-lg text-text-heading focus:outline-none font-mono"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-text-heading font-semibold">Reg. Deadline *</label>
                  <input
                    type="datetime-local"
                    required
                    value={regDeadline}
                    onChange={(e) => setRegDeadline(e.target.value)}
                    className="h-10 px-3 bg-bg-primary border border-border-normal rounded-lg text-text-heading focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-text-heading font-semibold">Budget (Allocated Outflows)</label>
                  <input
                    type="number"
                    value={budget}
                    onChange={(e) => setBudget(e.target.value)}
                    className="h-10 px-3 bg-bg-primary border border-border-normal rounded-lg text-text-heading focus:outline-none font-mono"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-text-heading font-semibold">Expected Revenue (Sponsorship/Fees)</label>
                  <input
                    type="number"
                    value={expectedRevenue}
                    onChange={(e) => setExpectedRevenue(e.target.value)}
                    className="h-10 px-3 bg-bg-primary border border-border-normal rounded-lg text-text-heading focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-text-heading font-semibold">Sponsors (comma separated)</label>
                  <input
                    type="text"
                    placeholder="Google, Vercel, Stripe"
                    value={sponsors}
                    onChange={(e) => setSponsors(e.target.value)}
                    className="h-10 px-3 bg-bg-primary border border-border-normal rounded-lg text-text-heading focus:outline-none font-mono"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-text-heading font-semibold">Speakers (comma separated)</label>
                  <input
                    type="text"
                    placeholder="Dr. Roy, Tanmay H"
                    value={speakers}
                    onChange={(e) => setSpeakers(e.target.value)}
                    className="h-10 px-3 bg-bg-primary border border-border-normal rounded-lg text-text-heading focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-text-heading font-semibold">Event Description</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="p-3 bg-bg-primary border border-border-normal rounded-lg text-text-heading focus:outline-none resize-none"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-text-heading font-semibold">Agenda Details</label>
                <textarea
                  rows={2}
                  value={agenda}
                  onChange={(e) => setAgenda(e.target.value)}
                  className="p-3 bg-bg-primary border border-border-normal rounded-lg text-text-heading focus:outline-none resize-none font-mono text-[11px]"
                />
              </div>

            </div>

            <div className="px-4 sm:px-6 py-4 border-t border-border-normal bg-bg-elevated/20 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowFormModal(false)}
                className="h-10 px-4 rounded-lg border border-border-normal hover:bg-bg-elevated text-xs font-semibold font-mono transition-colors"
              >
                CANCEL
              </button>
              
              <button
                type="submit"
                disabled={isSubmitting}
                className="h-10 px-6 rounded-lg bg-primary hover:bg-opacity-90 text-black font-bold text-xs transition-all disabled:opacity-50"
              >
                {isSubmitting ? 'SAVING...' : (editingEvent ? 'SAVE CHANGES' : 'CREATE EVENT')}
              </button>
            </div>

          </form>
        </div>
      )}

      {/* REGISTRATION FORM MODAL */}
      {showRegModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={handleRegisterSubmit} className="bg-bg-surface border border-border-normal rounded-xl max-w-sm w-full p-4 sm:p-6 space-y-4 animate-in scale-in duration-200">
            <div className="flex items-center justify-between border-b border-border-normal pb-3">
              <h3 className="font-display font-bold text-text-heading text-sm">{"// Register Attendee"}</h3>
              <button type="button" onClick={() => setShowRegModal(false)} className="text-text-muted hover:text-text-heading">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs text-sans">
              <div className="flex flex-col gap-1.5">
                <label className="text-text-heading font-semibold">Attendee Name *</label>
                <input
                  type="text"
                  required
                  placeholder="John Doe"
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  className="h-10 px-3 bg-bg-primary border border-border-normal rounded-lg text-text-heading focus:outline-none"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-text-heading font-semibold">Email Address *</label>
                <input
                  type="email"
                  required
                  placeholder="john@cyberx.org"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  className="h-10 px-3 bg-bg-primary border border-border-normal rounded-lg text-text-heading focus:outline-none"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-text-heading font-semibold">Phone Number</label>
                <input
                  type="tel"
                  placeholder="+91 9876543210"
                  value={regPhone}
                  onChange={(e) => setRegPhone(e.target.value)}
                  className="h-10 px-3 bg-bg-primary border border-border-normal rounded-lg text-text-heading focus:outline-none font-mono"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 text-xs">
              <button
                type="button"
                onClick={() => setShowRegModal(false)}
                className="h-9 px-4 rounded-lg border border-border-normal hover:bg-bg-elevated font-mono"
              >
                CANCEL
              </button>
              <button
                type="submit"
                className="h-9 px-5 rounded-lg bg-primary hover:bg-opacity-90 text-black font-bold font-mono"
              >
                SUBMIT
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}
