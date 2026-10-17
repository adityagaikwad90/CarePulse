import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import HeroSection from './components/HeroSection';
import BookingWizard from './components/BookingWizard';
import PatientDashboard from './components/PatientDashboard';
import StatusTracker from './components/StatusTracker';
import DoctorDashboard from './components/DoctorDashboard';
import DoctorsDirectory from './components/DoctorsDirectory';
import HospitalServices from './components/HospitalServices';
import DoctorPortalPage from './components/DoctorPortalPage';
import PatientAuthPage from './components/PatientAuthPage';
import PatientProfilePage from './components/PatientProfilePage';
import AiDoctorConsultant from './components/AiDoctorConsultant';
import { 
  Calendar, Search, UserCheck, Stethoscope, 
  Activity, ShieldCheck, Heart, Info, CheckCircle2, AlertCircle, Lock, Sparkles, User
} from 'lucide-react';
import { getStoredUser, getStoredDoctor, logoutAll } from './services/authService';
import { apiUrl } from './services/api';
import './App.css';

export default function App() {
  const [currentPath, setCurrentPath] = useState(window.location.pathname);
  const [activeRole, setActiveRole] = useState('patient'); // 'patient' | 'doctor'
  const [patientTab, setPatientTab] = useState('book'); // 'book' | 'my-appointments' | 'ai-doctor' | 'track' | 'doctors' | 'services'

  // Authenticated State (Firebase & Clinic auth)
  const [currentUser, setCurrentUser] = useState(() => getStoredUser());
  const [currentDoctor, setCurrentDoctor] = useState(() => getStoredDoctor());


  const [doctors, setDoctors] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [stats, setStats] = useState(null);
  const [firebaseInfo, setFirebaseInfo] = useState(null);

  const [trackingId, setTrackingId] = useState('');
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    const handlePopState = () => setCurrentPath(window.location.pathname);
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const isDoctorRoute = currentPath === '/doctor' || currentPath.startsWith('/doctor');
  const isAuthRoute = currentPath === '/patient-auth' || currentPath === '/login' || currentPath === '/auth';
  const isProfileRoute = currentPath === '/profile' || currentPath.startsWith('/profile') || currentPath === '/my-appointments';

  // Count user appointments
  const userAppointmentsCount = appointments.filter(a => {
    if (!currentUser?.email) return false;
    return (a.patientEmail || '').toLowerCase() === currentUser.email.toLowerCase();
  }).length;

  // Toast Helper
  const showToast = (message, type = 'info') => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  // Fetch initial data
  const fetchData = async () => {
    try {
      // 1. Health / Firebase check
      fetch(apiUrl('/api/health'))
        .then(r => r.json())
        .then(data => setFirebaseInfo(data.firebase))
        .catch(() => {});

      // 2. Stats
      fetch(apiUrl('/api/stats'))
        .then(r => r.json())
        .then(data => setStats(data))
        .catch(() => {});

      // 3. Departments
      fetch(apiUrl('/api/departments'))
        .then(r => r.json())
        .then(data => setDepartments(data))
        .catch(() => {});

      // 4. Doctors
      fetch(apiUrl('/api/doctors'))
        .then(r => r.json())
        .then(data => setDoctors(data))
        .catch(() => {});

      // 5. Appointments
      fetch(apiUrl('/api/appointments'))
        .then(r => r.json())
        .then(data => setAppointments(data))
        .catch(() => {});
    } catch (err) {
      console.error('Error fetching data:', err);
    }
  };

  useEffect(() => {
    fetchData();
    // Poll stats & appointments every 15 seconds
    const interval = setInterval(fetchData, 15000);
    return () => clearInterval(interval);
  }, []);

  // Listen for Cross-Window / Cross-Tab Authentication Events (Instant sync when patient signs in in new window!)
  useEffect(() => {
    // 1. localStorage change across windows
    const handleStorageChange = (e) => {
      if (e.key === 'carepulse_auth_user') {
        const newUser = e.newValue ? JSON.parse(e.newValue) : null;
        if (newUser && newUser.id !== currentUser?.id) {
          setCurrentUser(newUser);
          setPatientTab('my-appointments');
          showToast(`Welcome, ${newUser.name}! Your profile and appointment history are loaded.`, 'success');
          fetchData();
        } else if (!newUser && currentUser) {
          setCurrentUser(null);
          setPatientTab('book');
        }
      }
    };

    // 2. window.opener.postMessage from child popup window
    const handleWindowMessage = (e) => {
      if (e.data && e.data.type === 'CAREPULSE_AUTH_SUCCESS' && e.data.user) {
        const user = e.data.user;
        setCurrentUser(user);
        setPatientTab('my-appointments');
        showToast(`Welcome, ${user.name}! Your profile and appointment history are loaded.`, 'success');
        fetchData();
      }
    };

    // 3. BroadcastChannel across all browser tabs
    let channel = null;
    try {
      channel = new BroadcastChannel('carepulse_auth_channel');
      channel.onmessage = (event) => {
        if (event.data?.type === 'CAREPULSE_AUTH_SUCCESS' && event.data.user) {
          const user = event.data.user;
          setCurrentUser(user);
          setPatientTab('my-appointments');
          showToast(`Welcome, ${user.name}! Your profile and appointment history are loaded.`, 'success');
          fetchData();
        }
      };
    } catch (err) {}

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('message', handleWindowMessage);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('message', handleWindowMessage);
      if (channel) channel.close();
    };
  }, [currentUser]);

  // Open Patient Sign In / Sign Up in a Dedicated New Window (NOT iframe / NOT modal)
  const openPatientAuthWindow = (mode = 'signin') => {
    const w = 520;
    const h = 760;
    const left = window.screen.width / 2 - w / 2;
    const top = window.screen.height / 2 - h / 2;
    window.open(
      `/patient-auth?mode=${mode}`,
      'CarePulsePatientAuthWindow',
      `toolbar=no, location=no, directories=no, status=no, menubar=no, scrollbars=yes, resizable=yes, copyhistory=no, width=${w}, height=${h}, top=${top}, left=${left}`
    );
  };

  // Open Patient Profile & History in Dedicated Window / Page
  const openPatientProfileWindow = () => {
    const w = 1200;
    const h = 840;
    const left = window.screen.width / 2 - w / 2;
    const top = window.screen.height / 2 - h / 2;
    window.open(
      '/profile',
      'CarePulsePatientProfileWindow',
      `toolbar=no, location=no, directories=no, status=no, menubar=no, scrollbars=yes, resizable=yes, copyhistory=no, width=${w}, height=${h}, top=${top}, left=${left}`
    );
  };

  // Update appointment status (Doctor Approve / Reject / Complete)
  const handleUpdateStatus = async (id, payload) => {
    const res = await fetch(apiUrl(`/api/appointments/${id}/status`), {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to update status');
    }
    const updated = await res.json();
    setAppointments(prev => prev.map(a => a.id === id ? updated : a));
    // update stats
    fetch(apiUrl('/api/stats')).then(r => r.json()).then(data => setStats(data)).catch(() => {});
    return updated;
  };

  // Reschedule appointment (Doctor Reschedule)
  const handleReschedule = async (id, payload) => {
    const res = await fetch(apiUrl(`/api/appointments/${id}/reschedule`), {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to reschedule');
    }
    const updated = await res.json();
    setAppointments(prev => prev.map(a => a.id === id ? updated : a));
    // update stats
    fetch(apiUrl('/api/stats')).then(r => r.json()).then(data => setStats(data)).catch(() => {});
    return updated;
  };

  // Cancel Appointment by Patient
  const handleCancelAppointment = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this appointment request?')) return;
    try {
      await handleUpdateStatus(id, { 
        status: 'cancelled', 
        doctorNotes: 'Cancelled upon patient request.' 
      });
      showToast('Appointment request cancelled.', 'info');
      fetchData();
    } catch (err) {
      showToast(err.message || 'Failed to cancel appointment', 'error');
    }
  };

  // Patient Sign Out
  const handlePatientSignOut = () => {
    logoutAll();
    setCurrentUser(null);
    setPatientTab('book');
    showToast('Signed out of patient account.', 'info');
  };


  // Exit Doctor mode
  const handleExitDoctorMode = () => {
    setActiveRole('patient');
  };

  const handleLockDoctorSession = () => {
    logoutAll();
    setCurrentDoctor(null);
    setActiveRole('patient');
    showToast('Doctor session ended.', 'info');
  };

  // Tracking reference click
  const handleTrackReference = (id) => {
    setTrackingId(id);
    setPatientTab('track');
    setTimeout(() => {
      const el = document.getElementById('tracker-section');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  // Select doctor from directory
  const handleSelectDoctorFromDirectory = (doc) => {
    if (!currentUser) {
      openPatientAuthWindow('signin');
      showToast('Please sign in or create an account to book an appointment with ' + doc.name, 'info');
      return;
    }
    setPatientTab('book');
    setTimeout(() => {
      const el = document.getElementById('booking-section');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  // 1. Separate Dedicated Doctor Portal Page Route
  if (isDoctorRoute) {
    return (
      <>
        <div className="toast-container">
          {toasts.map(t => (
            <div key={t.id} className={`toast toast-${t.type}`}>
              {t.type === 'success' ? <CheckCircle2 size={18} color="#10b981" /> : <AlertCircle size={18} color="#38bdf8" />}
              <span>{t.message}</span>
            </div>
          ))}
        </div>

        <DoctorPortalPage
          appointments={appointments}
          doctors={doctors}
          stats={stats}
          firebaseInfo={firebaseInfo}
          onRefresh={fetchData}
          onUpdateStatus={handleUpdateStatus}
          onReschedule={handleReschedule}
          showToast={showToast}
          onBackToHome={() => {
            window.history.pushState({}, '', '/');
            setCurrentPath('/');
          }}
        />
      </>
    );
  }

  // 2. Separate Dedicated Patient Sign In / Sign Up Window Route
  if (isAuthRoute) {
    return (
      <PatientAuthPage
        onAuthSuccess={(user) => {
          setCurrentUser(user);
          showToast(`Welcome, ${user.name}!`, 'success');
        }}
      />
    );
  }

  // 3. Separate Dedicated Patient Profile & History Window Route
  if (isProfileRoute) {
    return (
      <PatientProfilePage
        currentUser={currentUser}
        doctors={doctors}
        onBackToHome={() => {
          window.history.pushState({}, '', '/');
          setCurrentPath('/');
        }}
        showToast={showToast}
      />
    );
  }

  return (
    <div className="app-container">
      {/* Toast Notification Container */}
      <div className="toast-container">
        {toasts.map(t => (
          <div key={t.id} className={`toast toast-${t.type}`}>
            {t.type === 'success' ? <CheckCircle2 size={18} color="#10b981" /> : <AlertCircle size={18} color="#38bdf8" />}
            <span>{t.message}</span>
          </div>
        ))}
      </div>

      {/* Navbar */}
      <Navbar
        activeRole={activeRole}
        currentUser={currentUser}
        currentDoctor={currentDoctor}
        userAppointmentsCount={userAppointmentsCount}
        isDoctorAuthenticated={Boolean(currentDoctor)}
        onBookClick={() => {
          if (!currentUser) {
            openPatientAuthWindow('signin');
            showToast('Please sign in or create an account to book your consultation.', 'info');
          } else {
            setActiveRole('patient');
            setPatientTab('book');
            const el = document.getElementById('booking-section');
            if (el) el.scrollIntoView({ behavior: 'smooth' });
          }
        }}
        onMyAppointmentsClick={() => {
          if (!currentUser) {
            openPatientAuthWindow('signin');
            showToast('Please sign in to view your appointment history.', 'info');
          } else {
            openPatientProfileWindow();
          }
        }}
        onProfileClick={() => {
          if (!currentUser) {
            openPatientAuthWindow('signin');
            showToast('Please sign in to view your profile.', 'info');
          } else {
            openPatientProfileWindow();
          }
        }}
        onOpenAuth={(mode) => openPatientAuthWindow(mode || 'signin')}
        onSignOut={handlePatientSignOut}
        onExitDoctorMode={handleExitDoctorMode}
        stats={stats}
        firebaseInfo={firebaseInfo}
      />

      {/* Main Content Area */}
      <main className="main-content">
        {/* PATIENT PORTAL */}
        {activeRole === 'patient' && (
          <div>
            <HeroSection
              stats={stats}
              onBookClick={() => {
                if (!currentUser) {
                  openPatientAuthWindow('signin');
                  showToast('Please sign in or create an account to book your consultation.', 'info');
                } else {
                  setPatientTab('book');
                  const el = document.getElementById('booking-section');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }
              }}
              onTrackClick={() => {
                if (currentUser) {
                  openPatientProfileWindow();
                } else {
                  setPatientTab('track');
                  const el = document.getElementById('tracker-section');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }
              }}
              onAiConsultClick={() => {
                setPatientTab('ai-doctor');
              }}
            />

            {/* Navigation Tabs for Patients */}
            <div className="section-nav">
              <div className="tab-group">
                <button
                  className={`tab-btn ${patientTab === 'book' ? 'active' : ''}`}
                  onClick={() => setPatientTab('book')}
                >
                  <Calendar size={16} />
                  <span>Book Appointment</span>
                </button>

                {/* Personalized My Appointments Tab (Profile & History) */}
                <button
                  className="tab-btn"
                  onClick={() => {
                    if (!currentUser) {
                      openPatientAuthWindow('signin');
                      showToast('Please sign in to view your appointment history and profile.', 'info');
                    } else {
                      openPatientProfileWindow();
                    }
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                  title="Open your profile & appointment history"
                >
                  <User size={16} color="#059669" />
                  <span>My Appointments</span>
                  {userAppointmentsCount > 0 && (
                    <span style={{
                      fontSize: '10px',
                      fontWeight: 800,
                      backgroundColor: '#10b981',
                      color: '#ffffff',
                      padding: '1px 6px',
                      borderRadius: '10px'
                    }}>
                      {userAppointmentsCount}
                    </span>
                  )}
                </button>

                <button
                  className={`tab-btn ${patientTab === 'ai-doctor' ? 'active' : ''}`}
                  onClick={() => setPatientTab('ai-doctor')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <Sparkles size={16} color="#0284c7" />
                  <span>Ask AI Doctor</span>
                  <span style={{
                    fontSize: '9px',
                    fontWeight: 800,
                    background: 'linear-gradient(135deg, #0284c7, #38bdf8)',
                    color: '#ffffff',
                    padding: '1px 6px',
                    borderRadius: '10px',
                    textTransform: 'uppercase'
                  }}>
                    Gemini
                  </span>
                </button>

                <button
                  className={`tab-btn ${patientTab === 'track' ? 'active' : ''}`}
                  onClick={() => setPatientTab('track')}
                >
                  <Search size={16} />
                  <span>Track Status</span>
                </button>

                <button
                  className={`tab-btn ${patientTab === 'doctors' ? 'active' : ''}`}
                  onClick={() => setPatientTab('doctors')}
                >
                  <Stethoscope size={16} />
                  <span>Specialists Directory</span>
                </button>

                <button
                  className={`tab-btn ${patientTab === 'services' ? 'active' : ''}`}
                  onClick={() => setPatientTab('services')}
                >
                  <Activity size={16} />
                  <span>Hospital Services</span>
                </button>
              </div>

              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <ShieldCheck size={16} color="var(--emerald)" />
                <span>Verified Medical Professionals • Firebase Protected</span>
              </div>
            </div>

            {/* Tab Views */}
            {patientTab === 'book' && (
              <BookingWizard
                doctors={doctors}
                departments={departments}
                currentUser={currentUser}
                onOpenAuthWindow={openPatientAuthWindow}
                onBookingComplete={(apt) => {
                  showToast(`Appointment ${apt.id} booked! Doctor notified.`, 'success');
                  fetchData();
                  openPatientProfileWindow();
                }}
                onTrackReference={handleTrackReference}
              />
            )}

            {patientTab === 'ai-doctor' && (
              <AiDoctorConsultant
                departments={departments}
                onSelectSpecialtyForBooking={(deptName) => {
                  setPatientTab('book');
                  showToast(`Selected ${deptName} specialty for consultation. Choose your specialist below.`, 'info');
                  setTimeout(() => {
                    const el = document.getElementById('booking-section');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }, 100);
                }}
              />
            )}

            {patientTab === 'track' && (
              <StatusTracker initialQuery={trackingId} />
            )}

            {patientTab === 'doctors' && (
              <DoctorsDirectory
                doctors={doctors}
                departments={departments}
                onSelectDoctor={handleSelectDoctorFromDirectory}
              />
            )}

            {patientTab === 'services' && (
              <HospitalServices />
            )}
          </div>
        )}

        {/* DOCTOR DASHBOARD */}
        {activeRole === 'doctor' && (
          <DoctorDashboard
            appointments={appointments}
            doctors={doctors}
            stats={stats}
            currentDoctor={currentDoctor}
            onRefresh={fetchData}
            onUpdateStatus={handleUpdateStatus}
            onReschedule={handleReschedule}
            onExitDoctorMode={handleExitDoctorMode}
            onLockSession={handleLockDoctorSession}
            onSwitchDoctor={() => {
              window.open('/doctor', '_blank');
            }}
            showToast={showToast}
          />
        )}
      </main>


      {/* Footer */}
      <footer className="app-footer">
        <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Activity size={18} color="var(--primary)" />
            <strong>CarePulse Hospital System</strong>
            <span style={{ color: 'var(--text-light)' }}>• React, Node.js, Express & Firebase Authentication</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <a
              href="/doctor"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--primary)',
                cursor: 'pointer',
                fontSize: '0.8rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                fontWeight: 600,
                padding: '4px 8px',
                borderRadius: '6px',
                textDecoration: 'none'
              }}
              title="Open Doctor Clinical Console"
            >
              <Lock size={13} />
              <span>Doctor / Staff Portal</span>
            </a>
            <span style={{ color: '#cbd5e1' }}>|</span>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Project ID: <code style={{ background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px' }}>hospital-managment-ed068</code>
            </span>
          </div>

          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            © {new Date().getFullYear()} CarePulse Healthcare Network. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
