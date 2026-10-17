import React from 'react';
import { 
  Activity, User, Stethoscope, ShieldCheck, 
  CalendarPlus, LogIn, LogOut, CheckCircle2, Calendar 
} from 'lucide-react';

export default function Navbar({ 
  activeRole, 
  currentUser,
  currentDoctor,
  userAppointmentsCount = 0,
  onBookClick, 
  onMyAppointmentsClick,
  onProfileClick,
  onOpenAuth,
  onSignOut,
  onExitDoctorMode,
  isDoctorAuthenticated,
  stats, 
  firebaseInfo 
}) {
  return (
    <header className="glass-header">
      <div className="navbar-inner">
        {/* Brand */}
        <div className="brand-logo" onClick={onExitDoctorMode} style={{ cursor: 'pointer' }}>
          <div className="brand-icon-box">
            <Activity size={24} strokeWidth={2.5} />
          </div>
          <div className="brand-text">
            <h1>CarePulse</h1>
            <span>Hospital & Clinical Center</span>
          </div>
        </div>

        {/* Right Actions */}
        <div className="nav-actions">
          {/* Cloud Database indicator */}
          <div className="system-status-pill" title="Firebase Firestore Database backend integration">
            <div className="pulse-dot" />
            <span>
              {firebaseInfo?.firestoreActive ? 'Firebase Cloud' : 'Firebase Sync'}
            </span>
          </div>

          {/* Patient Actions (when not in doctor mode) */}
          {activeRole === 'patient' && (
            <>
              {/* Authenticated Patient Pill & Quick Nav */}
              {currentUser ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <a 
                    href="/profile"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-secondary btn-sm"
                    onClick={(e) => {
                      if (onProfileClick) {
                        e.preventDefault();
                        onProfileClick();
                      }
                    }}
                    style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '6px',
                      background: '#f0fdf4',
                      borderColor: '#bbf7d0',
                      color: '#166534',
                      fontWeight: 700,
                      textDecoration: 'none'
                    }}
                    title="View your personalized appointments & digital passes"
                  >
                    <Calendar size={14} color="#16a34a" />
                    <span>My Appointments</span>
                    {userAppointmentsCount > 0 && (
                      <span style={{
                        background: '#16a34a',
                        color: '#ffffff',
                        fontSize: '0.7rem',
                        fontWeight: 800,
                        padding: '1px 6px',
                        borderRadius: '9999px',
                        marginLeft: '2px'
                      }}>
                        {userAppointmentsCount}
                      </span>
                    )}
                  </a>

                  {/* Profile Badge in top right corner */}
                  <a 
                    href="/profile"
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => {
                      if (onProfileClick) {
                        e.preventDefault();
                        onProfileClick();
                      }
                    }}
                    style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '8px', 
                      background: '#f0f9ff',
                      border: '1.5px solid #bae6fd',
                      borderRadius: '9999px',
                      padding: '4px 12px 4px 6px',
                      fontSize: '0.82rem',
                      fontWeight: 700,
                      color: '#0369a1',
                      cursor: 'pointer',
                      textDecoration: 'none',
                      transition: 'all 0.15s ease'
                    }}
                    title="Open your patient profile & appointment history"
                  >
                    <div style={{
                      width: '22px',
                      height: '22px',
                      borderRadius: '50%',
                      background: '#0284c7',
                      color: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.72rem',
                      fontWeight: 800
                    }}>
                      {(currentUser.name || 'P').charAt(0).toUpperCase()}
                    </div>
                    <span style={{ maxWidth: '120px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {currentUser.name}
                    </span>
                  </a>

                  <button 
                    className="btn-icon"
                    onClick={onSignOut}
                    title="Sign Out"
                    style={{ color: '#94a3b8', padding: '6px', background: 'none', border: 'none', cursor: 'pointer' }}
                  >
                    <LogOut size={16} />
                  </button>
                </div>
              ) : (
                <a 
                  href="/patient-auth"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-secondary btn-sm"
                  onClick={(e) => {
                    if (onOpenAuth) {
                      e.preventDefault();
                      onOpenAuth('signin');
                    }
                  }}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', textDecoration: 'none' }}
                  title="Open Patient Sign In & Sign Up in a new window"
                >
                  <LogIn size={15} />
                  <span>Sign In / Register</span>
                </a>
              )}

              {/* Book Appointment button */}
              <button className="btn btn-primary btn-sm" onClick={onBookClick}>
                <CalendarPlus size={16} />
                <span>Book Appointment</span>
              </button>
            </>
          )}

          {/* Doctor Portal Access */}
          {activeRole === 'doctor' ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div className="doctor-active-pill">
                <Stethoscope size={14} />
                <span>{currentDoctor ? currentDoctor.name : 'Doctor Mode'}</span>
                {stats && stats.pending > 0 && (
                  <span className="badge-pending-count">{stats.pending}</span>
                )}
              </div>
              <button 
                className="btn btn-secondary btn-sm" 
                onClick={onExitDoctorMode}
                title="Return to public patient view"
              >
                <span>Exit Portal</span>
              </button>
            </div>
          ) : (
            <a 
              href="/doctor"
              target="_blank"
              rel="noopener noreferrer"
              className="doctor-access-btn" 
              title="Open Doctor & Staff Portal in a new tab"
              style={{ textDecoration: 'none' }}
            >
              <ShieldCheck size={14} />
              <span>Doctor Access</span>
            </a>
          )}
        </div>
      </div>
    </header>
  );
}
