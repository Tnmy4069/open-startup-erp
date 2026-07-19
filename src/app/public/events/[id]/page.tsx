'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  CheckCircle,
  AlertTriangle,
  Loader,
  Share2,
  Ticket,
  Printer,
  Copy,
  Sparkles,
  UserCheck,
  Building,
  Mail,
  User,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  PhoneCall,
  Code,
  Terminal,
  Globe,
  Zap,
  Check
} from 'lucide-react';

interface EventDetail {
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
  sponsors: string[];
  speakers: string[];
  organizers: string[];
  agenda: string | null;
  resources: string | null;
  registrations: { id: string; status: string; createdAt: string }[];
  enableEventPass: boolean;
}

interface RSVPResult {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  qrCode: string;
  status: string;
  createdAt: string;
}

export default function PublicEventPage() {
  const { id } = useParams();
  const [event, setEvent] = useState<EventDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // RSVP Form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [college, setCollege] = useState('');
  const [phone, setPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [rsvpSuccess, setRsvpSuccess] = useState(false);
  const [rsvpError, setRsvpError] = useState('');
  const [passData, setPassData] = useState<RSVPResult | null>(null);

  // Link copy notification
  const [copiedLink, setCopiedLink] = useState(false);

  // Tab mode for right panel: 'rsvp' | 'lookup'
  const [activeRightTab, setActiveRightTab] = useState<'rsvp' | 'lookup'>('rsvp');
  const [lookupEmail, setLookupEmail] = useState('');
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupError, setLookupError] = useState('');

  // API Docs Section State
  const [activeApiEndpointIdx, setActiveApiEndpointIdx] = useState(0);
  const [activeApiTab, setActiveApiTab] = useState<'payload' | 'response' | 'curl' | 'errors'>('payload');
  const [copiedApiItem, setCopiedApiItem] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    const fetchEvent = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/public/events/${id}`);
        if (!res.ok) {
          setError('Event not found or no longer available.');
          return;
        }
        const data = await res.json();
        setEvent(data);
      } catch (err: any) {
        setError('Network error: ' + err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchEvent();
  }, [id]);

  const handleRSVPSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!event) return;

    setSubmitting(true);
    setRsvpError('');

    try {
      const res = await fetch(`/api/public/events/${event.id}/rsvp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, college, phone }),
      });

      const data = await res.json();
      if (!res.ok) {
        setRsvpError(data.error || 'Failed to complete RSVP.');
      } else {
        setRsvpSuccess(true);
        if (data.registration) {
          setPassData(data.registration);
        }
        const refreshRes = await fetch(`/api/public/events/${event.id}`);
        if (refreshRes.ok) {
          const freshData = await refreshRes.json();
          setEvent(freshData);
        }
      }
    } catch (err: any) {
      setRsvpError('Connection error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleLookupPass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!event || !lookupEmail) return;

    setLookupLoading(true);
    setLookupError('');

    try {
      const res = await fetch(`/api/public/events/${event.id}/rsvp?email=${encodeURIComponent(lookupEmail)}`);
      const data = await res.json();

      if (data.registration) {
        setPassData(data.registration);
        setRsvpSuccess(true);
      } else {
        setLookupError(data.error || 'No existing registration found for this email.');
      }
    } catch {
      setLookupError('Failed to lookup registration.');
    } finally {
      setLookupLoading(false);
    }
  };

  const handleCopyText = (text: string, key: string) => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(text);
      setCopiedApiItem(key);
      setTimeout(() => setCopiedApiItem(null), 2000);
    }
  };

  const handleCopyLink = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  const handlePrintPass = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0B] text-text-body font-sans flex flex-col items-center justify-center py-20 gap-3">
        <Loader className="w-8 h-8 text-primary animate-spin" />
        <p className="text-xs text-text-muted font-mono">{"// Loading public event portal..."}</p>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="min-h-screen bg-[#0A0A0B] text-text-body font-sans flex flex-col items-center justify-center p-6 text-center">
        <div className="p-4 bg-cyber-danger/10 border border-cyber-danger/25 rounded-full text-cyber-danger mb-4">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <h2 className="font-display font-bold text-text-heading text-xl mb-2">Event Not Available</h2>
        <p className="text-xs text-text-muted max-w-sm font-mono mb-6">{error || 'Event parameters could not be loaded.'}</p>
        <a href="/" className="px-5 py-2.5 bg-primary text-black font-bold font-mono text-xs rounded-lg hover:bg-opacity-90 transition-all">
          RETURN TO HOME
        </a>
      </div>
    );
  }

  const registeredCount = event.registrations?.length || 0;
  const isFull = registeredCount >= event.capacity;
  const isEnded = new Date(event.endDate) < new Date();
  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';

  // Specific API Endpoints Definitions for this Event
  const apiEndpoints = [
    {
      id: 'public-rsvp',
      title: 'Submit Public RSVP',
      method: 'POST',
      path: `/api/public/events/${event.id}/rsvp`,
      description: 'Used by public attendees to register for this event. Generates a unique QR ticket pass instantly upon submission.',
      sampleInput: JSON.stringify(
        {
          name: 'Rahul Sharma',
          email: 'rahul.sharma@example.com',
          phone: '+91 9876543210',
          college: 'VIT Pune'
        },
        null,
        2
      ),
      sampleResponse: JSON.stringify(
        {
          success: true,
          message: 'RSVP confirmed successfully!',
          eventTitle: event.title,
          enableEventPass: true,
          registration: {
            id: '6699a2f10b2c1234567890ab',
            eventId: event.id,
            name: 'Rahul Sharma',
            email: 'rahul.sharma@example.com',
            phone: '+91 9876543210',
            status: 'Registered',
            qrCode: `CYBERX-PASS-${event.slug.toUpperCase()}-LX91AB2-9F8A`,
            createdAt: new Date().toISOString()
          }
        },
        null,
        2
      ),
      curl: `curl -X POST "${currentOrigin}/api/public/events/${event.id}/rsvp" \\
  -H "Content-Type: application/json" \\
  -d '{"name":"Rahul Sharma","email":"rahul.sharma@example.com","phone":"+91 9876543210"}'`,
      errors: [
        { code: '400 Bad Request', reason: 'Missing name or email string', solution: 'Ensure both "name" and "email" are provided in body.' },
        { code: '400 Capacity Full', reason: 'Event registration capacity limit reached', solution: 'Increase event capacity or wait for cancellations.' },
        { code: '404 Not Found', reason: 'Event ID or Slug invalid', solution: 'Verify target event ID parameter.' }
      ]
    },
    {
      id: 'lookup-rsvp',
      title: 'Check RSVP Status',
      method: 'GET',
      path: `/api/public/events/${event.id}/rsvp?email=rahul.sharma@example.com`,
      description: 'Retrieve an existing attendee ticket pass using their registered email address or QR code string.',
      sampleInput: `// Query Parameters\n?email=rahul.sharma@example.com\n// OR\n?qrCode=CYBERX-PASS-${event.slug.toUpperCase()}-...`,
      sampleResponse: JSON.stringify(
        {
          found: true,
          eventTitle: event.title,
          enableEventPass: true,
          registration: {
            id: '6699a2f10b2c1234567890ab',
            name: 'Rahul Sharma',
            email: 'rahul.sharma@example.com',
            status: 'Registered',
            qrCode: `CYBERX-PASS-${event.slug.toUpperCase()}-LX91AB2-9F8A`
          }
        },
        null,
        2
      ),
      curl: `curl -X GET "${currentOrigin}/api/public/events/${event.id}/rsvp?email=rahul.sharma@example.com"`,
      errors: [
        { code: '404 Not Found', reason: 'No RSVP record found for given email', solution: 'Double check spelling or prompt attendee to register.' }
      ]
    },
    {
      id: 'list-registrations',
      title: 'Fetch RSVP List & Stats',
      method: 'GET',
      path: `/api/events/${event.id}/registrations?status=Attended`,
      description: 'Fetches the complete RSVP participant list for the event team along with breakdown stats (Total, Attended, Registered, No-Show, Remaining Spots).',
      sampleInput: `// Query Parameters (Optional)\n?search=rahul\n?status=Attended // Registered | Attended | No-Show`,
      sampleResponse: JSON.stringify(
        {
          event: {
            id: event.id,
            title: event.title,
            slug: event.slug,
            capacity: event.capacity
          },
          stats: {
            total: registeredCount,
            attended: Math.round(registeredCount * 0.7),
            registered: Math.round(registeredCount * 0.3),
            noShow: 0,
            capacity: event.capacity,
            spotsRemaining: Math.max(0, event.capacity - registeredCount)
          },
          registrations: [
            {
              id: '6699a2f10b2c1234567890ab',
              name: 'Rahul Sharma',
              email: 'rahul.sharma@example.com',
              status: 'Attended',
              qrCode: `CYBERX-PASS-${event.slug.toUpperCase()}-LX91AB2-9F8A`
            }
          ]
        },
        null,
        2
      ),
      curl: `curl -X GET "${currentOrigin}/api/events/${event.id}/registrations"`,
      errors: [
        { code: '401 Unauthorized', reason: 'User session missing or expired', solution: 'Login as organizer/admin before calling endpoint.' }
      ]
    },
    {
      id: 'manual-add',
      title: 'Manual Admin Add RSVP',
      method: 'POST',
      path: `/api/events/${event.id}/registrations`,
      description: 'Allows event organizers to manually add a participant to the RSVP database.',
      sampleInput: JSON.stringify(
        {
          name: 'Priya Verma',
          email: 'priya.v@example.com',
          phone: '+91 9123456789',
          status: 'Registered'
        },
        null,
        2
      ),
      sampleResponse: JSON.stringify(
        {
          id: '6699a3990b2c1234567890ac',
          eventId: event.id,
          name: 'Priya Verma',
          email: 'priya.v@example.com',
          status: 'Registered',
          qrCode: `CYBERX-PASS-${event.slug.toUpperCase()}-LX91AB2-9F8B`
        },
        null,
        2
      ),
      curl: `curl -X POST "${currentOrigin}/api/events/${event.id}/registrations" \\
  -H "Content-Type: application/json" \\
  -d '{"name":"Priya Verma","email":"priya.v@example.com","status":"Registered"}'`,
      errors: [
        { code: '409 Conflict', reason: 'Email already registered for this event', solution: 'Update existing record instead of creating duplicate.' }
      ]
    },
    {
      id: 'mark-attendance',
      title: 'Update Attendance Status',
      method: 'PUT',
      path: `/api/events/${event.id}/attendance`,
      description: 'Update attendee status to Attended, Registered, or No-Show manually or by registration ID.',
      sampleInput: JSON.stringify(
        {
          registrationId: '6699a2f10b2c1234567890ab',
          status: 'Attended',
          feedback: 'Excellent session!',
          rating: 5
        },
        null,
        2
      ),
      sampleResponse: JSON.stringify(
        {
          id: '6699a2f10b2c1234567890ab',
          name: 'Rahul Sharma',
          email: 'rahul.sharma@example.com',
          status: 'Attended',
          feedback: 'Excellent session!',
          rating: 5
        },
        null,
        2
      ),
      curl: `curl -X PUT "${currentOrigin}/api/events/${event.id}/attendance" \\
  -H "Content-Type: application/json" \\
  -d '{"registrationId":"6699a2f10b2c1234567890ab","status":"Attended"}'`,
      errors: [
        { code: '400 Bad Request', reason: 'Neither registrationId nor qrCode provided', solution: 'Pass registrationId or qrCode string in request body.' }
      ]
    },
    {
      id: 'gate-scan',
      title: 'Venue QR Scanner Gate Check-In',
      method: 'POST',
      path: `/api/events/scan`,
      description: 'High-speed venue gate scanner check-in endpoint. Scans QR string and updates attendee status to Attended.',
      sampleInput: JSON.stringify(
        {
          qrCode: `CYBERX-PASS-${event.slug.toUpperCase()}-LX91AB2-9F8A`
        },
        null,
        2
      ),
      sampleResponse: JSON.stringify(
        {
          success: true,
          alreadyAttended: false,
          message: 'Check-in Successful! Marked Rahul Sharma as Attended.',
          registration: {
            name: 'Rahul Sharma',
            email: 'rahul.sharma@example.com',
            status: 'Attended'
          }
        },
        null,
        2
      ),
      curl: `curl -X POST "${currentOrigin}/api/events/scan" \\
  -H "Content-Type: application/json" \\
  -d '{"qrCode":"CYBERX-PASS-${event.slug.toUpperCase()}-LX91AB2-9F8A"}'`,
      errors: [
        { code: '404 Not Found', reason: 'Unrecognized or invalid QR string', solution: 'Verify ticket QR code string.' }
      ]
    }
  ];

  const currentEndpoint = apiEndpoints[activeApiEndpointIdx];

  return (
    <div className="dark min-h-screen bg-[#0A0A0B] text-text-body font-sans antialiased flex flex-col justify-between selection:bg-primary selection:text-black">
      
      {/* Background pattern */}
      <div
        className="fixed inset-0 pointer-events-none z-0 opacity-[0.02]"
        style={{
          backgroundImage:
            'repeating-linear-gradient(0deg, #FFD54A 0px, #FFD54A 1px, transparent 1px, transparent 3px)',
        }}
      />

      {/* Header */}
      <header className="border-b border-border-normal bg-bg-surface/40 backdrop-blur-md sticky top-0 z-20 print:hidden">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/cyberx-logo.webp" alt="CyberX" className="h-7 w-auto object-contain" />
            <span className="text-text-muted font-mono text-xs hidden sm:inline">|</span>
            <span className="text-[10px] text-text-muted font-mono tracking-widest hidden sm:inline uppercase">PUBLIC EVENT PORTAL</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleCopyLink}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border-normal hover:border-primary/50 text-xs font-mono text-text-heading hover:text-primary transition-all bg-bg-surface cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>{copiedLink ? 'LINK COPIED!' : 'COPY EVENT LINK'}</span>
            </button>
            <span className="px-2.5 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-mono font-bold uppercase tracking-wider">
              {event.category}
            </span>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8 z-10 space-y-8">

        {/* EVENT POSTER DISPLAY */}
        {event.banner && (
          <div className="w-full h-64 sm:h-96 rounded-2xl overflow-hidden border border-border-normal/70 shadow-2xl relative bg-bg-surface">
            <img src={event.banner} alt={event.title} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0B] via-transparent to-transparent opacity-80" />
          </div>
        )}

        {/* HERO BANNER SECTION */}
        <div className="relative rounded-2xl overflow-hidden border border-border-normal/70 bg-bg-surface/50 shadow-2xl p-6 sm:p-10">
          <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full filter blur-3xl -z-10" />
          
          <div className="flex flex-col md:flex-row justify-between md:items-end gap-6">
            <div className="space-y-4 max-w-2xl">
              <div className="flex flex-wrap items-center gap-2 font-mono text-[10px]">
                <span className="px-2.5 py-1 rounded bg-bg-elevated border border-border-normal text-text-heading uppercase font-bold tracking-wider">
                  {event.category}
                </span>

                {/* Event Type Badge (Online / Offline / Hybrid) */}
                <span className={`px-2.5 py-1 rounded border font-bold uppercase ${
                  event.eventType === 'Online' ? 'bg-blue-500/10 border-blue-500/30 text-blue-400' :
                  event.eventType === 'Hybrid' ? 'bg-purple-500/10 border-purple-500/30 text-purple-400' :
                  'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                }`}>
                  {event.eventType === 'Online' ? '🌐 ONLINE EVENT' : event.eventType === 'Hybrid' ? '⚡ HYBRID EVENT' : '📍 OFFLINE VENUE'}
                </span>

                {isEnded ? (
                  <span className="px-2.5 py-1 rounded bg-cyber-danger/10 border border-cyber-danger/30 text-cyber-danger font-bold uppercase">
                    EVENT CONCLUDED
                  </span>
                ) : isFull ? (
                  <span className="px-2.5 py-1 rounded bg-cyber-warning/10 border border-cyber-warning/30 text-cyber-warning font-bold uppercase">
                    CAPACITY REACHED
                  </span>
                ) : (
                  <span className="px-2.5 py-1 rounded bg-cyber-success/15 border border-cyber-success/30 text-cyber-success font-bold uppercase animate-pulse">
                    ● REGISTRATION OPEN
                  </span>
                )}
              </div>

              <h1 className="font-display font-extrabold text-2xl sm:text-4xl text-text-heading leading-tight tracking-wide">
                {event.title}
              </h1>

              {/* Event Timing & Location Badges */}
              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs sm:text-sm text-text-body font-mono">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-primary shrink-0" />
                  <span>{new Date(event.startDate).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-primary shrink-0" />
                  <span>{new Date(event.startDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(event.endDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-primary shrink-0" />
                  <span className="text-text-heading font-semibold">{event.venue}</span>
                </div>
              </div>
            </div>

            {/* Attendance Progress Card */}
            <div className="bg-bg-primary/80 border border-border-normal/60 rounded-xl p-4 w-full md:w-64 font-mono text-xs space-y-2 shrink-0">
              <div className="flex justify-between items-center text-text-muted text-[10px] font-bold">
                <span>RESERVATION CAPACITY</span>
                <span>{registeredCount} / {event.capacity}</span>
              </div>
              <div className="w-full bg-bg-elevated h-2 rounded-full overflow-hidden">
                <div
                  className="bg-primary h-full transition-all duration-500 rounded-full"
                  style={{ width: `${Math.min(100, Math.round((registeredCount / event.capacity) * 100))}%` }}
                />
              </div>
              <p className="text-[10px] text-text-muted text-right">
                {Math.max(0, event.capacity - registeredCount)} spots remaining
              </p>
            </div>
          </div>
        </div>

        {/* TWO COLUMN GRID CONTENT */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* LEFT COL: EVENT OVERVIEW, AGENDA, SPEAKERS, SPONSORS */}
          <div className="lg:col-span-2 space-y-8 print:hidden">

            {/* Description */}
            <div className="bg-bg-surface/50 border border-border-normal/60 rounded-2xl p-6 sm:p-8 space-y-4 shadow-sm">
              <h3 className="font-display font-bold text-text-heading text-lg border-b border-border-normal/40 pb-3 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                <span>About Event</span>
              </h3>
              <p className="text-sm text-text-body leading-relaxed font-sans whitespace-pre-line">
                {event.description}
              </p>
            </div>

            {/* Agenda Schedule */}
            {event.agenda && (
              <div className="bg-bg-surface/50 border border-border-normal/60 rounded-2xl p-6 sm:p-8 space-y-4 shadow-sm">
                <h3 className="font-display font-bold text-text-heading text-lg border-b border-border-normal/40 pb-3 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-primary" />
                  <span>Event Schedule & Agenda</span>
                </h3>
                <div className="p-4 bg-bg-primary border border-border-normal/40 rounded-xl text-xs font-mono text-text-body whitespace-pre-wrap leading-relaxed">
                  {event.agenda}
                </div>
              </div>
            )}

            {/* Speakers Showcase */}
            {event.speakers && event.speakers.length > 0 && (
              <div className="bg-bg-surface/50 border border-border-normal/60 rounded-2xl p-6 sm:p-8 space-y-4 shadow-sm">
                <h3 className="font-display font-bold text-text-heading text-lg border-b border-border-normal/40 pb-3 flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-primary" />
                  <span>Featured Speakers</span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {event.speakers.map((speaker, idx) => (
                    <div key={idx} className="flex items-center gap-3 p-3.5 bg-bg-primary/60 border border-border-normal/40 rounded-xl">
                      <div className="w-9 h-9 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center font-bold text-primary text-xs font-display">
                        {speaker.charAt(0)}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-text-heading">{speaker}</p>
                        <span className="text-[10px] text-text-muted font-mono">Keynote Speaker</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Sponsors & Partners */}
            {event.sponsors && event.sponsors.length > 0 && (
              <div className="bg-bg-surface/50 border border-border-normal/60 rounded-2xl p-6 sm:p-8 space-y-4 shadow-sm">
                <h3 className="font-display font-bold text-text-heading text-lg border-b border-border-normal/40 pb-3 flex items-center gap-2">
                  <Building className="w-4 h-4 text-primary" />
                  <span>Official Sponsors</span>
                </h3>
                <div className="flex flex-wrap gap-2.5">
                  {event.sponsors.map((sp, idx) => (
                    <span key={idx} className="px-3.5 py-1.5 bg-bg-elevated border border-border-normal rounded-xl text-xs font-mono font-semibold text-text-heading">
                      {sp}
                    </span>
                  ))}
                </div>
              </div>
            )}

          </div>

          {/* RIGHT COL: RSVP FORM & EVENT PASS DISPLAY */}
          <div className="space-y-6">

            {/* RSVP / LOOKUP PASS CONTAINER */}
            {rsvpSuccess && passData ? (
              
              /* EVENT PASS / E-TICKET CARD */
              <div className="bg-bg-surface border-2 border-primary/60 rounded-2xl p-6 sm:p-8 shadow-[0_0_30px_rgba(255,213,74,0.12)] space-y-6 animate-in zoom-in-95 duration-300 print:shadow-none print:border-black">
                
                {/* Header Ticket branding */}
                <div className="flex items-center justify-between border-b border-border-normal/60 pb-4">
                  <div className="flex items-center gap-2">
                    <Ticket className="w-5 h-5 text-primary" />
                    <span className="font-display font-bold text-text-heading text-sm uppercase tracking-wider">CYBERX EVENT PASS</span>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-cyber-success/15 border border-cyber-success/30 text-cyber-success text-[9px] font-mono font-bold uppercase">
                    CONFIRMED
                  </span>
                </div>

                {/* Event Pass details */}
                <div className="space-y-3 font-mono text-xs">
                  <div>
                    <span className="text-[9px] text-text-muted block uppercase">EVENT</span>
                    <h4 className="font-display font-bold text-text-heading text-base leading-tight mt-0.5">{event.title}</h4>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-1 text-[11px]">
                    <div>
                      <span className="text-[9px] text-text-muted block uppercase">DATE & TIME</span>
                      <p className="text-text-heading font-semibold mt-0.5">
                        {new Date(event.startDate).toLocaleDateString()}
                      </p>
                      <p className="text-text-muted text-[10px]">
                        {new Date(event.startDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    <div>
                      <span className="text-[9px] text-text-muted block uppercase">VENUE</span>
                      <p className="text-text-heading font-semibold mt-0.5 truncate">{event.venue}</p>
                    </div>
                  </div>

                  {/* Attendee Details */}
                  <div className="p-3 bg-bg-primary border border-border-normal/40 rounded-xl space-y-1">
                    <span className="text-[9px] text-text-muted block uppercase">PASS HOLDER</span>
                    <p className="text-text-heading font-bold text-sm">{passData.name}</p>
                    <p className="text-text-muted text-[10px] font-mono">{passData.email}</p>
                    {passData.phone && (
                      <p className="text-text-muted text-[10px] font-mono flex items-center gap-1 mt-0.5">
                        <PhoneCall className="w-3 h-3 text-primary shrink-0" />
                        <span>{passData.phone}</span>
                      </p>
                    )}
                  </div>
                </div>

                {/* Real Scannable QR Code */}
                {event.enableEventPass !== false ? (
                  <div className="bg-white p-4 rounded-xl flex flex-col items-center justify-center space-y-2 text-black border-2 border-border-normal">
                    <div className="w-44 h-44 relative flex items-center justify-center bg-white p-1 border-2 border-gray-900 rounded-lg shadow-inner">
                      <img
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(passData.qrCode)}`}
                        alt="CyberX Event Pass Scannable QR Code"
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <span className="font-mono font-bold text-[10px] tracking-wider text-center uppercase text-gray-900 bg-gray-100 px-2 py-0.5 rounded border border-gray-300 select-all">
                      {passData.qrCode}
                    </span>
                  </div>
                ) : (
                  <div className="p-3 bg-cyber-warning/10 border border-cyber-warning/30 rounded-xl text-center text-[10px] font-mono text-cyber-warning">
                    {"// Event Pass QR is currently disabled by organizers."}
                  </div>
                )}

                {/* Print & Action Buttons */}
                <div className="space-y-2 print:hidden">
                  <button
                    onClick={handlePrintPass}
                    className="w-full h-10 rounded-xl bg-primary hover:bg-opacity-95 text-black font-bold font-mono text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <Printer className="w-4 h-4" />
                    <span>PRINT / SAVE EVENT PASS</span>
                  </button>

                  <button
                    onClick={() => { setRsvpSuccess(false); setPassData(null); }}
                    className="w-full h-9 rounded-xl border border-border-normal hover:bg-bg-elevated font-mono text-[10px] text-text-muted hover:text-text-heading transition-colors"
                  >
                    RSVP FOR ANOTHER PERSON
                  </button>
                </div>

              </div>

            ) : (

              /* RSVP FORM CARD */
              <div className="bg-bg-surface border border-border-normal rounded-2xl p-6 sm:p-8 space-y-5 shadow-xl">
                
                {/* Tabs for RSVP vs Lookup */}
                <div className="flex border-b border-border-normal/40 font-mono text-xs">
                  <button
                    onClick={() => setActiveRightTab('rsvp')}
                    className={`pb-2.5 font-bold transition-colors cursor-pointer flex-1 text-center ${
                      activeRightTab === 'rsvp' ? 'text-primary border-b-2 border-primary' : 'text-text-muted hover:text-text-heading'
                    }`}
                  >
                    CONFIRM RSVP
                  </button>
                  <button
                    onClick={() => setActiveRightTab('lookup')}
                    className={`pb-2.5 font-bold transition-colors cursor-pointer flex-1 text-center ${
                      activeRightTab === 'lookup' ? 'text-primary border-b-2 border-primary' : 'text-text-muted hover:text-text-heading'
                    }`}
                  >
                    FIND MY PASS
                  </button>
                </div>

                {activeRightTab === 'rsvp' ? (
                  <form onSubmit={handleRSVPSubmit} className="space-y-4 text-xs font-sans">
                    
                    {rsvpError && (
                      <div className="p-3 bg-cyber-danger/10 border border-cyber-danger/30 rounded-xl text-cyber-danger font-mono text-[11px] flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 shrink-0" />
                        <span>{rsvpError}</span>
                      </div>
                    )}

                    <div className="space-y-3">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-text-heading font-semibold flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-text-muted" />
                          <span>Full Name *</span>
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Rahul Sharma"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className="h-10 px-3 bg-bg-primary border border-border-normal rounded-xl text-text-heading focus:border-primary focus:outline-none"
                        />
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label className="text-text-heading font-semibold flex items-center gap-1.5">
                          <Mail className="w-3.5 h-3.5 text-text-muted" />
                          <span>Email Address *</span>
                        </label>
                        <input
                          type="email"
                          required
                          placeholder="rahul@example.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="h-10 px-3 bg-bg-primary border border-border-normal rounded-xl text-text-heading focus:border-primary focus:outline-none"
                        />
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label className="text-text-heading font-semibold flex items-center gap-1.5">
                          <PhoneCall className="w-3.5 h-3.5 text-text-muted" />
                          <span>Phone Number *</span>
                        </label>
                        <input
                          type="tel"
                          required
                          placeholder="+91 9876543210"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          className="h-10 px-3 bg-bg-primary border border-border-normal rounded-xl text-text-heading focus:border-primary focus:outline-none font-mono"
                        />
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label className="text-text-heading font-semibold flex items-center gap-1.5">
                          <Building className="w-3.5 h-3.5 text-text-muted" />
                          <span>College / Organization</span>
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. CyberX Tech Academy"
                          value={college}
                          onChange={(e) => setCollege(e.target.value)}
                          className="h-10 px-3 bg-bg-primary border border-border-normal rounded-xl text-text-heading focus:border-primary focus:outline-none"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={submitting || isFull || isEnded}
                      className="w-full h-11 rounded-xl bg-primary hover:bg-opacity-95 text-black font-bold font-mono text-xs flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer mt-2"
                    >
                      {submitting ? (
                        <>
                          <Loader className="w-4 h-4 animate-spin" />
                          <span>GENERATING PASS...</span>
                        </>
                      ) : isEnded ? (
                        <span>EVENT CONCLUDED</span>
                      ) : isFull ? (
                        <span>REGISTRATIONS FULL</span>
                      ) : (
                        <>
                          <Ticket className="w-4 h-4" />
                          <span>CONFIRM RSVP &amp; GET PASS</span>
                        </>
                      )}
                    </button>

                    <p className="text-[10px] text-text-muted text-center font-mono">
                      🔒 Instant digital event pass issuance upon submission.
                    </p>

                  </form>
                ) : (
                  <form onSubmit={handleLookupPass} className="space-y-4 text-xs font-sans">
                    <p className="text-text-muted font-mono text-[11px]">
                      Already registered? Enter your email to retrieve your CyberX Event Pass.
                    </p>

                    {lookupError && (
                      <div className="p-3 bg-cyber-danger/10 border border-cyber-danger/30 rounded-xl text-cyber-danger font-mono text-[11px] flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 shrink-0" />
                        <span>{lookupError}</span>
                      </div>
                    )}

                    <div className="flex flex-col gap-1.5">
                      <label className="text-text-heading font-semibold">Registered Email</label>
                      <input
                        type="email"
                        required
                        placeholder="your-email@example.com"
                        value={lookupEmail}
                        onChange={(e) => setLookupEmail(e.target.value)}
                        className="h-10 px-3 bg-bg-primary border border-border-normal rounded-xl text-text-heading focus:border-primary focus:outline-none"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={lookupLoading || !lookupEmail}
                      className="w-full h-11 rounded-xl bg-primary hover:bg-opacity-95 text-black font-bold font-mono text-xs flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
                    >
                      {lookupLoading ? <Loader className="w-4 h-4 animate-spin" /> : <Ticket className="w-4 h-4" />}
                      <span>RETRIEVE MY PASS</span>
                    </button>
                  </form>
                )}

              </div>
            )}

          </div>

        </div>

        {/* FULL WIDTH SECTION: INTERACTIVE EVENT API DOCUMENTATION */}
        <section className="mt-12 bg-bg-surface/60 border border-border-normal/70 rounded-2xl p-6 sm:p-8 space-y-6 print:hidden shadow-xl">
          
          {/* Section Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border-normal/50 pb-5">
            <div>
              <div className="flex items-center gap-2 text-primary font-mono text-xs font-bold uppercase tracking-wider mb-1">
                <Code className="w-4 h-4" />
                <span>{"// EVENT TEAM & DEVELOPER API DOCS"}</span>
              </div>
              <h2 className="font-display font-extrabold text-xl text-text-heading">
                API Integration &amp; Endpoints Reference
              </h2>
              <p className="text-xs text-text-muted font-mono mt-0.5">
                Target endpoints, payload schemas, response contracts, status codes, and cURL snippets for {event.title}
              </p>
            </div>

            <span className="px-3 py-1.5 rounded-lg bg-bg-elevated border border-border-normal text-text-heading font-mono text-xs font-bold shrink-0 self-start sm:self-auto">
              ID: {event.id}
            </span>
          </div>

          {/* Endpoints Nav Pills */}
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-border-normal">
            {apiEndpoints.map((ep, idx) => {
              const isSelected = idx === activeApiEndpointIdx;
              const methodColor =
                ep.method === 'POST' ? 'text-cyber-success bg-cyber-success/10 border-cyber-success/30' :
                ep.method === 'GET' ? 'text-blue-400 bg-blue-500/10 border-blue-500/30' :
                ep.method === 'PUT' ? 'text-cyber-warning bg-cyber-warning/10 border-cyber-warning/30' :
                'text-cyber-danger bg-cyber-danger/10 border-cyber-danger/30';

              return (
                <button
                  key={ep.id}
                  onClick={() => { setActiveApiEndpointIdx(idx); setActiveApiTab('payload'); }}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-mono font-semibold transition-all shrink-0 cursor-pointer border ${
                    isSelected
                      ? 'bg-bg-elevated border-primary text-text-heading shadow-sm'
                      : 'bg-bg-primary/50 border-border-normal/40 text-text-muted hover:text-text-heading hover:border-border-normal'
                  }`}
                >
                  <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold border ${methodColor}`}>
                    {ep.method}
                  </span>
                  <span>{ep.title}</span>
                </button>
              );
            })}
          </div>

          {/* Selected Endpoint Card */}
          <div className="bg-bg-primary border border-border-normal/60 rounded-xl p-5 sm:p-6 space-y-6">
            
            {/* Endpoint Method & URL Bar */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-bg-surface border border-border-normal/50 rounded-xl p-3.5 font-mono text-xs">
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className={`px-2.5 py-1 rounded-md text-xs font-extrabold border ${
                  currentEndpoint.method === 'POST' ? 'bg-cyber-success/15 border-cyber-success/40 text-cyber-success' :
                  currentEndpoint.method === 'GET' ? 'bg-blue-500/15 border-blue-500/40 text-blue-400' :
                  currentEndpoint.method === 'PUT' ? 'bg-cyber-warning/15 border-cyber-warning/40 text-cyber-warning' :
                  'bg-cyber-danger/15 border-cyber-danger/40 text-cyber-danger'
                }`}>
                  {currentEndpoint.method}
                </span>
                <span className="text-text-heading font-bold select-all break-all sm:break-normal">
                  {currentOrigin}{currentEndpoint.path}
                </span>
              </div>

              <button
                onClick={() => handleCopyText(`${currentOrigin}${currentEndpoint.path}`, `url-${currentEndpoint.id}`)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-bg-elevated border border-border-normal hover:border-primary text-text-heading hover:text-primary text-[10px] font-bold transition-colors cursor-pointer shrink-0"
              >
                {copiedApiItem === `url-${currentEndpoint.id}` ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-cyber-success" />
                    <span>COPIED URL</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>COPY URL</span>
                  </>
                )}
              </button>
            </div>

            {/* Description */}
            <p className="text-xs text-text-body font-sans leading-relaxed">
              {currentEndpoint.description}
            </p>

            {/* Inner Tabs: Payload | Response | cURL | Error Codes */}
            <div className="space-y-4">
              <div className="flex border-b border-border-normal/40 font-mono text-xs gap-4 overflow-x-auto">
                <button
                  onClick={() => setActiveApiTab('payload')}
                  className={`pb-2.5 font-bold transition-colors cursor-pointer shrink-0 ${
                    activeApiTab === 'payload' ? 'text-primary border-b-2 border-primary' : 'text-text-muted hover:text-text-heading'
                  }`}
                >
                  SAMPLE INPUT (PAYLOAD)
                </button>
                <button
                  onClick={() => setActiveApiTab('response')}
                  className={`pb-2.5 font-bold transition-colors cursor-pointer shrink-0 ${
                    activeApiTab === 'response' ? 'text-primary border-b-2 border-primary' : 'text-text-muted hover:text-text-heading'
                  }`}
                >
                  EXPECTED RESPONSE (200/201)
                </button>
                <button
                  onClick={() => setActiveApiTab('curl')}
                  className={`pb-2.5 font-bold transition-colors cursor-pointer shrink-0 ${
                    activeApiTab === 'curl' ? 'text-primary border-b-2 border-primary' : 'text-text-muted hover:text-text-heading'
                  }`}
                >
                  TERMINAL cURL SNIPPET
                </button>
                <button
                  onClick={() => setActiveApiTab('errors')}
                  className={`pb-2.5 font-bold transition-colors cursor-pointer shrink-0 ${
                    activeApiTab === 'errors' ? 'text-primary border-b-2 border-primary' : 'text-text-muted hover:text-text-heading'
                  }`}
                >
                  POSSIBLE ERRORS &amp; CODES
                </button>
              </div>

              {/* Tab Content Display */}
              {activeApiTab === 'payload' && (
                <div className="relative group">
                  <pre className="p-4 bg-[#050506] border border-border-normal/50 rounded-xl text-xs font-mono text-emerald-400 overflow-x-auto leading-relaxed">
                    {currentEndpoint.sampleInput}
                  </pre>
                  <button
                    onClick={() => handleCopyText(currentEndpoint.sampleInput, `payload-${currentEndpoint.id}`)}
                    className="absolute top-3 right-3 p-2 bg-bg-surface/80 border border-border-normal rounded-lg text-text-muted hover:text-primary transition-colors cursor-pointer"
                    title="Copy Sample Input Payload"
                  >
                    {copiedApiItem === `payload-${currentEndpoint.id}` ? <Check className="w-4 h-4 text-cyber-success" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              )}

              {activeApiTab === 'response' && (
                <div className="relative group">
                  <pre className="p-4 bg-[#050506] border border-border-normal/50 rounded-xl text-xs font-mono text-blue-300 overflow-x-auto leading-relaxed">
                    {currentEndpoint.sampleResponse}
                  </pre>
                  <button
                    onClick={() => handleCopyText(currentEndpoint.sampleResponse, `resp-${currentEndpoint.id}`)}
                    className="absolute top-3 right-3 p-2 bg-bg-surface/80 border border-border-normal rounded-lg text-text-muted hover:text-primary transition-colors cursor-pointer"
                    title="Copy Expected Response JSON"
                  >
                    {copiedApiItem === `resp-${currentEndpoint.id}` ? <Check className="w-4 h-4 text-cyber-success" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              )}

              {activeApiTab === 'curl' && (
                <div className="relative group">
                  <pre className="p-4 bg-[#050506] border border-border-normal/50 rounded-xl text-xs font-mono text-yellow-300 overflow-x-auto leading-relaxed">
                    {currentEndpoint.curl}
                  </pre>
                  <button
                    onClick={() => handleCopyText(currentEndpoint.curl, `curl-${currentEndpoint.id}`)}
                    className="absolute top-3 right-3 p-2 bg-bg-surface/80 border border-border-normal rounded-lg text-text-muted hover:text-primary transition-colors cursor-pointer"
                    title="Copy cURL Command"
                  >
                    {copiedApiItem === `curl-${currentEndpoint.id}` ? <Check className="w-4 h-4 text-cyber-success" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              )}

              {activeApiTab === 'errors' && (
                <div className="border border-border-normal/50 rounded-xl overflow-hidden font-mono text-xs">
                  <table className="w-full text-left divide-y divide-border-normal/40">
                    <thead className="bg-bg-surface text-text-muted text-[10px] uppercase">
                      <tr>
                        <th className="p-3">Status Code</th>
                        <th className="p-3">Trigger Reason</th>
                        <th className="p-3">Resolution / Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border-normal/30 bg-[#050506]">
                      {currentEndpoint.errors.map((err, i) => (
                        <tr key={i} className="hover:bg-bg-surface/40">
                          <td className="p-3 font-bold text-cyber-danger">{err.code}</td>
                          <td className="p-3 text-text-heading">{err.reason}</td>
                          <td className="p-3 text-text-muted text-[11px] font-sans">{err.solution}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

          </div>
        </section>

      </main>

      {/* Footer */}
      <footer className="border-t border-border-normal bg-bg-surface/10 py-6 text-center text-[10px] font-mono text-text-muted z-10 print:hidden">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row justify-between items-center gap-2">
          <span>&copy; {new Date().getFullYear()} CyberX Community. All rights reserved.</span>
          <span className="text-[9px] opacity-60">Verified Cryptographic Identity Node</span>
        </div>
      </footer>

    </div>
  );
}
