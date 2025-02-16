import React, { useState } from 'react';
import axios from 'axios';
import ChatInput from './components/ChatInput';
import ChatWindow from './components/ChatWindow';
import config from './config';
import './App.css';

const App = () => {
  const [messages, setMessages] = useState([]);

  const handleSendMessage = async (message, files) => {
    // Create message object
    const messageObj = {
      text: message,
      isUser: true,
      files: files.map(file => ({
        name: file.name,
        type: file.type,
        size: file.size
      }))
    };

    // Add user message to the chat
    setMessages((prevMessages) => [...prevMessages, messageObj]);

    try {
      // Create FormData for the request
      const formData = new FormData();
      formData.append('message', message);
      // Append all files with the same field name to allow multiple files
      files.forEach(file => {
        formData.append('files', file);
      });

      // Send message to n8n webhook
      const response = await axios.post(
        config.webhookUrl,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      // Add response message to the chat
      setMessages((prevMessages) => [
        ...prevMessages,
        { text: response.data.reply, isUser: false },
      ]);
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages((prevMessages) => [
        ...prevMessages,
        { text: 'Sorry, there was an error processing your message.', isUser: false },
      ]);
    }
  };

  return (
    <div className="app">
      <div className="chat-container">
        <h1>n8n AI Chat</h1>
        <ChatWindow messages={messages} />
        <ChatInput onSendMessage={handleSendMessage} />
      </div>
    </div>
  );
};

export default App;
