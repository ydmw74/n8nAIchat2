# n8n AI Chat

A web application for communicating with n8n webhooks that can process text messages and files.

## Features

- Send text messages to n8n webhooks
- Upload and transmit multiple files
- Automatic capture of file information:
  - Filename
  - File size (in kB)
  - File type
  - MIME type
  - File extension
- Count of transmitted files ("filecount" parameter)
- Real-time status indicators for message transmission
- Display of webhook responses in the chat interface

## Webhook Parameters

The following parameters are transmitted to the webhook with each message:

- `sessionId`: Unique ID for each message
- `action`: Type of action (e.g., "sendMessage")
- `message`: The message text
- `filecount`: Number of transmitted files (0 if no files are attached)
- `files`: Array with detailed information about all transmitted files

### File Information

The following information is transmitted for each file:
- `fileName`: Name of the file
- `fileSize`: Size of the file in kB
- `fileType`: Basic file type
- `mimeType`: Complete MIME type
- `fileExtension`: File extension
- `binaryKey`: Key for accessing the binary data

## Technical Details

- Developed with React
- Uses Axios for HTTP requests
- Supports multipart/form-data for file transfers
- Error handling and status indicators for better user guidance
