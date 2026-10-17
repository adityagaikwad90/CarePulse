import React, { useState, useEffect } from 'react';
import { 
  User, Lock, Mail, Phone, ShieldCheck, 
  Eye, EyeOff, AlertCircle, CheckCircle2, ArrowRight, Sparkles, LogIn, Activity, X
} from 'lucide-react';
import { loginUser, registerPatient, setStoredUser, getStoredUser } from '../services/authService';

export default function PatientAuthPage({ onAuthSuccess }) {
  // Check if initial tab passed via URL query e.g. /patient-auth?mode=signup
  const urlParams = new URLSearchParams(window.location.search);
  const initialMode = urlParams.get('mode') === 'signup' ? 'signup' : 'signin';

  const [activeTab, setActiveTab] = useState(initialMode); // 'signin' | 'signup'
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [authenticatedUser, setAuthenticatedUser] = useState(() => getStoredUser());

  // Sign In Form State
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Sign Up Form State
  const [signUpForm, setSignUpForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: ''
  });

  // Notify parent window & broadcast across tabs
  const notifyAuthSuccess = (user) => {
    setStoredUser(user);
    setAuthenticatedUser(user);

    // 1. PostMessage to opener window if opened via window.open
    if (window.opener && !window.opener.closed) {
      try {
        window.opener.postMessage({ type: 'CAREPULSE_AUTH_SUCCESS', user }, '*');
      } catch (e) {
        console.warn('Opener postMessage error:', e);
      }
    }

    // 2. BroadcastChannel to notify all tabs immediately
    try {
      const channel = new BroadcastChannel('carepulse_auth_channel');
      channel.postMessage({ type: 'CAREPULSE_AUTH_SUCCESS', user });
      channel.close();
    } catch (e) {
      // fallback
    }

    if (onAuthSuccess) {
      onAuthSuccess(user);
    }
  };

  // 1. Handle Patient Login
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    if (!loginEmail.trim() || !loginPassword.trim()) {
      setError('Please provide your email address and password.');
      return;
    }
    setError('');
    setLoading(true);

    try {
      const result = await loginUser(loginEmail.trim(), loginPassword.trim());
      notifyAuthSuccess(result.user);
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  // 2. Handle Patient Registration
  const handleSignUpSubmit = async (e) => {
    e.preventDefault();
    if (!signUpForm.name.trim() || !signUpForm.email.trim() || !signUpForm.password.trim()) {
      setError('Full name, email address, and password are required.');
      return;
    }
    if (signUpForm.password.length < 6) {
      setError('Password must contain at least 6 characters.');
      return;
    }
    setError('');
    setLoading(true);

    try {
      const result = await registerPatient(signUpForm);
      notifyAuthSuccess(result.user);
    } catch (err) {
      setError(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  // Demo Patient Fill
  const fillDemoPatient = (email, pass) => {
    setLoginEmail(email);
    setLoginPassword(pass);
    setError('');
  };

  // Handle return to main portal
  const handleReturnToPortal = () => {
    if (window.opener && !window.opener.closed) {
      window.opener.focus();
      window.close();
    } else {
      window.location.href = '/';
    }
  };

  // 3. SUCCESS CONFIRMATION SCREEN
  if (authenticatedUser) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 60%, #0369a1 100%)',
        color: '#ffffff',
        padding: '24px'
      }}>
        {/* Header */}
        <div style={{ maxWidth: '1000px', width: '100%', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Activity size={20} color="#ffffff" />
            </div>
            <span style={{ fontWeight: 800, fontSize: '1.1rem' }}>CarePulse</span>
          </div>

          <button
            onClick={() => window.close()}
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              color: '#ffffff',
              padding: '6px 14px',
              borderRadius: '9999px',
              cursor: 'pointer',
              fontSize: '0.8rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <X size={14} />
            <span>Close Window</span>
          </button>
        </div>

        {/* Success Card */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '30px 10px' }}>
          <div style={{
            width: '100%',
            maxWidth: '500px',
            backgroundColor: '#ffffff',
            borderRadius: '24px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
            padding: '40px 32px',
            color: '#1e293b',
            textAlign: 'center'
          }}>
            <div style={{
              width: '72px',
              height: '72px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px',
              boxShadow: '0 10px 25px rgba(16, 185, 129, 0.35)'
            }}>
              <CheckCircle2 size={38} />
            </div>

            <span style={{
              background: '#d1fae5',
              color: '#059669',
              fontSize: '0.75rem',
              fontWeight: 800,
              padding: '3px 12px',
              borderRadius: '9999px',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>
              Authentication Verified
            </span>

            <h2 style={{ fontSize: '1.6rem', fontWeight: 800, margin: '12px 0 6px', color: '#0f172a' }}>
              Welcome, {authenticatedUser.name}!
            </h2>

            <p style={{ color: '#64748b', fontSize: '0.9rem', lineHeight: '1.5', margin: '0 0 24px' }}>
              Your patient account has been verified with Firebase Authentication. Your personal profile, appointment history, doctor instructions, and prescriptions are loaded.
            </p>

            <div style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              padding: '14px 16px',
              marginBottom: '28px',
              textAlign: 'left'
            }}>
              <div style={{ fontSize: '0.78rem', color: '#64748b', marginBottom: '4px' }}>
                Signed in as:
              </div>
              <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.95rem' }}>
                {authenticatedUser.name}
              </div>
              <div style={{ fontSize: '0.82rem', color: '#0284c7' }}>
                {authenticatedUser.email}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button
                onClick={handleReturnToPortal}
                className="btn btn-primary"
                style={{
                  width: '100%',
                  padding: '14px',
                  borderRadius: '12px',
                  fontSize: '0.95rem',
                  fontWeight: 700,
                  justifyContent: 'center',
                  boxShadow: '0 4px 14px rgba(2, 132, 199, 0.35)'
                }}
              >
                <span>Continue to My Profile & Book Appointments</span>
                <ArrowRight size={16} />
              </button>

              <button
                onClick={() => window.close()}
                className="btn btn-secondary"
                style={{ width: '100%', justifyContent: 'center' }}
              >
                <span>Close This Window</span>
              </button>
            </div>
          </div>
        </div>

        <div style={{ textAlign: 'center', color: '#64748b', fontSize: '0.75rem', padding: '12px 0' }}>
          CarePulse Hospital Management System • Verified Patient Portal
        </div>
      </div>
    );
  }

  // 4. STANDALONE SIGN IN / SIGN UP SCREEN
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 60%, #0369a1 100%)',
      color: '#ffffff',
      padding: '24px'
    }}>
      {/* Top Bar */}
      <div style={{ maxWidth: '1100px', width: '100%', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <a 
          href="/"
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '10px', 
            textDecoration: 'none', 
            color: '#ffffff' 
          }}
        >
          <div style={{ 
            width: '40px', 
            height: '40px', 
            borderRadius: '12px', 
            background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(2, 132, 199, 0.4)'
          }}>
            <Activity size={22} color="#ffffff" />
          </div>
          <div>
            <h1 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0, color: '#ffffff' }}>CarePulse</h1>
            <span style={{ fontSize: '0.72rem', color: '#38bdf8', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
              Patient Portal Authentication
            </span>
          </div>
        </a>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#94a3b8', fontSize: '0.8rem' }}>
          <ShieldCheck size={16} color="#38bdf8" />
          <span>Firebase Secured Patient Session</span>
        </div>
      </div>

      {/* Main Authentication Card */}
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '28px 10px'
      }}>
        <div style={{
          width: '100%',
          maxWidth: '480px',
          backgroundColor: '#ffffff',
          borderRadius: '24px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
          padding: '36px 32px',
          color: '#1e293b'
        }}>
          {/* Card Header */}
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <div style={{
              width: '54px',
              height: '54px',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 14px',
              boxShadow: '0 8px 18px rgba(2, 132, 199, 0.35)'
            }}>
              <User size={26} />
            </div>

            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, margin: '0 0 6px', color: '#0f172a' }}>
              {activeTab === 'signin' ? 'Patient Sign In' : 'Create Patient Account'}
            </h2>
            <p style={{ color: '#64748b', fontSize: '0.875rem', margin: 0 }}>
              {activeTab === 'signin'
                ? 'Sign in to access your booked consultations, prescriptions, and schedule new appointments.'
                : 'Sign up to create your personalized health history profile and start booking appointments.'}
            </p>
          </div>

          {/* Tab Switcher */}
          <div style={{
            display: 'flex',
            background: '#f1f5f9',
            padding: '4px',
            borderRadius: '12px',
            marginBottom: '22px',
            gap: '4px'
          }}>
            <button
              type="button"
              onClick={() => { setActiveTab('signin'); setError(''); }}
              style={{
                flex: 1,
                padding: '10px 12px',
                fontSize: '0.85rem',
                fontWeight: activeTab === 'signin' ? 700 : 500,
                backgroundColor: activeTab === 'signin' ? '#ffffff' : 'transparent',
                color: activeTab === 'signin' ? '#0f172a' : '#64748b',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                boxShadow: activeTab === 'signin' ? '0 2px 6px rgba(0,0,0,0.08)' : 'none',
                transition: 'all 0.15s ease'
              }}
            >
              Sign In
            </button>

            <button
              type="button"
              onClick={() => { setActiveTab('signup'); setError(''); }}
              style={{
                flex: 1,
                padding: '10px 12px',
                fontSize: '0.85rem',
                fontWeight: activeTab === 'signup' ? 700 : 500,
                backgroundColor: activeTab === 'signup' ? '#ffffff' : 'transparent',
                color: activeTab === 'signup' ? '#0f172a' : '#64748b',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                boxShadow: activeTab === 'signup' ? '0 2px 6px rgba(0,0,0,0.08)' : 'none',
                transition: 'all 0.15s ease'
              }}
            >
              Create Account
            </button>
          </div>

          {/* Error Notice */}
          {error && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              backgroundColor: '#fef2f2',
              color: '#b91c1c',
              padding: '12px 14px',
              borderRadius: '10px',
              fontSize: '0.85rem',
              marginBottom: '18px',
              border: '1px solid #fecaca'
            }}>
              <AlertCircle size={18} style={{ flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          {/* SIGN IN FORM */}
          {activeTab === 'signin' && (
            <form onSubmit={handleLoginSubmit}>
              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label className="form-label" style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                  Patient Email Address
                </label>
                <div style={{ position: 'relative' }}>
                  <Mail size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                  <input
                    type="email"
                    className="form-input"
                    style={{ paddingLeft: '38px', width: '100%', boxSizing: 'border-box' }}
                    placeholder="e.g. emma.watson@example.com"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    autoFocus
                    required
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '20px' }}>
                <label className="form-label" style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                  Password
                </label>
                <div style={{ position: 'relative' }}>
                  <Lock size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="form-input"
                    style={{ paddingLeft: '38px', paddingRight: '40px', width: '100%', boxSizing: 'border-box' }}
                    placeholder="Enter your password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
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

              {/* Demo Patient Fast Fill */}
              <div style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '10px',
                padding: '12px 14px',
                marginBottom: '22px'
              }}>
                <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#64748b', display: 'block', marginBottom: '8px' }}>
                  TEST ACCOUNTS (1-CLICK AUTOFILL):
                </span>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={() => fillDemoPatient('emma.watson@example.com', 'patient123')}
                    style={{
                      background: '#ffffff',
                      border: '1px solid #cbd5e1',
                      borderRadius: '6px',
                      padding: '5px 10px',
                      fontSize: '0.76rem',
                      cursor: 'pointer',
                      color: '#0f172a',
                      fontWeight: 600
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
                      padding: '5px 10px',
                      fontSize: '0.76rem',
                      cursor: 'pointer',
                      color: '#0f172a',
                      fontWeight: 600
                    }}
                  >
                    👤 Robert Langdon
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary"
                style={{
                  width: '100%',
                  padding: '14px',
                  borderRadius: '12px',
                  fontSize: '0.95rem',
                  fontWeight: 700,
                  justifyContent: 'center',
                  boxShadow: '0 4px 14px rgba(2, 132, 199, 0.35)'
                }}
              >
                <LogIn size={16} />
                <span>{loading ? 'Authenticating...' : 'Sign In as Patient'}</span>
              </button>
            </form>
          )}

          {/* SIGN UP FORM */}
          {activeTab === 'signup' && (
            <form onSubmit={handleSignUpSubmit}>
              <div className="form-group" style={{ marginBottom: '14px' }}>
                <label className="form-label" style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                  Full Legal Name
                </label>
                <div style={{ position: 'relative' }}>
                  <User size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                  <input
                    type="text"
                    className="form-input"
                    style={{ paddingLeft: '38px', width: '100%', boxSizing: 'border-box' }}
                    placeholder="e.g. John Doe"
                    value={signUpForm.name}
                    onChange={(e) => setSignUpForm({ ...signUpForm, name: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '14px' }}>
                <label className="form-label" style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                  Email Address
                </label>
                <div style={{ position: 'relative' }}>
                  <Mail size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                  <input
                    type="email"
                    className="form-input"
                    style={{ paddingLeft: '38px', width: '100%', boxSizing: 'border-box' }}
                    placeholder="patient@example.com"
                    value={signUpForm.email}
                    onChange={(e) => setSignUpForm({ ...signUpForm, email: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '14px' }}>
                <label className="form-label" style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                  Phone Number
                </label>
                <div style={{ position: 'relative' }}>
                  <Phone size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                  <input
                    type="tel"
                    className="form-input"
                    style={{ paddingLeft: '38px', width: '100%', boxSizing: 'border-box' }}
                    placeholder="+1 (555) 234-5678"
                    value={signUpForm.phone}
                    onChange={(e) => setSignUpForm({ ...signUpForm, phone: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '22px' }}>
                <label className="form-label" style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                  Create Password (minimum 6 characters)
                </label>
                <div style={{ position: 'relative' }}>
                  <Lock size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="form-input"
                    style={{ paddingLeft: '38px', paddingRight: '40px', width: '100%', boxSizing: 'border-box' }}
                    placeholder="Choose a strong password"
                    value={signUpForm.password}
                    onChange={(e) => setSignUpForm({ ...signUpForm, password: e.target.value })}
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
                disabled={loading}
                className="btn btn-primary"
                style={{
                  width: '100%',
                  padding: '14px',
                  borderRadius: '12px',
                  fontSize: '0.95rem',
                  fontWeight: 700,
                  justifyContent: 'center',
                  boxShadow: '0 4px 14px rgba(2, 132, 199, 0.35)'
                }}
              >
                <Sparkles size={16} />
                <span>{loading ? 'Creating Profile...' : 'Sign Up & Create Profile'}</span>
              </button>
            </form>
          )}

          <div style={{ marginTop: '22px', textAlign: 'center', fontSize: '0.82rem', color: '#64748b' }}>
            Looking for clinical staff login?{' '}
            <a 
              href="/doctor" 
              style={{ color: '#0284c7', fontWeight: 700, textDecoration: 'none' }}
            >
              Doctor Portal Access →
            </a>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{ textAlign: 'center', color: '#64748b', fontSize: '0.75rem', padding: '12px 0' }}>
        CarePulse Hospital Management System • Secured by Firebase Authentication
      </div>
    </div>
  );
}
