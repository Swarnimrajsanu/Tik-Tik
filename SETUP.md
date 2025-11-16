# Tik-Tik Setup Guide

This is a collaborative coding platform with real-time collaboration, AI code generation, and in-browser code execution.

## Prerequisites

- Node.js (v18 or higher)
- MongoDB (running locally or connection string)
- Redis (optional, for token blacklisting)
- Google AI API Key (for Gemini AI features)

## Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the backend directory with the following variables:
```env
# Server Configuration
PORT=3000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

# MongoDB Configuration
MONGO_URI=mongodb://localhost:27017/tik-tik

# JWT Secret (Change this to a random string in production)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Redis Configuration (Optional - for token blacklisting)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# Google AI API Key (for Gemini)
GOOGLE_AI_KEY=your-google-ai-api-key-here
```

4. Start the backend server:
```bash
npm start
```

The server will run on `http://localhost:3000`

## Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the frontend directory:
```env
# Backend API URL
VITE_API_URL=http://localhost:3000
```

4. Start the development server:
```bash
npm run dev
```

The frontend will run on `http://localhost:5173`

## Features

- **User Authentication**: Register and login with JWT tokens
- **Project Management**: Create and manage coding projects
- **Real-time Collaboration**: Multiple users can work on the same project simultaneously
- **AI Code Generation**: Use `@ai` in chat to generate code with Google Gemini
- **In-Browser Code Execution**: Run code directly in the browser using WebContainer
- **File Management**: Create, edit, and manage project files
- **Live Preview**: See your code running in real-time

## Usage

1. Register a new account or login
2. Create a new project from the home page
3. Open a project to start coding
4. Use `@ai` in the chat to ask AI to generate code
5. Edit files in the code editor
6. Click "run" to execute your code
7. Add collaborators to work together

## Notes

- Redis is optional. If not configured, token blacklisting will be disabled but the app will still work.
- Make sure MongoDB is running before starting the backend.
- The Google AI API key is required for AI features to work.

