import { auth } from '../firebase';
import { apiUrl } from './api';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut as firebaseSignOut,
  onAuthStateChanged 
} from 'firebase/auth';

const STORAGE_USER_KEY = 'carepulse_auth_user';
const STORAGE_DOCTOR_KEY = 'carepulse_doctor_session';

// Helper to save session
export function setStoredUser(user) {
  if (user) {
    localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(STORAGE_USER_KEY);
  }
}

export function getStoredUser() {
  try {
    const raw = localStorage.getItem(STORAGE_USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setStoredDoctor(doctor) {
  if (doctor) {
    sessionStorage.setItem(STORAGE_DOCTOR_KEY, JSON.stringify(doctor));
  } else {
    sessionStorage.removeItem(STORAGE_DOCTOR_KEY);
  }
}

export function getStoredDoctor() {
  try {
    const raw = sessionStorage.getItem(STORAGE_DOCTOR_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

// Register a new patient
export async function registerPatient({ name, email, password, phone }) {
  // 1. Backend registration (creates user in database & attempts Firebase Admin)
  const res = await fetch(apiUrl('/api/auth/register'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password, phone })
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to register account');
  }

  // 2. Client-side Firebase Auth attempt (if client config is enabled)
  try {
    await createUserWithEmailAndPassword(auth, email, password);
  } catch (fbErr) {
    // Graceful fallback if client Firebase Auth is in simulation mode
    console.log('Firebase Client Auth notice:', fbErr.code || fbErr.message);
  }

  setStoredUser(data.user);
  return data;
}

// Universal Login (Patients or Doctors)
export async function loginUser(email, password) {
  const res = await fetch(apiUrl('/api/auth/login'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Invalid credentials');
  }

  // Client Firebase Auth sync attempt
  try {
    await signInWithEmailAndPassword(auth, email, password);
  } catch (fbErr) {
    console.log('Firebase Client Auth notice:', fbErr.code || fbErr.message);
  }

  if (data.role === 'doctor') {
    setStoredDoctor(data.doctor);
    setStoredUser(data.user);
  } else {
    setStoredUser(data.user);
  }

  return data;
}

// Dedicated Doctor Clinical Login
export async function loginDoctor({ doctorId, email, passcode }) {
  const res = await fetch(apiUrl('/api/auth/doctor-login'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ doctorId, email, passcode })
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Doctor authentication failed');
  }

  setStoredDoctor(data.doctor);
  setStoredUser(data.user);
  return data;
}

// Fetch list of doctors with their credentials for quick 1-click test login
export async function getDoctorsDirectory() {
  try {
    const res = await fetch(apiUrl('/api/auth/doctors'));
    if (!res.ok) return [];
    return await res.json();
  } catch (err) {
    console.warn('Failed to fetch doctor directory:', err);
    return [];
  }
}

// Sign Out
export async function logoutAll() {
  try {
    await firebaseSignOut(auth);
  } catch (e) {
    // ignore
  }
  setStoredUser(null);
  setStoredDoctor(null);
}

// Fetch complete patient profile & appointment history
export async function fetchPatientProfile(email) {
  if (!email) return null;
  const res = await fetch(apiUrl(`/api/patient/profile?email=${encodeURIComponent(email)}`));
  if (!res.ok) {
    throw new Error('Failed to load patient profile data');
  }
  return await res.json();
}

// Update patient profile details
export async function updatePatientProfile(profileData) {
  const res = await fetch(apiUrl('/api/patient/profile'), {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(profileData)
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to update profile');
  }
  const data = await res.json();
  if (data.user) {
    setStoredUser(data.user);
  }
  return data;
}
