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

      // Add the main message structure as a JSON string
      const messageData = {
        sessionId: "29d327b0582d4ff9add47c8e50f3c1f2",
        action: "sendMessage",
        chatInput: message,
        files: files.map((file, index) => ({
          fileName: file.name,
          fileSize: `${(file.size / 1024).toFixed(1)} kB`,
          fileType: file.type.split('/')[0],
          mimeType: file.type,
          fileExtension: file.name.split('.').pop(),
          binaryKey: `data${index}`
        }))
      };

      // Add the JSON message data directly
      Object.entries(messageData).forEach(([key, value]) => {
        formData.append(key, typeof value === 'string' ? value : JSON.stringify(value));
      });
      
      // Add the actual files
      files.forEach((file, index) => {
        formData.append(`data${index}`, file);
      });

      const headers = {
        'Content-Type': 'multipart/form-data'
      };

      const requestData = formData;

      // Send message to n8n webhook
      const response = await axios.post(
        config.webhookUrl,
        requestData,
        { headers }
      );

      // Add response message to the chat
      const responseText = response.data[0]?.text || 'No response received';
      setMessages((prevMessages) => [
        ...prevMessages,
        { text: responseText, isUser: false },
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
