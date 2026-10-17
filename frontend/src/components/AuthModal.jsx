import React, { useState, useEffect } from 'react';
import { 
  X, User, Lock, Mail, Phone, Stethoscope, ShieldCheck, 
  Eye, EyeOff, AlertCircle, CheckCircle2, ArrowRight, Key, Sparkles, LogIn
} from 'lucide-react';
import { loginUser, registerPatient, loginDoctor, getDoctorsDirectory } from '../services/authService';

export default function AuthModal({ 
  isOpen, 
  onClose, 
  initialTab = 'patient-login', // 'patient-login' | 'patient-register' | 'doctor-login'
  onAuthSuccess, 
  doctors = [] 
}) {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [doctorList, setDoctorList] = useState(doctors);

  // Patient Login Form
  const [patientLoginEmail, setPatientLoginEmail] = useState('');
  const [patientLoginPassword, setPatientLoginPassword] = useState('');

  // Patient Register Form
  const [registerForm, setRegisterForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: ''
  });

  // Doctor Login Form
  const [selectedDoctorId, setSelectedDoctorId] = useState('');
  const [doctorEmailOrId, setDoctorEmailOrId] = useState('');
  const [doctorPasscode, setDoctorPasscode] = useState('');

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
      setError('');
      // Fetch fresh doctor directory
      getDoctorsDirectory().then(docs => {
        if (docs && docs.length > 0) {
          setDoctorList(docs);
          if (!selectedDoctorId) {
            setSelectedDoctorId(docs[0].id);
            setDoctorEmailOrId(docs[0].email);
            setDoctorPasscode(docs[0].passcode);
          }
        }
      });
    }
  }, [isOpen, initialTab]);

  if (!isOpen) return null;

  // Handle Quick Doctor Selection
  const handleSelectDoctor = (doc) => {
    setSelectedDoctorId(doc.id);
    setDoctorEmailOrId(doc.email);
    setDoctorPasscode(doc.passcode || 'admin@hospital');
    setError('');
  };

  // Demo Patient Auto-Fill
  const fillDemoPatient = (email, pass) => {
    setPatientLoginEmail(email);
    setPatientLoginPassword(pass);
    setError('');
  };

  // 1. Patient Login Submit
  const handlePatientLogin = async (e) => {
    e.preventDefault();
    if (!patientLoginEmail || !patientLoginPassword) {
      setError('Please provide your email and password.');
      return;
    }
    setError('');
    setLoading(true);

    try {
      const result = await loginUser(patientLoginEmail.trim(), patientLoginPassword.trim());
      if (onAuthSuccess) {
        onAuthSuccess(result);
      }
      onClose();
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  // 2. Patient Register Submit
  const handlePatientRegister = async (e) => {
    e.preventDefault();
    if (!registerForm.name || !registerForm.email || !registerForm.password) {
      setError('Name, email, and password are required.');
      return;
    }
    if (registerForm.password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    setError('');
    setLoading(true);

    try {
      const result = await registerPatient(registerForm);
      if (onAuthSuccess) {
        onAuthSuccess(result);
      }
      onClose();
    } catch (err) {
      setError(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  // 3. Doctor Login Submit
  const handleDoctorLogin = async (e) => {
    e.preventDefault();
    if (!doctorPasscode) {
      setError('Please enter your clinical passcode or master key.');
      return;
    }
    setError('');
    setLoading(true);

    try {
      const result = await loginDoctor({
        doctorId: selectedDoctorId || undefined,
        email: doctorEmailOrId ? doctorEmailOrId.trim() : undefined,
        passcode: doctorPasscode.trim()
      });

      if (onAuthSuccess) {
        onAuthSuccess(result);
      }
      onClose();
    } catch (err) {
      setError(err.message || 'Doctor authorization failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose} style={{ zIndex: 1200 }}>
      <div 
        className="modal-box" 
        onClick={(e) => e.stopPropagation()} 
        style={{ 
          maxWidth: activeTab === 'doctor-login' ? '560px' : '460px', 
          padding: '28px', 
          borderRadius: '20px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)'
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span style={{ 
                fontSize: '0.72rem', 
                fontWeight: 700, 
                textTransform: 'uppercase', 
                letterSpacing: '0.06em',
                color: activeTab === 'doctor-login' ? '#0284c7' : '#059669',
                backgroundColor: activeTab === 'doctor-login' ? '#e0f2fe' : '#d1fae5',
                padding: '3px 10px',
                borderRadius: '9999px'
              }}>
                {activeTab === 'doctor-login' ? 'Physician Access' : 'Patient Authentication'}
              </span>
              <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <ShieldCheck size={14} color="#0284c7" /> Firebase Protected
              </span>
            </div>
            <h3 style={{ fontSize: '1.35rem', fontWeight: 800, margin: 0, color: '#0f172a' }}>
              {activeTab === 'doctor-login' ? 'Personalized Doctor Login' : (activeTab === 'patient-register' ? 'Create Patient Account' : 'Patient Sign In')}
            </h3>
          </div>

          <button 
            type="button" 
            onClick={onClose} 
            className="btn-icon" 
            style={{ color: '#64748b', padding: '6px' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div style={{
          display: 'flex',
          background: '#f1f5f9',
          padding: '4px',
          borderRadius: '12px',
          marginBottom: '20px',
          gap: '4px'
        }}>
          <button
            type="button"
            onClick={() => { setActiveTab('patient-login'); setError(''); }}
            style={{
              flex: 1,
              padding: '8px 12px',
              fontSize: '0.82rem',
              fontWeight: activeTab === 'patient-login' ? 700 : 500,
              backgroundColor: activeTab === 'patient-login' ? '#ffffff' : 'transparent',
              color: activeTab === 'patient-login' ? '#0f172a' : '#64748b',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              boxShadow: activeTab === 'patient-login' ? '0 2px 6px rgba(0,0,0,0.08)' : 'none',
              transition: 'all 0.15s ease'
            }}
          >
            Patient Sign In
          </button>

          <button
            type="button"
            onClick={() => { setActiveTab('patient-register'); setError(''); }}
            style={{
              flex: 1,
              padding: '8px 12px',
              fontSize: '0.82rem',
              fontWeight: activeTab === 'patient-register' ? 700 : 500,
              backgroundColor: activeTab === 'patient-register' ? '#ffffff' : 'transparent',
              color: activeTab === 'patient-register' ? '#0f172a' : '#64748b',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              boxShadow: activeTab === 'patient-register' ? '0 2px 6px rgba(0,0,0,0.08)' : 'none',
              transition: 'all 0.15s ease'
            }}
          >
            New Patient
          </button>

          <button
            type="button"
            onClick={() => { setActiveTab('doctor-login'); setError(''); }}
            style={{
              flex: 1,
              padding: '8px 12px',
              fontSize: '0.82rem',
              fontWeight: activeTab === 'doctor-login' ? 700 : 500,
              backgroundColor: activeTab === 'doctor-login' ? '#0284c7' : 'transparent',
              color: activeTab === 'doctor-login' ? '#ffffff' : '#64748b',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              boxShadow: activeTab === 'doctor-login' ? '0 2px 8px rgba(2,132,199,0.3)' : 'none',
              transition: 'all 0.15s ease'
            }}
          >
            Doctor Portal
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            backgroundColor: '#fef2f2',
            color: '#b91c1c',
            padding: '11px 14px',
            borderRadius: '10px',
            fontSize: '0.82rem',
            marginBottom: '18px',
            border: '1px solid #fecaca'
          }}>
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        {/* TAB 1: PATIENT SIGN IN */}
        {activeTab === 'patient-login' && (
          <form onSubmit={handlePatientLogin}>
            <div className="form-group" style={{ marginBottom: '14px' }}>
              <label className="form-label" style={{ fontSize: '0.82rem', fontWeight: 600 }}>
                Patient Email Address
              </label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                <input
                  type="email"
                  className="form-input"
                  style={{ paddingLeft: '38px' }}
                  placeholder="e.g. emma.watson@example.com"
                  value={patientLoginEmail}
                  onChange={(e) => setPatientLoginEmail(e.target.value)}
                  autoFocus
                  required
                />
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: '18px' }}>
              <label className="form-label" style={{ fontSize: '0.82rem', fontWeight: 600 }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="form-input"
                  style={{ paddingLeft: '38px', paddingRight: '38px' }}
                  placeholder="Enter your password"
                  value={patientLoginPassword}
                  onChange={(e) => setPatientLoginPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: '#94a3b8',
                    cursor: 'pointer',
                    padding: 0
                  }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Quick Demo Logins */}
            <div style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '10px',
              padding: '10px 12px',
              marginBottom: '20px'
            }}>
              <span style={{ fontSize: '0.73rem', fontWeight: 700, color: '#64748b', display: 'block', marginBottom: '6px' }}>
                DEMO PATIENTS (1-CLICK AUTOFILL):
              </span>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => fillDemoPatient('emma.watson@example.com', 'patient123')}
                  style={{
                    background: '#ffffff',
                    border: '1px solid #cbd5e1',
                    borderRadius: '6px',
                    padding: '4px 8px',
                    fontSize: '0.75rem',
                    cursor: 'pointer',
                    color: '#0f172a',
                    fontWeight: 500
                  }}
                >
                  👤 Emma Watson
                </button>
                <button
                  type="button"
                  onClick={() => fillDemoPatient('robert.l@example.com', 'patient123')}
                  style={{
                    background: '#ffffff',
                    border: '1px solid #cbd5e1',
                    borderRadius: '6px',
                    padding: '4px 8px',
                    fontSize: '0.75rem',
                    cursor: 'pointer',
                    color: '#0f172a',
                    fontWeight: 500
                  }}
                >
                  👤 Robert Langdon
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
              style={{ width: '100%', justifyContent: 'center', padding: '12px' }}
            >
              <LogIn size={16} />
              <span>{loading ? 'Authenticating...' : 'Sign In as Patient'}</span>
            </button>
          </form>
        )}

        {/* TAB 2: PATIENT REGISTRATION */}
        {activeTab === 'patient-register' && (
          <form onSubmit={handlePatientRegister}>
            <div className="form-group" style={{ marginBottom: '12px' }}>
              <label className="form-label" style={{ fontSize: '0.82rem', fontWeight: 600 }}>
                Full Legal Name
              </label>
              <div style={{ position: 'relative' }}>
                <User size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                <input
                  type="text"
                  className="form-input"
                  style={{ paddingLeft: '38px' }}
                  placeholder="e.g. John Doe"
                  value={registerForm.name}
                  onChange={(e) => setRegisterForm({ ...registerForm, name: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: '12px' }}>
              <label className="form-label" style={{ fontSize: '0.82rem', fontWeight: 600 }}>
                Email Address
              </label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                <input
                  type="email"
                  className="form-input"
                  style={{ paddingLeft: '38px' }}
                  placeholder="name@example.com"
                  value={registerForm.email}
                  onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: '12px' }}>
              <label className="form-label" style={{ fontSize: '0.82rem', fontWeight: 600 }}>
                Phone Number
              </label>
              <div style={{ position: 'relative' }}>
                <Phone size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                <input
                  type="tel"
                  className="form-input"
                  style={{ paddingLeft: '38px' }}
                  placeholder="+1 (555) 000-0000"
                  value={registerForm.phone}
                  onChange={(e) => setRegisterForm({ ...registerForm, phone: e.target.value })}
                />
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: '18px' }}>
              <label className="form-label" style={{ fontSize: '0.82rem', fontWeight: 600 }}>
                Create Password (min. 6 characters)
              </label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="form-input"
                  style={{ paddingLeft: '38px', paddingRight: '38px' }}
                  placeholder="Choose a strong password"
                  value={registerForm.password}
                  onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: '#94a3b8',
                    cursor: 'pointer',
                    padding: 0
                  }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
              style={{ width: '100%', justifyContent: 'center', padding: '12px' }}
            >
              <Sparkles size={16} />
              <span>{loading ? 'Creating Account...' : 'Register & Access Dashboard'}</span>
            </button>
          </form>
        )}

        {/* TAB 3: PERSONALIZED DOCTOR LOGIN */}
        {activeTab === 'doctor-login' && (
          <form onSubmit={handleDoctorLogin}>
            <div style={{ marginBottom: '14px' }}>
              <label className="form-label" style={{ fontSize: '0.82rem', fontWeight: 600, display: 'flex', justifyContent: 'space-between' }}>
                <span>Select Doctor (Personalized Account)</span>
                <span style={{ fontSize: '0.72rem', color: '#0284c7' }}>Restricted to assigned clinician</span>
              </label>

              {/* Doctor Quick Cards Grid */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
                gap: '8px',
                maxHeight: '160px',
                overflowY: 'auto',
                padding: '4px',
                border: '1px solid #e2e8f0',
                borderRadius: '10px',
                background: '#f8fafc',
                marginBottom: '14px'
              }}>
                {doctorList.map((doc) => {
                  const isSelected = selectedDoctorId === doc.id;
                  return (
                    <div
                      key={doc.id}
                      onClick={() => handleSelectDoctor(doc)}
                      style={{
                        padding: '8px 10px',
                        borderRadius: '8px',
                        border: isSelected ? '2px solid #0284c7' : '1px solid #e2e8f0',
                        background: isSelected ? '#f0f9ff' : '#ffffff',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <img 
                          src={doc.avatar} 
                          alt={doc.name} 
                          style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover' }} 
                        />
                        <div style={{ overflow: 'hidden' }}>
                          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#0f172a', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                            {doc.name}
                          </div>
                          <div style={{ fontSize: '0.68rem', color: '#0284c7', fontWeight: 600 }}>
                            {doc.department}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: '12px' }}>
              <label className="form-label" style={{ fontSize: '0.82rem', fontWeight: 600 }}>
                Doctor Email or Clinical ID
              </label>
              <div style={{ position: 'relative' }}>
                <Stethoscope size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#0284c7' }} />
                <input
                  type="text"
                  className="form-input"
                  style={{ paddingLeft: '38px' }}
                  placeholder="Doctor ID or email"
                  value={doctorEmailOrId}
                  onChange={(e) => setDoctorEmailOrId(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: '18px' }}>
              <label className="form-label" style={{ fontSize: '0.82rem', fontWeight: 600 }}>
                Doctor Passcode / Authorization Key
              </label>
              <div style={{ position: 'relative' }}>
                <Key size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#0284c7' }} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="form-input"
                  style={{ paddingLeft: '38px', paddingRight: '38px' }}
                  placeholder="Clinical passcode"
                  value={doctorPasscode}
                  onChange={(e) => setDoctorPasscode(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: '#94a3b8',
                    cursor: 'pointer',
                    padding: 0
                  }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div style={{
              background: '#f0fdf4',
              border: '1px solid #bbf7d0',
              borderRadius: '8px',
              padding: '8px 12px',
              fontSize: '0.73rem',
              color: '#166534',
              marginBottom: '16px'
            }}>
              🔒 <strong>Strict Clinical Privacy:</strong> Once logged in, you will only view consultation requests assigned specifically to your doctor profile.
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
              style={{ 
                width: '100%', 
                justifyContent: 'center', 
                padding: '12px',
                background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)'
              }}
            >
              <Key size={16} />
              <span>{loading ? 'Authenticating Doctor...' : 'Unlock Doctor Consultation Console'}</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
