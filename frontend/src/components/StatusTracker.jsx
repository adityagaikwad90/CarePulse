import React, { useState } from 'react';
import { 
  Search, CheckCircle2, Clock, AlertTriangle, 
  MapPin, Calendar, FileText, Pill, Stethoscope, ArrowRight 
} from 'lucide-react';
import { apiUrl } from '../services/api';

export default function StatusTracker({ initialQuery = '' }) {
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');

  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) {
      setError('Please enter an Appointment ID (e.g. APT-1001) or your Email.');
      return;
    }
    setError('');
    setLoading(true);

    try {
      const isEmail = searchQuery.includes('@');
      let url = '';
      if (isEmail) {
        url = `/api/appointments?patientEmail=${encodeURIComponent(searchQuery.trim())}`;
      } else {
        url = `/api/appointments/${encodeURIComponent(searchQuery.trim().toUpperCase())}`;
      }

      const res = await fetch(apiUrl(url));
      if (!res.ok) {
        if (res.status === 404) {
          throw new Error(`No appointment found for "${searchQuery}". Please check the ID or email.`);
        }
        throw new Error('Failed to fetch appointment record');
      }

      const data = await res.json();
      if (Array.isArray(data)) {
        setResults(data);
      } else {
        setResults([data]);
      }
    } catch (err) {
      setError(err.message);
      setResults(null);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'approved':
        return <span className="badge badge-approved"><CheckCircle2 size={12} /> Approved & Scheduled</span>;
      case 'rescheduled':
        return <span className="badge badge-rescheduled"><Clock size={12} /> Rescheduled by Doctor</span>;
      case 'completed':
        return <span className="badge badge-completed"><CheckCircle2 size={12} /> Consultation Completed</span>;
      case 'rejected':
      case 'cancelled':
        return <span className="badge badge-rejected"><AlertTriangle size={12} /> Cancelled / Declined</span>;
      default:
        return <span className="badge badge-pending"><Clock size={12} /> Pending Doctor Review</span>;
    }
  };

  return (
    <div className="glass-card" style={{ padding: '32px', marginBottom: '40px' }} id="tracker-section">
      <div style={{ marginBottom: '24px' }}>
        <h3 style={{ fontSize: '1.4rem', marginBottom: '6px' }}>Track Appointment Status</h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          Check real-time confirmation status, assigned consultation rooms, doctor schedule notes, and prescriptions.
        </p>
      </div>

      <form onSubmit={handleSearch} style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '24px' }}>
        <div style={{ flex: '1', minWidth: '260px', position: 'relative' }}>
          <Search size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)' }} />
          <input
            type="text"
            className="form-input"
            style={{ paddingLeft: '42px' }}
            placeholder="Enter Appointment ID (e.g. APT-1001) or Email Address"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? 'Searching...' : 'Search Record'}
          <ArrowRight size={16} />
        </button>
      </form>

      {error && (
        <div style={{
          backgroundColor: '#fee2e2',
          border: '1px solid #f87171',
          color: '#991b1b',
          padding: '12px 16px',
          borderRadius: '10px',
          fontSize: '0.85rem'
        }}>
          {error}
        </div>
      )}

      {/* Results */}
      {results && results.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', marginTop: '16px' }}>
          {results.map((apt) => (
            <div key={apt.id} className="digital-pass" style={{ margin: 0 }}>
              <div className="digital-pass-header">
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span className="pass-id-badge">{apt.id}</span>
                    <h4 style={{ fontSize: '1.1rem' }}>{apt.patientName}</h4>
                  </div>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Booked on: {new Date(apt.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <div>{getStatusBadge(apt.status)}</div>
              </div>

              {/* Progress Timeline */}
              <div className="tracker-timeline">
                <div className={`timeline-step completed`}>
                  <div className="timeline-dot"><CheckCircle2 size={16} /></div>
                  <span className="timeline-label">Submitted</span>
                </div>

                <div className={`timeline-step ${apt.status !== 'pending' ? 'completed' : 'active'}`}>
                  <div className="timeline-dot"><Clock size={16} /></div>
                  <span className="timeline-label">Doctor Review</span>
                </div>

                <div className={`timeline-step ${apt.status === 'approved' || apt.status === 'rescheduled' ? 'active' : (apt.status === 'completed' ? 'completed' : '')}`}>
                  <div className="timeline-dot"><Calendar size={16} /></div>
                  <span className="timeline-label">Scheduled</span>
                </div>

                <div className={`timeline-step ${apt.status === 'completed' ? 'completed' : ''}`}>
                  <div className="timeline-dot"><Stethoscope size={16} /></div>
                  <span className="timeline-label">Completed</span>
                </div>
              </div>

              {/* Details Grid */}
              <div className="pass-grid">
                <div className="pass-field">
                  <label>Assigned Specialist</label>
                  <span>{apt.doctorName}</span>
                </div>
                <div className="pass-field">
                  <label>Department</label>
                  <span>{apt.department}</span>
                </div>
                <div className="pass-field">
                  <label>Scheduled Date & Time</label>
                  <span style={{ color: 'var(--primary)' }}>
                    {apt.scheduledDate && apt.scheduledTime 
                      ? `${apt.scheduledDate} at ${apt.scheduledTime}`
                      : `Requested: ${apt.preferredDate} (${apt.preferredTime})`
                    }
                  </span>
                </div>
                <div className="pass-field">
                  <label>Consultation Room</label>
                  <span>{apt.room || 'To be assigned upon arrival'}</span>
                </div>
              </div>

              {/* Doctor's Notes */}
              {apt.doctorNotes && (
                <div style={{
                  background: '#eff6ff',
                  border: '1px solid #bfdbfe',
                  borderRadius: '10px',
                  padding: '12px 16px',
                  marginBottom: '12px',
                  fontSize: '0.85rem'
                }}>
                  <strong style={{ color: '#1e40af', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                    <FileText size={15} /> Doctor Note & Instructions:
                  </strong>
                  <p style={{ color: '#1e3a8a' }}>{apt.doctorNotes}</p>
                </div>
              )}

              {/* Prescription / Clinical Advice */}
              {apt.prescription && (
                <div style={{
                  background: '#f0fdf4',
                  border: '1px solid #bbf7d0',
                  borderRadius: '10px',
                  padding: '12px 16px',
                  fontSize: '0.85rem'
                }}>
                  <strong style={{ color: '#166534', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                    <Pill size={15} /> Prescription & Clinical Recommendations:
                  </strong>
                  <p style={{ color: '#14532d' }}>{apt.prescription}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
