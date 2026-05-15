const IORedis = require("ioredis");

let redisClient = null;

const connectToRedis = async () => {
  try {

    // Reuse existing connection
    if (redisClient) {
      return redisClient;
    }

    redisClient = new IORedis({
      host: process.env.REDIS_HOST || "127.0.0.1",
      port: process.env.REDIS_PORT || 6379,

      // Important for BullMQ
      maxRetriesPerRequest: null,

      retryStrategy(times) {
        return Math.min(times * 50, 2000);
      }
    });

    redisClient.on("connect", () => {
      console.log("✅ Redis connected");
    });

    redisClient.on("error", (err) => {
      console.error("❌ Redis error:", err.message);
    });

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
