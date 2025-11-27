const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Rate limiting
const { RateLimiterMemory } = require('rate-limiter-flexible');
const rateLimiter = new RateLimiterMemory({
  keyGenerator: (req) => req.headers['x-api-key'] || req.ip,
  points: 100, // 100 requests
  duration: 60, // per 60 seconds
});

app.use((req, res, next) => {
  rateLimiter.consume(req.headers['x-api-key'] || req.ip)
    .then(() => next())
    .catch(() => res.status(429).json({ error: 'Too many requests' }));
});

// API Routes
app.use('/api/anime', require('./anime/index'));
app.use('/api/ongoing', require('./ongoing'));
app.use('/api/completed', require('./completed'));
app.use('/api/popular', require('./popular'));
app.use('/api/schedule', require('./schedule'));
app.use('/api/genres', require('./genres'));
app.use('/api/streaming', require('./streaming'));

// API Key middleware
const { authenticateApiKey } = require('../middleware/auth');
app.use('/api', authenticateApiKey);

// Health check
app.get('/', (req, res) => {
  res.json({ 
    message: 'Samehadaku Scraper API', 
    status: 'active',
    version: '1.0.0'
  });
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;