import React, { useState } from "react";
import ChatbotWidget from "../components/ChatWidget";

const ChatbotPage = () => {
    const [appointments, setAppointments] = useState([]);

    const handleAppointmentCreated = (appointmentData) => {
        setAppointments((prev) => [appointmentData, ...prev]);
    };

    return (
        <div className="min-h-screen bg-white flex items-center justify-center">
            {/* Chatbot always open in standalone mode */}
            <div className="w-full max-w-md h-[600px]">
                <ChatbotWidget
                    onAppointmentCreated={handleAppointmentCreated}
                    isOpen={true}          // Always open
                    setIsOpen={() => { }}   // No close in standalone
                />
            </div>
        </div>
    );
};

export default ChatbotPage;
