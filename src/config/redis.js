const { createClient } = require('redis');

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

const clientOptions = {
    url: REDIS_URL,
    socket: {
        reconnectStrategy: (retries) => {
            if (retries > 2) {
                return new Error('Redis connection cancelled after max retries.');
            }
            return 1000;
        },
        connectTimeout: 2000
    }
};

const pubClient = createClient(clientOptions);
const subClient = createClient(clientOptions);
const redisClient = createClient(clientOptions);

// Attach mandatory error listeners
pubClient.on('error', (err) => {});
subClient.on('error', (err) => {});
redisClient.on('error', (err) => {});

module.exports = {
    pubClient,
    subClient,
    redisClient
};

