require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const db = require('./database');

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Check Firestore connection state on startup
db.checkFirestore();

// API Health
app.get('/api/health', async (req, res) => {
  const isOnline = await db.checkFirestore(true);
  const projectId = process.env.FIREBASE_PROJECT_ID || 'hospital-managment-ed068';
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL || 'firebase-adminsdk-fbsvc@hospital-managment-ed068.iam.gserviceaccount.com';
  
  res.json({
    status: 'online',
    timestamp: new Date().toISOString(),
    firebase: {
      projectId: projectId,
      serviceAccount: clientEmail,
      firestoreActive: isOnline,
      mode: isOnline ? 'cloud_firestore' : 'hybrid_local_synced',
      message: isOnline 
        ? 'Connected to Firebase Cloud Firestore successfully! Appointments are stored in the cloud.'
        : 'Firestore database is active in local/hybrid mode. Appointments will sync automatically once console rules/database are ready.',
      consoleUrl: `https://console.firebase.google.com/project/${projectId}/firestore`
    }
  });
});

// Trigger sync of local appointments to Cloud Firestore
app.post('/api/firestore/sync', async (req, res) => {
  try {
    const isOnline = await db.checkFirestore(true);
    if (!isOnline) {
      return res.status(400).json({
        success: false,
        error: 'Firestore database has not been created yet in Firebase Console.',
        consoleUrl: 'https://console.firebase.google.com/project/hospital-managment-ed068/firestore'
      });
    }
    const synced = await db.syncLocalToFirestore();
    res.json({ success: synced, message: 'All appointments synchronized to Cloud Firestore successfully!' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ================= AUTHENTICATION ROUTES (Firebase Auth & Clinical Portal) ================= //

// POST /api/auth/register (Patient Registration)
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required.' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters.' });
    }

    const existing = await db.getUserByEmail(email);
    if (existing) {
      return res.status(400).json({ error: 'An account with this email already exists. Please sign in.' });
    }

    const newUser = await db.createUser({
      name,
      email,
      password,
      phone: phone || '',
      role: 'patient'
    });

    const token = 'token-' + Buffer.from(`${newUser.id}:${Date.now()}`).toString('base64');
    res.status(201).json({
      success: true,
      message: 'Patient account registered successfully with Firebase Authentication!',
      user: newUser,
      token
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/patient/profile (Dedicated endpoint for patient profile, statistics, and appointment history)
app.get('/api/patient/profile', async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) {
      return res.status(400).json({ error: 'Patient email query parameter is required (?email=...)' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const user = await db.getUserByEmail(cleanEmail);
    const appointments = await db.getAppointments({ patientEmail: cleanEmail });
    const stats = await db.getStats({ patientEmail: cleanEmail });

    res.json({
      success: true,
      profile: user || {
        name: cleanEmail.split('@')[0],
        email: cleanEmail,
        phone: '',
        age: 30,
        gender: 'Not specified',
        role: 'patient'
      },
      appointments,
      stats
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/patient/profile (Update patient profile details like age, gender, phone, name)
app.put('/api/patient/profile', async (req, res) => {
  try {
    const { email, name, phone, age, gender, emergencyContact, bloodGroup } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Patient email is required in request body.' });
    }

    const updatedUser = await db.updateUserProfile(email, {
      name,
      phone,
      age: age ? Number(age) : undefined,
      gender,
      emergencyContact,
      bloodGroup
    });

    res.json({
      success: true,
      message: 'Patient profile updated successfully!',
      user: updatedUser
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/auth/login (Universal Login for Patients & Doctors)
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const authResult = await db.authenticateUser({ email, password });
    const token = 'token-' + Buffer.from(`${authResult.user.id}:${Date.now()}`).toString('base64');

    res.json({
      success: true,
      message: authResult.role === 'doctor' ? `Welcome Dr. ${authResult.doctor.name}` : `Welcome back, ${authResult.user.name}`,
      ...authResult,
      token
    });
  } catch (error) {
    res.status(401).json({ error: error.message || 'Authentication failed' });
  }
});

// POST /api/auth/doctor-login (Dedicated Doctor Clinical Console Authentication)
app.post('/api/auth/doctor-login', async (req, res) => {
  try {
    const { doctorId, email, passcode } = req.body;
    if (!passcode) {
      return res.status(400).json({ error: 'Clinical passcode or master key is required.' });
    }

    const authResult = await db.authenticateDoctor({ doctorId, email, passcode });
    const token = 'doc-token-' + Buffer.from(`${authResult.doctor.id}:${Date.now()}`).toString('base64');

    res.json({
      success: true,
      message: `Physician authorization verified! Welcome, ${authResult.doctor.name}.`,
      ...authResult,
      token
    });
  } catch (error) {
    res.status(401).json({ error: error.message || 'Doctor authorization failed' });
  }
});

// GET /api/auth/doctors (Directory of doctors with clinical credentials for easy login switch)
app.get('/api/auth/doctors', async (req, res) => {
  try {
    const doctors = await db.getDoctors();
    const directory = doctors.map(d => ({
      id: d.id,
      name: d.name,
      title: d.title,
      department: d.department,
      email: d.email || `${d.id}@hospital.care`,
      passcode: d.passcode || 'admin@hospital',
      avatar: d.avatar,
      room: d.room
    }));
    res.json(directory);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ================= STATS & CORE METRICS ================= //

// GET /api/stats (Supports personalized queries: ?doctorId=doc-1 or ?patientEmail=...)
app.get('/api/stats', async (req, res) => {
  try {
    const { doctorId, patientEmail } = req.query;
    const stats = await db.getStats({ doctorId, patientEmail });
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/departments
app.get('/api/departments', async (req, res) => {
  try {
    const departments = await db.getDepartments();
    res.json(departments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/doctors
app.get('/api/doctors', async (req, res) => {
  try {
    const doctors = await db.getDoctors();
    res.json(doctors);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/doctors/:id
app.get('/api/doctors/:id', async (req, res) => {
  try {
    const doctor = await db.getDoctorById(req.params.id);
    if (!doctor) return res.status(404).json({ error: 'Doctor not found' });
    res.json(doctor);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/doctors
app.post('/api/doctors', async (req, res) => {
  try {
    const { name, department, title, consultationFee } = req.body;
    if (!name || !department) {
      return res.status(400).json({ error: 'Name and department are required' });
    }
    const newDoc = await db.addDoctor(req.body);
    res.status(201).json(newDoc);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/appointments
app.get('/api/appointments', async (req, res) => {
  try {
    const { doctorId, patientEmail, status, date } = req.query;
    const appointments = await db.getAppointments({ doctorId, patientEmail, status, date });
    res.json(appointments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/appointments/:id
app.get('/api/appointments/:id', async (req, res) => {
  try {
    const appointment = await db.getAppointmentById(req.params.id);
    if (!appointment) return res.status(404).json({ error: 'Appointment not found' });
    res.json(appointment);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/appointments (Client booking)
app.post('/api/appointments', async (req, res) => {
  try {
    const { patientName, patientEmail, patientPhone, doctorId, preferredDate, preferredTime } = req.body;
    if (!patientName || !patientEmail || !patientPhone || !doctorId || !preferredDate || !preferredTime) {
      return res.status(400).json({
        error: 'Missing required booking fields (patientName, patientEmail, patientPhone, doctorId, preferredDate, preferredTime)'
      });
    }

    const doctor = await db.getDoctorById(doctorId);
    const bookingPayload = {
      ...req.body,
      doctorName: doctor ? doctor.name : (req.body.doctorName || 'Assigned Specialist'),
      department: doctor ? doctor.department : (req.body.department || 'General')
    };

    const appointment = await db.createAppointment(bookingPayload);
    res.status(201).json(appointment);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PATCH /api/appointments/:id/status (Doctor approve, reject, reschedule, complete)
app.patch('/api/appointments/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, scheduledDate, scheduledTime, room, doctorNotes, prescription } = req.body;

    if (!['pending', 'approved', 'rejected', 'rescheduled', 'completed', 'cancelled'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status code' });
    }

    const updates = { status };
    if (scheduledDate !== undefined) updates.scheduledDate = scheduledDate;
    if (scheduledTime !== undefined) updates.scheduledTime = scheduledTime;
    if (room !== undefined) updates.room = room;
    if (doctorNotes !== undefined) updates.doctorNotes = doctorNotes;
    if (prescription !== undefined) updates.prescription = prescription;

    const updated = await db.updateAppointment(id, updates);
    if (!updated) return res.status(404).json({ error: 'Appointment not found' });

    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PATCH /api/appointments/:id/reschedule (Doctor reschedule with date & time)
app.patch('/api/appointments/:id/reschedule', async (req, res) => {
  try {
    const { id } = req.params;
    const { scheduledDate, scheduledTime, doctorNotes } = req.body;

    if (!scheduledDate || !scheduledTime) {
      return res.status(400).json({ error: 'scheduledDate and scheduledTime are required' });
    }

    const updates = {
      status: 'rescheduled',
      scheduledDate,
      scheduledTime,
      doctorNotes: doctorNotes || 'Appointment rescheduled by doctor.'
    };

    const updated = await db.updateAppointment(id, updates);
    if (!updated) return res.status(404).json({ error: 'Appointment not found' });

    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PATCH /api/appointments/:id/notes (Doctor prescription/clinical note)
app.patch('/api/appointments/:id/notes', async (req, res) => {
  try {
    const { id } = req.params;
    const { doctorNotes, prescription } = req.body;

    const updates = {};
    if (doctorNotes !== undefined) updates.doctorNotes = doctorNotes;
    if (prescription !== undefined) updates.prescription = prescription;

    const updated = await db.updateAppointment(id, updates);
    if (!updated) return res.status(404).json({ error: 'Appointment not found' });

    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/appointments/:id
app.delete('/api/appointments/:id', async (req, res) => {
  try {
    const result = await db.deleteAppointment(req.params.id);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/seed (Reset/re-seed default sample data)
app.post('/api/seed', async (req, res) => {
  try {
    const result = await db.seedData();
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Start Express Server if run directly (CLI / PM2 / nodemon)
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🏥 Hospital Management Server running on port ${PORT}`);
    console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
    console.log(`👥 Doctors API: http://localhost:${PORT}/api/doctors`);
    console.log(`📅 Appointments API: http://localhost:${PORT}/api/appointments`);
  });
}

module.exports = app;
