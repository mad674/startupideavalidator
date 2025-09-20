const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const ideaRoutes = require('./routes/ideaRoutes');
const userRoutes = require('./routes/userRoutes');
const adminRoutes = require('./routes/adminRoutes');

const errorHandler  = require('./middleware/errorHandler');
const connectDB = require('./config/db'); // DB connection file

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Connect to MongoDB
connectDB();

// API Routes
app.use('/idea', ideaRoutes); // Idea routes are prefixed with '/idea'
app.use('/user', userRoutes); // User routes are prefixed with '/user'
app.use('/admin', adminRoutes); // Admin routes are prefixed with '/admin'
// Error Handler Middleware
app.use(errorHandler);

// Port
const PORT = process.env.PORT || 5000;

// Start Server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
