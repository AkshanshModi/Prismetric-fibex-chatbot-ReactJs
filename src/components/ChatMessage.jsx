import React from 'react';
import { motion } from 'framer-motion';

const ChatMessage = ({ message }) => {
  const isBot = message.sender === 'bot';
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`flex ${isBot ? 'justify-start' : 'justify-end'}`}
    >
      <div className={`max-w-xs lg:max-w-md px-3 py-2 rounded-2xl ${
        isBot 
          ? 'bg-gray-100 text-gray-800 rounded-bl-sm' 
          : 'bg-blue-600 text-white rounded-br-sm'
      }`}>
        <p className="text-sm leading-relaxed">{message.text}</p>
        <p className={`text-xs mt-1 ${
          isBot ? 'text-gray-500' : 'text-blue-100'
        }`}>
          {message.timestamp.toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit' 
          })}
        </p>
      </div>
    </motion.div>
  );
};

export default ChatMessage;