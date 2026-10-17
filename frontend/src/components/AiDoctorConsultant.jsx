import React, { useState, useRef, useEffect } from 'react';
import { 
  Bot, Sparkles, Send, Stethoscope, AlertTriangle, 
  ArrowRight, HeartPulse, Key, CheckCircle, RefreshCw, 
  ShieldAlert, User, HelpCircle, PhoneCall, ChevronRight
} from 'lucide-react';

export default function AiDoctorConsultant({ onSelectSpecialtyForBooking, departments }) {
  const [apiKey, setApiKey] = useState(() => {
    return (import.meta.env.VITE_GEMINI_API_KEY || localStorage.getItem('carepulse_gemini_key') || '').trim();
  });
  const [isEditingKey, setIsEditingKey] = useState(false);
  const [tempKey, setTempKey] = useState('');

  const [inputPrompt, setInputPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      role: 'assistant',
      text: `Hello! I am **CarePulse AI Medical Assistant**, powered by Google Gemini. \n\nI can help you understand your symptoms, advise on immediate self-care precautions, guide you on what questions to ask your physician, and recommend the right hospital department or specialist for your consultation. \n\n*How are you feeling today? Describe any symptoms or questions you have below.*`,
      recommendedDept: null
    }
  ]);

  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const sampleQueries = [
    { text: 'Frequent chest tightness & breathlessness during mild walking', dept: 'Cardiology' },
    { text: 'Severe throbbing migraine with flashing lights and nausea', dept: 'Neurology' },
    { text: 'Sharp knee pain and stiffness after sports activity', dept: 'Orthopedics' },
    { text: 'Red itchy rash and hives spreading on arms', dept: 'Dermatology' },
    { text: 'Child running high fever with throat irritation', dept: 'Pediatrics' },
    { text: 'Persistent fatigue, morning dizziness, and loss of appetite', dept: 'General Medicine' }
  ];

  // Save custom key
  const handleSaveKey = (e) => {
    e.preventDefault();
    const trimmed = tempKey.trim();
    if (trimmed) {
      localStorage.setItem('carepulse_gemini_key', trimmed);
      setApiKey(trimmed);
      setIsEditingKey(false);
    }
  };

  // Helper to extract recommended department from text
  const detectDepartment = (text) => {
    const lower = text.toLowerCase();
    if (lower.includes('cardio') || lower.includes('heart') || lower.includes('blood pressure')) return 'Cardiology';
    if (lower.includes('neuro') || lower.includes('brain') || lower.includes('migraine') || lower.includes('headache')) return 'Neurology';
    if (lower.includes('pediatric') || lower.includes('child') || lower.includes('baby') || lower.includes('infant')) return 'Pediatrics';
    if (lower.includes('ortho') || lower.includes('bone') || lower.includes('joint') || lower.includes('knee') || lower.includes('fracture')) return 'Orthopedics';
    if (lower.includes('derma') || lower.includes('skin') || lower.includes('rash') || lower.includes('eczema')) return 'Dermatology';
    if (lower.includes('eye') || lower.includes('ophthalm') || lower.includes('vision') || lower.includes('cataract')) return 'Ophthalmology';
    if (lower.includes('cancer') || lower.includes('oncol') || lower.includes('tumor')) return 'Oncology';
    if (lower.includes('gyn') || lower.includes('pregnan') || lower.includes('women health')) return 'Gynecology';
    return 'General Medicine';
  };

  // Call Gemini API
  const handleSendMessage = async (queryText = inputPrompt) => {
    const query = queryText.trim();
    if (!query || loading) return;

    setInputPrompt('');
    const userMsgId = Date.now();
    const newMessages = [...messages, { id: userMsgId, role: 'user', text: query }];
    setMessages(newMessages);
    setLoading(true);

    const activeKey = apiKey || import.meta.env.VITE_GEMINI_API_KEY;

    if (!activeKey) {
      // Smart Fallback Guidance if user has not entered an API key yet
      setTimeout(() => {
        const detected = detectDepartment(query);
        setMessages(prev => [
          ...prev,
          {
            id: Date.now() + 1,
            role: 'assistant',
            text: `### 🩺 Preliminary Clinical Assessment:\nBased on your description: *"${query}"*:\n\n` +
              `1. **Recommended Department**: We suggest consulting our **${detected}** department for evaluation.\n` +
              `2. **Immediate Precautions**: Rest in a comfortable position, stay hydrated, avoid strenuous physical activities, and monitor your vitals.\n` +
              `3. **Key Questions for the Doctor**:\n` +
              `   - How long have you been experiencing these symptoms?\n` +
              `   - Are there specific triggers or times when it worsens?\n` +
              `   - Any family history or current medications?\n\n` +
              `*💡 Note: To enable live real-time Gemini AI guidance, please configure your \`VITE_GEMINI_API_KEY\` in \`frontend/.env\` or enter your API key using the button above.*`,
            recommendedDept: detected
          }
        ]);
        setLoading(false);
      }, 700);
      return;
    }

    try {
      const systemInstruction = 
        `You are CarePulse AI Medical Assistant, a professional, empathetic clinical triage assistant for CarePulse Hospital. ` +
        `Provide helpful, structured preliminary health guidance for the patient's symptoms. ` +
        `Always include:\n` +
        `1. A brief empathetic overview of their symptoms.\n` +
        `2. Recommended Hospital Department: Explicitly state one of: Cardiology, Neurology, Pediatrics, Orthopedics, Dermatology, General Medicine, Ophthalmology, Oncology, or Gynecology.\n` +
        `3. Immediate self-care or safety precautions to take while waiting.\n` +
        `4. Important questions to ask their doctor during their appointment.\n` +
        `5. A clear medical disclaimer that this is informational AI triage and does not replace emergency care or in-person physician diagnosis.\n` +
        `Use clean markdown with bullet points and bold headers.`;

      const candidateModels = [
        'gemini-2.5-flash',
        'gemini-flash-latest',
        'gemini-2.5-flash-lite',
        'gemini-2.5-pro'
      ];
      
      const payload = {
        contents: [
          {
            role: 'user',
            parts: [{ text: `${systemInstruction}\n\nPatient Inquiry: ${query}` }]
          }
        ],
        generationConfig: {
          temperature: 0.4,
          maxOutputTokens: 800
        }
      };

      let aiReply = null;
      let lastApiError = null;

      for (const model of candidateModels) {
        try {
          const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${activeKey}`;
          const res = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });

          if (res.ok) {
            const data = await res.json();
            const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
            if (text) {
              aiReply = text;
              break;
            }
          } else {
            const errData = await res.json().catch(() => ({}));
            lastApiError = errData?.error?.message || `Model ${model} returned HTTP ${res.status}`;
          }
        } catch (err) {
          lastApiError = err.message;
        }
      }

      if (!aiReply) {
        throw new Error(lastApiError || 'Unable to generate response from Gemini models.');
      }

      const recommended = detectDepartment(aiReply + ' ' + query);

      setMessages(prev => [
        ...prev,
        {
          id: Date.now() + 1,
          role: 'assistant',
          text: aiReply,
          recommendedDept: recommended
        }
      ]);
    } catch (err) {
      console.error('Gemini API call failed:', err);
      const fallbackDept = detectDepartment(query);
      setMessages(prev => [
        ...prev,
        {
          id: Date.now() + 1,
          role: 'assistant',
          text: `⚠️ **API Notice:** Could not connect to Gemini API (${err.message}).\n\n` +
            `Based on your symptoms, we recommend consulting our **${fallbackDept}** specialist. You can book an appointment directly using the button below.`,
          recommendedDept: fallbackDept
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ marginTop: '24px', marginBottom: '60px' }}>
      {/* Header Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #0369a1 0%, #0f172a 100%)',
        color: '#ffffff',
        borderRadius: '20px',
        padding: '32px 28px',
        marginBottom: '24px',
        boxShadow: '0 10px 25px -5px rgba(2, 132, 199, 0.25)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '20px'
      }}>
        <div style={{ maxWidth: '640px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', backgroundColor: 'rgba(255,255,255,0.15)', padding: '4px 12px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 600, marginBottom: '12px' }}>
            <Sparkles size={14} color="#38bdf8" />
            <span>Google Gemini AI Medical Triage</span>
          </div>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 800, margin: '0 0 8px', letterSpacing: '-0.02em', color: '#ffffff' }}>
            Ask CarePulse AI Doctor
          </h2>
          <p style={{ margin: 0, color: '#e0f2fe', fontSize: '0.95rem', lineHeight: '1.5' }}>
            Describe your symptoms or health queries in natural language. Our AI will analyze your condition, recommend the right medical specialty, and guide you directly to the appropriate specialist consultation.
          </p>
        </div>

        {/* Gemini API Key config status */}
        <div style={{
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          borderRadius: '14px',
          padding: '14px 18px',
          textAlign: 'right'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px', fontSize: '0.8rem', marginBottom: '6px' }}>
            <Key size={14} color={apiKey ? '#4ade80' : '#fbbf24'} />
            <span style={{ fontWeight: 600 }}>
              {apiKey ? 'Gemini API Configured' : 'Using Intelligent Fallback'}
            </span>
          </div>
          <button
            onClick={() => setIsEditingKey(!isEditingKey)}
            style={{
              background: 'rgba(255, 255, 255, 0.2)',
              border: 'none',
              color: '#ffffff',
              padding: '6px 12px',
              borderRadius: '8px',
              fontSize: '0.75rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            {isEditingKey ? 'Close Key Settings' : (apiKey ? 'Change API Key' : 'Add Gemini API Key')}
          </button>
        </div>
      </div>

      {/* API Key Modal / Expandable Form */}
      {isEditingKey && (
        <div style={{
          background: '#f8fafc',
          border: '1.5px solid #cbd5e1',
          borderRadius: '14px',
          padding: '20px 24px',
          marginBottom: '24px'
        }}>
          <h4 style={{ margin: '0 0 6px', fontSize: '1rem', color: '#0f172a' }}>Google Gemini API Key Setup</h4>
          <p style={{ margin: '0 0 14px', fontSize: '0.85rem', color: '#64748b' }}>
            Enter your Google Gemini API key below, or configure <code>VITE_GEMINI_API_KEY</code> in <code>frontend/.env</code>.
          </p>
          <form onSubmit={handleSaveKey} style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <input
              type="password"
              className="form-input"
              placeholder="AIzaSy..."
              value={tempKey}
              onChange={(e) => setTempKey(e.target.value)}
              style={{ flex: 1, minWidth: '240px', padding: '10px 14px' }}
            />
            <button type="submit" className="btn btn-primary" style={{ padding: '10px 18px' }}>
              Save API Key
            </button>
            {apiKey && (
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  localStorage.removeItem('carepulse_gemini_key');
                  setApiKey('');
                  setIsEditingKey(false);
                }}
              >
                Clear Key
              </button>
            )}
          </form>
        </div>
      )}

      {/* Emergency Warning */}
      <div style={{
        background: '#fff1f2',
        border: '1px solid #fecdd3',
        borderRadius: '12px',
        padding: '12px 18px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
        marginBottom: '20px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#9f1239', fontSize: '0.85rem' }}>
          <ShieldAlert size={18} style={{ flexShrink: 0 }} />
          <span>
            <strong>Emergency Advisory:</strong> If you are experiencing chest pain, difficulty breathing, or severe trauma, call our 24/7 Emergency Line immediately: <strong>+1 (800) 424-CARE</strong>.
          </span>
        </div>
      </div>

      {/* Suggested Quick Prompt Pills */}
      <div style={{ marginBottom: '16px' }}>
        <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '8px' }}>
          Suggested Symptom Queries (Click to Ask):
        </span>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {sampleQueries.map((q, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(q.text)}
              style={{
                backgroundColor: '#ffffff',
                border: '1px solid #e2e8f0',
                padding: '6px 14px',
                borderRadius: '20px',
                fontSize: '0.78rem',
                color: '#334155',
                cursor: 'pointer',
                transition: 'all 0.2s',
                fontWeight: 500
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--primary)';
                e.currentTarget.style.color = 'var(--primary)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#e2e8f0';
                e.currentTarget.style.color = '#334155';
              }}
            >
              {q.text}
            </button>
          ))}
        </div>
      </div>

      {/* Chat Container */}
      <div style={{
        backgroundColor: '#ffffff',
        border: '1px solid var(--border)',
        borderRadius: '18px',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        minHeight: '480px'
      }}>
        {/* Messages List */}
        <div style={{ flex: 1, padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {messages.map((m) => {
            const isUser = m.role === 'user';
            return (
              <div
                key={m.id}
                style={{
                  display: 'flex',
                  gap: '12px',
                  alignSelf: isUser ? 'flex-end' : 'flex-start',
                  maxWidth: '85%'
                }}
              >
                {!isUser && (
                  <div style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '10px',
                    background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <Stethoscope size={20} />
                  </div>
                )}

                <div style={{
                  backgroundColor: isUser ? '#0284c7' : '#f8fafc',
                  color: isUser ? '#ffffff' : '#1e293b',
                  padding: '16px 20px',
                  borderRadius: isUser ? '16px 16px 2px 16px' : '16px 16px 16px 2px',
                  border: isUser ? 'none' : '1px solid #e2e8f0',
                  fontSize: '0.9rem',
                  lineHeight: '1.6'
                }}>
                  {/* Message body with simple markdown formatting */}
                  <div style={{ whiteSpace: 'pre-wrap' }}>
                    {m.text}
                  </div>

                  {/* Recommendation Action Button */}
                  {!isUser && m.recommendedDept && (
                    <div style={{
                      marginTop: '16px',
                      paddingTop: '12px',
                      borderTop: '1px dashed #cbd5e1',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '10px'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#0369a1', fontWeight: 700, fontSize: '0.85rem' }}>
                        <HeartPulse size={16} />
                        <span>Recommended Specialty: {m.recommendedDept}</span>
                      </div>

                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => {
                          if (onSelectSpecialtyForBooking) {
                            onSelectSpecialtyForBooking(m.recommendedDept);
                          }
                        }}
                        style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem' }}
                      >
                        <span>Book with {m.recommendedDept} Specialist</span>
                        <ArrowRight size={14} />
                      </button>
                    </div>
                  )}
                </div>

                {isUser && (
                  <div style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '10px',
                    background: '#e2e8f0',
                    color: '#475569',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <User size={20} />
                  </div>
                )}
              </div>
            );
          })}

          {loading && (
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', color: '#64748b', fontSize: '0.85rem' }}>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Bot size={20} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <RefreshCw size={16} className="spin" />
                <span>CarePulse AI Doctor is evaluating your clinical symptoms...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Query Input Bar */}
        <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }} style={{
          padding: '16px 20px',
          borderTop: '1px solid #e2e8f0',
          background: '#ffffff',
          display: 'flex',
          gap: '12px',
          alignItems: 'center'
        }}>
          <input
            type="text"
            className="form-input"
            placeholder="Type your symptoms or health query here (e.g. persistent headache and fever for 2 days)..."
            value={inputPrompt}
            onChange={(e) => setInputPrompt(e.target.value)}
            disabled={loading}
            style={{
              flex: 1,
              padding: '14px 18px',
              borderRadius: '12px',
              border: '1.5px solid #cbd5e1',
              fontSize: '0.95rem'
            }}
          />
          <button
            type="submit"
            disabled={!inputPrompt.trim() || loading}
            className="btn btn-primary"
            style={{
              padding: '14px 24px',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontWeight: 700
            }}
          >
            <Send size={18} />
            <span>Consult AI</span>
          </button>
        </form>
      </div>
    </div>
  );
}
