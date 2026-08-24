const { redisClient } = require('../config/redis');
const { makeid } = require('../utils/helpers');

// In-Memory Fallback Store (when Redis is offline)
const inMemory = {
    rooms: new Map(), // code -> { name, createdAt }
    users: new Map(), // sid -> { room, username }
    roomUsers: new Map() // room -> Map(sid -> username)
};

function isRedisReady() {
    return redisClient && redisClient.isOpen;
}

async function generateRoomCode(length = 6) {
    while (true) {
        const code = makeid(length);
        const exists = await roomExists(code);
        if (!exists) return code;
    }
}

async function roomExists(code) {
    if (isRedisReady()) {
        try {
            const exists1 = await redisClient.exists(`room:${code}:exists`);
            const exists2 = await redisClient.exists(`room:${code}:users`);
            return exists1 || exists2;
        } catch (e) {
            console.warn("Redis error on roomExists, falling back to memory:", e.message);
        }
    }
    return inMemory.rooms.has(code);
}

async function createRoom(code, name) {
    if (isRedisReady()) {
        try {
            await redisClient.setEx(`room:${code}:exists`, 3600, "1");
            if (name) {
                await redisClient.setEx(`room:${code}:name`, 3600, name);
            }
            return;
        } catch (e) {
            console.warn("Redis error on createRoom, falling back to memory:", e.message);
        }
    }
    inMemory.rooms.set(code, { name: name || "Ephemeral Room", createdAt: Date.now() });
    if (!inMemory.roomUsers.has(code)) {
        inMemory.roomUsers.set(code, new Map());
    }
}

async function getRoomName(code) {
    if (isRedisReady()) {
        try {
            let name = await redisClient.get(`room:${code}:name`);
            if (name) return name;
        } catch (e) {
            console.warn("Redis error on getRoomName, falling back to memory:", e.message);
        }
    }
    const room = inMemory.rooms.get(code);
    return room ? room.name : "Ephemeral Room";
}

async function getActiveRoomsCount() {
    if (isRedisReady()) {
        try {
            const keys = await redisClient.keys("room:*:exists");
            return keys.length;
        } catch (e) {}
    }
    return inMemory.rooms.size;
}

async function addUserToRoom(room, sid, username) {
    if (isRedisReady()) {
        try {
            await redisClient.hSet(`room:${room}:users`, sid, username);
            await redisClient.set(`sid:${sid}:room`, room);
            await redisClient.set(`sid:${sid}:username`, username);
            return;
        } catch (e) {
            console.warn("Redis error on addUserToRoom, falling back to memory:", e.message);
        }
    }

    inMemory.users.set(sid, { room, username });
    if (!inMemory.roomUsers.has(room)) {
        inMemory.roomUsers.set(room, new Map());
    }
    inMemory.roomUsers.get(room).set(sid, username);
}

async function removeUserFromRoom(sid) {
    if (isRedisReady()) {
        try {
            const room = await redisClient.get(`sid:${sid}:room`);
            const username = await redisClient.get(`sid:${sid}:username`);
            
            if (room && username) {
                await redisClient.hDel(`room:${room}:users`, sid);
                await redisClient.del(`sid:${sid}:room`);
                await redisClient.del(`sid:${sid}:username`);

                const len = await redisClient.hLen(`room:${room}:users`);
                if (len === 0) {
                    await redisClient.del(`room:${room}:exists`);
                    await redisClient.del(`room:${room}:users`);
                    await redisClient.del(`room:${room}:name`);
                }
                return { room, username };
            }
        } catch (e) {
            console.warn("Redis error on removeUserFromRoom, falling back to memory:", e.message);
        }
    }

    const userInfo = inMemory.users.get(sid);
    if (!userInfo) return null;

    const { room, username } = userInfo;
    inMemory.users.delete(sid);

    if (inMemory.roomUsers.has(room)) {
        const roomMap = inMemory.roomUsers.get(room);
        roomMap.delete(sid);
        if (roomMap.size === 0) {
            inMemory.roomUsers.delete(room);
            inMemory.rooms.delete(room);
        }
    }

    return { room, username };
}

module.exports = {
    generateRoomCode,
    roomExists,
    createRoom,
    getRoomName,
    getActiveRoomsCount,
    addUserToRoom,
    removeUserFromRoom
};
