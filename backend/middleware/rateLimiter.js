const { getRedisClient } = require('../config/redis');

class RateLimiter {
  static rateLimiter({ windowSeconds, maxRequests, keyPrefix }) {
    return async (req, res, next) => {
      try {
        const redisClient = getRedisClient(); // ✅ always fetch singleton

        // Identify user (JWT user OR IP fallback)
        const userId = req.user?.id || req.ip;
        const key = `${keyPrefix}:${userId}`;

        // Increment request count
        const current = await redisClient.incr(key);

        // First request → set expiry
        if (current === 1) {
          await redisClient.expire(key, windowSeconds);
        }

        // Limit exceeded
        if (current > maxRequests) {
          return res.status(429).json({
            success: false,
            message: 'Too many requests. Please try again later.',
          });
        }

        next();
      } catch (error) {
        console.error('Rate limit error:', error);
        next(); // fail open (do not block app)
      }
    };
  }
}

module.exports = RateLimiter;
