import React, { useState, useRef, useEffect } from "react";
import { MessageCircle, Send, X, Bot, User, Sparkles } from "lucide-react";

export default function ChatbotWidget({ onAppointmentCreated }) {
    const [isOpen, setIsOpen] = useState(false);
    const [sessionId, setSessionId] = useState('');
    const [confirmation, setConfirmation] = useState(false);
    const [messages, setMessages] = useState([
        { role: "bot", text: "Hi! I'm your scheduling assistant. How can I help you today? ✨", isHtml: false }
    ]);
    const [input, setInput] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef(null);

    // Auto scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const sendMessage = async () => {
        if (!input.trim()) return;
        const userMsg = { role: "user", text: input, isHtml: false };
        setMessages((prev) => [...prev, userMsg]);
        setInput("");
        setIsTyping(true);

        try {
            // Call your FastAPI backend
            const res = await fetch("http://192.168.0.54:8000/chatbot/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ message: input, session_id: sessionId })
            });

            const data = await res.json();



            // Simulate typing delay for better UX
            setTimeout(() => {

                const botMsg = {
                    role: "bot",
                    text: data.response || "Something went wrong.",
                    isHtml: true // Mark as HTML content
                };
                setSessionId(data.session_id || '');
                setMessages((prev) => [...prev, botMsg]);
                setIsTyping(false);

                if (data.intent === 'confirmation' && data.appointment_data) {
                    onAppointmentCreated(data.appointment_data);
                    setConfirmation(true);
                }
            }, 1000);

        } catch (err) {
            setTimeout(() => {
                setMessages((prev) => [...prev, {
                    role: "bot",
                    text: "⚠️ Sorry, I'm having trouble connecting. Please try again.",
                    isHtml: false
                }]);
                setIsTyping(false);
            }, 1000);
        }
    };

    const TypingIndicator = () => (
        <div className="flex items-center space-x-2 p-3 bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl max-w-xs animate-pulse">
            <div className="w-8 h-8 bg-[#13486b] rounded-full flex items-center justify-center">
                <Bot size={16} className="text-white" />
            </div>
            <div className="flex space-x-1">
                <div
                    className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: "0ms" }}
                ></div>
                <div
                    className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: "150ms" }}
                ></div>
                <div
                    className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: "300ms" }}
                ></div>
            </div>
        </div>
    );

    const startNewConversation = () => {
        setMessages([{ role: "bot", text: "Hi! I'm your scheduling assistant. How can I help you today? ✨", isHtml: false }]);
        setSessionId('');
        setInput('');
        setConfirmation(false);
    };

    return (
        <div>
            {/* Floating Button */}
            {!isOpen && (
                <div className="fixed bottom-4 right-4 z-50">
                    <button
                        onClick={() => setIsOpen(true)}
                        className="fixed bottom-6 right-6 bg-[#13486b] text-white p-4 rounded-full shadow-2xl hover:shadow-3xl transform hover:scale-110 transition-all duration-300 group relative overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-full"></div>
                        <div className="relative z-10 flex items-center justify-center">
                            <MessageCircle size={28} className="group-hover:rotate-12 transition-transform duration-300" />
                            <Sparkles size={16} className="absolute -top-1 -right-1 text-yellow-300 animate-pulse" />
                        </div>
                        <div className="absolute inset-0 rounded-full bg-blue-400 animate-ping opacity-30"></div>
                    </button>
                </div>
            )}

            {/* Chat Window */}
            {isOpen && (
                <div
                    className="fixed bottom-6 right-6 w-96 bg-white rounded-3xl shadow-2xl flex flex-col backdrop-blur-lg border border-gray-100 transform transition-all duration-300"
                    style={{ maxHeight: '600px' }}
                >
                    {/* Header */}
                    <div className="bg-[#13486b] text-white p-4 flex justify-between items-center rounded-t-3xl relative overflow-hidden">
                        <div className="absolute inset-0 opacity-10 pointer-events-none">
                            <div className="absolute top-0 left-0 w-20 h-20 bg-white rounded-full -translate-x-10 -translate-y-10"></div>
                            <div className="absolute bottom-0 right-0 w-16 h-16 bg-white rounded-full translate-x-8 translate-y-8"></div>
                        </div>

                        <div className="flex items-center space-x-3 relative z-10">
                            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
                                <Bot size={24} className="text-[#13486b]" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-lg">Assistant</h3>
                                <p className="text-xs text-blue-100">Always here to help ✨</p>
                            </div>
                        </div>

                        <div className="flex items-center space-x-2 relative z-10">
                            <button
                                onClick={startNewConversation}
                                className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors duration-200"
                            >
                                <MessageCircle size={18} />
                            </button>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors duration-200"
                            >
                                <X size={18} />
                            </button>
                        </div>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-gray-50/50 to-white" style={{ maxHeight: '400px' }}>
                        {messages.map((msg, idx) => (
                            <div
                                key={idx}
                                className={`flex items-start space-x-3 ${msg.role === "user" ? "flex-row-reverse space-x-reverse" : ""}`}
                            >
                                <div
                                    className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role === "user" ? "bg-[#13486b]" : "bg-[#13486b]"
                                        }`}
                                >
                                    {msg.role === "user" ? (
                                        <User size={16} className="text-white" />
                                    ) : (
                                        <Bot size={16} className="text-white" />
                                    )}
                                </div>

                                <div className={`p-3 rounded-2xl max-w-xs shadow-sm ${msg.role === "user"
                                    ? "bg-[#13486b] text-white rounded-br-md"
                                    : "bg-white border border-gray-100 text-gray-800 rounded-bl-md"
                                    }`}>
                                    {msg.isHtml && msg.role === "bot" ? (
                                        <div
                                            className="text-sm leading-relaxed chatbot-html-content"
                                            dangerouslySetInnerHTML={{ __html: msg.text }}
                                        />
                                    ) : (
                                        <p className="text-sm leading-relaxed">{msg.text}</p>
                                    )}
                                </div>
                            </div>
                        ))}

                        {isTyping && (
                            <div className="flex items-start space-x-3">
                                <TypingIndicator />
                            </div>
                        )}

                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input */}
                    <div className="p-4 border-t border-gray-100 bg-white rounded-b-3xl">
                        {!confirmation ? (
                            <div className="flex items-center space-x-3 bg-gray-50 rounded-2xl p-2">
                                <input
                                    type="text"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                                    placeholder="Type your message..."
                                    className="flex-1 bg-transparent outline-none text-sm text-gray-700 px-2"
                                />
                                <button
                                    onClick={sendMessage}
                                    disabled={!input.trim()}
                                    className="bg-[#13486b] text-white p-2 rounded-xl disabled:opacity-50 hover:bg-[#2b5893] transition-colors"
                                >
                                    <Send size={16} />
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={startNewConversation}
                                className="w-full bg-[#13486b] text-white p-2 rounded-xl hover:bg-[#2b5893] transition-all"
                            >
                                Start New Conversation
                            </button>
                        )}
                    </div>


                </div>
            )}
        </div>
    );
}