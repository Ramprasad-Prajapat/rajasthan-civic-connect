import React, { useState } from 'react';

export default function CivicChatbot({ setActivePage }) {
  const [isOpen, setIsOpen] = useState(false);
  const [language, setLanguage] = useState('en'); // 'en' | 'hi'
  const [messages, setMessages] = useState([
    {
      sender: 'bot',
      text: 'Namaste! 🙏 I am your RajCivic AI Assistant. How can I help you today?',
      textHi: 'नमस्ते! 🙏 मैं आपका राजसिभिक एआई सहायक हूँ। आज मैं आपकी क्या सहायता कर सकता हूँ?'
    }
  ]);
  const [input, setInput] = useState('');

  const quickPrompts = [
    { en: '📝 Lodge New Complaint', hi: '📝 शिकायत दर्ज करें', action: () => setActivePage('Complaint') },
    { en: '🔍 Track Complaint Status', hi: '🔍 स्थिति ट्रैक करें', action: () => setActivePage('Track Complaint') },
    { en: '📞 Emergency SOS Dispatches', hi: '📞 आपातकालीन सहायता', action: () => setActivePage('Emergency') },
  ];

  const handleSend = (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userText = input;
    const newMessages = [...messages, { sender: 'user', text: userText }];
    setMessages(newMessages);
    setInput('');

    // AI Chatbot Response Logic
    setTimeout(() => {
      let botReplyEn = "I can help you lodge a complaint or track an existing grievance. Please select an option above or type your complaint ID (e.g. RJCIVIC-JOD-9921).";
      let botReplyHi = "मैं शिकायत दर्ज करने या मौजूदा शिकायत को ट्रैक करने में आपकी मदद कर सकता हूँ। कृपया ऊपर एक विकल्प चुनें या अपनी शिकायत आईडी टाइप करें।";

      const lower = userText.toLowerCase();
      if (lower.includes('rjcivic') || lower.includes('track') || lower.includes('status')) {
        botReplyEn = "To track a complaint, navigate to 'Track Complaint' tab and enter your Complaint Reference ID to view live SLA timeline.";
        botReplyHi = "शिकायत ट्रैक करने के लिए, 'Track Complaint' टैब पर जाएँ और अपनी लाइव SLA समय-सीमा देखने के लिए अपनी संदर्भ आईडी दर्ज करें।";
      } else if (lower.includes('garbage') || lower.includes('water') || lower.includes('light') || lower.includes('road')) {
        botReplyEn = "I can auto-classify this grievance and assign it to your municipal department. Click 'Lodge Complaint' to begin.";
        botReplyHi = "मैं इस शिकायत को स्वचालित रूप से वर्गीकृत कर सकता हूँ। शुरू करने के लिए 'शिकायत दर्ज करें' पर क्लिक करें।";
      }

      setMessages(prev => [...prev, { sender: 'bot', text: botReplyEn, textHi: botReplyHi }]);
    }, 600);
  };

  return (
    <div style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 1050 }}>
      {/* Floating Toggle Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="btn btn-primary rounded-circle shadow-lg d-flex align-items-center justify-content-center p-0"
          style={{ width: '60px', height: '60px', background: 'linear-gradient(135deg, #10b981 0%, #0f4c81 100%)', border: 'none' }}
          title="Open AI Civic Assistant"
        >
          <i className="bi bi-robot fs-2 text-white"></i>
        </button>
      )}

      {/* Chatbot Popup Window */}
      {isOpen && (
        <div className="card border-0 shadow-lg rounded-4 overflow-hidden" style={{ width: '350px', maxHeight: '520px', display: 'flex', flexDirection: 'column' }}>
          {/* Header */}
          <div className="p-3 text-white d-flex align-items-center justify-content-between" style={{ background: 'linear-gradient(135deg, #0f4c81 0%, #0f172a 100%)' }}>
            <div className="d-flex align-items-center gap-2">
              <i className="bi bi-robot fs-4 text-warning"></i>
              <div>
                <strong className="d-block small" style={{ fontSize: '0.9rem' }}>RajCivic AI Assistant</strong>
                <span className="badge bg-success-soft text-success text-xxs" style={{ fontSize: '0.65rem' }}>● Online</span>
              </div>
            </div>
            <div className="d-flex align-items-center gap-2">
              <button
                onClick={() => setLanguage(l => l === 'en' ? 'hi' : 'en')}
                className="btn btn-sm btn-outline-light py-0 px-2 rounded-pill"
                style={{ fontSize: '0.7rem' }}
              >
                {language === 'en' ? 'हिंदी' : 'English'}
              </button>
              <button onClick={() => setIsOpen(false)} className="btn-close btn-close-white small"></button>
            </div>
          </div>

          {/* Messages Area */}
          <div className="p-3 bg-light flex-grow-1 overflow-y-auto" style={{ height: '300px' }}>
            {messages.map((m, i) => (
              <div key={i} className={`d-flex mb-2 ${m.sender === 'user' ? 'justify-content-end' : 'justify-content-start'}`}>
                <div className={`p-2.5 rounded-3 max-w-85 small ${m.sender === 'user' ? 'bg-primary text-white' : 'bg-white border text-secondary'}`} style={{ fontSize: '0.8rem' }}>
                  {language === 'hi' && m.textHi ? m.textHi : m.text}
                </div>
              </div>
            ))}
          </div>

          {/* Quick Shortcuts */}
          <div className="p-2 bg-white border-top border-bottom d-flex gap-1 overflow-x-auto">
            {quickPrompts.map((p, idx) => (
              <button
                key={idx}
                onClick={() => { p.action(); setIsOpen(false); }}
                className="btn btn-xs btn-outline-secondary rounded-pill text-nowrap"
                style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem' }}
              >
                {language === 'hi' ? p.hi : p.en}
              </button>
            ))}
          </div>

          {/* Input Bar */}
          <form onSubmit={handleSend} className="p-2 bg-white d-flex gap-2">
            <input
              type="text"
              className="form-control form-control-sm rounded-pill px-3"
              placeholder={language === 'hi' ? 'प्रश्न पूछें...' : 'Type your question...'}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              style={{ fontSize: '0.8rem' }}
            />
            <button type="submit" className="btn btn-primary btn-sm rounded-circle p-2 d-flex align-items-center justify-content-center" style={{ width: '34px', height: '34px' }}>
              <i className="bi bi-send-fill text-white" style={{ fontSize: '0.75rem' }}></i>
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
