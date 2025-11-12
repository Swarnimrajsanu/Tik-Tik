import Redis from 'ioredis';

const redisClient = new Redis({
    port: parseInt(process.env.REDIS_PORT),
    host: process.env.REDIS_HOST,
    password: process.env.REDIS_PASSWORD
});

redisClient.on('connect', () => {
    console.log('Redis Client Connected');
});

export default redisClient;