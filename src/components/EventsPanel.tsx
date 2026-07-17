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
  CheckCircle
} from 'lucide-react';

interface EventRegistration {
  id: string;
  name: string;
  email: string;
  status: string;
  qrCode: string | null;
  feedback: string | null;
  rating: number | null;
}

interface Event {
  id: string;
  title: string;
  slug: string;
  banner: string | null;
  description: string;
  category: string;
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

  const fetchEventRegistrations = async (id: string) => {
    try {
      setLoadingRegs(true);
      const res = await fetch(`/api/events/${id}`);
      if (res.ok) {
        const data = await res.json();
        setRegistrations(data.registrations || []);
        setSelectedEvent(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingRegs(false);
    }
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
      const res = await fetch(`/api/events/${selectedEvent.id}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: regName, email: regEmail }),
      });

      if (res.ok) {
        setShowRegModal(false);
        triggerNotification(`Registered ${regName} successfully`, 'Registered');
        fetchEventRegistrations(selectedEvent.id);
      } else {
        const data = await res.json();
        alert(data.error || 'Registration failed');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleAttendance = async (reg: EventRegistration) => {
    if (!selectedEvent) return;
    const targetStatus = reg.status === 'Attended' ? 'Registered' : 'Attended';

    try {
      const res = await fetch(`/api/events/${selectedEvent.id}/attendance`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ registrationId: reg.id, status: targetStatus }),
      });

      if (res.ok) {
        fetchEventRegistrations(selectedEvent.id);
        triggerNotification(`Updated attendance status for ${reg.name}`, 'Updated');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleMockQrScan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEvent) return;

    setQrMessage('');
    setQrSuccess(false);

    try {
      const res = await fetch(`/api/events/${selectedEvent.id}/attendance`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ qrCode: qrCodeInput }),
      });

      const data = await res.json();
      if (res.ok) {
        setQrSuccess(true);
        setQrMessage(`Check-in Successful! Attended: ${data.name}`);
        setQrCodeInput('');
        fetchEventRegistrations(selectedEvent.id);
      } else {
        setQrSuccess(false);
        setQrMessage(data.error || 'Check-in failed');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const triggerEmailMock = () => {
    alert(`Emailed all ${registrations.length} registered participants with the event details.`);
  };

  return (
    <div className="space-y-6">
      
      {/* HEADER ROW */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-text-heading font-display tracking-wide">{"// Event Operating Lifecycle"}</h2>
          <p className="text-[10px] text-text-muted font-mono mt-0.5 font-semibold">Organize campus workshops, sponsorship drives and registrations list</p>
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
                        <span className="px-2 py-0.5 rounded bg-bg-elevated border border-border-normal text-[9px] font-mono font-semibold text-primary uppercase">
                          {e.category}
                        </span>
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
                      
                      {role !== 'Read Only' && (
                        <div className="flex gap-1.5">
                          <button
                            onClick={(event) => { event.stopPropagation(); handleOpenForm(e); }}
                            className="p-1.5 border border-border-normal hover:border-primary text-text-muted hover:text-text-heading rounded-lg"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          {(role === 'Super Admin' || role === 'Co-Founder') && (
                            <button
                              onClick={(event) => { event.stopPropagation(); handleDelete(e); }}
                              className="p-1.5 border border-border-normal hover:border-cyber-danger text-text-muted hover:text-cyber-danger rounded-lg"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      )}
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
                  <span className="px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20 text-[9px] font-mono font-bold tracking-wider">
                    {selectedEvent.category.toUpperCase()}
                  </span>
                  <h3 className="font-display font-bold text-text-heading text-base mt-1.5">{selectedEvent.title}</h3>
                  <span className="text-[10px] text-text-muted font-mono">{selectedEvent.slug}</span>
                </div>
                <button
                  onClick={() => setSelectedEvent(null)}
                  className="p-1.5 hover:bg-bg-elevated hover:text-text-heading text-text-muted rounded-lg"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

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

              {/* Financial calculations */}
              <div className="grid grid-cols-2 gap-3 text-center font-mono text-[10px]">
                <div className="bg-bg-primary border border-border-normal/40 p-2.5 rounded-lg text-cyber-danger">
                  <span className="text-text-muted block">BUDGET EXPENSE</span>
                  <p className="text-xs font-bold mt-1">₹{selectedEvent.budget}</p>
                </div>
                <div className="bg-bg-primary border border-border-normal/40 p-2.5 rounded-lg text-cyber-success">
                  <span className="text-text-muted block">EST. REVENUE</span>
                  <p className="text-xs font-bold mt-1">₹{selectedEvent.expectedRevenue}</p>
                </div>
              </div>

              {/* Sponsors/Organizers lists */}
              <div className="space-y-3 font-mono text-[10px]">
                {selectedEvent.sponsors.length > 0 && (
                  <div>
                    <span className="text-text-muted block mb-1">SPONSORS</span>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedEvent.sponsors.map((sp, idx) => (
                        <span key={idx} className="px-2 py-0.5 rounded bg-bg-elevated border border-border-normal text-text-heading">
                          {sp}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {selectedEvent.speakers.length > 0 && (
                  <div>
                    <span className="text-text-muted block mb-1">SPEAKERS</span>
                    <div className="flex flex-wrap gap-1.5 text-primary">
                      {selectedEvent.speakers.map((sp, idx) => (
                        <span key={idx} className="px-2 py-0.5 rounded bg-primary/10 border border-primary/20 font-semibold">
                          {sp}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Attendee Registry list */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-mono text-[10px] text-text-muted font-bold">REGISTRATIONS ({registrations.length})</span>
                  
                  {role !== 'Read Only' && (
                    <div className="flex gap-2">
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
                          <span className="text-[9px] text-text-muted font-mono truncate">{reg.email}</span>
                        </div>
                        
                        <button
                          disabled={role === 'Read Only'}
                          onClick={() => handleToggleAttendance(reg)}
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
              {role !== 'Read Only' && registrations.length > 0 && (
                <div className="pt-2 border-t border-border-normal/40 flex justify-between gap-3">
                  <button
                    onClick={triggerEmailMock}
                    className="flex-1 h-9 flex items-center justify-center gap-1.5 rounded-lg border border-border-normal hover:bg-bg-elevated hover:text-text-heading text-[10px] font-bold font-mono transition-colors cursor-pointer"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    <span>EMAIL ALL</span>
                  </button>
                  <button
                    onClick={() => alert('Successfully generated certificate designs for attendees.')}
                    className="flex-1 h-9 flex items-center justify-center gap-1.5 rounded-lg border border-border-normal hover:bg-bg-elevated hover:text-text-heading text-[10px] font-bold font-mono transition-colors cursor-pointer"
                  >
                    <Award className="w-3.5 h-3.5" />
                    <span>CERTIFICATES</span>
                  </button>
                </div>
              )}

            </div>
          </div>
        )}
      </div>

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
                  placeholder="e.g. CYBERX-EVT-workshop-..."
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

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
                  <label className="text-text-heading font-semibold">Venue</label>
                  <input
                    type="text"
                    placeholder="Seminar Hall 1"
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
