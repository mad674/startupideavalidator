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

app.get('/', (req, res) => {
    res.send('SIV BACKEND API is running...');
})
app.get('/health', (req, res) => {
    res.status(200).json({ message: 'Running SIVBACKEND successfully'});
})
app.head('/health', (req, res) => {
    res.status(200).json({ message: 'Running SIVBACKEND successfully'});
})
// API Routes
app.use('/idea', ideaRoutes); // Idea routes are prefixed with '/idea'
app.use('/user', userRoutes); // User routes are prefixed with '/user'
app.use('/admin', adminRoutes); // Admin routes are prefixed with '/admin'
// Error Handler Middleware
app.use(errorHandler);

// Port
const PORT = process.env.PORT || 5000;

// Start Server
app.listen(PORT,"0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
});
