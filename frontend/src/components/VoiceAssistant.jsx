import React, { useState } from 'react';

export default function VoiceAssistant({ onTranscriptionComplete }) {
  const [isListening, setIsListening] = useState(false);
  const [voiceText, setVoiceText] = useState('');

  const handleToggleListen = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert("Voice recognition is simulated in this browser session. (Web Speech API supported in Chrome/Edge).");
      const simulatedText = "Sewer pipeline leakage and garbage overflow near Shastri Nagar Sector 4.";
      setVoiceText(simulatedText);
      if (onTranscriptionComplete) onTranscriptionComplete(simulatedText);
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = 'hi-IN'; // Hindi / English support
    recognition.interimResults = false;

    if (!isListening) {
      setIsListening(true);
      recognition.start();

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setVoiceText(transcript);
        setIsListening(false);
        if (onTranscriptionComplete) onTranscriptionComplete(transcript);
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };
    } else {
      setIsListening(false);
    }
  };

  return (
    <div className="card border-0 bg-primary-soft rounded-4 p-3 mb-3 text-start">
      <div className="d-flex align-items-center justify-content-between">
        <div className="d-flex align-items-center gap-2">
          <button
            type="button"
            onClick={handleToggleListen}
            className={`btn rounded-circle p-0 d-flex align-items-center justify-content-center ${isListening ? 'btn-danger animate-pulse' : 'btn-primary'}`}
            style={{ width: '42px', height: '42px' }}
            title="Dictate Complaint in Hindi / English"
          >
            <i className={`bi ${isListening ? 'bi-mic-fill' : 'bi-mic'} fs-5`}></i>
          </button>
          <div>
            <strong className="d-block small text-secondary">AI Voice Dictation (बोलकर शिकायत दर्ज करें)</strong>
            <span className="text-muted text-xxs">Click microphone to speak in Hindi or English</span>
          </div>
        </div>
        {isListening && <span className="badge bg-danger rounded-pill animate-pulse px-2 py-1">Listening...</span>}
      </div>

      {voiceText && (
        <div className="mt-2.5 p-2 bg-white rounded-3 border small text-secondary">
          <strong className="text-primary text-xxs d-block">Transcribed Text:</strong>
          "{voiceText}"
        </div>
      )}
    </div>
  );
}
