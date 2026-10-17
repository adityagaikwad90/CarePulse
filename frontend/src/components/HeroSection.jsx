import React from 'react';
import { Calendar, Search, Shield, Award, Users, Clock, Sparkles } from 'lucide-react';

export default function HeroSection({ onBookClick, onTrackClick, onAiConsultClick, stats }) {
  return (
    <div className="hero-banner">
      <div className="hero-content">
        <div className="hero-badge">
          <Shield size={14} />
          <span>NABH & JCI Accredited Hospital</span>
        </div>

        <h2 className="hero-title">
          Compassionate Care, <span>Seamless Appointments</span>
        </h2>

        <p className="hero-subtitle">
          Connect with top-tier board-certified specialists. Book your consultation in minutes,
          receive verified doctor approval, real-time schedule updates, and digital health records.
        </p>

        <div className="hero-ctas">
          <button className="btn btn-primary btn-lg" onClick={onBookClick}>
            <Calendar size={18} />
            <span>Book Doctor Consultation</span>
          </button>
          <button 
            className="btn btn-lg" 
            onClick={onAiConsultClick}
            style={{ 
              background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)', 
              color: '#ffffff',
              border: 'none',
              boxShadow: '0 4px 14px rgba(2, 132, 199, 0.35)' 
            }}
          >
            <Sparkles size={18} color="#38bdf8" />
            <span>Ask AI Doctor</span>
          </button>
          <button className="btn btn-secondary btn-lg" onClick={onTrackClick}>
            <Search size={18} />
            <span>Check Appointment Status</span>
          </button>
        </div>

        <div className="hero-stats">
          <div className="hero-stat-item">
            <h3>{stats?.totalDoctors || 6}+</h3>
            <p>Expert Doctors</p>
          </div>
          <div className="hero-stat-item">
            <h3>{stats?.totalDepartments || 9}</h3>
            <p>Specialized Wings</p>
          </div>
          <div className="hero-stat-item">
            <h3>{stats?.totalAppointments || 0}</h3>
            <p>Appointments Handled</p>
          </div>
          <div className="hero-stat-item">
            <h3>&lt; 15m</h3>
            <p>Avg. Doctor Response</p>
          </div>
        </div>
      </div>
    </div>
  );
}
