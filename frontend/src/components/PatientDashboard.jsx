import React, { useState } from 'react';
import { 
  Calendar, Clock, CheckCircle2, AlertCircle, MapPin, 
  User, Stethoscope, FileText, Pill, Printer, Copy, Check, 
  PlusCircle, RefreshCw, LogOut, ChevronRight, Filter, ShieldCheck, ArrowRight, XCircle
} from 'lucide-react';

export default function PatientDashboard({
  currentUser,
  appointments,
  doctors,
  onOpenBooking,
  onCancelAppointment,
  onSignOut,
  onRefresh,
  showToast
}) {
  const [statusFilter, setStatusFilter] = useState('all');
  const [copiedId, setCopiedId] = useState(null);
  const [selectedPassAppointment, setSelectedPassAppointment] = useState(null);

  // Filter appointments specifically for this logged-in patient
  const patientEmail = (currentUser?.email || '').toLowerCase().trim();
  const patientAppointments = appointments.filter(apt => {
    const aptEmail = (apt.patientEmail || '').toLowerCase().trim();
    return aptEmail === patientEmail;
  });

  // Calculate personalized stats for this patient
  const totalBooked = patientAppointments.length;
  const pendingCount = patientAppointments.filter(a => a.status === 'pending').length;
  const approvedCount = patientAppointments.filter(a => a.status === 'approved').length;
  const completedCount = patientAppointments.filter(a => a.status === 'completed').length;
  const rescheduledCount = patientAppointments.filter(a => a.status === 'rescheduled').length;

  // Filtered by status tab
  const displayedAppointments = patientAppointments.filter(apt => {
    if (statusFilter === 'all') return true;
    return apt.status === statusFilter;
  });

  const handleCopyId = (id) => {
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    if (showToast) showToast(`Appointment ID ${id} copied to clipboard!`, 'info');
    setTimeout(() => setCopiedId(null), 2500);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'approved':
        return (
          <span className="badge badge-approved" style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
            <CheckCircle2 size={13} /> Approved & Scheduled
          </span>
        );
      case 'rescheduled':
        return (
          <span className="badge badge-rescheduled" style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
            <Clock size={13} /> Rescheduled by Doctor
          </span>
        );
      case 'completed':
        return (
          <span className="badge badge-completed" style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
            <CheckCircle2 size={13} /> Consultation Completed
          </span>
        );
      case 'rejected':
      case 'cancelled':
        return (
          <span className="badge badge-rejected" style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
            <XCircle size={13} /> Cancelled
          </span>
        );
      default:
        return (
          <span className="badge badge-pending" style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
            <Clock size={13} /> Pending Doctor Review
          </span>
        );
    }
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 16px 40px' }}>
      {/* Patient Profile Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 60%, #0369a1 100%)',
        borderRadius: '24px',
        padding: '32px',
        color: '#ffffff',
        marginBottom: '28px',
        boxShadow: '0 20px 40px -15px rgba(2, 132, 199, 0.25)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '20px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{
            width: '68px',
            height: '68px',
            borderRadius: '20px',
            background: 'linear-gradient(135deg, #38bdf8 0%, #0284c7 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.8rem',
            fontWeight: 800,
            boxShadow: '0 8px 20px rgba(56, 189, 248, 0.35)',
            border: '2px solid rgba(255, 255, 255, 0.2)'
          }}>
            {(currentUser?.name || 'P').charAt(0).toUpperCase()}
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
              <h2 style={{ fontSize: '1.6rem', fontWeight: 800, margin: 0, color: '#ffffff' }}>
                {currentUser?.name || 'Valued Patient'}
              </h2>
              <span style={{
                background: 'rgba(56, 189, 248, 0.2)',
                border: '1px solid rgba(56, 189, 248, 0.4)',
                color: '#38bdf8',
                fontSize: '0.72rem',
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: '9999px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px'
              }}>
                <ShieldCheck size={12} /> Authenticated Patient
              </span>
            </div>

            <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.88rem', display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
              <span>✉️ {currentUser?.email}</span>
              {currentUser?.phone && <span>📞 {currentUser?.phone}</span>}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={onOpenBooking}
            className="btn btn-primary"
            style={{
              boxShadow: '0 4px 14px rgba(2, 132, 199, 0.4)',
              background: '#0284c7',
              borderColor: '#0284c7'
            }}
          >
            <PlusCircle size={18} />
            <span>Book New Appointment</span>
          </button>

          <button
            onClick={onRefresh}
            className="btn btn-secondary"
            title="Refresh appointments"
            style={{ background: 'rgba(255, 255, 255, 0.1)', color: '#ffffff', border: '1px solid rgba(255, 255, 255, 0.2)' }}
          >
            <RefreshCw size={16} />
          </button>

          <button
            onClick={onSignOut}
            className="btn btn-secondary"
            style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#fca5a5', border: '1px solid rgba(239, 68, 68, 0.3)' }}
            title="Sign out of patient portal"
          >
            <LogOut size={16} />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* Personalized Statistics Counters */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
        gap: '16px',
        marginBottom: '28px'
      }}>
        {/* Total */}
        <div className="stat-card" style={{ borderLeft: '4px solid #0284c7' }}>
          <div className="stat-icon-wrapper" style={{ background: '#e0f2fe', color: '#0284c7' }}>
            <Calendar size={22} />
          </div>
          <div className="stat-details">
            <span className="stat-label">Total Appointments</span>
            <div className="stat-count">{totalBooked}</div>
            <span style={{ fontSize: '0.72rem', color: '#64748b' }}>Booked with our clinic</span>
          </div>
        </div>

        {/* Approved */}
        <div className="stat-card" style={{ borderLeft: '4px solid #10b981' }}>
          <div className="stat-icon-wrapper" style={{ background: '#d1fae5', color: '#059669' }}>
            <CheckCircle2 size={22} />
          </div>
          <div className="stat-details">
            <span className="stat-label">Approved & Scheduled</span>
            <div className="stat-count">{approvedCount}</div>
            <span style={{ fontSize: '0.72rem', color: '#059669', fontWeight: 600 }}>Ready for consultation</span>
          </div>
        </div>

        {/* Pending Review */}
        <div className="stat-card" style={{ borderLeft: '4px solid #f59e0b' }}>
          <div className="stat-icon-wrapper" style={{ background: '#fef3c7', color: '#d97706' }}>
            <Clock size={22} />
          </div>
          <div className="stat-details">
            <span className="stat-label">Pending Doctor Review</span>
            <div className="stat-count">{pendingCount}</div>
            <span style={{ fontSize: '0.72rem', color: '#d97706', fontWeight: 600 }}>Awaiting doctor action</span>
          </div>
        </div>

        {/* Completed */}
        <div className="stat-card" style={{ borderLeft: '4px solid #6366f1' }}>
          <div className="stat-icon-wrapper" style={{ background: '#e0e7ff', color: '#4f46e5' }}>
            <Stethoscope size={22} />
          </div>
          <div className="stat-details">
            <span className="stat-label">Completed</span>
            <div className="stat-count">{completedCount}</div>
            <span style={{ fontSize: '0.72rem', color: '#4f46e5', fontWeight: 600 }}>Rx & notes available</span>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
        marginBottom: '20px'
      }}>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {[
            { id: 'all', label: 'All Requests', count: totalBooked },
            { id: 'approved', label: 'Approved & Scheduled', count: approvedCount },
            { id: 'pending', label: 'Pending Review', count: pendingCount },
            { id: 'completed', label: 'Completed', count: completedCount },
            { id: 'rescheduled', label: 'Rescheduled', count: rescheduledCount }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              style={{
                padding: '8px 14px',
                borderRadius: '10px',
                border: statusFilter === tab.id ? '2px solid #0284c7' : '1px solid #e2e8f0',
                background: statusFilter === tab.id ? '#f0f9ff' : '#ffffff',
                color: statusFilter === tab.id ? '#0284c7' : '#64748b',
                fontWeight: statusFilter === tab.id ? 700 : 500,
                fontSize: '0.85rem',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.15s ease'
              }}
            >
              <span>{tab.label}</span>
              <span style={{
                background: statusFilter === tab.id ? '#0284c7' : '#f1f5f9',
                color: statusFilter === tab.id ? '#ffffff' : '#64748b',
                fontSize: '0.72rem',
                fontWeight: 700,
                padding: '1px 6px',
                borderRadius: '9999px'
              }}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        <span style={{ fontSize: '0.82rem', color: '#64748b' }}>
          Showing {displayedAppointments.length} of {totalBooked} personal records
        </span>
      </div>

      {/* Appointment Cards List */}
      {displayedAppointments.length === 0 ? (
        <div className="glass-card" style={{ padding: '60px 20px', textAlign: 'center' }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            background: '#f0f9ff',
            color: '#0284c7',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px'
          }}>
            <Calendar size={32} />
          </div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '0 0 8px', color: '#0f172a' }}>
            No appointments found in this view
          </h3>
          <p style={{ color: '#64748b', maxWidth: '440px', margin: '0 auto 20px', fontSize: '0.9rem' }}>
            {totalBooked === 0 
              ? "You haven't scheduled any consultations yet. Choose your preferred doctor and book your consultation in seconds!" 
              : "No appointments match your current filter. Try selecting 'All Requests'."}
          </p>
          <button onClick={onOpenBooking} className="btn btn-primary">
            <PlusCircle size={16} />
            <span>Book Your First Consultation</span>
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {displayedAppointments.map((apt) => {
            const doc = doctors.find(d => d.id === apt.doctorId);
            return (
              <div 
                key={apt.id} 
                className="digital-pass" 
                style={{ 
                  margin: 0,
                  boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.05)',
                  border: '1px solid #e2e8f0',
                  borderRadius: '20px'
                }}
              >
                {/* Header */}
                <div className="digital-pass-header" style={{ borderBottom: '1px solid #f1f5f9', paddingBottom: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    {/* Doctor Avatar */}
                    <img 
                      src={doc?.avatar || 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=400'} 
                      alt={apt.doctorName}
                      style={{
                        width: '52px',
                        height: '52px',
                        borderRadius: '16px',
                        objectFit: 'cover',
                        border: '2px solid #e0f2fe'
                      }}
                    />
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <h4 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, color: '#0f172a' }}>
                          {apt.doctorName}
                        </h4>
                        <span style={{ 
                          fontSize: '0.72rem', 
                          fontWeight: 700, 
                          color: '#0284c7', 
                          background: '#f0f9ff',
                          padding: '2px 8px',
                          borderRadius: '6px'
                        }}>
                          {apt.department}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '4px' }}>
                        <button
                          type="button"
                          onClick={() => handleCopyId(apt.id)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#64748b',
                            fontSize: '0.78rem',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            cursor: 'pointer',
                            padding: 0
                          }}
                          title="Click to copy Appointment ID"
                        >
                          <strong>{apt.id}</strong>
                          {copiedId === apt.id ? <Check size={12} color="#10b981" /> : <Copy size={12} />}
                        </button>
                        <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>•</span>
                        <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                          Booked on: {new Date(apt.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div>
                    {getStatusBadge(apt.status)}
                  </div>
                </div>

                {/* Visual Progress Timeline */}
                <div className="tracker-timeline" style={{ margin: '20px 0 24px' }}>
                  <div className="timeline-step completed">
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
                <div className="pass-grid" style={{ marginBottom: '18px' }}>
                  <div className="pass-field">
                    <label>Assigned Consultation Room</label>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#0f172a', fontWeight: 600 }}>
                      <MapPin size={15} color="#0284c7" />
                      {apt.room || doc?.room || 'Assigned upon check-in'}
                    </span>
                  </div>

                  <div className="pass-field">
                    <label>Confirmed Date & Time</label>
                    <span style={{ color: '#0284c7', fontWeight: 700, fontSize: '0.95rem' }}>
                      {apt.scheduledDate && apt.scheduledTime 
                        ? `${apt.scheduledDate} at ${apt.scheduledTime}`
                        : `Requested: ${apt.preferredDate} (${apt.preferredTime})`
                      }
                    </span>
                  </div>

                  <div className="pass-field">
                    <label>Reason for Consultation</label>
                    <span>{apt.reason || 'General Health Consultation'}</span>
                  </div>

                  <div className="pass-field">
                    <label>Consultation Fee</label>
                    <span>₹{doc?.consultationFee || 1000} (Pay at desk or insurance)</span>
                  </div>
                </div>

                {/* Doctor's Clinical Notes */}
                {apt.doctorNotes && (
                  <div style={{
                    background: '#f0f9ff',
                    border: '1px solid #bae6fd',
                    borderRadius: '12px',
                    padding: '14px 18px',
                    marginBottom: '14px',
                    fontSize: '0.88rem'
                  }}>
                    <strong style={{ color: '#0369a1', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                      <FileText size={16} /> Direct Doctor Instructions & Notes:
                    </strong>
                    <p style={{ color: '#0c4a6e', margin: 0, lineHeight: 1.5 }}>
                      {apt.doctorNotes}
                    </p>
                  </div>
                )}

                {/* Doctor's Prescription (Available when completed) */}
                {apt.prescription && (
                  <div style={{
                    background: '#f0fdf4',
                    border: '1px solid #bbf7d0',
                    borderRadius: '12px',
                    padding: '14px 18px',
                    marginBottom: '14px',
                    fontSize: '0.88rem'
                  }}>
                    <strong style={{ color: '#15803d', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                      <Pill size={16} /> Doctor Prescription & Medical Recommendations:
                    </strong>
                    <p style={{ color: '#14532d', margin: 0, lineHeight: 1.5, whiteSpace: 'pre-line' }}>
                      {apt.prescription}
                    </p>
                  </div>
                )}

                {/* Card Actions */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '12px', borderTop: '1px solid #f1f5f9' }}>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                      type="button"
                      onClick={() => window.print()}
                      className="btn btn-secondary btn-sm"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                    >
                      <Printer size={14} />
                      <span>Print Pass</span>
                    </button>
                  </div>

                  {apt.status === 'pending' && onCancelAppointment && (
                    <button
                      type="button"
                      onClick={() => onCancelAppointment(apt.id)}
                      className="btn btn-danger btn-sm"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                    >
                      <XCircle size={14} />
                      <span>Cancel Request</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
