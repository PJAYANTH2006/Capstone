# Real-Time Collaborative Whiteboard

A full-stack real-time collaborative whiteboard application built with the MERN stack and Socket.io.

## Features

- **User Authentication**: Secure Register, Login, and Logout using JWT.
- **Room Management**: Create or join rooms using unique Room IDs.
- **Real-Time Drawing**: Synchronized canvas with Pencil and Eraser tools.
- **Styling**: Color picker and brush size selection.
- **Collaborative Chat**: Real-time chat within the whiteboard room.
- **User Presence**: Real-time indicator of users online in the room.
- **Responsive Design**: Modern dark UI built with TailwindCSS and Framer Motion.

## Tech Stack

- **Frontend**: React, Vite, Socket.io-client, TailwindCSS, Lucide-react.
- **Backend**: Node.js, Express, MongoDB, Socket.io, JWT, bcryptjs.
- **Persistence**: MongoDB for room and session data.

## Setup Instructions

### Prerequisites

- Node.js installed
- MongoDB running locally (default: `mongodb://localhost:27017/whiteboard_db`)

### Backend Setup

1. Navigate to the `backend` directory.
2. Install dependencies: `npm install`
3. The `.env` file should contain:
   ```env
   PORT=5000
   MONGO_URI=mongodb://localhost:27017/whiteboard_db
   JWT_SECRET=your_jwt_secret
   ```
4. Start the server: `node server.js`

### Frontend Setup

1. Navigate to the `frontend` directory.
2. Install dependencies: `npm install`
3. Start the development server: `npm run dev`

### How to Use

1. Register or Login to your account.
2. On the Dashboard, create a new room or enter an existing Room ID.
3. Share the Room ID with others to collaborate in real-time.
4. Use the sidebar tools to draw, change colors, or clear the board. Use the chat panel on the right to communicate.
