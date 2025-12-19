import React, { useState } from 'react';
import ChatbotWidget from './components/ChatbotWidget';
import AppointmentList from './components/AppointmentList';
import { LanguageProvider } from './contexts/LanguageContext';

const App = () => {
  const [appointments, setAppointments] = useState([]);
  const [chatOpen, setChatOpen] = useState(false); // Lifted chat open state

  const handleAppointmentCreated = (appointmentData) => {
    setAppointments(prev => [appointmentData, ...prev]);
  };

  return (
    <LanguageProvider>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="container mx-auto px-4 py-8">
          {/* Optional: External button to open chatbot */}
          {/* <button
            onClick={() => setChatOpen(true)}
            className="mb-4 bg-[#13486b] text-white px-4 py-2 rounded-lg hover:bg-[#2b5893] transition-colors"
          >
            Open Chatbot
          </button> */}

          <AppointmentList appointments={appointments} />
        </div>
        <ChatbotWidget onAppointmentCreated={handleAppointmentCreated}></ChatbotWidget>

        {/* <ChatbotWidget
          onAppointmentCreated={handleAppointmentCreated}
          isOpen={chatOpen}
          setIsOpen={setChatOpen}
        /> */}
      </div>
    </LanguageProvider>
  );
};

export default App;
