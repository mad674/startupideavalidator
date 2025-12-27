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

// API Routes with rate limiting
app.use(
    '/idea',
    RateLimiter.rateLimiter({ windowSeconds, maxRequests, keyPrefix: 'idea' }),
    ideaRoutes
);
app.use(
    '/user',
    RateLimiter.rateLimiter({ windowSeconds, maxRequests, keyPrefix: 'user' }),
    userRoutes
);
app.use(
    '/admin',
    RateLimiter.rateLimiter({ windowSeconds, maxRequests, keyPrefix: 'admin' }),
    adminRoutes
);
app.use(
    '/expert',
    RateLimiter.rateLimiter({ windowSeconds, maxRequests, keyPrefix: 'expert' }),
    expertRoutes
);

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
