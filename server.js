const express = require('express');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

const connectDB = require('./db');

// Connect to MongoDB
connectDB()
  .then(() => console.log('Successfully connected to MongoDB Database.'))
  .catch(err => console.error('MongoDB connection error:', err));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Serve static frontend assets
app.use(express.static(path.join(__dirname, 'public')));

// Root route: always serve index.html (SPA)
// The frontend JS decides which view to show based on session state.
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Register API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/accounts', require('./routes/accounts'));

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({ error: '伺服器內部錯誤，請稍後再試！' });
});

app.listen(PORT, () => {
  console.log(`Server is running locally on http://localhost:${PORT}`);
});
