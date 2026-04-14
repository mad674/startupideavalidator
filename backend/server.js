const express = require('express');
const cors = require('cors');
const ideaRoutes = require('./routes/ideaRoutes');
const userRoutes = require('./routes/userRoutes');
const adminRoutes = require('./routes/adminRoutes');
const expertRoutes = require('./routes/expertRoutes');
const RateLimiter = require('./middleware/rateLimiter');
const ErrorHandler  = require('./middleware/errorHandler');
const Mongodb = require('./config/db'); // DB connection file
const { connectToRedis} = require('./config/redis'); // Redis connection file
const dotenv = require('dotenv');
const {idempotencyMiddleware} = require('./middleware/idempotency');
dotenv.config();

const app = express();
// Middleware
app.set('trust proxy', 1);
app.use(cors());
app.use(express.json());

// Connect to MongoDB
// Mongodb.connectDB();
// Health check routes
app.get('/', (req, res) => {
    res.send('SIV BACKEND API is running...');
});
app.get('/health', (req, res) => {
    res.status(200).json({ message: 'Running SIVBACKEND successfully'});
});
app.head('/health', (req, res) => {
    res.status(200).json({ message: 'Running SIVBACKEND successfully'});
});

// Rate limiter config
const windowSeconds = Number(process.env.RATE_LIMIT_WINDOW) || 900; // 15 minutes
const maxRequests = Number(process.env.RATE_LIMIT_MAX) || 300;
// rate limiter middleware
app.use(
    ['/idea', '/user', '/admin', '/expert'],
    RateLimiter.rateLimiter({ windowSeconds, maxRequests, keyPrefix: 'api' })
  );
//idempotency middleware
const idempotency=idempotencyMiddleware({
    ttlMs: 60 * 60 * 1000,// expiry time 1 hour
    enforce: false,// if true, missing key => 400 for unsafe methods
    useOriginalUrl: false, // false => req.path, true => req.originalUrl
    waitForCompletion: true, // true => wait for completion, false => return immediately
});
app.use(
  (req, res, next) => {
  if (req.path.startsWith('/user/check_api_key') || req.path.startsWith('/user/save_api_key')) {
    return next(); // ✅ skip only this route
  }
  return idempotency(req, res, next);
});
// API Routes with rate limiting
app.use('/idea',ideaRoutes);
app.use('/user',userRoutes);
app.use('/admin',adminRoutes);
app.use('/expert',expertRoutes);

// Error Handler Middleware
app.use(ErrorHandler.errorHandler);

// Port
const PORT = process.env.PORT || 5000;

(async () => {
  try {
    await Mongodb.connectDB();
    await connectToRedis();

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error('❌ Server startup failed:', err);
    process.exit(1);
  }
})();
