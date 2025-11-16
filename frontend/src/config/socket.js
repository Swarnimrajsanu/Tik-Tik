import { io } from 'socket.io-client';

let socketInstance = null;

export const initializeSocket = (projectId) => {
    // Disconnect existing socket if any
    if (socketInstance) {
        socketInstance.disconnect();
    }

    const token = localStorage.getItem('token');

    socketInstance = io(
        import.meta.env.VITE_API_URL || 'http://localhost:3000', {
            auth: {
                token: token // Send token in auth object (preferred method)
            },
            query: {
                projectId: projectId
            },
            extraHeaders: {
                Authorization: `Bearer ${token}` // Also send in headers as fallback
            },
            transports: ['websocket', 'polling'], // Try websocket first, fallback to polling
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
        });

    // Connection event handlers
    socketInstance.on('connect', () => {
        console.log('✅ Socket connected:', socketInstance.id);
    });

    socketInstance.on('connect_error', (error) => {
        console.error('❌ Socket connection error:', error.message);
    });

    socketInstance.on('disconnect', (reason) => {
        console.log('🔌 Socket disconnected:', reason);
    });

    socketInstance.on('error', (error) => {
        console.error('⚠️ Socket error:', error);
    });

    return socketInstance;
}

export const receiveMessage = (eventName, cb) => {
    if (socketInstance) {
        socketInstance.on(eventName, cb);
    } else {
        console.error('Socket not initialized. Call initializeSocket first.');
    }
}

export const sendMessage = (eventName, data) => {
    if (socketInstance) {
        socketInstance.emit(eventName, data);
    } else {
        console.error('Socket not initialized. Call initializeSocket first.');
    }
}

export const disconnectSocket = () => {
    if (socketInstance) {
        socketInstance.disconnect();
        socketInstance = null;
    }
}

export const getSocket = () => socketInstance;