import React from 'react';

const ChatMessage = ({ message: { text, isUser, files = [] } }) => {
  return (
    <div className={`chat-message ${isUser ? 'user-message' : 'ai-message'}`}>
      <div className="message-content">
        {text && <p>{text}</p>}
        {files.length > 0 && (
          <div className="file-attachments">
            {files.map((file, index) => (
              <div key={index} className="file-attachment">
                <div className="file-info">
                  <span className="file-icon">📎</span>
                  <span className="file-name">{file.name}</span>
                </div>
                <div className="file-meta">
                  {(file.size / 1024).toFixed(1)} KB • {file.type}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatMessage;
