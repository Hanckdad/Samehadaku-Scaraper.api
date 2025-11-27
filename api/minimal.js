const express = require('express');
const app = express();

app.use(express.json());

app.get('/', (req, res) => {
  res.json({ 
    message: 'Samehadaku API - Minimal Version',
    status: 'working',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/health', (req, res) => {
  res.json({ 
    success: true,
    message: 'API is healthy',
    environment: process.env.NODE_ENV || 'development'
  });
});

module.exports = app;