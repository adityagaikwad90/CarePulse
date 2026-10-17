import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, Lock, Key, Eye, EyeOff, AlertCircle, 
  ArrowLeft, Activity, Stethoscope, LogOut, RefreshCw, CheckCircle2, UserCheck
} from 'lucide-react';
import DoctorDashboard from './DoctorDashboard';
import { loginDoctor, getStoredDoctor, setStoredDoctor, getDoctorsDirectory } from '../services/authService';

export default function DoctorPortalPage({
  appointments,
  doctors,
  stats,
  firebaseInfo,
  onRefresh,
  onUpdateStatus,
  onReschedule,
  showToast,
  onBackToHome
}) {
  const [authenticatedDoctor, setAuthenticatedDoctor] = useState(() => {
    return getStoredDoctor();
  });

  const [doctorList, setDoctorList] = useState(doctors);
  const [selectedDoctorId, setSelectedDoctorId] = useState('');
  const [doctorIdOrEmail, setDoctorIdOrEmail] = useState('');
  const [passkey, setPasskey] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getDoctorsDirectory().then(docs => {
      if (docs && docs.length > 0) {
        setDoctorList(docs);
        if (!selectedDoctorId) {
          setSelectedDoctorId(docs[0].id);
          setDoctorIdOrEmail(docs[0].email);
          setPasskey(docs[0].passcode);
        }
      }
    });
  }, []);

  // Quick fill doctor
  const handleSelectDoctor = (doc) => {
    setSelectedDoctorId(doc.id);
    setDoctorIdOrEmail(doc.email);
    setPasskey(doc.passcode || 'admin@hospital');
    setError('');
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    const trimmedIdent = doctorIdOrEmail.trim();
    const trimmedPass = passkey.trim();

    if (!trimmedPass) {
      setError('Please enter your clinical password or master access key.');
      return;
    }

    setLoading(true);

    try {
      const result = await loginDoctor({
        doctorId: selectedDoctorId || trimmedIdent,
        email: trimmedIdent,
        passcode: trimmedPass
      });

      setAuthenticatedDoctor(result.doctor);
      if (showToast) {
        showToast(`Welcome Dr. ${result.doctor.name}. Personalized consultation queue active!`, 'success');
      }
    } catch (err) {
      setError(err.message || 'Access denied: Invalid Doctor ID or Passcode.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setStoredDoctor(null);
    setAuthenticatedDoctor(null);
    if (showToast) showToast('Doctor session ended.', 'info');
  };

  const handleSwitchDoctor = () => {
    setStoredDoctor(null);
    setAuthenticatedDoctor(null);
    setError('');
    if (showToast) showToast('Select another doctor account to log in.', 'info');
  };

  // 1. If Doctor is Authenticated -> Render Personalized Dashboard
  if (authenticatedDoctor) {
    return (
      <div className="app-container" style={{ backgroundColor: '#f8fafc', minHeight: '100vh' }}>
        {/* Dedicated Doctor Header */}
        <header className="glass-header" style={{ borderBottom: '1px solid #e2e8f0', background: '#ffffff' }}>
          <div className="navbar-inner">
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <button 
                onClick={onBackToHome}
                className="btn btn-secondary btn-sm"
                style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                title="Return to Public Patient Portal"
              >
                <ArrowLeft size={16} />
                <span>Patient Site</span>
              </button>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div className="brand-icon-box" style={{ width: '36px', height: '36px' }}>
                  <Activity size={20} />
                </div>
                <div>
                  <h1 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0, color: 'var(--secondary)' }}>
                    CarePulse
                  </h1>
                  <span style={{ fontSize: '0.7rem', color: '#0369a1', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Physician & Clinical Console
                  </span>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div className="doctor-active-pill" style={{ background: '#f0f9ff', border: '1px solid #bae6fd', color: '#0369a1' }}>
                <img 
                  src={authenticatedDoctor.avatar} 
                  alt={authenticatedDoctor.name}
                  style={{ width: '22px', height: '22px', borderRadius: '50%', objectFit: 'cover' }} 
                />
                <span style={{ fontWeight: 700 }}>{authenticatedDoctor.name}</span>
                <span style={{ fontSize: '0.7rem', color: '#0284c7' }}>({authenticatedDoctor.department})</span>
              </div>

              <div className="system-status-pill">
                <div className="pulse-dot" />
                <span>{firebaseInfo?.firestoreActive ? 'Firestore Online' : 'Local Sync'}</span>
              </div>

              <button 
                className="btn btn-secondary btn-sm"
                onClick={handleSwitchDoctor}
                title="Switch to another clinician account"
              >
                <UserCheck size={14} />
                <span>Switch Doctor</span>
              </button>

              <button 
                className="btn btn-danger btn-sm"
                onClick={handleLogout}
                style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                title="Lock session and sign out"
              >
                <LogOut size={15} />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </header>

        {/* Doctor Dashboard Content Personalized to this Doctor */}
        <main className="main-content" style={{ paddingTop: '28px' }}>
          <DoctorDashboard
            appointments={appointments}
            doctors={doctors}
            stats={stats}
            currentDoctor={authenticatedDoctor}
            onRefresh={onRefresh}
            onUpdateStatus={onUpdateStatus}
            onReschedule={onReschedule}
            onExitDoctorMode={onBackToHome}
            onLockSession={handleLogout}
            onSwitchDoctor={handleSwitchDoctor}
            showToast={showToast}
          />
        </main>
      </div>
    );
  }

  // 2. If Not Authenticated -> Personalized Doctor Portal Login Page
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 60%, #0369a1 100%)',
      color: '#ffffff',
      padding: '20px'
    }}>
      {/* Top Bar with back link */}
      <div style={{ maxWidth: '1200px', width: '100%', margin: '0 auto', padding: '16px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button
          onClick={onBackToHome}
          style={{
            background: 'rgba(255, 255, 255, 0.1)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            color: '#ffffff',
            padding: '8px 16px',
            borderRadius: '9999px',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '0.85rem',
            fontWeight: 600,
            backdropFilter: 'blur(8px)'
          }}
        >
          <ArrowLeft size={16} />
          <span>Back to Patient Site</span>
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#94a3b8', fontSize: '0.8rem' }}>
          <ShieldCheck size={16} color="#38bdf8" />
          <span>Restricted Clinical Network • Firebase Secured</span>
        </div>
      </div>

      {/* Centered Login Card */}
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px 10px'
      }}>
        <div style={{
          width: '100%',
          maxWidth: '540px',
          backgroundColor: '#ffffff',
          borderRadius: '24px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
          padding: '36px 32px',
          color: '#1e293b'
        }}>
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
              boxShadow: '0 10px 20px rgba(2, 132, 199, 0.35)'
            }}>
              <Stethoscope size={28} />
            </div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, margin: '0 0 6px', color: '#0f172a' }}>
              Doctor & Clinician Portal
            </h2>
            <p style={{ color: '#64748b', fontSize: '0.875rem', margin: 0 }}>
              Personalized login: Each specialist logs in to view and manage only their own consultation requests.
            </p>
          </div>

          {/* Quick Doctor Selector Grid */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#334155', display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span>Select Your Doctor Profile:</span>
              <span style={{ color: '#0284c7', fontSize: '0.75rem' }}>1-Click Instant Credential Fill</span>
            </label>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
              gap: '8px',
              maxHeight: '180px',
              overflowY: 'auto',
              padding: '6px',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              background: '#f8fafc'
            }}>
              {doctorList.map((doc) => {
                const isSelected = selectedDoctorId === doc.id;
                return (
                  <div
                    key={doc.id}
                    onClick={() => handleSelectDoctor(doc)}
                    style={{
                      padding: '8px 10px',
                      borderRadius: '10px',
                      border: isSelected ? '2px solid #0284c7' : '1px solid #cbd5e1',
                      background: isSelected ? '#f0f9ff' : '#ffffff',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <img 
                        src={doc.avatar} 
                        alt={doc.name} 
                        style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }} 
                      />
                      <div style={{ overflow: 'hidden' }}>
                        <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#0f172a', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                          {doc.name}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: '#0284c7', fontWeight: 600 }}>
                          {doc.department}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              backgroundColor: '#fef2f2',
              color: '#b91c1c',
              padding: '12px 16px',
              borderRadius: '10px',
              fontSize: '0.85rem',
              marginBottom: '20px',
              border: '1px solid #fecaca'
            }}>
              <AlertCircle size={18} style={{ flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleLogin}>
            <div className="form-group" style={{ marginBottom: '16px' }}>
              <label className="form-label" style={{ fontSize: '0.82rem', fontWeight: 700, color: '#334155' }}>
                Doctor ID / Clinician Email
              </label>
              <div style={{ position: 'relative' }}>
                <Stethoscope size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#0284c7' }} />
                <input
                  type="text"
                  className="form-input"
                  placeholder="Doctor ID or email"
                  value={doctorIdOrEmail}
                  onChange={(e) => setDoctorIdOrEmail(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 14px 12px 38px',
                    borderRadius: '10px',
                    border: '1.5px solid #cbd5e1',
                    fontSize: '0.9rem'
                  }}
                  required
                />
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: '20px' }}>
              <label className="form-label" style={{ fontSize: '0.82rem', fontWeight: 700, color: '#334155' }}>
                Doctor Passcode / Authorization Key
              </label>
              <div style={{ position: 'relative' }}>
                <Key size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#0284c7' }} />
                <input
                  type={showPass ? 'text' : 'password'}
                  className="form-input"
                  placeholder="Doctor passcode"
                  value={passkey}
                  onChange={(e) => setPasskey(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 44px 12px 38px',
                    borderRadius: '10px',
                    border: '1.5px solid #cbd5e1',
                    fontSize: '0.9rem'
                  }}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  style={{
                    position: 'absolute',
                    right: '14px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: '#64748b',
                    cursor: 'pointer',
                    padding: 0
                  }}
                >
                  {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div style={{
              background: '#f8fafc',
              border: '1px dashed #cbd5e1',
              borderRadius: '10px',
              padding: '10px 14px',
              fontSize: '0.78rem',
              color: '#64748b',
              marginBottom: '20px',
              lineHeight: '1.4'
            }}>
              🔒 <strong>Personalized Queue Isolation:</strong> When you sign in, you only see and manage appointments assigned to your specialist profile.
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
              style={{
                width: '100%',
                padding: '14px',
                borderRadius: '10px',
                fontSize: '0.95rem',
                fontWeight: 700,
                justifyContent: 'center',
                boxShadow: '0 4px 14px rgba(2, 132, 199, 0.35)',
                background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)'
              }}
            >
              <Key size={18} />
              <span>{loading ? 'Authenticating Doctor...' : 'Sign In to My Consultation Console'}</span>
            </button>
          </form>
        </div>
      </div>

      {/* Footer */}
      <div style={{ textAlign: 'center', color: '#64748b', fontSize: '0.75rem', padding: '12px 0' }}>
        CarePulse Hospital Management System • Personalized Doctor & Staff Network
      </div>
    </div>
  );
}
