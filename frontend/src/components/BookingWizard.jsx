import React, { useState, useEffect } from 'react';
import { 
  User, Calendar, Clock, Stethoscope, CheckCircle, 
  ArrowRight, ArrowLeft, Star, MapPin, IndianRupee, 
  FileText, ShieldCheck, Printer, Copy, Check, LogIn, CheckCircle2
} from 'lucide-react';
import { apiUrl } from '../services/api';

export default function BookingWizard({ doctors, departments, currentUser, onOpenAuthWindow, onBookingComplete, onTrackReference }) {
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedDept, setSelectedDept] = useState('All');
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  
  // Tomorrow as min date
  const tomorrowStr = new Date(Date.now() + 86400000).toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState(tomorrowStr);
  const [selectedSlot, setSelectedSlot] = useState('');
  
  const [patientForm, setPatientForm] = useState(() => ({
    name: currentUser?.name || '',
    email: currentUser?.email || '',
    phone: currentUser?.phone || '',
    age: '',
    gender: 'Female',
    reason: ''
  }));

  useEffect(() => {
    if (currentUser) {
      setPatientForm(prev => ({
        ...prev,
        name: prev.name || currentUser.name || '',
        email: prev.email || currentUser.email || '',
        phone: prev.phone || currentUser.phone || ''
      }));
    }
  }, [currentUser]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [confirmedBooking, setConfirmedBooking] = useState(null);
  const [copied, setCopied] = useState(false);

  // Filtered doctors
  const filteredDoctors = selectedDept === 'All' 
    ? doctors 
    : doctors.filter(d => d.department.toLowerCase() === selectedDept.toLowerCase());

  // Handle Form Change
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setPatientForm(prev => ({ ...prev, [name]: value }));
  };

  // Step 1 Validation
  const handleNextStep1 = () => {
    if (!currentUser) {
      if (onOpenAuthWindow) onOpenAuthWindow('signin');
      setError('Patient Sign In Required: Please sign in or create an account before scheduling your appointment.');
      return;
    }
    if (!selectedDoctor) {
      setError('Please select a doctor to proceed.');
      return;
    }
    setError('');
    // auto select first slot if not chosen
    if (!selectedSlot && selectedDoctor.slots && selectedDoctor.slots.length > 0) {
      setSelectedSlot(selectedDoctor.slots[0]);
    }
    setCurrentStep(2);
  };

  // Step 2 Validation
  const handleNextStep2 = () => {
    if (!selectedDate) {
      setError('Please pick an appointment date.');
      return;
    }
    if (!selectedSlot) {
      setError('Please choose a preferred time slot.');
      return;
    }
    setError('');
    setCurrentStep(3);
  };

  // Step 3 Submission
  const handleSubmitBooking = async (e) => {
    e.preventDefault();
    if (!currentUser) {
      if (onOpenAuthWindow) onOpenAuthWindow('signin');
      setError('You must be signed in as a patient to confirm and book this appointment.');
      return;
    }
    if (!patientForm.name || !patientForm.email || !patientForm.phone || !patientForm.reason) {
      setError('Please fill in all required patient details.');
      return;
    }
    setError('');
    setLoading(true);

    try {
      const payload = {
        patientName: patientForm.name,
        patientEmail: patientForm.email,
        patientPhone: patientForm.phone,
        patientAge: patientForm.age ? parseInt(patientForm.age) : null,
        patientGender: patientForm.gender,
        doctorId: selectedDoctor.id,
        doctorName: selectedDoctor.name,
        department: selectedDoctor.department,
        reason: patientForm.reason,
        preferredDate: selectedDate,
        preferredTime: selectedSlot
      };

      const res = await fetch(apiUrl('/api/appointments'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to submit appointment');
      }

      const appointment = await res.json();
      setConfirmedBooking(appointment);
      setCurrentStep(4);
      if (onBookingComplete) onBookingComplete(appointment);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyId = () => {
    if (confirmedBooking?.id) {
      navigator.clipboard.writeText(confirmedBooking.id);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleReset = () => {
    setCurrentStep(1);
    setSelectedDoctor(null);
    setSelectedSlot('');
    setPatientForm({
      name: '',
      email: '',
      phone: '',
      age: '',
      gender: 'Female',
      reason: ''
    });
    setConfirmedBooking(null);
  };

  return (
    <div className="booking-card" id="booking-section">
      {/* Stepper Header */}
      <div className="stepper-header">
        <div className={`step-item ${currentStep === 1 ? 'active' : ''} ${currentStep > 1 ? 'completed' : ''}`}>
          <div className="step-circle">
            {currentStep > 1 ? <Check size={18} /> : 1}
          </div>
          <span className="step-label">Select Specialist</span>
        </div>

        <div className={`step-item ${currentStep === 2 ? 'active' : ''} ${currentStep > 2 ? 'completed' : ''}`}>
          <div className="step-circle">
            {currentStep > 2 ? <Check size={18} /> : 2}
          </div>
          <span className="step-label">Date & Time</span>
        </div>

        <div className={`step-item ${currentStep === 3 ? 'active' : ''} ${currentStep > 3 ? 'completed' : ''}`}>
          <div className="step-circle">
            {currentStep > 3 ? <Check size={18} /> : 3}
          </div>
          <span className="step-label">Patient Details</span>
        </div>

        <div className={`step-item ${currentStep === 4 ? 'active' : ''}`}>
          <div className="step-circle">
            {currentStep === 4 ? <CheckCircle size={18} /> : 4}
          </div>
          <span className="step-label">Confirmation Pass</span>
        </div>
      </div>

      {/* Patient Authentication Status Banner */}
      {!currentUser ? (
        <div style={{
          background: 'linear-gradient(135deg, #eff6ff 0%, #f0fdf4 100%)',
          border: '2px dashed #0284c7',
          borderRadius: '16px',
          padding: '22px 20px',
          marginBottom: '24px',
          textAlign: 'center'
        }}>
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: '50%',
            background: '#0284c7',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 10px',
            boxShadow: '0 4px 12px rgba(2, 132, 199, 0.3)'
          }}>
            <ShieldCheck size={24} />
          </div>
          <h4 style={{ fontSize: '1.15rem', fontWeight: 800, margin: '0 0 4px', color: '#0f172a' }}>
            Patient Sign In or Registration Required
          </h4>
          <p style={{ color: '#475569', fontSize: '0.85rem', maxWidth: '520px', margin: '0 auto 14px', lineHeight: 1.5 }}>
            To ensure your appointment records, real-time doctor approval, and prescriptions are securely stored in your personal profile, please sign in or register before booking.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => onOpenAuthWindow && onOpenAuthWindow('signin')}
              className="btn btn-primary"
              style={{ padding: '9px 18px', fontSize: '0.85rem' }}
            >
              <LogIn size={15} />
              <span>Sign In as Patient (New Window)</span>
            </button>
            <button
              type="button"
              onClick={() => onOpenAuthWindow && onOpenAuthWindow('signup')}
              className="btn btn-secondary"
              style={{ padding: '9px 18px', fontSize: '0.85rem', borderColor: '#0284c7', color: '#0284c7' }}
            >
              <User size={15} />
              <span>Create Patient Account</span>
            </button>
          </div>
          <div style={{ marginTop: '10px', fontSize: '0.74rem', color: '#64748b' }}>
            ⚡ <em>Opens in a separate secure window. Once you sign in, this booking wizard will automatically unlock!</em>
          </div>
        </div>
      ) : (
        <div style={{
          background: '#f0fdf4',
          border: '1px solid #bbf7d0',
          borderRadius: '12px',
          padding: '10px 16px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '10px',
          fontSize: '0.85rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#166534' }}>
            <CheckCircle2 size={16} color="#16a34a" />
            <span>
              Booking as: <strong>{currentUser.name}</strong> ({currentUser.email})
            </span>
          </div>
          <span style={{ fontSize: '0.75rem', color: '#059669', fontWeight: 600 }}>
            Linked to your Patient History Profile
          </span>
        </div>
      )}

      {error && (
        <div style={{
          backgroundColor: '#fee2e2',
          border: '1px solid #f87171',
          color: '#991b1b',
          padding: '12px 16px',
          borderRadius: '12px',
          fontSize: '0.85rem',
          marginBottom: '20px'
        }}>
          {error}
        </div>
      )}

      {/* STEP 1: DOCTOR & SPECIALTY SELECTION */}
      {currentStep === 1 && (
        <div>
          <div style={{ marginBottom: '16px' }}>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '4px' }}>Choose Specialty & Doctor</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              Select a specialized clinical department and choose your preferred physician.
            </p>
          </div>

          {/* Department Filter Pills */}
          <div className="filter-pills" style={{ marginBottom: '16px' }}>
            <button
              className={`filter-pill ${selectedDept === 'All' ? 'active' : ''}`}
              onClick={() => setSelectedDept('All')}
            >
              All Specialties ({doctors.length})
            </button>
            {departments.map(dep => (
              <button
                key={dep.id}
                className={`filter-pill ${selectedDept === dep.name ? 'active' : ''}`}
                onClick={() => setSelectedDept(dep.name)}
              >
                {dep.name}
              </button>
            ))}
          </div>

          {/* Doctor Cards Grid */}
          <div className="doctor-select-grid">
            {filteredDoctors.map(doc => {
              const isSelected = selectedDoctor?.id === doc.id;
              return (
                <div
                  key={doc.id}
                  className={`doc-choice-card ${isSelected ? 'selected' : ''}`}
                  onClick={() => setSelectedDoctor(doc)}
                >
                  <div className="doc-choice-header">
                    <img 
                      src={doc.avatar} 
                      alt={doc.name} 
                      className="doc-choice-avatar"
                      onError={(e) => {
                        e.target.src = 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&q=80&w=400';
                      }}
                    />
                    <div className="doc-choice-info">
                      <h4>{doc.name}</h4>
                      <span>{doc.department}</span>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                        {doc.degree}
                      </div>
                    </div>
                  </div>

                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '8px 0', lineHeight: '1.4' }}>
                    {doc.bio}
                  </p>

                  <div className="doc-choice-meta">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#b45309', fontWeight: 600 }}>
                      <Star size={14} fill="#f59e0b" color="#f59e0b" />
                      <span>{doc.rating}</span>
                      <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>({doc.reviewsCount})</span>
                    </div>

                    <div style={{ fontWeight: 700, color: 'var(--secondary)' }}>
                      ₹{doc.consultationFee} <span style={{ fontSize: '0.75rem', fontWeight: 400, color: 'var(--text-muted)' }}>/ consult</span>
                    </div>
                  </div>

                  {isSelected && (
                    <div style={{
                      marginTop: '10px',
                      padding: '4px 8px',
                      background: 'var(--primary)',
                      color: '#ffffff',
                      borderRadius: '6px',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      textAlign: 'center'
                    }}>
                      ✓ Selected Specialist
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '24px' }}>
            <button className="btn btn-primary" onClick={handleNextStep1}>
              <span>Continue to Schedule</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: DATE & TIME SELECTION */}
      {currentStep === 2 && selectedDoctor && (
        <div>
          <div style={{ marginBottom: '20px' }}>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '4px' }}>Select Preferred Date & Time</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              Booking with <strong style={{ color: 'var(--secondary)' }}>{selectedDoctor.name}</strong> ({selectedDoctor.department})
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
            <div>
              <label className="form-label">
                <Calendar size={15} />
                <span>Select Appointment Date</span>
              </label>
              <input
                type="date"
                className="form-input"
                min={tomorrowStr}
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
              />
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '6px' }}>
                Available Days: {selectedDoctor.availableDays.join(', ')}
              </div>

              <div style={{ marginTop: '20px', padding: '16px', background: '#f8fafc', borderRadius: '12px', border: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <MapPin size={16} color="var(--primary)" />
                  <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Location: {selectedDoctor.room}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <IndianRupee size={16} color="var(--emerald)" />
                  <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Consultation Fee: ₹{selectedDoctor.consultationFee}</span>
                </div>
              </div>
            </div>

            <div>
              <label className="form-label">
                <Clock size={15} />
                <span>Available Consultation Slots</span>
              </label>
              <div className="slots-grid">
                {selectedDoctor.slots.map(slot => (
                  <button
                    key={slot}
                    type="button"
                    className={`slot-btn ${selectedSlot === slot ? 'selected' : ''}`}
                    onClick={() => setSelectedSlot(slot)}
                  >
                    {slot}
                  </button>
                ))}
              </div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '12px' }}>
                * Appointments are confirmed upon doctor review. You will receive an instant notification if rescheduled.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '30px' }}>
            <button className="btn btn-secondary" onClick={() => setCurrentStep(1)}>
              <ArrowLeft size={16} />
              <span>Back</span>
            </button>
            <button className="btn btn-primary" onClick={handleNextStep2}>
              <span>Enter Patient Information</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: PATIENT INFORMATION */}
      {currentStep === 3 && (
        <form onSubmit={handleSubmitBooking}>
          <div style={{ marginBottom: '20px' }}>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '4px' }}>Patient Details & Consultation Reason</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              Please provide accurate information for patient registration and medical profiling.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">Patient Full Name *</label>
              <input
                type="text"
                name="name"
                className="form-input"
                placeholder="e.g. John Doe"
                required
                value={patientForm.name}
                onChange={handleInputChange}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Email Address *</label>
              <input
                type="email"
                name="email"
                className="form-input"
                placeholder="e.g. john@example.com"
                required
                value={patientForm.email}
                onChange={handleInputChange}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Contact Phone *</label>
              <input
                type="tel"
                name="phone"
                className="form-input"
                placeholder="+1 (555) 000-0000"
                required
                value={patientForm.phone}
                onChange={handleInputChange}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Age</label>
              <input
                type="number"
                name="age"
                className="form-input"
                placeholder="e.g. 34"
                min="1"
                max="120"
                value={patientForm.age}
                onChange={handleInputChange}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Gender</label>
              <select
                name="gender"
                className="form-select"
                value={patientForm.gender}
                onChange={handleInputChange}
              >
                <option value="Female">Female</option>
                <option value="Male">Male</option>
                <option value="Non-Binary">Non-Binary</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Symptoms / Chief Health Complaint *</label>
            <textarea
              name="reason"
              className="form-textarea"
              placeholder="Describe your symptoms, previous treatments, or reason for this consultation..."
              required
              value={patientForm.reason}
              onChange={handleInputChange}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '24px' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setCurrentStep(2)}>
              <ArrowLeft size={16} />
              <span>Back</span>
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Submitting Appointment...' : 'Confirm & Book Appointment'}
              <CheckCircle size={16} />
            </button>
          </div>
        </form>
      )}

      {/* STEP 4: DIGITAL BOOKING PASS / CONFIRMATION */}
      {currentStep === 4 && confirmedBooking && (
        <div>
          <div style={{ textAlign: 'center', marginBottom: '20px' }}>
            <div style={{
              width: '60px',
              height: '60px',
              background: 'var(--emerald-light)',
              color: 'var(--emerald)',
              borderRadius: '50%',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '12px'
            }}>
              <CheckCircle size={36} />
            </div>
            <h3 style={{ fontSize: '1.5rem', color: 'var(--secondary)' }}>Appointment Successfully Booked!</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              Your appointment request has been routed to the doctor's review queue.
            </p>
          </div>

          {/* Digital Pass Card */}
          <div className="digital-pass">
            <div className="digital-pass-header">
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                  Booking Reference Number
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                  <span className="pass-id-badge">{confirmedBooking.id}</span>
                  <button 
                    className="btn btn-secondary btn-sm"
                    onClick={handleCopyId}
                    title="Copy Appointment ID"
                  >
                    {copied ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
                    <span>{copied ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </div>

              <div>
                <span className="badge badge-pending">
                  {confirmedBooking.status} review
                </span>
              </div>
            </div>

            <div className="pass-grid">
              <div className="pass-field">
                <label>Patient Name</label>
                <span>{confirmedBooking.patientName}</span>
              </div>
              <div className="pass-field">
                <label>Specialist Doctor</label>
                <span>{confirmedBooking.doctorName}</span>
              </div>
              <div className="pass-field">
                <label>Department</label>
                <span>{confirmedBooking.department}</span>
              </div>
              <div className="pass-field">
                <label>Preferred Date & Time</label>
                <span>{confirmedBooking.preferredDate} at {confirmedBooking.preferredTime}</span>
              </div>
              <div className="pass-field">
                <label>Patient Contact</label>
                <span>{confirmedBooking.patientPhone}</span>
              </div>
              <div className="pass-field">
                <label>Clinical Status</label>
                <span style={{ color: '#d97706' }}>Awaiting Doctor Schedule Approval</span>
              </div>
            </div>

            <div style={{
              background: '#f8fafc',
              padding: '12px 16px',
              borderRadius: '8px',
              fontSize: '0.8rem',
              color: 'var(--text-muted)'
            }}>
              <strong>Health Symptoms:</strong> {confirmedBooking.reason}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '14px', flexWrap: 'wrap', marginTop: '20px' }}>
            <button 
              className="btn btn-primary"
              onClick={() => onTrackReference && onTrackReference(confirmedBooking.id)}
            >
              <Clock size={16} />
              <span>Track Live Status</span>
            </button>
            <button 
              className="btn btn-secondary"
              onClick={() => window.print()}
            >
              <Printer size={16} />
              <span>Print Appointment Pass</span>
            </button>
            <button 
              className="btn btn-secondary"
              onClick={handleReset}
            >
              <span>Book Another Appointment</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
