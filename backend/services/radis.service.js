import Redis from 'ioredis';

let redisClient = null;

// Only create Redis client if environment variables are provided
if (process.env.REDIS_HOST && process.env.REDIS_PORT) {
    redisClient = new Redis({
        port: parseInt(process.env.REDIS_PORT) || 6379,
        host: process.env.REDIS_HOST,
        password: process.env.REDIS_PASSWORD || undefined,
        retryStrategy: (times) => {
            const delay = Math.min(times * 50, 2000);
            return delay;
        },
        maxRetriesPerRequest: 3,
    });

    redisClient.on('connect', () => {
        console.log('✅ Redis Client Connected');
    });

    redisClient.on('error', (err) => {
        console.warn('⚠️ Redis connection error:', err.message);
    });
} else {
    console.warn('⚠️ Redis not configured. Token blacklisting will be disabled.');
    // Create a mock Redis client with the same interface
    redisClient = {
        get: async () => null,
        set: async () => true,
        del: async () => true,
    };
}

export default redisClient;