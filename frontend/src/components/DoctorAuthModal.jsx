import React, { useState } from 'react';
import { Lock, ShieldCheck, Key, Eye, EyeOff, AlertCircle, X, Stethoscope, CheckCircle2 } from 'lucide-react';

export default function DoctorAuthModal({ isOpen, onClose, onAuthenticated }) {
  const [doctorId, setDoctorId] = useState('');
  const [passkey, setPasskey] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  // Expected credentials configured in .env (with safe fallbacks)
  const envDoctorId = (import.meta.env.VITE_DOCTOR_ID || 'DOC2026').trim();
  const envPasskey = (import.meta.env.VITE_DOCTOR_PASSKEY || 'admin@hospital').trim();
  const envAccessKey = (import.meta.env.VITE_DOCTOR_ACCESS_KEY || 'DOC-ADMIN-2026').trim();

  const handleLogin = (e) => {
    e.preventDefault();
    setError('');

    const trimmedId = doctorId.trim();
    const trimmedPass = passkey.trim();

    if (!trimmedPass) {
      setError('Please enter your authorization password or master access key.');
      return;
    }

    setLoading(true);

    setTimeout(() => {
      // Allow authentication if:
      // 1. Master Access Key is entered in the password field
      // 2. Doctor ID & Doctor Passkey match the .env configuration
      // 3. Master Access Key is entered as the ID
      const isMasterKey = trimmedPass === envAccessKey || trimmedId === envAccessKey;
      const isDoctorCreds = trimmedId.toLowerCase() === envDoctorId.toLowerCase() && trimmedPass === envPasskey;

      if (isMasterKey || isDoctorCreds) {
        // Persist session
        sessionStorage.setItem('carepulse_doctor_auth', JSON.stringify({
          authenticated: true,
          doctorId: trimmedId || envDoctorId,
          timestamp: Date.now()
        }));
        onAuthenticated();
        onClose();
      } else {
        setError('Invalid Doctor ID or Passcode. Please check your .env configuration.');
      }
      setLoading(false);
    }, 350);
  };

  return (
    <div className="modal-backdrop" onClick={onClose} style={{ zIndex: 1100 }}>
      <div 
        className="modal-box" 
        onClick={(e) => e.stopPropagation()} 
        style={{ maxWidth: '440px', padding: '28px', borderRadius: '16px' }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '44px',
              height: '44px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(2, 132, 199, 0.35)'
            }}>
              <ShieldCheck size={24} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, color: 'var(--secondary)' }}>
                Doctor Portal Access
              </h3>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Protected Staff & Clinical Console
              </span>
            </div>
          </div>

          <button 
            type="button" 
            onClick={onClose} 
            className="btn-icon" 
            style={{ color: 'var(--text-muted)' }}
          >
            <X size={20} />
          </button>
        </div>

        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '18px', lineHeight: '1.5' }}>
          This area is restricted to authorized hospital clinicians and staff. Please authenticate using your clinical ID and passcode configured in <code>.env</code>.
        </p>

        {error && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: '#fef2f2',
            color: '#dc2626',
            padding: '10px 14px',
            borderRadius: '8px',
            fontSize: '0.82rem',
            marginBottom: '16px',
            border: '1px solid #fecaca'
          }}>
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin}>
          <div className="form-group" style={{ marginBottom: '14px' }}>
            <label className="form-label" style={{ fontSize: '0.82rem', fontWeight: 600 }}>
              Doctor ID / Clinical Username
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. DOC2026"
                value={doctorId}
                onChange={(e) => setDoctorId(e.target.value)}
                autoFocus
              />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: '20px' }}>
            <label className="form-label" style={{ fontSize: '0.82rem', fontWeight: 600 }}>
              Passcode / Master Access Key
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPass ? 'text' : 'password'}
                className="form-input"
                placeholder="Enter passcode from .env"
                value={passkey}
                onChange={(e) => setPasskey(e.target.value)}
                style={{ paddingRight: '40px' }}
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: 0
                }}
              >
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div style={{
            background: '#f8fafc',
            border: '1px dashed #cbd5e1',
            borderRadius: '8px',
            padding: '10px 12px',
            fontSize: '0.75rem',
            color: '#64748b',
            marginBottom: '20px'
          }}>
            <strong>Configured in .env:</strong> Doctor ID <code>{envDoctorId}</code> & Password or Key <code>{envAccessKey}</code>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              style={{ flex: 1 }}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
              style={{ flex: 1.5, justifyContent: 'center' }}
            >
              <Key size={16} />
              <span>{loading ? 'Verifying...' : 'Unlock Dashboard'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
