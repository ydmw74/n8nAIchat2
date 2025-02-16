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
      let requestData;
      let headers = {};

      if (files.length > 0) {
        // If there are files, use FormData
        const formData = new FormData();
        
        // Add message data
        const messageData = {
          sessionId: "29d327b0582d4ff9add47c8e50f3c1f2",
          action: "sendMessage",
          chatInput: message
        };
        formData.append('message', JSON.stringify(messageData));
        
        // Append files
        files.forEach(file => {
          formData.append('files', file);
        });

        requestData = formData;
        headers = {
          'Content-Type': 'multipart/form-data'
        };
      } else {
        // If no files, send JSON directly
        requestData = {
          sessionId: "29d327b0582d4ff9add47c8e50f3c1f2",
          action: "sendMessage",
          chatInput: message
        };
        headers = {
          'Content-Type': 'application/json'
        };
      }

      // Send message to n8n webhook
      const response = await axios.post(
        config.webhookUrl,
        requestData,
        { headers }
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
