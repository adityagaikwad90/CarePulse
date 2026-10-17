import React from 'react';
import { 
  HeartPulse, Activity, ShieldCheck, Ambulance, 
  FlaskConical, Pill, Clock, PhoneCall 
} from 'lucide-react';

export default function HospitalServices() {
  const services = [
    {
      icon: <Ambulance size={28} color="#ef4444" />,
      title: '24/7 Emergency & Trauma',
      desc: 'Rapid emergency response team equipped with life-support ambulances and critical care surgeons.'
    },
    {
      icon: <Activity size={28} color="#0284c7" />,
      title: 'Advanced ICU & Critical Care',
      desc: 'State-of-the-art intensive care units with non-invasive monitoring and dedicated specialists.'
    },
    {
      icon: <FlaskConical size={28} color="#10b981" />,
      title: 'Diagnostic Pathology & Imaging',
      desc: 'High-precision 3T MRI, 128-slice CT scans, digital ultrasound, and accredited automated pathology.'
    },
    {
      icon: <Pill size={28} color="#8b5cf6" />,
      title: 'Digital In-House Pharmacy',
      desc: 'Fully stocked round-the-clock hospital pharmacy with digital prescription dispensing and home delivery.'
    }
  ];

  return (
    <div style={{ marginTop: '30px', marginBottom: '50px' }}>
      <div style={{ textAlign: 'center', maxWidth: '640px', margin: '0 auto 32px' }}>
        <h3 style={{ fontSize: '1.6rem', marginBottom: '8px' }}>Comprehensive Hospital Facilities</h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
          Delivering advanced multidisciplinary medical care with cutting-edge technology and patient-first protocols.
        </p>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
        gap: '20px'
      }}>
        {services.map((s, idx) => (
          <div key={idx} className="glass-card" style={{ padding: '24px' }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '14px',
              background: '#f8fafc',
              border: '1px solid var(--border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '16px'
            }}>
              {s.icon}
            </div>
            <h4 style={{ fontSize: '1.1rem', marginBottom: '8px' }}>{s.title}</h4>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', lineHeight: '1.5' }}>
              {s.desc}
            </p>
          </div>
        ))}
      </div>

      {/* Emergency helpline banner */}
      <div style={{
        marginTop: '28px',
        background: 'linear-gradient(135deg, #fee2e2 0%, #fef2f2 100%)',
        border: '1px solid #fecaca',
        borderRadius: '16px',
        padding: '20px 28px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: '50%',
            background: '#ef4444',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <PhoneCall size={22} />
          </div>
          <div>
            <h4 style={{ color: '#991b1b', fontSize: '1.05rem', marginBottom: '2px' }}>
              Immediate Medical Emergency Hotline
            </h4>
            <p style={{ color: '#b91c1c', fontSize: '0.85rem' }}>
              24-Hour Trauma Response Unit: <strong>+1 (800) 424-CARE / 911</strong>
            </p>
          </div>
        </div>

        <span className="badge badge-rejected" style={{ fontSize: '0.8rem', padding: '6px 14px' }}>
          Trauma Beds Available: 14 Free
        </span>
      </div>
    </div>
  );
}
