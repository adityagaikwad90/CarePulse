const fs = require('fs');
const path = require('path');
const { admin, db: firestoreDb } = require('./firebase');

const DATA_DIR = process.env.VERCEL ? path.join('/tmp', 'data') : path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

// Ensure local fallback data directory exists
try {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
} catch (e) {
  // Read-only filesystem warning
}

let isFirestoreOnline = false;
let lastCheckTime = 0;
let lastCheckError = null;

// In-memory cache fallback for serverless environments where disk writes are restricted
let inMemoryDb = null;

// Dynamic Firestore availability checker (auto-retries so that once database is created in console, it connects immediately)
async function checkFirestore(force = false) {
  if (!firestoreDb) {
    isFirestoreOnline = false;
    return false;
  }
  const now = Date.now();
  if (isFirestoreOnline && !force) return true;
  const backoff = (lastCheckError && lastCheckError.includes('RESOURCE_EXHAUSTED')) ? 60000 : 15000;
  if (!force && now - lastCheckTime < backoff) return isFirestoreOnline;

  lastCheckTime = now;
  try {
    const testRef = firestoreDb.collection('_health_check').doc('ping');
    await testRef.set({ check: true, timestamp: Date.now() });
    await testRef.delete();
    const wasOffline = !isFirestoreOnline;
    isFirestoreOnline = true;
    lastCheckError = null;
    if (wasOffline) {
      console.log('✅ Firebase Firestore connected and operational!');
      syncLocalToFirestore().catch(e => console.warn('Sync error:', e.message));
    }
  } catch (err) {
    isFirestoreOnline = false;
    lastCheckError = err.message || String(err);
    if (!lastCheckError.includes('RESOURCE_EXHAUSTED')) {
      console.warn(`ℹ️ Firestore connection check: ${lastCheckError}`);
    }
  }
  return isFirestoreOnline;
}

// Sync local records directly to Cloud Firestore
async function syncLocalToFirestore() {
  if (!isFirestoreOnline) return false;
  try {
    const local = readLocalDb();
    console.log(`🔄 Syncing ${local.appointments.length} appointments to Firestore...`);
    const batch = firestoreDb.batch();
    
    for (const apt of local.appointments) {
      const ref = firestoreDb.collection('appointments').doc(apt.id);
      batch.set(ref, apt, { merge: true });
    }

    for (const doc of local.doctors) {
      const ref = firestoreDb.collection('doctors').doc(doc.id);
      batch.set(ref, doc, { merge: true });
    }

    for (const dep of local.departments) {
      const ref = firestoreDb.collection('departments').doc(dep.id);
      batch.set(ref, dep, { merge: true });
    }

    await batch.commit();
    console.log('✅ All local appointments & data successfully synchronized to Cloud Firestore!');
    return true;
  } catch (err) {
    console.warn('⚠️ Auto-sync to Firestore failed:', err.message);
    return false;
  }
}

// Initial default seed dataset
const DEFAULT_DEPARTMENTS = [
  { id: 'dep-cardio', name: 'Cardiology', icon: 'HeartPulse', desc: 'Heart care, ECG, hypertension & cardiovascular treatment' },
  { id: 'dep-neuro', name: 'Neurology', icon: 'Brain', desc: 'Brain, spinal cord & nervous system disorders' },
  { id: 'dep-pedia', name: 'Pediatrics', icon: 'Baby', desc: 'Comprehensive healthcare for newborns, children & teens' },
  { id: 'dep-ortho', name: 'Orthopedics', icon: 'Bone', desc: 'Bones, joints, sports injuries & spine therapy' },
  { id: 'dep-derma', name: 'Dermatology', icon: 'Sparkles', desc: 'Skin, hair, nail treatments & cosmetic care' },
  { id: 'dep-gen', name: 'General Medicine', icon: 'Stethoscope', desc: 'Primary diagnosis, preventive health & consultations' },
  { id: 'dep-ophtha', name: 'Ophthalmology', icon: 'Eye', desc: 'Eye examinations, vision correction & cataract care' },
  { id: 'dep-onco', name: 'Oncology', icon: 'Activity', desc: 'Cancer diagnosis, chemotherapy guidance & screening' },
  { id: 'dep-gyn', name: 'Gynecology', icon: 'UserCheck', desc: 'Women health, prenatal care & reproductive medicine' }
];

const DEFAULT_DOCTORS = [
  {
    id: 'doc-1',
    name: 'Dr. Sarah Jenkins',
    email: 'sarah.jenkins@hospital.care',
    passcode: 'doctor@cardio2026',
    title: 'Chief of Cardiology',
    department: 'Cardiology',
    degree: 'MD, FACC - Harvard Medical',
    experienceYears: 14,
    rating: 4.95,
    reviewsCount: 184,
    consultationFee: 1200,
    room: 'Room 304 - Cardio Wing A',
    availableDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    slots: ['09:00 AM', '10:00 AM', '11:30 AM', '02:00 PM', '03:30 PM', '04:30 PM'],
    avatar: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=400',
    bio: 'Pioneering cardiologist specialized in non-invasive cardiac imaging, preventive heart care, and arrhythmia management.'
  },
  {
    id: 'doc-2',
    name: 'Dr. Marcus Vance',
    email: 'marcus.vance@hospital.care',
    passcode: 'doctor@neuro2026',
    title: 'Senior Neurosurgeon',
    department: 'Neurology',
    degree: 'MD, PhD - Johns Hopkins',
    experienceYears: 18,
    rating: 4.98,
    reviewsCount: 220,
    consultationFee: 1500,
    room: 'Room 512 - Neurological Center',
    availableDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday'],
    slots: ['10:00 AM', '11:00 AM', '01:30 PM', '02:30 PM', '04:00 PM'],
    avatar: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=400',
    bio: 'Distinguished neurologist specializing in cerebrovascular therapies, epilepsy, chronic migraines, and neuro-rehabilitation.'
  },
  {
    id: 'doc-3',
    name: 'Dr. Elena Rostova',
    email: 'elena.rostova@hospital.care',
    passcode: 'doctor@pedia2026',
    title: 'Pediatric Specialist',
    department: 'Pediatrics',
    degree: 'MD, FAAP - Stanford University',
    experienceYears: 11,
    rating: 4.92,
    reviewsCount: 165,
    consultationFee: 800,
    room: 'Room 201 - Childrens Clinic',
    availableDays: ['Monday', 'Tuesday', 'Wednesday', 'Friday', 'Saturday'],
    slots: ['08:30 AM', '09:30 AM', '11:00 AM', '01:00 PM', '03:00 PM'],
    avatar: 'https://images.unsplash.com/photo-1594824813637-674be8832a76?auto=format&fit=crop&q=80&w=400',
    bio: 'Caring pediatrician dedicated to childhood wellness, neonatal checkups, developmental milestones, and pediatric immunology.'
  },
  {
    id: 'doc-4',
    name: 'Dr. David Chen',
    email: 'david.chen@hospital.care',
    passcode: 'doctor@ortho2026',
    title: 'Orthopedic Surgeon',
    department: 'Orthopedics',
    degree: 'MD, FACS - Mayo Clinic',
    experienceYears: 16,
    rating: 4.89,
    reviewsCount: 142,
    consultationFee: 1300,
    room: 'Room 408 - Ortho & Sports Wing',
    availableDays: ['Monday', 'Wednesday', 'Thursday', 'Friday'],
    slots: ['09:00 AM', '10:30 AM', '01:00 PM', '02:30 PM', '04:00 PM'],
    avatar: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&q=80&w=400',
    bio: 'Orthopedic specialist in joint replacement, sports injury recovery, arthroscopy, and complex trauma reconstruction.'
  },
  {
    id: 'doc-5',
    name: 'Dr. Maya Patel',
    email: 'maya.patel@hospital.care',
    passcode: 'doctor@derma2026',
    title: 'Consultant Dermatologist',
    department: 'Dermatology',
    degree: 'MD, FAAD - Columbia University',
    experienceYears: 10,
    rating: 4.94,
    reviewsCount: 198,
    consultationFee: 950,
    room: 'Room 115 - Skin & Laser Care',
    availableDays: ['Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    slots: ['10:00 AM', '11:30 AM', '02:00 PM', '03:30 PM', '05:00 PM'],
    avatar: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=400',
    bio: 'Expert dermatologist handling medical and aesthetic dermatology, eczema, acne therapies, and laser dermatological procedures.'
  },
  {
    id: 'doc-6',
    name: 'Dr. Arthur Pendelton',
    email: 'arthur.pendelton@hospital.care',
    passcode: 'doctor@med2026',
    title: 'Internal Medicine Physician',
    department: 'General Medicine',
    degree: 'MD - Oxford University',
    experienceYears: 22,
    rating: 4.96,
    reviewsCount: 310,
    consultationFee: 750,
    room: 'Room 102 - Outpatient Consultation',
    availableDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    slots: ['08:00 AM', '09:00 AM', '10:30 AM', '12:00 PM', '02:00 PM', '03:30 PM'],
    avatar: 'https://images.unsplash.com/photo-1582750433449-648ed127bb54?auto=format&fit=crop&q=80&w=400',
    bio: 'Senior physician with over two decades of clinical experience in family wellness, chronic disease management, and metabolic diagnostics.'
  }
];

const DEFAULT_USERS = [
  {
    id: 'user-emma',
    name: 'Emma Watson',
    email: 'emma.watson@example.com',
    password: 'patient123',
    phone: '+1 (555) 234-5678',
    role: 'patient',
    createdAt: new Date().toISOString()
  },
  {
    id: 'user-robert',
    name: 'Robert Langdon',
    email: 'robert.l@example.com',
    password: 'patient123',
    phone: '+1 (555) 876-5432',
    role: 'patient',
    createdAt: new Date().toISOString()
  }
];

const DEFAULT_APPOINTMENTS = [
  {
    id: 'APT-1001',
    patientName: 'Emma Watson',
    patientEmail: 'emma.watson@example.com',
    patientPhone: '+1 (555) 234-5678',
    patientAge: 32,
    patientGender: 'Female',
    doctorId: 'doc-1',
    doctorName: 'Dr. Sarah Jenkins',
    department: 'Cardiology',
    reason: 'Frequent palpitations after running and occasional chest tightness in morning hours.',
    preferredDate: '2026-10-18',
    preferredTime: '10:00 AM',
    status: 'approved',
    scheduledDate: '2026-10-18',
    scheduledTime: '10:00 AM',
    room: 'Room 304 - Cardio Wing A',
    doctorNotes: 'Confirmed appointment. Advised to avoid caffeine 12 hours prior to ECG.',
    prescription: 'Initial ECG and lipid profile test recommended upon arrival.',
    createdAt: new Date(Date.now() - 3600 * 1000 * 24).toISOString(),
    updatedAt: new Date(Date.now() - 3600 * 1000 * 18).toISOString()
  },
  {
    id: 'APT-1002',
    patientName: 'Robert Langdon',
    patientEmail: 'robert.l@example.com',
    patientPhone: '+1 (555) 876-5432',
    patientAge: 48,
    patientGender: 'Male',
    doctorId: 'doc-2',
    doctorName: 'Dr. Marcus Vance',
    department: 'Neurology',
    reason: 'Recurring severe migraine episodes with visual auras for the last 3 weeks.',
    preferredDate: '2026-10-19',
    preferredTime: '01:30 PM',
    status: 'pending',
    scheduledDate: null,
    scheduledTime: null,
    room: null,
    doctorNotes: '',
    prescription: '',
    createdAt: new Date(Date.now() - 3600 * 1000 * 6).toISOString(),
    updatedAt: new Date(Date.now() - 3600 * 1000 * 6).toISOString()
  },
  {
    id: 'APT-1003',
    patientName: 'Sophia Miller',
    patientEmail: 'sophia.m@example.com',
    patientPhone: '+1 (555) 432-8765',
    patientAge: 7,
    patientGender: 'Female',
    doctorId: 'doc-3',
    doctorName: 'Dr. Elena Rostova',
    department: 'Pediatrics',
    reason: 'Annual developmental pediatric checkup and seasonal flu vaccination.',
    preferredDate: '2026-10-20',
    preferredTime: '09:30 AM',
    status: 'rescheduled',
    scheduledDate: '2026-10-21',
    scheduledTime: '11:00 AM',
    room: 'Room 201 - Childrens Clinic',
    doctorNotes: 'Rescheduled from Oct 20 to Oct 21 due to pediatric emergency rounds on Tuesday.',
    prescription: '',
    createdAt: new Date(Date.now() - 3600 * 1000 * 48).toISOString(),
    updatedAt: new Date(Date.now() - 3600 * 1000 * 12).toISOString()
  },
  {
    id: 'APT-1004',
    patientName: 'Michael Brown',
    patientEmail: 'mbrown@example.com',
    patientPhone: '+1 (555) 345-9876',
    patientAge: 39,
    patientGender: 'Male',
    doctorId: 'doc-4',
    doctorName: 'Dr. David Chen',
    department: 'Orthopedics',
    reason: 'Knee ligament follow-up consultation after meniscus rehabilitation therapy.',
    preferredDate: '2026-10-15',
    preferredTime: '02:30 PM',
    status: 'completed',
    scheduledDate: '2026-10-15',
    scheduledTime: '02:30 PM',
    room: 'Room 408 - Ortho & Sports Wing',
    doctorNotes: 'Patient demonstrates 90% range of motion recovery. Quadriceps strength normal.',
    prescription: 'Continue low-impact cycling and prescribed physical therapy. Next review in 6 months.',
    createdAt: new Date(Date.now() - 3600 * 1000 * 72).toISOString(),
    updatedAt: new Date(Date.now() - 3600 * 1000 * 20).toISOString()
  }
];

// Helper to read local DB
function readLocalDb() {
  if (inMemoryDb) {
    return inMemoryDb;
  }
  if (!fs.existsSync(DB_FILE)) {
    const initial = {
      doctors: DEFAULT_DOCTORS,
      departments: DEFAULT_DEPARTMENTS,
      appointments: DEFAULT_APPOINTMENTS,
      users: DEFAULT_USERS
    };
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(initial, null, 2), 'utf-8');
    } catch (_) {}
    inMemoryDb = initial;
    return initial;
  }
  try {
    const data = JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
    if (!data.users) {
      data.users = DEFAULT_USERS;
    }
    // Also ensure doctors have email and passcode
    if (data.doctors && data.doctors.length > 0) {
      DEFAULT_DOCTORS.forEach(defDoc => {
        const found = data.doctors.find(d => d.id === defDoc.id);
        if (found) {
          if (!found.email) found.email = defDoc.email;
          if (!found.passcode) found.passcode = defDoc.passcode;
        }
      });
    }
    inMemoryDb = data;
    return data;
  } catch (e) {
    inMemoryDb = { 
      doctors: DEFAULT_DOCTORS, 
      departments: DEFAULT_DEPARTMENTS, 
      appointments: DEFAULT_APPOINTMENTS,
      users: DEFAULT_USERS
    };
    return inMemoryDb;
  }
}

// Helper to write local DB
function writeLocalDb(data) {
  inMemoryDb = data;
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (_) {
    // In serverless / read-only filesystem, silently kept in inMemoryDb
  }
}

// Unified API Functions
async function getDepartments() {
  const online = await checkFirestore();
  if (online) {
    try {
      const snap = await withTimeout(firestoreDb.collection('departments').get(), 800);
      if (!snap.empty) {
        return snap.docs.map(d => ({ id: d.id, ...d.data() }));
      }
    } catch (e) {
      // Instant local fallback
    }
  }
  const local = readLocalDb();
  return local.departments || DEFAULT_DEPARTMENTS;
}

async function getDoctors() {
  const online = await checkFirestore();
  if (online) {
    try {
      const snap = await withTimeout(firestoreDb.collection('doctors').get(), 800);
      if (!snap.empty) {
        return snap.docs.map(d => ({ id: d.id, ...d.data() }));
      }
    } catch (e) {
      // Instant local fallback
    }
  }
  const local = readLocalDb();
  return local.doctors || DEFAULT_DOCTORS;
}

async function getDoctorById(id) {
  const doctors = await getDoctors();
  return doctors.find(d => d.id === id) || null;
}

async function addDoctor(docData) {
  const id = 'doc-' + Date.now();
  const doctor = { id, ...docData };

  const online = await checkFirestore();
  if (online) {
    try {
      await firestoreDb.collection('doctors').doc(id).set(doctor);
    } catch (e) {
      console.warn('Firestore addDoctor fallback:', e.message);
    }
  }

  const local = readLocalDb();
  local.doctors.unshift(doctor);
  writeLocalDb(local);
  return doctor;
}

function withTimeout(promise, ms = 1500) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error('Firestore timeout')), ms))
  ]);
}

async function getAppointments({ doctorId, patientEmail, status, date } = {}) {
  const online = await checkFirestore();
  let list = [];

  if (online) {
    try {
      let q = firestoreDb.collection('appointments');
      if (doctorId) q = q.where('doctorId', '==', doctorId);
      if (patientEmail) q = q.where('patientEmail', '==', patientEmail);
      if (status && status !== 'all') q = q.where('status', '==', status);
      const snap = await withTimeout(q.get(), 1500);
      if (!snap.empty) {
        list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      }
    } catch (e) {
      // Graceful instant fallback to local cache
    }
  }

  if (list.length === 0) {
    const local = readLocalDb();
    list = local.appointments || [];
    if (doctorId) list = list.filter(a => a.doctorId === doctorId);
    if (patientEmail) list = list.filter(a => (a.patientEmail || '').toLowerCase() === patientEmail.toLowerCase());
    if (status && status !== 'all') list = list.filter(a => a.status === status);
    if (date) list = list.filter(a => a.preferredDate === date || a.scheduledDate === date);
  }

  // Sort descending by creation date
  return list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

async function getAppointmentById(id) {
  const online = await checkFirestore();
  if (online) {
    try {
      const doc = await firestoreDb.collection('appointments').doc(id).get();
      if (doc.exists) {
        return { id: doc.id, ...doc.data() };
      }
    } catch (e) {
      console.warn('Firestore fallback on getAppointmentById:', e.message);
    }
  }

  const local = readLocalDb();
  return local.appointments.find(a => a.id === id) || null;
}

async function createAppointment(data) {
  const id = 'APT-' + Math.floor(1000 + Math.random() * 9000);
  const now = new Date().toISOString();

  const appointment = {
    id,
    patientName: data.patientName || '',
    patientEmail: data.patientEmail || '',
    patientPhone: data.patientPhone || '',
    patientAge: Number(data.patientAge) || null,
    patientGender: data.patientGender || 'Unspecified',
    doctorId: data.doctorId || '',
    doctorName: data.doctorName || '',
    department: data.department || '',
    reason: data.reason || '',
    preferredDate: data.preferredDate || '',
    preferredTime: data.preferredTime || '',
    status: 'pending', // 'pending', 'approved', 'rejected', 'rescheduled', 'completed'
    scheduledDate: null,
    scheduledTime: null,
    room: null,
    doctorNotes: '',
    prescription: '',
    createdAt: now,
    updatedAt: now
  };

  const online = await checkFirestore(!isFirestoreOnline);
  if (online) {
    try {
      await firestoreDb.collection('appointments').doc(id).set(appointment);
      console.log(`🔥 [Firestore] Successfully stored appointment ${id} for "${appointment.patientName}" in Cloud Firestore!`);
    } catch (e) {
      console.warn(`⚠️ [Firestore] Failed to write appointment ${id} to Firestore:`, e.message);
    }
  } else {
    console.log(`💾 [Local DB] Saved appointment ${id} locally in db.json (Cloud Firestore pending creation in Firebase Console).`);
  }

  const local = readLocalDb();
  local.appointments.unshift(appointment);
  writeLocalDb(local);

  return appointment;
}

async function updateAppointment(id, updates) {
  const now = new Date().toISOString();
  const modified = { ...updates, updatedAt: now };

  const online = await checkFirestore(!isFirestoreOnline);
  if (online) {
    try {
      await firestoreDb.collection('appointments').doc(id).set(modified, { merge: true });
      console.log(`🔥 [Firestore] Updated appointment ${id} in Cloud Firestore`);
    } catch (e) {
      console.warn(`⚠️ [Firestore] Update fallback for ${id}:`, e.message);
    }
  }

  const local = readLocalDb();
  const idx = local.appointments.findIndex(a => a.id === id);
  if (idx !== -1) {
    local.appointments[idx] = { ...local.appointments[idx], ...modified };
    writeLocalDb(local);
    return local.appointments[idx];
  }
  return null;
}

async function deleteAppointment(id) {
  const online = await checkFirestore(!isFirestoreOnline);
  if (online) {
    try {
      await firestoreDb.collection('appointments').doc(id).delete();
      console.log(`🔥 [Firestore] Deleted appointment ${id} from Cloud Firestore`);
    } catch (e) {
      console.warn(`⚠️ [Firestore] Delete fallback for ${id}:`, e.message);
    }
  }

  const local = readLocalDb();
  local.appointments = local.appointments.filter(a => a.id !== id);
  writeLocalDb(local);
  return { success: true, id };
}

// User Authentication & Management
async function getUsers() {
  const online = await checkFirestore();
  if (online) {
    try {
      const snap = await withTimeout(firestoreDb.collection('users').get(), 800);
      if (!snap.empty) {
        return snap.docs.map(d => ({ id: d.id, ...d.data() }));
      }
    } catch (e) {
      // Instant local fallback
    }
  }
  const local = readLocalDb();
  return local.users || DEFAULT_USERS;
}

async function getUserByEmail(email) {
  if (!email) return null;
  const users = await getUsers();
  return users.find(u => u.email.toLowerCase() === email.toLowerCase()) || null;
}

async function getUserById(id) {
  if (!id) return null;
  const users = await getUsers();
  return users.find(u => u.id === id) || null;
}

async function createUser(userData) {
  const id = 'user-' + Math.floor(10000 + Math.random() * 90000);
  const now = new Date().toISOString();
  const newUser = {
    id,
    name: userData.name || 'Hospital Patient',
    email: userData.email.toLowerCase().trim(),
    password: userData.password, // Plain text for lightweight local/sync auth demo
    phone: userData.phone || '',
    role: userData.role || 'patient',
    createdAt: now
  };

  // Try creating in Cloud Firestore
  const online = await checkFirestore();
  if (online) {
    try {
      await firestoreDb.collection('users').doc(id).set(newUser);
      console.log(`🔥 [Firestore] Registered user ${newUser.email} in Firestore`);
    } catch (e) {
      console.warn('Firestore createUser fallback:', e.message);
    }
  }

  // Also try registering in Firebase Admin Auth if possible
  try {
    await admin.auth().createUser({
      uid: id,
      email: newUser.email,
      password: newUser.password,
      displayName: newUser.name,
      phoneNumber: newUser.phone.startsWith('+') ? newUser.phone : undefined
    });
    console.log(`🔥 [Firebase Auth] Registered user in Firebase Authentication`);
  } catch (authErr) {
    // If auth API is not enabled in console or already exists, log gracefully
    console.log(`ℹ️ [Firebase Auth Note] ${authErr.message}`);
  }

  const local = readLocalDb();
  if (!local.users) local.users = [];
  local.users.unshift(newUser);
  writeLocalDb(local);

  const { password, ...safeUser } = newUser;
  return safeUser;
}

async function updateUserProfile(email, updates) {
  if (!email) return null;
  const cleanEmail = email.toLowerCase().trim();
  const online = await checkFirestore();
  let user = await getUserByEmail(cleanEmail);

  if (!user) {
    user = {
      id: 'user-' + Math.floor(10000 + Math.random() * 90000),
      name: updates.name || cleanEmail.split('@')[0],
      email: cleanEmail,
      phone: updates.phone || '',
      age: updates.age || 30,
      gender: updates.gender || 'Not specified',
      role: 'patient',
      createdAt: new Date().toISOString()
    };
  }

  const updatedUser = {
    ...user,
    ...updates,
    email: cleanEmail
  };

  if (online) {
    try {
      await firestoreDb.collection('users').doc(updatedUser.id).set(updatedUser, { merge: true });
    } catch (e) {
      console.warn('Firestore updateUserProfile fallback:', e.message);
    }
  }

  const local = readLocalDb();
  if (!local.users) local.users = [];
  const idx = local.users.findIndex(u => u.email.toLowerCase() === cleanEmail);
  if (idx !== -1) {
    local.users[idx] = { ...local.users[idx], ...updatedUser };
  } else {
    local.users.unshift(updatedUser);
  }
  writeLocalDb(local);

  const { password, ...safeUser } = updatedUser;
  return safeUser;
}

async function authenticateUser({ email, password }) {
  if (!email || !password) {
    throw new Error('Email and password are required');
  }

  // 1. Check if it's a Doctor logging in via universal login
  const doctors = await getDoctors();
  const matchedDoctor = doctors.find(d => 
    (d.email && d.email.toLowerCase() === email.toLowerCase().trim()) ||
    (d.id && d.id.toLowerCase() === email.toLowerCase().trim())
  );

  const masterPass = (process.env.VITE_DOCTOR_PASSKEY || 'admin@hospital').trim();
  const masterKey = (process.env.VITE_DOCTOR_ACCESS_KEY || 'DOC-ADMIN-2026').trim();

  if (matchedDoctor) {
    const isDocPassValid = 
      password === matchedDoctor.passcode || 
      password === masterPass || 
      password === masterKey;

    if (isDocPassValid) {
      return {
        role: 'doctor',
        doctor: matchedDoctor,
        user: {
          id: matchedDoctor.id,
          name: matchedDoctor.name,
          email: matchedDoctor.email || `${matchedDoctor.id}@hospital.care`,
          role: 'doctor',
          doctorId: matchedDoctor.id,
          department: matchedDoctor.department
        }
      };
    }
  }

  // 2. Check registered patients
  const users = await getUsers();
  const matchedUser = users.find(u => u.email.toLowerCase() === email.toLowerCase().trim());
  if (matchedUser && matchedUser.password === password) {
    const { password: _, ...safeUser } = matchedUser;
    return {
      role: safeUser.role || 'patient',
      user: safeUser
    };
  }

  // Check if credentials match any doctor passcode
  if (password === masterPass || password === masterKey) {
    const primaryDoctor = doctors[0];
    return {
      role: 'doctor',
      doctor: primaryDoctor,
      user: {
        id: primaryDoctor.id,
        name: primaryDoctor.name,
        email: primaryDoctor.email,
        role: 'doctor',
        doctorId: primaryDoctor.id,
        department: primaryDoctor.department
      }
    };
  }

  throw new Error('Invalid email or password.');
}

async function authenticateDoctor({ doctorId, email, passcode }) {
  const doctors = await getDoctors();
  let doctor = null;

  if (doctorId) {
    doctor = doctors.find(d => d.id.toLowerCase() === doctorId.toLowerCase().trim());
  }
  if (!doctor && email) {
    doctor = doctors.find(d => d.email && d.email.toLowerCase() === email.toLowerCase().trim());
  }

  const masterPass = (process.env.VITE_DOCTOR_PASSKEY || 'admin@hospital').trim();
  const masterKey = (process.env.VITE_DOCTOR_ACCESS_KEY || 'DOC-ADMIN-2026').trim();

  // If master pass used without doctor id, default to first doctor
  if (!doctor && (passcode === masterKey || passcode === masterPass)) {
    doctor = doctors[0];
  }

  if (!doctor) {
    throw new Error('Doctor record not found for the provided identifier.');
  }

  const isValidPass = 
    passcode === doctor.passcode ||
    passcode === masterPass ||
    passcode === masterKey;

  if (!isValidPass) {
    throw new Error('Invalid doctor passcode or authorization credentials.');
  }

  return {
    success: true,
    role: 'doctor',
    doctor,
    user: {
      id: doctor.id,
      name: doctor.name,
      email: doctor.email || `${doctor.id}@hospital.care`,
      role: 'doctor',
      doctorId: doctor.id,
      department: doctor.department
    }
  };
}

async function getStats({ doctorId, patientEmail } = {}) {
  let appointments = await getAppointments();
  
  if (doctorId) {
    appointments = appointments.filter(a => a.doctorId === doctorId);
  } else if (patientEmail) {
    appointments = appointments.filter(a => a.patientEmail.toLowerCase() === patientEmail.toLowerCase());
  }

  const doctors = await getDoctors();
  const departments = await getDepartments();

  const totalAppointments = appointments.length;
  const pending = appointments.filter(a => a.status === 'pending').length;
  const approved = appointments.filter(a => a.status === 'approved').length;
  const rescheduled = appointments.filter(a => a.status === 'rescheduled').length;
  const completed = appointments.filter(a => a.status === 'completed').length;
  const cancelled = appointments.filter(a => a.status === 'rejected' || a.status === 'cancelled').length;

  return {
    totalAppointments,
    pending,
    approved,
    rescheduled,
    completed,
    cancelled,
    totalDoctors: doctors.length,
    totalDepartments: departments.length,
    filteredFor: doctorId ? { doctorId } : (patientEmail ? { patientEmail } : null),
    databaseStatus: isFirestoreOnline ? 'firestore_cloud' : 'local_synchronized'
  };
}

async function seedData() {
  const local = {
    doctors: DEFAULT_DOCTORS,
    departments: DEFAULT_DEPARTMENTS,
    appointments: DEFAULT_APPOINTMENTS,
    users: DEFAULT_USERS
  };
  writeLocalDb(local);

  const online = await checkFirestore();
  if (online) {
    try {
      const batch = firestoreDb.batch();
      DEFAULT_DOCTORS.forEach(doc => {
        batch.set(firestoreDb.collection('doctors').doc(doc.id), doc);
      });
      DEFAULT_DEPARTMENTS.forEach(dep => {
        batch.set(firestoreDb.collection('departments').doc(dep.id), dep);
      });
      DEFAULT_APPOINTMENTS.forEach(apt => {
        batch.set(firestoreDb.collection('appointments').doc(apt.id), apt);
      });
      DEFAULT_USERS.forEach(u => {
        batch.set(firestoreDb.collection('users').doc(u.id), u);
      });
      await batch.commit();
      console.log('Seeded data to Firestore successfully!');
    } catch (e) {
      console.warn('Firestore seed fallback:', e.message);
    }
  }
  return { success: true, message: 'Database seeded successfully' };
}

// Initialize seed if file does not exist
readLocalDb();

module.exports = {
  checkFirestore,
  syncLocalToFirestore,
  getDepartments,
  getDoctors,
  getDoctorById,
  addDoctor,
  getAppointments,
  getAppointmentById,
  createAppointment,
  updateAppointment,
  deleteAppointment,
  getStats,
  seedData,
  getUsers,
  getUserByEmail,
  getUserById,
  createUser,
  updateUserProfile,
  authenticateUser,
  authenticateDoctor
};
