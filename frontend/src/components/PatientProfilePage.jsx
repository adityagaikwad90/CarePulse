import React, { useState, useEffect } from 'react';
import { 
  Activity, ArrowLeft, Calendar, Clock, CheckCircle2, AlertCircle, 
  MapPin, User, Stethoscope, FileText, Pill, Printer, Copy, Check, 
  PlusCircle, RefreshCw, LogOut, ChevronRight, ShieldCheck, XCircle, 
  Edit3, Phone, Mail, Heart, Sparkles, UserCheck, ExternalLink
} from 'lucide-react';
import { getStoredUser, fetchPatientProfile, updatePatientProfile, logoutAll } from '../services/authService';

export default function PatientProfilePage({
  currentUser: initialUser,
  doctors = [],
  onBackToHome,
  showToast
}) {
  const [user, setUser] = useState(() => initialUser || getStoredUser());
  const [profileData, setProfileData] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [stats, setStats] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    phone: '',
    age: '',
    gender: 'Male',
    emergencyContact: '',
    bloodGroup: 'O+'
  });

  const loadData = async () => {
    const activeEmail = user?.email || 'ram@gmail.com';
    setLoading(true);
    try {
      const data = await fetchPatientProfile(activeEmail);
      if (data) {
        setProfileData(data.profile);
        setAppointments(data.appointments || []);
        setStats(data.stats || null);
        setEditForm({
          name: data.profile?.name || '',
          phone: data.profile?.phone || '',
          age: data.profile?.age || 28,
          gender: data.profile?.gender || 'Male',
          emergencyContact: data.profile?.emergencyContact || '',
          bloodGroup: data.profile?.bloodGroup || 'O+'
        });
      }
    } catch (err) {
      console.warn('Profile load notice:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    document.title = 'CarePulse | Patient Profile & Appointment History';
    loadData();
  }, [user]);

  const handleCopyId = (id) => {
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    if (showToast) showToast(`Appointment ID ${id} copied!`, 'info');
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    try {
      const res = await updatePatientProfile({
        email: user?.email,
        ...editForm
      });
      setUser(prev => ({ ...prev, ...res.user }));
      setProfileData(prev => ({ ...prev, ...res.user }));
      setIsEditing(false);
      if (showToast) showToast('Profile details updated successfully!', 'success');
      loadData();
    } catch (err) {
      if (showToast) showToast(err.message || 'Failed to update profile', 'error');
    }
  };

  const handleSignOut = () => {
    logoutAll();
    setUser(null);
    if (showToast) showToast('Signed out of patient account.', 'info');
    if (window.opener) {
      window.close();
    } else if (onBackToHome) {
      onBackToHome();
    } else {
      window.location.href = '/';
    }
  };

  // Quick switch demo profile
  const handleSwitchPatient = (demoEmail, demoName) => {
    const demoUser = {
      name: demoName,
      email: demoEmail,
      role: 'patient'
    };
    localStorage.setItem('carepulse_auth_user', JSON.stringify(demoUser));
    setUser(demoUser);
    if (showToast) showToast(`Switched view to patient ${demoName} (${demoEmail})`, 'info');
  };

  // Status Filter
  const displayedAppointments = appointments.filter(apt => {
    if (statusFilter === 'all') return true;
    return apt.status === statusFilter;
  });

  const totalCount = appointments.length;
  const approvedCount = appointments.filter(a => a.status === 'approved').length;
  const pendingCount = appointments.filter(a => a.status === 'pending').length;
  const completedCount = appointments.filter(a => a.status === 'completed').length;
  const rescheduledCount = appointments.filter(a => a.status === 'rescheduled').length;

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
    <div style={{ minHeight: '100vh', background: '#f8fafc', color: '#0f172a' }}>
      {/* Top Navigation */}
      <header className="glass-header" style={{ position: 'sticky', top: 0, zIndex: 100, background: 'rgba(255, 255, 255, 0.95)', borderBottom: '1px solid #e2e8f0' }}>
        <div className="navbar-inner" style={{ maxWidth: '1240px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button
              onClick={() => {
                if (window.opener) {
                  window.close();
                } else if (onBackToHome) {
                  onBackToHome();
                } else {
                  window.location.href = '/';
                }
              }}
              className="btn btn-secondary btn-sm"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              title="Return to hospital portal"
            >
              <ArrowLeft size={16} />
              <span>Hospital Home</span>
            </button>

            <div className="brand-logo" style={{ cursor: 'pointer' }} onClick={() => window.location.href = '/'}>
              <div className="brand-icon-box" style={{ width: '36px', height: '36px', borderRadius: '10px' }}>
                <Activity size={20} strokeWidth={2.5} />
              </div>
              <div className="brand-text">
                <h1 style={{ fontSize: '1.2rem', margin: 0 }}>CarePulse</h1>
                <span style={{ fontSize: '0.72rem' }}>Patient Health Portal</span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div className="system-status-pill" title="Synchronized with Cloud Firestore Database">
              <div className="pulse-dot" />
              <span>Firebase Cloud Active</span>
            </div>

            <button
              onClick={() => {
                if (window.opener) {
                  window.opener.location.href = '/#booking-section';
                  window.close();
                } else {
                  window.location.href = '/#booking-section';
                }
              }}
              className="btn btn-primary btn-sm"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <PlusCircle size={15} />
              <span>Book Appointment</span>
            </button>

            <button
              onClick={handleSignOut}
              className="btn btn-secondary btn-sm"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#ef4444', borderColor: '#fecaca' }}
            >
              <LogOut size={15} />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Profile Workspace */}
      <main style={{ maxWidth: '1240px', margin: '32px auto', padding: '0 20px 60px' }}>
        
        {/* Patient Profile Header Card */}
        <div style={{
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 60%, #0369a1 100%)',
          borderRadius: '24px',
          padding: '36px',
          color: '#ffffff',
          marginBottom: '32px',
          boxShadow: '0 20px 45px -15px rgba(2, 132, 199, 0.3)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '24px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '24px', flexWrap: 'wrap' }}>
            {/* Avatar */}
            <div style={{
              width: '84px',
              height: '84px',
              borderRadius: '24px',
              background: 'linear-gradient(135deg, #38bdf8 0%, #0284c7 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '2.4rem',
              fontWeight: 800,
              boxShadow: '0 10px 25px rgba(56, 189, 248, 0.4)',
              border: '3px solid rgba(255, 255, 255, 0.25)'
            }}>
              {(user?.name || profileData?.name || 'P').charAt(0).toUpperCase()}
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px', flexWrap: 'wrap' }}>
                <h2 style={{ fontSize: '1.9rem', fontWeight: 800, margin: 0, letterSpacing: '-0.02em', color: '#ffffff' }}>
                  {profileData?.name || user?.name || 'Hospital Patient'}
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
                  <ShieldCheck size={13} /> Authenticated Patient Profile
                </span>
              </div>

              {/* Patient Demographics (referencing Firestore Screenshot fields: age, gender, phone, email) */}
              <div style={{ display: 'flex', gap: '18px', flexWrap: 'wrap', color: '#cbd5e1', fontSize: '0.92rem' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  <Mail size={15} color="#38bdf8" /> {profileData?.email || user?.email}
                </span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  <Phone size={15} color="#38bdf8" /> {profileData?.phone || user?.phone || 'Not provided'}
                </span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  <User size={15} color="#38bdf8" /> Age: {profileData?.age || 28} yrs
                </span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  <UserCheck size={15} color="#38bdf8" /> Gender: {profileData?.gender || 'Male'}
                </span>
              </div>
            </div>
          </div>

          {/* Header Action Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="btn btn-secondary"
              style={{ background: 'rgba(255, 255, 255, 0.12)', color: '#ffffff', border: '1px solid rgba(255, 255, 255, 0.25)', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <Edit3 size={15} />
              <span>{isEditing ? 'Cancel Edit' : 'Edit Profile'}</span>
            </button>

            <button
              onClick={loadData}
              className="btn btn-secondary"
              style={{ background: 'rgba(255, 255, 255, 0.12)', color: '#ffffff', border: '1px solid rgba(255, 255, 255, 0.25)' }}
              title="Refresh profile records"
            >
              <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {/* Profile Edit Drawer / Form (Expandable) */}
        {isEditing && (
          <div style={{
            background: '#ffffff',
            borderRadius: '20px',
            border: '1px solid #e2e8f0',
            padding: '28px',
            marginBottom: '32px',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.05)'
          }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: '0 0 18px', color: '#0f172a' }}>
              Update Personal & Medical Record Details
            </h3>
            <form onSubmit={handleSaveProfile}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '20px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>Full Name</label>
                  <input
                    type="text"
                    className="form-input"
                    value={editForm.name}
                    onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>Phone Number</label>
                  <input
                    type="tel"
                    className="form-input"
                    value={editForm.phone}
                    onChange={e => setEditForm({ ...editForm, phone: e.target.value })}
                    placeholder="+91 / Mobile"
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>Patient Age</label>
                  <input
                    type="number"
                    className="form-input"
                    value={editForm.age}
                    onChange={e => setEditForm({ ...editForm, age: e.target.value })}
                    placeholder="e.g. 43"
                    min="1"
                    max="120"
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>Patient Gender</label>
                  <select
                    className="form-input"
                    value={editForm.gender}
                    onChange={e => setEditForm({ ...editForm, gender: e.target.value })}
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other / Prefer not to say</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>Blood Group</label>
                  <select
                    className="form-input"
                    value={editForm.bloodGroup}
                    onChange={e => setEditForm({ ...editForm, bloodGroup: e.target.value })}
                  >
                    <option value="O+">O Positive (O+)</option>
                    <option value="A+">A Positive (A+)</option>
                    <option value="B+">B Positive (B+)</option>
                    <option value="AB+">AB Positive (AB+)</option>
                    <option value="O-">O Negative (O-)</option>
                    <option value="A-">A Negative (A-)</option>
                    <option value="B-">B Negative (B-)</option>
                    <option value="AB-">AB Negative (AB-)</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>Emergency Contact Phone</label>
                  <input
                    type="tel"
                    className="form-input"
                    value={editForm.emergencyContact}
                    onChange={e => setEditForm({ ...editForm, emergencyContact: e.target.value })}
                    placeholder="Emergency Contact"
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setIsEditing(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Changes to Firestore & Profile
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Demo Account Switcher Pill Bar (for convenience testing) */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          marginBottom: '28px',
          background: '#ffffff',
          padding: '10px 18px',
          borderRadius: '14px',
          border: '1px solid #e2e8f0',
          flexWrap: 'wrap'
        }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b' }}>
            ⚡ Quick Test View:
          </span>
          <button
            onClick={() => handleSwitchPatient('ram@gmail.com', 'ram gaikwad')}
            className={`btn btn-sm ${user?.email === 'ram@gmail.com' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ fontSize: '0.78rem', padding: '4px 12px' }}
          >
            ram gaikwad (ram@gmail.com)
          </button>

          <button
            onClick={() => handleSwitchPatient('fa@gmail.com', 'fda')}
            className={`btn btn-sm ${user?.email === 'fa@gmail.com' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ fontSize: '0.78rem', padding: '4px 12px' }}
            title="Matches Firestore Screenshot APT-9029"
          >
            fda (fa@gmail.com • Firestore Sample)
          </button>

          <button
            onClick={() => handleSwitchPatient('emma.watson@example.com', 'Emma Watson')}
            className={`btn btn-sm ${user?.email === 'emma.watson@example.com' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ fontSize: '0.78rem', padding: '4px 12px' }}
          >
            Emma Watson (Cardiology Patient)
          </button>
        </div>

        {/* Metric Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
          gap: '16px',
          marginBottom: '32px'
        }}>
          {/* Total */}
          <div className="stat-card" style={{ borderLeft: '4px solid #0284c7' }}>
            <div className="stat-icon-wrapper" style={{ background: '#e0f2fe', color: '#0284c7' }}>
              <Calendar size={22} />
            </div>
            <div className="stat-details">
              <span className="stat-label">Total Appointments</span>
              <div className="stat-count">{totalCount}</div>
              <span style={{ fontSize: '0.72rem', color: '#64748b' }}>Booked with our clinic</span>
            </div>
          </div>

          {/* Approved & Scheduled */}
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
              <span style={{ fontSize: '0.72rem', color: '#d97706', fontWeight: 600 }}>Awaiting clinician action</span>
            </div>
          </div>

          {/* Completed */}
          <div className="stat-card" style={{ borderLeft: '4px solid #6366f1' }}>
            <div className="stat-icon-wrapper" style={{ background: '#e0e7ff', color: '#4f46e5' }}>
              <Stethoscope size={22} />
            </div>
            <div className="stat-details">
              <span className="stat-label">Completed Consultations</span>
              <div className="stat-count">{completedCount}</div>
              <span style={{ fontSize: '0.72rem', color: '#4f46e5', fontWeight: 600 }}>Prescriptions available</span>
            </div>
          </div>
        </div>

        {/* Filter Navigation Tabs */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          marginBottom: '24px'
        }}>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {[
              { id: 'all', label: 'All Requests', count: totalCount },
              { id: 'approved', label: 'Approved & Scheduled', count: approvedCount },
              { id: 'pending', label: 'Pending Review', count: pendingCount },
              { id: 'completed', label: 'Completed', count: completedCount },
              { id: 'rescheduled', label: 'Rescheduled', count: rescheduledCount }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '12px',
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

          <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>
            Showing {displayedAppointments.length} of {totalCount} appointments
          </span>
        </div>

        {/* Appointment Cards (Matching exact Firestore Schema in Screenshot 2) */}
        {displayedAppointments.length === 0 ? (
          <div className="glass-card" style={{ padding: '60px 20px', textAlign: 'center', background: '#ffffff', borderRadius: '24px', border: '1px solid #e2e8f0' }}>
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
              You haven't scheduled any consultations in this status category. Select "All Requests" or book a consultation below.
            </p>
            <button
              onClick={() => {
                if (window.opener) {
                  window.opener.location.href = '/#booking-section';
                  window.close();
                } else {
                  window.location.href = '/#booking-section';
                }
              }}
              className="btn btn-primary"
            >
              <PlusCircle size={16} />
              <span>Book Your First Consultation</span>
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
            {displayedAppointments.map((apt) => {
              const doc = doctors.find(d => d.id === apt.doctorId);
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
                  {/* Pass Header */}
                  <div className="digital-pass-header" style={{ borderBottom: '1px solid #f1f5f9', paddingBottom: '18px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <img 
                        src={doc?.avatar || 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=400'} 
                        alt={apt.doctorName}
                        style={{
                          width: '56px',
                          height: '56px',
                          borderRadius: '16px',
                          objectFit: 'cover',
                          border: '2px solid #e0f2fe'
                        }}
                      />
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <h4 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0, color: '#0f172a' }}>
                            {apt.doctorName}
                          </h4>
                          <span style={{ 
                            fontSize: '0.75rem', 
                            fontWeight: 700, 
                            color: '#0284c7', 
                            background: '#f0f9ff',
                            padding: '3px 9px',
                            borderRadius: '8px'
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
                              fontSize: '0.8rem',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              cursor: 'pointer',
                              padding: 0
                            }}
                            title="Click to copy Appointment ID"
                          >
                            <strong>{apt.id}</strong>
                            {copiedId === apt.id ? <Check size={13} color="#10b981" /> : <Copy size={13} />}
                          </button>
                          <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>•</span>
                          <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
                            Created: {new Date(apt.createdAt).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div>
                      {getStatusBadge(apt.status)}
                    </div>
                  </div>

                  {/* Details Grid (referencing Firestore Screenshot 2: patientAge, patientGender, patientPhone, doctorNotes, etc.) */}
                  <div className="pass-grid" style={{ margin: '18px 0' }}>
                    <div className="pass-field">
                      <label>Confirmed Consultation Time</label>
                      <span style={{ color: '#0284c7', fontWeight: 700, fontSize: '0.98rem' }}>
                        {apt.scheduledDate && apt.scheduledTime 
                          ? `${apt.scheduledDate} at ${apt.scheduledTime}`
                          : `Requested: ${apt.preferredDate} (${apt.preferredTime})`
                        }
                      </span>
                    </div>

                    <div className="pass-field">
                      <label>Assigned Consultation Room</label>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#0f172a', fontWeight: 600 }}>
                        <MapPin size={15} color="#0284c7" />
                        {apt.room || doc?.room || 'Room assigned upon check-in'}
                      </span>
                    </div>

                    <div className="pass-field">
                      <label>Patient Record Details</label>
                      <span style={{ color: '#334155', fontWeight: 600 }}>
                        {apt.patientName} • {apt.patientAge ? `${apt.patientAge} yrs` : 'Adult'} • {apt.patientGender || 'Unspecified'}
                      </span>
                    </div>

                    <div className="pass-field">
                      <label>Reason for Visit</label>
                      <span>{apt.reason || 'Primary Consultation & Evaluation'}</span>
                    </div>
                  </div>

                  {/* Direct Doctor Instructions & Notes (as seen in Screenshot 2: doctorNotes) */}
                  {apt.doctorNotes && (
                    <div style={{
                      background: '#f0f9ff',
                      border: '1px solid #bae6fd',
                      borderRadius: '14px',
                      padding: '14px 18px',
                      marginBottom: '16px',
                      fontSize: '0.88rem'
                    }}>
                      <strong style={{ color: '#0369a1', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                        <FileText size={16} /> Direct Physician Instructions & Notes:
                      </strong>
                      <p style={{ color: '#0c4a6e', margin: 0, lineHeight: 1.5, fontWeight: 500 }}>
                        {apt.doctorNotes}
                      </p>
                    </div>
                  )}

                  {/* Prescription */}
                  {apt.prescription && (
                    <div style={{
                      background: '#f0fdf4',
                      border: '1px solid #bbf7d0',
                      borderRadius: '14px',
                      padding: '14px 18px',
                      marginBottom: '16px',
                      fontSize: '0.88rem'
                    }}>
                      <strong style={{ color: '#15803d', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                        <Pill size={16} /> Medical Prescription & Treatment Plan:
                      </strong>
                      <p style={{ color: '#14532d', margin: 0, lineHeight: 1.5, whiteSpace: 'pre-line' }}>
                        {apt.prescription}
                      </p>
                    </div>
                  )}

                  {/* Actions */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '14px', borderTop: '1px solid #f1f5f9' }}>
                    <button
                      type="button"
                      onClick={() => window.print()}
                      className="btn btn-secondary btn-sm"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                    >
                      <Printer size={14} />
                      <span>Print Digital Pass</span>
                    </button>

                    <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                      Ref Doc: #{apt.id} • Verified via Firebase
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
