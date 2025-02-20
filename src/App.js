import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ChatInput from './components/ChatInput.js';
import ChatWindow from './components/ChatWindow.js';
import Login from './components/Login.js';
import Register from './components/Register.js';
import config from './config.js';
import './App.css';

const App = () => {
  const [messages, setMessages] = useState([]);
  const [status, setStatus] = useState({ type: null, message: null });
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showLogin, setShowLogin] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [username, setUsername] = useState('');

  const generateSessionId = (message) => {
    return `${Date.now()}-${message.substring(0, 100)}`;
  };

  const setStatusMessage = (type, message) => {
    setStatus({ type, message });
    if (type === 'complete' || type === 'error') {
      setTimeout(() => setStatus({ type: null, message: null }), 3000);
    }
  };

  const handleLogin = async (username, password, isAdmin) => {
    setIsLoggedIn(true);
    setIsAdmin(isAdmin);
    setUsername(username);
    setStatusMessage('complete', 'Logged in successfully');
  };

  const handleRegister = async (username, password) => {
    try {
      const response = await axios.post('http://localhost:3001/register', {
        username,
        password
      });

      if (response.status === 201) {
        setIsLoggedIn(true);
        setUsername(username);
        setStatusMessage('complete', 'Registered successfully');
        setShowLogin(true);
      } else {
        setStatusMessage('error', response.data.message || 'Registration failed');
      }
    } catch (error) {
      setStatusMessage('error', error.response?.data?.message || 'Registration failed');
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setIsAdmin(false);
    setUsername('');
    setStatusMessage('complete', 'Logged out successfully');
  };

  const handleSendMessage = async (message, files) => {
    // Create message object
    const messageObj = {
      text: message,
      isUser: true,
      files: files.map(file => ({
        name: file.name,
        type: file.type,
        size: file.size,
      })),
    };

    // Add user message to the chat
    setMessages((prevMessages) => [...prevMessages, messageObj]);

    try {
      // Create FormData for the request
      const formData = new FormData();

      setStatusMessage('progress', 'Sending message...');
      
      // Add the main message structure as a JSON string
      const messageData = {
        sessionId: generateSessionId(message),
        action: "sendMessage",
        [config.inputField]: message,
        filecount: files.length,
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

      if (response.status === 200) {
        setStatusMessage('complete', 'Message sent successfully');
        
        // Log the raw response for debugging
        console.log('Raw response:', response.data);
        console.log('Response type:', typeof response.data);
        
        // Parse the response if it's a string
        let parsedData = response.data;
        if (typeof response.data === 'string') {
          try {
            parsedData = JSON.parse(response.data);
          } catch (e) {
            console.error('Failed to parse response:', e);
            throw new Error('Failed to parse response as JSON');
          }
        }

        console.log('Parsed data:', parsedData);

        // Handle both array and single object responses
        const responseArray = Array.isArray(parsedData) ? parsedData : [parsedData];
        
        if (!responseArray[0] || typeof responseArray[0].text !== 'string') {
          console.error('Invalid response structure:', responseArray);
          throw new Error('Response does not contain text field');
        }

        const responseText = responseArray[0].text;
        setMessages((prevMessages) => [
          ...prevMessages,
          { text: responseText, isUser: false },
        ]);
      } else {
        throw new Error(`Server responded with status: ${response.status}`);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setStatusMessage('error', `Error: ${error.message}`);
      setMessages((prevMessages) => [
        ...prevMessages,
        { text: `Error: ${error.response?.data?.message || error.message}`, isUser: false },
      ]);
    }
  };

  return (
    <div className="app">
      <h1>n8n AI Chat</h1>
      {status.type && (
        <div className={`status-message ${status.type}`}>
          {status.message}
        </div>
      )}
      {!isLoggedIn ? (
        <>
          {showLogin ? (
            <Login onLogin={handleLogin} />
          ) : (
            <Register onRegister={handleRegister} />
          )}
          <button onClick={() => setShowLogin(!showLogin)}>
            {showLogin ? 'Register' : 'Login'}
          </button>
        </>
      ) : (
        <>
          <p>
            Logged in as {username} (
            {isAdmin ? 'Admin' : 'User'})
          </p>
          <button onClick={handleLogout}>Logout</button>
        </>
      )}
      {isLoggedIn && (
        <div className="chat-container">
          <div className="chat-area">
            <ChatWindow messages={messages} />
            <ChatInput onSendMessage={handleSendMessage} />
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
