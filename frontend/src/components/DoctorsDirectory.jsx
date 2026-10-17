import React, { useState } from 'react';
import { Star, MapPin, Calendar, Clock, DollarSign, Award, ArrowRight } from 'lucide-react';

export default function DoctorsDirectory({ doctors, departments, onSelectDoctor }) {
  const [activeDept, setActiveDept] = useState('All');

  const filtered = activeDept === 'All'
    ? doctors
    : doctors.filter(d => d.department.toLowerCase() === activeDept.toLowerCase());

  return (
    <div style={{ marginTop: '20px', marginBottom: '40px' }}>
      <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h3 style={{ fontSize: '1.4rem', marginBottom: '4px' }}>Meet Our Medical Specialists</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Internationally trained doctors, surgeons, and healthcare consultants.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="filter-pills">
          <button
            className={`filter-pill ${activeDept === 'All' ? 'active' : ''}`}
            onClick={() => setActiveDept('All')}
          >
            All Specialties
          </button>
          {departments.map(d => (
            <button
              key={d.id}
              className={`filter-pill ${activeDept === d.name ? 'active' : ''}`}
              onClick={() => setActiveDept(d.name)}
            >
              {d.name}
            </button>
          ))}
        </div>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
        gap: '20px'
      }}>
        {filtered.map(doc => (
          <div key={doc.id} className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginBottom: '14px' }}>
                <img
                  src={doc.avatar}
                  alt={doc.name}
                  style={{
                    width: '68px',
                    height: '68px',
                    borderRadius: '50%',
                    objectFit: 'cover',
                    border: '3px solid #e0f2fe'
                  }}
                  onError={(e) => {
                    e.target.src = 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&q=80&w=400';
                  }}
                />
                <div>
                  <h4 style={{ fontSize: '1.1rem', marginBottom: '2px' }}>{doc.name}</h4>
                  <span style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 700 }}>
                    {doc.title}
                  </span>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    {doc.degree}
                  </div>
                </div>
              </div>

              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '16px', lineHeight: '1.5' }}>
                {doc.bio}
              </p>

              <div style={{
                background: '#f8fafc',
                borderRadius: '10px',
                padding: '12px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                fontSize: '0.8rem',
                marginBottom: '16px',
                border: '1px solid var(--border)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)' }}>
                  <Award size={14} color="var(--primary)" />
                  <span><strong>Experience:</strong> {doc.experienceYears} Years Clinical Practice</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)' }}>
                  <MapPin size={14} color="var(--primary)" />
                  <span><strong>Location:</strong> {doc.room}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)' }}>
                  <Calendar size={14} color="var(--primary)" />
                  <span><strong>Clinic Days:</strong> {doc.availableDays.join(', ')}</span>
                </div>
              </div>
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderTop: '1px solid var(--border)',
              paddingTop: '14px',
              marginTop: '4px'
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#b45309', fontWeight: 700, fontSize: '0.9rem' }}>
                  <Star size={15} fill="#f59e0b" color="#f59e0b" />
                  <span>{doc.rating}</span>
                  <span style={{ color: 'var(--text-muted)', fontWeight: 400, fontSize: '0.75rem' }}>({doc.reviewsCount} reviews)</span>
                </div>
                <div style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--secondary)', marginTop: '2px' }}>
                  ₹{doc.consultationFee} <span style={{ fontSize: '0.75rem', fontWeight: 400, color: 'var(--text-muted)' }}>/ consult</span>
                </div>
              </div>

              <button
                className="btn btn-primary btn-sm"
                onClick={() => onSelectDoctor && onSelectDoctor(doc)}
              >
                <span>Book Slot</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
