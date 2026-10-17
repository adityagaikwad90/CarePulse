const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

// Load environment variables if not already loaded
try {
  require('dotenv').config();
  // Also load from backend/.env if cwd is root
  require('dotenv').config({ path: path.join(__dirname, '.env') });
} catch (_) {}

let credential = null;
let initSource = 'none';

// 1. Try FIREBASE_SERVICE_ACCOUNT_KEY (full JSON string or Base64 string from env)
if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
  try {
    let raw = process.env.FIREBASE_SERVICE_ACCOUNT_KEY.trim();
    // Support single quotes or extra wrapping
    if ((raw.startsWith("'") && raw.endsWith("'")) || (raw.startsWith('"') && raw.endsWith('"'))) {
      raw = raw.slice(1, -1);
    }
    if (!raw.startsWith('{')) {
      try {
        raw = Buffer.from(raw, 'base64').toString('utf8');
      } catch (_) {}
    }
    const parsed = JSON.parse(raw);
    credential = admin.credential.cert(parsed);
    initSource = 'env_service_account_json';
  } catch (err) {
    console.error('❌ Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY from environment:', err.message);
  }
}

// 2. Try individual environment variables
if (!credential && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
  try {
    let privateKey = process.env.FIREBASE_PRIVATE_KEY;
    // Handle escaped newlines from env strings
    if (privateKey.includes('\\n')) {
      privateKey = privateKey.replace(/\\n/g, '\n');
    }
    // Remove surrounding quotes if present
    if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
      privateKey = privateKey.slice(1, -1).replace(/\\n/g, '\n');
    }

    credential = admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID || 'hospital-managment-ed068',
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: privateKey
    });
    initSource = 'env_individual_keys';
  } catch (err) {
    console.error('❌ Failed to parse individual Firebase environment credentials:', err.message);
  }
}

// 3. Fallback to local serviceAccountKey.json file if present on disk
if (!credential) {
  const localKeyPath = path.join(__dirname, 'serviceAccountKey.json');
  if (fs.existsSync(localKeyPath)) {
    try {
      const serviceAccount = require(localKeyPath);
      credential = admin.credential.cert(serviceAccount);
      initSource = 'local_file_serviceAccountKey';
    } catch (err) {
      console.warn('⚠️ Could not load local serviceAccountKey.json:', err.message);
    }
  }
}

// Initialize Firebase Admin App
if (!admin.apps.length) {
  if (credential) {
    try {
      admin.initializeApp({ credential });
      console.log(`🔥 Firebase Admin SDK initialized successfully (source: ${initSource})`);
    } catch (initErr) {
      console.error('❌ Firebase Admin initializeApp error:', initErr.message);
    }
  } else {
    console.warn('⚠️ No Firebase credentials detected in environment variables or serviceAccountKey.json.');
    console.warn('ℹ️ Running in fallback mode. Local and in-memory persistence will be used.');
  }
}

let db = null;
try {
  if (admin.apps.length) {
    db = admin.firestore();
  }
} catch (dbErr) {
  console.warn('⚠️ Firestore initialization notice:', dbErr.message);
}

module.exports = { admin, db };
