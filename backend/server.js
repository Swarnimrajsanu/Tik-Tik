import 'dotenv/config';
import http from 'http';
import { Server } from 'socket.io';
import app from './app.js';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import projectModel from './models/project.models.js';
import { generateResult } from './services/ai.service.js';

const port = process.env.PORT || 3000;

const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: process.env.FRONTEND_URL || 'https://tik-tik-chat.onrender.com',
        credentials: true
    }
});

// Socket.io authentication middleware
io.use(async(socket, next) => {
    try {
        // Extract token
        const token = socket.handshake.auth ?.token ||
            socket.handshake.headers.authorization ?.split(' ')[1];

        if (!token) {
            return next(new Error('Authentication token required'));
        }

        // Extract and validate projectId
        const projectId = socket.handshake.query.projectId;

        if (!projectId) {
            return next(new Error('ProjectId is required'));
        }

        if (!mongoose.Types.ObjectId.isValid(projectId)) {
            return next(new Error('Invalid projectId format'));
        }

        // Verify JWT token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        if (!decoded) {
            return next(new Error('Invalid token'));
        }

        console.log('Decoded JWT:', decoded); // Debug log to see the structure

        // Fetch project from database
        const project = await projectModel.findById(projectId);

        if (!project) {
            return next(new Error('Project not found'));
        }

        // Get user ID from decoded token (handle different possible structures)
        const userId = decoded._id || decoded.id || decoded.userId || decoded.sub;

        if (!userId) {
            console.error('No user ID found in token. Token payload:', decoded);
            return next(new Error('Invalid token structure'));
        }

        // Check if user is authorized to access this project
        // Make sure project.users exists and is an array
        if (!project.users || !Array.isArray(project.users)) {
            console.error('Project users array is missing or invalid');
            return next(new Error('Invalid project structure'));
        }

        const isUserAuthorized = project.users.some(user => {
            // Handle both ObjectId and string formats
            const projectUserId = user._id ? user._id.toString() : user.toString();
            const currentUserId = userId.toString();
            return projectUserId === currentUserId;
        });

        if (!isUserAuthorized) {
            return next(new Error('User not authorized for this project'));
        }

        // Attach user and project to socket
        socket.user = decoded;
        socket.project = project;

        next();

    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return next(new Error('Invalid token'));
        }
        if (error.name === 'TokenExpiredError') {
            return next(new Error('Token expired'));
        }
        console.error('Socket authentication error:', error);
        next(new Error('Authentication failed'));
    }
});

// Socket.io connection handler
io.on('connection', (socket) => {
    socket.roomId = socket.project._id.toString();

    const userEmail = socket.user.email || socket.user.username || 'Unknown user';
    console.log(`✅ User ${userEmail} connected to project ${socket.roomId}`);

    // Join project room
    socket.join(socket.roomId);

    // Handle project messages
    socket.on('project-message', async(data) => {
        try {
            const { message } = data;

            if (!message || typeof message !== 'string') {
                socket.emit('error', { message: 'Invalid message format' });
                return;
            }

            const aiIsPresentInMessage = message.includes('@ai');

            // Broadcast message to other users in the room
            socket.broadcast.to(socket.roomId).emit('project-message', data);

            // Handle AI message
            if (aiIsPresentInMessage) {
                const prompt = message.replace('@ai', '').trim();

                if (!prompt) {
                    socket.emit('error', { message: 'Please provide a prompt for AI' });
                    return;
                }

                console.log(`🤖 AI prompt received: ${prompt}`);

                // Emit AI thinking status
                io.to(socket.roomId).emit('ai-status', {
                    status: 'thinking',
                    message: 'AI is processing your request...'
                });

                try {
                    const result = await generateResult(prompt);

                    // Parse and validate AI response
                    let parsedResult;
                    try {
                        parsedResult = JSON.parse(result);
                    } catch (parseError) {
                        console.error('Failed to parse AI response:', parseError);
                        parsedResult = { text: result };
                    }

                    // Emit AI response to all users in the room
                    io.to(socket.roomId).emit('project-message', {
                        message: JSON.stringify(parsedResult),
                        sender: {
                            _id: 'ai',
                            email: 'AI Assistant'
                        }
                    });

                    // Update project with new fileTree if present
                    if (parsedResult.fileTree) {
                        await projectModel.findByIdAndUpdate(
                            socket.project._id, { fileTree: parsedResult.fileTree }, { new: true }
                        );
                        console.log(`📁 FileTree updated for project ${socket.roomId}`);
                    }

                    // Emit AI completion status
                    io.to(socket.roomId).emit('ai-status', {
                        status: 'complete',
                        message: 'AI has completed the request'
                    });

                } catch (aiError) {
                    console.error('AI generation error:', aiError);

                    io.to(socket.roomId).emit('project-message', {
                        message: JSON.stringify({
                            text: 'Sorry, I encountered an error processing your request. Please try again.'
                        }),
                        sender: {
                            _id: 'ai',
                            email: 'AI Assistant'
                        }
                    });

                    io.to(socket.roomId).emit('ai-status', {
                        status: 'error',
                        message: 'AI encountered an error'
                    });
                }
            }

        } catch (error) {
            console.error('Message handling error:', error);
            socket.emit('error', { message: 'Failed to process message' });
        }
    });

    // Handle disconnect
    socket.on('disconnect', () => {
        console.log(`❌ User ${userEmail} disconnected from project ${socket.roomId}`);
        socket.leave(socket.roomId);
    });

    // Handle errors
    socket.on('error', (error) => {
        console.error('Socket error:', error);
    });
});

// Server startup
server.listen(port, () => {
    console.log(`✅ Server is running on port ${port}`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM signal received: closing HTTP server');
    server.close(() => {
        console.log('HTTP server closed');
        mongoose.connection.close(false, () => {
            console.log('MongoDB connection closed');
            process.exit(0);
        });
    });
});

export { io };