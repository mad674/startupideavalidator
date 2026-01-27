const { createClient } = require("redis");

let redisClient = null;

const connectToRedis = async () => {
  try {
    if (redisClient) return redisClient;

    // redisClient = createClient({
    //   url: process.env.REDIS_URL,
    // });
    redisClient=createClient({
      socket: {
        host: "127.0.0.1",
        port: 6379,
      },
    });

    redisClient.on("connect", () => {
      console.log("✅ Redis connected");
    });

    redisClient.on("error", (err) => {
      console.error("❌ Redis error:", err);
    });

    await redisClient.connect();
    return redisClient;
  } catch (error) {
    console.error("❌ Redis Connection Error:", error.message);
    process.exit(1);
  }
};

const getRedisClient = () => {
  if (!redisClient) {
    throw new Error("Redis not connected");
  }
  return redisClient;
};

module.exports = {
  connectToRedis,
  getRedisClient,
};
