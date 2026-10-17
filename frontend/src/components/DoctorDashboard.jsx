import React, { useState, useMemo } from 'react';
import { 
  Users, Clock, CheckCircle, CheckCircle2, Calendar, AlertCircle, 
  Search, Filter, ChevronRight, Stethoscope, MapPin, 
  FileEdit, XCircle, Check, RefreshCw, Send, Sparkles, PlusCircle,
  Copy, Phone, Mail, User, UserCheck, ShieldCheck, Printer, ArrowRight,
  ExternalLink, CalendarDays
} from 'lucide-react';

export default function DoctorDashboard({ 
  appointments = [], 
  doctors = [], 
  stats, 
  currentDoctor,
  onRefresh, 
  onUpdateStatus, 
  onReschedule,
  onExitDoctorMode,
  onLockSession,
  onSwitchDoctor,
  showToast 
}) {
  // Doctor filter
  const [selectedDoctorId, setSelectedDoctorId] = useState(() => {
    return currentDoctor ? currentDoctor.id : 'All';
  });

  // Date filters: 'all', 'today', 'tomorrow', 'upcoming', or 'custom'
  const [dateFilter, setDateFilter] = useState('all');
  const [customDate, setCustomDate] = useState('');
  
  // Status filter: 'all', 'approved', 'pending', 'completed', 'rescheduled'
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedId, setCopiedId] = useState(null);

  // Active Modals
  const [activeModal, setActiveModal] = useState(null); // 'approve', 'reschedule', 'complete', 'reject'
  const [targetAppointment, setTargetAppointment] = useState(null);

  // Form states for modals
  const [approveForm, setApproveForm] = useState({
    scheduledDate: '',
    scheduledTime: '',
    room: '',
    doctorNotes: ''
  });

  const [rescheduleForm, setRescheduleForm] = useState({
    scheduledDate: '',
    scheduledTime: '',
    doctorNotes: ''
  });

  const [completeForm, setCompleteForm] = useState({
    doctorNotes: '',
    prescription: ''
  });

  const [rejectReason, setRejectReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Resolve active doctor profile
  const activeDoctor = useMemo(() => {
    if (currentDoctor) return currentDoctor;
    if (selectedDoctorId && selectedDoctorId !== 'All') {
      return doctors.find(d => d.id === selectedDoctorId) || null;
    }
    return null;
  }, [currentDoctor, selectedDoctorId, doctors]);

  // Appointments strictly assigned to this doctor (or all if in general supervisor mode)
  const doctorAppointments = useMemo(() => {
    if (activeDoctor) {
      return appointments.filter(apt => apt.doctorId === activeDoctor.id);
    }
    return appointments;
  }, [appointments, activeDoctor]);

  // Helper date strings
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const tomorrowStr = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  }, []);

  // Extract all distinct dates in this doctor's appointments
  const availableDates = useMemo(() => {
    const datesMap = {};
    doctorAppointments.forEach(apt => {
      const d = apt.scheduledDate || apt.preferredDate;
      if (d) {
        datesMap[d] = (datesMap[d] || 0) + 1;
      }
    });
    return Object.entries(datesMap)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, count]) => ({ date, count }));
  }, [doctorAppointments]);

  // Filter by Date
  const dateFilteredAppointments = useMemo(() => {
    return doctorAppointments.filter(apt => {
      const aptDate = apt.scheduledDate || apt.preferredDate;
      if (!aptDate) return dateFilter === 'all';

      if (dateFilter === 'all') return true;
      if (dateFilter === 'today') return aptDate === todayStr;
      if (dateFilter === 'tomorrow') return aptDate === tomorrowStr;
      if (dateFilter === 'upcoming') return aptDate >= todayStr;
      if (dateFilter === 'custom' && customDate) return aptDate === customDate;
      return true;
    });
  }, [doctorAppointments, dateFilter, customDate, todayStr, tomorrowStr]);

  // Personalized Doctor Stats BY DATE
  const dateStats = useMemo(() => {
    return {
      total: dateFilteredAppointments.length,
      approved: dateFilteredAppointments.filter(a => a.status === 'approved').length,
      pending: dateFilteredAppointments.filter(a => a.status === 'pending').length,
      completed: dateFilteredAppointments.filter(a => a.status === 'completed').length,
      rescheduled: dateFilteredAppointments.filter(a => a.status === 'rescheduled').length
    };
  }, [dateFilteredAppointments]);

  // Filter by Status and Search Term
  const displayedAppointments = useMemo(() => {
    return dateFilteredAppointments.filter(apt => {
      // Status filter
      if (statusFilter !== 'all' && apt.status !== statusFilter) {
        return false;
      }
      // Search filter
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchName = apt.patientName?.toLowerCase().includes(q);
        const matchId = apt.id?.toLowerCase().includes(q);
        const matchEmail = apt.patientEmail?.toLowerCase().includes(q);
        const matchPhone = apt.patientPhone?.toLowerCase().includes(q);
        const matchReason = apt.reason?.toLowerCase().includes(q);
        return matchName || matchId || matchEmail || matchPhone || matchReason;
      }
      return true;
    });
  }, [dateFilteredAppointments, statusFilter, searchTerm]);

  // Copy Reference ID
  const handleCopyId = (id) => {
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    if (showToast) showToast(`Appointment ID ${id} copied!`, 'info');
    setTimeout(() => setCopiedId(null), 2500);
  };

  // Open Approve Modal
  const openApproveModal = (apt) => {
    const doc = activeDoctor || doctors.find(d => d.id === apt.doctorId);
    setTargetAppointment(apt);
    setApproveForm({
      scheduledDate: apt.scheduledDate || apt.preferredDate || todayStr,
      scheduledTime: apt.scheduledTime || apt.preferredTime || (doc?.slots?.[0] || '10:00 AM'),
      room: apt.room || doc?.room || 'Room 101 - Outpatient Wing',
      doctorNotes: apt.doctorNotes || 'Appointment approved. Please arrive 10 minutes prior.'
    });
    setActiveModal('approve');
  };

  // Submit Approval
  const handleApproveSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onUpdateStatus(targetAppointment.id, {
        status: 'approved',
        scheduledDate: approveForm.scheduledDate,
        scheduledTime: approveForm.scheduledTime,
        room: approveForm.room,
        doctorNotes: approveForm.doctorNotes
      });
      if (showToast) showToast('Appointment approved & consultation slot confirmed!', 'success');
      setActiveModal(null);
    } catch (err) {
      if (showToast) showToast(err.message || 'Failed to approve', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Open Reschedule Modal
  const openRescheduleModal = (apt) => {
    const doc = activeDoctor || doctors.find(d => d.id === apt.doctorId);
    setTargetAppointment(apt);
    setRescheduleForm({
      scheduledDate: apt.scheduledDate || apt.preferredDate || tomorrowStr,
      scheduledTime: doc?.slots?.[1] || apt.preferredTime || '02:00 PM',
      doctorNotes: apt.doctorNotes || 'Rescheduled due to clinical emergency schedule.'
    });
    setActiveModal('reschedule');
  };

  // Submit Reschedule
  const handleRescheduleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onReschedule(targetAppointment.id, {
        scheduledDate: rescheduleForm.scheduledDate,
        scheduledTime: rescheduleForm.scheduledTime,
        doctorNotes: rescheduleForm.doctorNotes
      });
      if (showToast) showToast('Appointment rescheduled with new date and time!', 'success');
      setActiveModal(null);
    } catch (err) {
      if (showToast) showToast(err.message || 'Failed to reschedule', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Open Complete Consultation Modal
  const openCompleteModal = (apt) => {
    setTargetAppointment(apt);
    setCompleteForm({
      doctorNotes: apt.doctorNotes || 'Consultation completed. Patient vitals evaluated.',
      prescription: apt.prescription || 'Rx: Paracetamol 500mg BID x 3 days. Follow up in 7 days if symptoms persist.'
    });
    setActiveModal('complete');
  };

  // Submit Complete
  const handleCompleteSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onUpdateStatus(targetAppointment.id, {
        status: 'completed',
        doctorNotes: completeForm.doctorNotes,
        prescription: completeForm.prescription
      });
      if (showToast) showToast('Consultation marked completed with clinical prescription!', 'success');
      setActiveModal(null);
    } catch (err) {
      if (showToast) showToast(err.message || 'Failed to complete consultation', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Open Reject Modal
  const openRejectModal = (apt) => {
    setTargetAppointment(apt);
    setRejectReason('Doctor unavailable due to emergency on-call duty.');
    setActiveModal('reject');
  };

  // Submit Reject
  const handleRejectSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onUpdateStatus(targetAppointment.id, {
        status: 'rejected',
        doctorNotes: rejectReason
      });
      if (showToast) showToast('Appointment request declined.', 'info');
      setActiveModal(null);
    } catch (err) {
      if (showToast) showToast(err.message || 'Failed to reject', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Print Consultation Slip
  const handlePrintSlip = (apt) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(`
      <html>
        <head>
          <title>Clinical Consultation Slip - ${apt.id}</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 30px; color: #0f172a; max-width: 700px; margin: 0 auto; }
            .header { border-bottom: 2px solid #0284c7; padding-bottom: 12px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center; }
            .hospital { font-size: 22px; font-weight: 800; color: #0284c7; }
            .field-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 20px; }
            .field { background: #f8fafc; padding: 12px; border-radius: 8px; border: 1px solid #e2e8f0; }
            .field label { font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: 700; display: block; }
            .field div { font-size: 15px; font-weight: 700; color: #0f172a; margin-top: 4px; }
            .rx-box { border: 2px dashed #0284c7; background: #f0f9ff; padding: 16px; border-radius: 10px; margin-top: 20px; }
            .stamp { text-align: right; margin-top: 40px; font-size: 13px; color: #64748b; }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <div class="hospital">CarePulse Clinical Center</div>
              <div style="font-size: 12px; color: #64748b;">NABH & JCI Accredited Hospital</div>
            </div>
            <div style="text-align: right;">
              <div style="font-weight: 800; font-family: monospace; font-size: 16px; color: #0284c7;">${apt.id}</div>
              <div style="font-size: 11px; color: #64748b;">Status: ${apt.status.toUpperCase()}</div>
            </div>
          </div>
          <div class="field-grid">
            <div class="field">
              <label>Patient Name</label>
              <div>${apt.patientName} (${apt.patientAge ? apt.patientAge + 'y, ' : ''}${apt.patientGender || 'Patient'})</div>
            </div>
            <div class="field">
              <label>Consulting Specialist</label>
              <div>${apt.doctorName} (${apt.department})</div>
            </div>
            <div class="field">
              <label>Confirmed Date & Time</label>
              <div>${apt.scheduledDate || apt.preferredDate} at ${apt.scheduledTime || apt.preferredTime}</div>
            </div>
            <div class="field">
              <label>Consultation Room</label>
              <div>${apt.room || 'Outpatient Clinic'}</div>
            </div>
          </div>
          <div class="field" style="margin-bottom: 16px;">
            <label>Chief Complaint / Reason for Visit</label>
            <div style="font-weight: 500; font-size: 14px; margin-top: 4px;">${apt.reason}</div>
          </div>
          ${apt.doctorNotes ? `
            <div class="field" style="margin-bottom: 16px; background: #f0fdf4; border-color: #bbf7d0;">
              <label style="color: #166534;">Doctor Instructions & Clinical Observations</label>
              <div style="font-weight: 500; font-size: 14px; color: #166534; margin-top: 4px;">${apt.doctorNotes}</div>
            </div>
          ` : ''}
          ${apt.prescription ? `
            <div class="rx-box">
              <label style="font-weight: 800; font-size: 13px; color: #0284c7;">Rx Medical Prescription</label>
              <div style="white-space: pre-wrap; font-family: monospace; font-size: 14px; color: #0f172a; margin-top: 8px;">${apt.prescription}</div>
            </div>
          ` : ''}
          <div class="stamp">
            <div>Verified & Signed: <strong>${apt.doctorName}</strong></div>
            <div>Department of ${apt.department}</div>
          </div>
          <script>window.print();</script>
        </body>
      </html>
    `);
    printWindow.document.close();
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
      case 'cancelled':
      case 'rejected':
        return (
          <span className="badge badge-rejected" style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
            <XCircle size={13} /> Declined
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
    <div style={{ maxWidth: '1240px', margin: '0 auto', paddingBottom: '80px' }}>
      
      {/* 1. Doctor Profile Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 60%, #0369a1 100%)',
        borderRadius: '24px',
        padding: '32px',
        color: '#ffffff',
        marginBottom: '28px',
        boxShadow: '0 20px 45px -15px rgba(2, 132, 199, 0.3)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '24px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '22px', flexWrap: 'wrap' }}>
          {/* Doctor Avatar */}
          <img 
            src={activeDoctor?.avatar || 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=400'} 
            alt={activeDoctor?.name || 'Doctor'}
            style={{
              width: '82px',
              height: '82px',
              borderRadius: '22px',
              objectFit: 'cover',
              border: '3px solid rgba(255, 255, 255, 0.3)',
              boxShadow: '0 10px 25px rgba(0, 0, 0, 0.25)'
            }}
          />

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px', flexWrap: 'wrap' }}>
              <h2 style={{ fontSize: '1.85rem', fontWeight: 800, margin: 0, letterSpacing: '-0.02em', color: '#ffffff' }}>
                {activeDoctor ? activeDoctor.name : 'Clinical Specialist Console'}
              </h2>
              <span style={{
                background: 'rgba(56, 189, 248, 0.2)',
                border: '1px solid rgba(56, 189, 248, 0.4)',
                color: '#38bdf8',
                fontSize: '0.75rem',
                fontWeight: 700,
                padding: '3px 10px',
                borderRadius: '9999px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px'
              }}>
                <ShieldCheck size={13} /> {activeDoctor?.department || 'Cardiology'} Specialist
              </span>
            </div>

            <div style={{ display: 'flex', gap: '18px', flexWrap: 'wrap', color: '#cbd5e1', fontSize: '0.9rem' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <Stethoscope size={15} color="#38bdf8" /> {activeDoctor?.title || 'Senior Consultant'}
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <MapPin size={15} color="#38bdf8" /> {activeDoctor?.room || 'Outpatient Wing'}
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <Clock size={15} color="#38bdf8" /> Fee: ₹{activeDoctor?.consultationFee || 1000}
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <Mail size={15} color="#38bdf8" /> {activeDoctor?.email}
              </span>
            </div>
          </div>
        </div>

        {/* Action Controls in Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          {onSwitchDoctor && (
            <button
              onClick={onSwitchDoctor}
              className="btn btn-secondary btn-sm"
              style={{ background: 'rgba(255, 255, 255, 0.12)', color: '#ffffff', border: '1px solid rgba(255, 255, 255, 0.25)', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              title="Switch to another clinician account"
            >
              <UserCheck size={15} />
              <span>Switch Doctor</span>
            </button>
          )}

          <button
            onClick={onRefresh}
            className="btn btn-secondary btn-sm"
            style={{ background: 'rgba(255, 255, 255, 0.12)', color: '#ffffff', border: '1px solid rgba(255, 255, 255, 0.25)' }}
            title="Reload live consultation queue"
          >
            <RefreshCw size={15} />
          </button>

          <button
            onClick={onLockSession || onExitDoctorMode}
            className="btn btn-danger btn-sm"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            title="Lock session and sign out"
          >
            <XCircle size={15} />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* Quick Doctor Account Switcher Bar (Demo Friendly) */}
      <div style={{
        background: '#ffffff',
        borderRadius: '16px',
        padding: '12px 18px',
        border: '1px solid #e2e8f0',
        marginBottom: '28px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        flexWrap: 'wrap'
      }}>
        <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b' }}>
          🩺 Clinician Queue View:
        </span>
        {doctors.slice(0, 5).map(doc => {
          const isActive = activeDoctor?.id === doc.id;
          return (
            <button
              key={doc.id}
              onClick={() => {
                setSelectedDoctorId(doc.id);
                if (showToast) showToast(`Viewing Dr. ${doc.name}'s personalized schedule`, 'info');
              }}
              className={`btn btn-sm ${isActive ? 'btn-primary' : 'btn-secondary'}`}
              style={{ fontSize: '0.78rem', padding: '4px 12px' }}
            >
              {doc.name} ({doc.department})
            </button>
          );
        })}
      </div>

      {/* 2. Date Breakdown & Filter Controls ("Total appointment by date") */}
      <div style={{
        background: '#ffffff',
        borderRadius: '20px',
        border: '1px solid #e2e8f0',
        padding: '22px 24px',
        marginBottom: '28px',
        boxShadow: '0 8px 20px -6px rgba(0, 0, 0, 0.04)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px', marginBottom: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <CalendarDays size={20} color="#0284c7" />
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, color: '#0f172a' }}>
              Appointment Schedule by Date
            </h3>
            {dateFilter !== 'all' && (
              <span style={{
                background: '#e0f2fe',
                color: '#0369a1',
                fontSize: '0.75rem',
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: '6px'
              }}>
                Filtered by {dateFilter === 'custom' ? customDate : dateFilter}
              </span>
            )}
          </div>

          {/* Quick Date Chips */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
            <button
              className={`btn btn-sm ${dateFilter === 'all' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => { setDateFilter('all'); setCustomDate(''); }}
              style={{ fontSize: '0.78rem', padding: '5px 12px' }}
            >
              All Dates ({doctorAppointments.length})
            </button>

            <button
              className={`btn btn-sm ${dateFilter === 'today' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => { setDateFilter('today'); setCustomDate(''); }}
              style={{ fontSize: '0.78rem', padding: '5px 12px' }}
            >
              Today
            </button>

            <button
              className={`btn btn-sm ${dateFilter === 'tomorrow' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => { setDateFilter('tomorrow'); setCustomDate(''); }}
              style={{ fontSize: '0.78rem', padding: '5px 12px' }}
            >
              Tomorrow
            </button>

            <button
              className={`btn btn-sm ${dateFilter === 'upcoming' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => { setDateFilter('upcoming'); setCustomDate(''); }}
              style={{ fontSize: '0.78rem', padding: '5px 12px' }}
            >
              Upcoming
            </button>

            {/* Custom Date Input */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <input 
                type="date"
                value={customDate}
                onChange={(e) => {
                  setCustomDate(e.target.value);
                  setDateFilter('custom');
                }}
                className="form-input"
                style={{ padding: '4px 10px', fontSize: '0.8rem', height: '32px', width: 'auto' }}
                title="Select specific date"
              />
              {dateFilter === 'custom' && (
                <button 
                  className="btn btn-secondary btn-sm"
                  onClick={() => { setDateFilter('all'); setCustomDate(''); }}
                  style={{ height: '32px', padding: '0 8px' }}
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Date chips carousel if multiple dates available */}
        {availableDates.length > 0 && (
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', paddingTop: '10px', borderTop: '1px solid #f1f5f9' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', display: 'flex', alignItems: 'center' }}>
              Jump to Date:
            </span>
            {availableDates.map(item => {
              const isSelected = dateFilter === 'custom' && customDate === item.date;
              return (
                <button
                  key={item.date}
                  onClick={() => {
                    setCustomDate(item.date);
                    setDateFilter('custom');
                  }}
                  style={{
                    background: isSelected ? '#0284c7' : '#f8fafc',
                    color: isSelected ? '#ffffff' : '#475569',
                    border: isSelected ? '1px solid #0284c7' : '1px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '0.76rem',
                    padding: '3px 9px',
                    cursor: 'pointer',
                    fontWeight: 600
                  }}
                >
                  📅 {item.date} ({item.count})
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* 3. Metric Stat Cards by Selected Date (Approved, Completed, Scheduled, Pending) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
        gap: '16px',
        marginBottom: '28px'
      }}>
        {/* Total Appointments by Date */}
        <div className="stat-card" style={{ borderLeft: '4px solid #0284c7' }}>
          <div className="stat-icon-wrapper" style={{ background: '#e0f2fe', color: '#0284c7' }}>
            <Calendar size={22} />
          </div>
          <div className="stat-details">
            <span className="stat-label">Total Appointments</span>
            <div className="stat-count">{dateStats.total}</div>
            <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
              {dateFilter === 'all' ? 'Across all consultation dates' : `For selected date`}
            </span>
          </div>
        </div>

        {/* Approved & Scheduled */}
        <div className="stat-card" style={{ borderLeft: '4px solid #10b981' }}>
          <div className="stat-icon-wrapper" style={{ background: '#d1fae5', color: '#059669' }}>
            <CheckCircle2 size={22} />
          </div>
          <div className="stat-details">
            <span className="stat-label">Approved & Scheduled</span>
            <div className="stat-count">{dateStats.approved}</div>
            <span style={{ fontSize: '0.72rem', color: '#059669', fontWeight: 600 }}>Ready for consultation</span>
          </div>
        </div>

        {/* Pending Doctor Review */}
        <div className="stat-card" style={{ borderLeft: '4px solid #f59e0b' }}>
          <div className="stat-icon-wrapper" style={{ background: '#fef3c7', color: '#d97706' }}>
            <Clock size={22} />
          </div>
          <div className="stat-details">
            <span className="stat-label">Pending Doctor Review</span>
            <div className="stat-count">{dateStats.pending}</div>
            <span style={{ fontSize: '0.72rem', color: '#d97706', fontWeight: 600 }}>Awaiting your approval</span>
          </div>
        </div>

        {/* Completed Consultations */}
        <div className="stat-card" style={{ borderLeft: '4px solid #6366f1' }}>
          <div className="stat-icon-wrapper" style={{ background: '#e0e7ff', color: '#4f46e5' }}>
            <Stethoscope size={22} />
          </div>
          <div className="stat-details">
            <span className="stat-label">Completed Consultations</span>
            <div className="stat-count">{dateStats.completed}</div>
            <span style={{ fontSize: '0.72rem', color: '#4f46e5', fontWeight: 600 }}>Rx & records filed</span>
          </div>
        </div>
      </div>

      {/* 4. Filter Navigation Tabs & Search Bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '14px',
        marginBottom: '24px'
      }}>
        {/* Status Filter Tabs */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {[
            { id: 'all', label: 'All Requests', count: dateStats.total },
            { id: 'approved', label: 'Approved & Scheduled', count: dateStats.approved },
            { id: 'pending', label: 'Pending Review', count: dateStats.pending },
            { id: 'completed', label: 'Completed', count: dateStats.completed },
            { id: 'rescheduled', label: 'Rescheduled', count: dateStats.rescheduled }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              style={{
                padding: '8px 16px',
                borderRadius: '9999px',
                border: statusFilter === tab.id ? '2px solid #0284c7' : '1px solid #e2e8f0',
                background: statusFilter === tab.id ? '#f0f9ff' : '#ffffff',
                color: statusFilter === tab.id ? '#0284c7' : '#64748b',
                fontWeight: statusFilter === tab.id ? 700 : 500,
                fontSize: '0.86rem',
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
                padding: '1px 7px',
                borderRadius: '9999px'
              }}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: '260px' }}>
          <div style={{ position: 'relative', width: '100%' }}>
            <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input 
              type="text"
              placeholder="Search patient, ID, phone, symptoms..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="form-input"
              style={{ paddingLeft: '36px', height: '38px', borderRadius: '9999px', fontSize: '0.85rem' }}
            />
          </div>
        </div>
      </div>

      {/* 5. Appointment Details Cards (NOT traditional dashboard table) */}
      {displayedAppointments.length === 0 ? (
        <div style={{
          background: '#ffffff',
          borderRadius: '24px',
          border: '1px solid #e2e8f0',
          padding: '60px 20px',
          textAlign: 'center',
          boxShadow: '0 8px 25px -8px rgba(0,0,0,0.05)'
        }}>
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
            No appointments found for this filter
          </h3>
          <p style={{ color: '#64748b', maxWidth: '440px', margin: '0 auto 20px', fontSize: '0.9rem' }}>
            There are currently no patient consultations matching the selected date or status category.
          </p>
          <button
            onClick={() => { setDateFilter('all'); setStatusFilter('all'); setSearchTerm(''); setCustomDate(''); }}
            className="btn btn-secondary"
          >
            Reset All Filters
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
          {displayedAppointments.map((apt) => {
            const isApproved = apt.status === 'approved';
            const isPending = apt.status === 'pending';
            const isRescheduled = apt.status === 'rescheduled';
            const isCompleted = apt.status === 'completed';

            return (
              <div
                key={apt.id}
                className="digital-pass"
                style={{
                  margin: 0,
                  boxShadow: '0 12px 30px -8px rgba(0, 0, 0, 0.06)',
                  border: '1px solid #e2e8f0',
                  borderRadius: '22px',
                  background: '#ffffff'
                }}
              >
                {/* Card Header: Patient Identity & Status Badge */}
                <div className="digital-pass-header" style={{ borderBottom: '1px solid #f1f5f9', paddingBottom: '18px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                    {/* Patient Initials Avatar */}
                    <div style={{
                      width: '54px',
                      height: '54px',
                      borderRadius: '16px',
                      background: isApproved 
                        ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' 
                        : isCompleted 
                        ? 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)'
                        : isRescheduled
                        ? 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)'
                        : 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                      color: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 800,
                      fontSize: '1.4rem',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                    }}>
                      {(apt.patientName || 'P').charAt(0).toUpperCase()}
                    </div>

                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                        <h4 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: '#0f172a' }}>
                          {apt.patientName}
                        </h4>
                        
                        {/* Demographic pill matching Firestore screenshot */}
                        <span style={{
                          fontSize: '0.76rem',
                          fontWeight: 700,
                          color: '#0369a1',
                          background: '#f0f9ff',
                          padding: '3px 10px',
                          borderRadius: '8px',
                          border: '1px solid #bae6fd'
                        }}>
                          {apt.patientAge ? `${apt.patientAge}y • ` : ''}{apt.patientGender || 'Patient'}
                        </span>
                      </div>

                      {/* Reference ID & Contact */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginTop: '4px', flexWrap: 'wrap' }}>
                        <button
                          type="button"
                          onClick={() => handleCopyId(apt.id)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#64748b',
                            fontSize: '0.8rem',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            cursor: 'pointer',
                            padding: 0
                          }}
                          title="Click to copy Appointment ID"
                        >
                          <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#0284c7' }}>
                            {apt.id}
                          </span>
                          {copiedId === apt.id ? <Check size={13} color="#10b981" /> : <Copy size={13} />}
                        </button>

                        <span style={{ color: '#cbd5e1' }}>•</span>

                        <span style={{ fontSize: '0.8rem', color: '#64748b', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <Phone size={13} /> {apt.patientPhone || 'No phone'}
                        </span>

                        <span style={{ color: '#cbd5e1' }}>•</span>

                        <span style={{ fontSize: '0.8rem', color: '#64748b', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <Mail size={13} /> {apt.patientEmail || 'No email'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {getStatusBadge(apt.status)}
                  </div>
                </div>

                {/* 4-Stage Clinical Progress Timeline (Matching Patient Profile Screenshot) */}
                <div style={{ margin: '20px 0 24px' }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    position: 'relative',
                    maxWidth: '720px',
                    margin: '0 auto'
                  }}>
                    {/* Connecting Background Line */}
                    <div style={{
                      position: 'absolute',
                      top: '14px',
                      left: '20px',
                      right: '20px',
                      height: '3px',
                      background: '#e2e8f0',
                      zIndex: 1
                    }} />

                    {/* Active Filled Line */}
                    <div style={{
                      position: 'absolute',
                      top: '14px',
                      left: '20px',
                      width: isCompleted ? 'calc(100% - 40px)' : (isApproved || isRescheduled) ? '66%' : isPending ? '33%' : '0%',
                      height: '3px',
                      background: isCompleted ? '#6366f1' : '#10b981',
                      zIndex: 2,
                      transition: 'all 0.3s ease'
                    }} />

                    {/* Step 1: Submitted */}
                    <div style={{ position: 'relative', zIndex: 3, textAlign: 'center', width: '80px' }}>
                      <div style={{
                        width: '30px',
                        height: '30px',
                        borderRadius: '50%',
                        background: '#10b981',
                        color: '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 6px',
                        boxShadow: '0 2px 6px rgba(16, 185, 129, 0.4)'
                      }}>
                        <Check size={15} strokeWidth={3} />
                      </div>
                      <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#10b981' }}>Submitted</span>
                    </div>

                    {/* Step 2: Doctor Review */}
                    <div style={{ position: 'relative', zIndex: 3, textAlign: 'center', width: '80px' }}>
                      <div style={{
                        width: '30px',
                        height: '30px',
                        borderRadius: '50%',
                        background: (isPending || isApproved || isRescheduled || isCompleted) ? '#10b981' : '#f1f5f9',
                        color: (isPending || isApproved || isRescheduled || isCompleted) ? '#ffffff' : '#94a3b8',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 6px',
                        boxShadow: isPending ? '0 0 0 4px rgba(245, 158, 11, 0.2)' : 'none'
                      }}>
                        {isPending ? <Clock size={15} /> : <Check size={15} strokeWidth={3} />}
                      </div>
                      <span style={{ fontSize: '0.72rem', fontWeight: 700, color: isPending ? '#d97706' : '#10b981' }}>
                        Doctor Review
                      </span>
                    </div>

                    {/* Step 3: Scheduled / Approved */}
                    <div style={{ position: 'relative', zIndex: 3, textAlign: 'center', width: '80px' }}>
                      <div style={{
                        width: '30px',
                        height: '30px',
                        borderRadius: '50%',
                        background: (isApproved || isRescheduled || isCompleted) ? '#0284c7' : '#f1f5f9',
                        color: (isApproved || isRescheduled || isCompleted) ? '#ffffff' : '#94a3b8',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 6px',
                        boxShadow: (isApproved || isRescheduled) ? '0 0 0 4px rgba(2, 132, 199, 0.2)' : 'none'
                      }}>
                        <Calendar size={15} />
                      </div>
                      <span style={{ fontSize: '0.72rem', fontWeight: 700, color: (isApproved || isRescheduled) ? '#0284c7' : isCompleted ? '#10b981' : '#94a3b8' }}>
                        Scheduled
                      </span>
                    </div>

                    {/* Step 4: Completed */}
                    <div style={{ position: 'relative', zIndex: 3, textAlign: 'center', width: '80px' }}>
                      <div style={{
                        width: '30px',
                        height: '30px',
                        borderRadius: '50%',
                        background: isCompleted ? '#6366f1' : '#f1f5f9',
                        color: isCompleted ? '#ffffff' : '#94a3b8',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 6px',
                        boxShadow: isCompleted ? '0 0 0 4px rgba(99, 102, 241, 0.2)' : 'none'
                      }}>
                        <Stethoscope size={15} />
                      </div>
                      <span style={{ fontSize: '0.72rem', fontWeight: 700, color: isCompleted ? '#6366f1' : '#94a3b8' }}>
                        Completed
                      </span>
                    </div>
                  </div>
                </div>

                {/* Appointment Information Grid */}
                <div className="pass-grid" style={{ marginBottom: '16px' }}>
                  <div className="pass-field">
                    <label style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <MapPin size={12} color="#0284c7" /> Assigned Consultation Room
                    </label>
                    <span style={{ color: '#0f172a', fontWeight: 700 }}>
                      {apt.room || (activeDoctor?.room || 'Outpatient Consultation Wing')}
                    </span>
                  </div>

                  <div className="pass-field">
                    <label style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Calendar size={12} color="#0284c7" /> Confirmed Date & Time
                    </label>
                    <span style={{ color: '#0284c7', fontWeight: 800 }}>
                      {apt.scheduledDate && apt.scheduledTime 
                        ? `${apt.scheduledDate} at ${apt.scheduledTime}` 
                        : `Requested: ${apt.preferredDate} (${apt.preferredTime})`}
                    </span>
                  </div>

                  <div className="pass-field">
                    <label>Reason for Consultation</label>
                    <span style={{ fontWeight: 600, color: '#334155' }}>
                      {apt.reason || 'Routine consultation'}
                    </span>
                  </div>

                  <div className="pass-field">
                    <label>Consultation Fee</label>
                    <span style={{ fontWeight: 700, color: '#0f172a' }}>
                      ₹{activeDoctor?.consultationFee || 1000} (Desk / Insurance)
                    </span>
                  </div>
                </div>

                {/* Direct Doctor Instructions & Notes Section */}
                {apt.doctorNotes && (
                  <div style={{
                    background: '#f0f9ff',
                    border: '1px solid #bae6fd',
                    borderRadius: '14px',
                    padding: '14px 18px',
                    margin: '14px 0',
                    fontSize: '0.88rem'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, color: '#0369a1', marginBottom: '4px' }}>
                      <FileEdit size={14} />
                      <span>Direct Doctor Instructions & Notes:</span>
                    </div>
                    <div style={{ color: '#0c4a6e', lineHeight: 1.5 }}>
                      {apt.doctorNotes}
                    </div>
                  </div>
                )}

                {/* Prescription Box if Completed */}
                {apt.prescription && (
                  <div style={{
                    background: '#f5f3ff',
                    border: '1px solid #ddd6fe',
                    borderRadius: '14px',
                    padding: '14px 18px',
                    margin: '14px 0',
                    fontSize: '0.88rem'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, color: '#6d28d9', marginBottom: '4px' }}>
                      <Stethoscope size={14} />
                      <span>Medical Prescription (Rx):</span>
                    </div>
                    <div style={{ color: '#4c1d95', whiteSpace: 'pre-wrap', fontFamily: 'monospace', fontSize: '0.9rem', lineHeight: 1.6 }}>
                      {apt.prescription}
                    </div>
                  </div>
                )}

                {/* Doctor Interactive Action Controls on Each Appointment Card */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '12px',
                  marginTop: '16px',
                  paddingTop: '16px',
                  borderTop: '1px solid #f1f5f9'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b', fontSize: '0.8rem' }}>
                    <ShieldCheck size={14} color="#10b981" />
                    <span>Clinical Record Verified • Firebase Synchronized</span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    {/* Action buttons based on status */}
                    {isPending && (
                      <>
                        <button
                          className="btn btn-success btn-sm"
                          onClick={() => openApproveModal(apt)}
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '7px 16px' }}
                        >
                          <Check size={15} />
                          <span>Approve & Schedule</span>
                        </button>

                        <button
                          className="btn btn-warning btn-sm"
                          onClick={() => openRescheduleModal(apt)}
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                        >
                          <Calendar size={14} />
                          <span>Reschedule Slot</span>
                        </button>

                        <button
                          className="btn btn-secondary btn-sm"
                          style={{ color: '#ef4444', borderColor: '#fecaca' }}
                          onClick={() => openRejectModal(apt)}
                          title="Decline appointment"
                        >
                          <XCircle size={14} />
                          <span>Decline</span>
                        </button>
                      </>
                    )}

                    {(isApproved || isRescheduled) && (
                      <>
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => openCompleteModal(apt)}
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '7px 16px' }}
                        >
                          <Stethoscope size={15} />
                          <span>Complete Consultation & Prescribe Rx</span>
                        </button>

                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => openRescheduleModal(apt)}
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                        >
                          <Calendar size={14} />
                          <span>Change Time / Room</span>
                        </button>

                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => handlePrintSlip(apt)}
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                          title="Print Consultation Slip"
                        >
                          <Printer size={14} />
                          <span>Print Slip</span>
                        </button>
                      </>
                    )}

                    {isCompleted && (
                      <>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => openCompleteModal(apt)}
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                        >
                          <FileEdit size={14} />
                          <span>Edit Clinical Summary & Rx</span>
                        </button>

                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => handlePrintSlip(apt)}
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                        >
                          <Printer size={14} />
                          <span>Print Clinical Rx Slip</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ================= MODALS ================= */}

      {/* APPROVE MODAL */}
      {activeModal === 'approve' && targetAppointment && (
        <div className="modal-overlay" onClick={() => setActiveModal(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '540px' }}>
            <div style={{ padding: '24px', borderBottom: '1px solid var(--border)' }}>
              <h3 style={{ fontSize: '1.25rem', margin: '0 0 6px' }}>Approve & Confirm Consultation</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0 }}>
                Patient: <strong>{targetAppointment.patientName}</strong> • {targetAppointment.id}
              </p>
            </div>

            <form onSubmit={handleApproveSubmit} style={{ padding: '24px' }}>
              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label className="form-label">Confirmed Consultation Date *</label>
                <input
                  type="date"
                  className="form-input"
                  required
                  value={approveForm.scheduledDate}
                  onChange={e => setApproveForm(prev => ({ ...prev, scheduledDate: e.target.value }))}
                />
              </div>

              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label className="form-label">Confirmed Time Slot *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. 10:00 AM"
                  required
                  value={approveForm.scheduledTime}
                  onChange={e => setApproveForm(prev => ({ ...prev, scheduledTime: e.target.value }))}
                />
              </div>

              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label className="form-label">Assigned Room / Wing *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Room 304 - Cardio Wing A"
                  required
                  value={approveForm.room}
                  onChange={e => setApproveForm(prev => ({ ...prev, room: e.target.value }))}
                />
              </div>

              <div className="form-group" style={{ marginBottom: '20px' }}>
                <label className="form-label">Doctor Instructions / Preparation Notes</label>
                <textarea
                  className="form-textarea"
                  style={{ minHeight: '80px' }}
                  placeholder="e.g. Appointment verified and approved. Bring previous ECG & test reports..."
                  value={approveForm.doctorNotes}
                  onChange={e => setApproveForm(prev => ({ ...prev, doctorNotes: e.target.value }))}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setActiveModal(null)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-success" disabled={submitting}>
                  {submitting ? 'Confirming...' : 'Approve & Confirm'}
                  <Check size={16} />
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RESCHEDULE MODAL */}
      {activeModal === 'reschedule' && targetAppointment && (
        <div className="modal-overlay" onClick={() => setActiveModal(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '540px' }}>
            <div style={{ padding: '24px', borderBottom: '1px solid var(--border)' }}>
              <h3 style={{ fontSize: '1.25rem', margin: '0 0 6px' }}>Reschedule Consultation Date/Slot</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0 }}>
                Patient: <strong>{targetAppointment.patientName}</strong> • {targetAppointment.id}
              </p>
            </div>

            <form onSubmit={handleRescheduleSubmit} style={{ padding: '24px' }}>
              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label className="form-label">New Consultation Date *</label>
                <input
                  type="date"
                  className="form-input"
                  required
                  value={rescheduleForm.scheduledDate}
                  onChange={e => setRescheduleForm(prev => ({ ...prev, scheduledDate: e.target.value }))}
                />
              </div>

              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label className="form-label">New Time Slot *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. 02:30 PM"
                  required
                  value={rescheduleForm.scheduledTime}
                  onChange={e => setRescheduleForm(prev => ({ ...prev, scheduledTime: e.target.value }))}
                />
              </div>

              <div className="form-group" style={{ marginBottom: '20px' }}>
                <label className="form-label">Reason for Rescheduling (shared with patient) *</label>
                <textarea
                  className="form-textarea"
                  style={{ minHeight: '80px' }}
                  placeholder="e.g. Rescheduled due to clinical emergency and procedure schedule..."
                  required
                  value={rescheduleForm.doctorNotes}
                  onChange={e => setRescheduleForm(prev => ({ ...prev, doctorNotes: e.target.value }))}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setActiveModal(null)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Updating...' : 'Save & Update Schedule'}
                  <Calendar size={16} />
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* COMPLETE / PRESCRIPTION MODAL */}
      {activeModal === 'complete' && targetAppointment && (
        <div className="modal-overlay" onClick={() => setActiveModal(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '580px' }}>
            <div style={{ padding: '24px', borderBottom: '1px solid var(--border)' }}>
              <h3 style={{ fontSize: '1.25rem', margin: '0 0 6px' }}>Clinical Findings & Prescription</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0 }}>
                Patient: <strong>{targetAppointment.patientName}</strong> • {targetAppointment.id}
              </p>
            </div>

            <form onSubmit={handleCompleteSubmit} style={{ padding: '24px' }}>
              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label className="form-label">Clinical Observations & Doctor Instructions</label>
                <textarea
                  className="form-textarea"
                  style={{ minHeight: '80px' }}
                  placeholder="Record diagnosis, observations, follow-up advice..."
                  value={completeForm.doctorNotes}
                  onChange={e => setCompleteForm(prev => ({ ...prev, doctorNotes: e.target.value }))}
                />
              </div>

              <div className="form-group" style={{ marginBottom: '20px' }}>
                <label className="form-label">Prescription (Rx) & Medications</label>
                <textarea
                  className="form-textarea"
                  style={{ minHeight: '120px', fontFamily: 'monospace', fontSize: '0.9rem' }}
                  placeholder="Rx: Medication name, dosage, frequency, course duration..."
                  value={completeForm.prescription}
                  onChange={e => setCompleteForm(prev => ({ ...prev, prescription: e.target.value }))}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setActiveModal(null)}>
                  Close
                </button>
                <button type="submit" className="btn btn-success" disabled={submitting}>
                  {submitting ? 'Saving...' : 'Mark Consultation Completed'}
                  <CheckCircle size={16} />
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* REJECT MODAL */}
      {activeModal === 'reject' && targetAppointment && (
        <div className="modal-overlay" onClick={() => setActiveModal(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <div style={{ padding: '24px', borderBottom: '1px solid var(--border)' }}>
              <h3 style={{ fontSize: '1.25rem', color: '#dc2626', margin: '0 0 6px' }}>Decline Consultation Request</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0 }}>
                Patient: <strong>{targetAppointment.patientName}</strong> ({targetAppointment.id})
              </p>
            </div>

            <form onSubmit={handleRejectSubmit} style={{ padding: '24px' }}>
              <div className="form-group" style={{ marginBottom: '20px' }}>
                <label className="form-label">Reason for Declining *</label>
                <textarea
                  className="form-textarea"
                  required
                  placeholder="Explain why this request cannot be accepted..."
                  value={rejectReason}
                  onChange={e => setRejectReason(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setActiveModal(null)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-danger" disabled={submitting}>
                  {submitting ? 'Declining...' : 'Decline Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
