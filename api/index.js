const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const app = express();

// Middleware
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Custom Rate Limiting
const { globalLimiter, searchLimiter } = require('./middleware/rateLimit');

// Global rate limiting middleware
app.use((req, res, next) => {
  const key = req.headers['x-api-key'] || req.ip;
  const result = globalLimiter.check(key);
  
  if (!result.allowed) {
    return res.status(429).json({
      success: false,
      error: 'Too many requests',
      retryAfter: result.retryAfter,
      message: `Rate limit exceeded. Try again in ${result.retryAfter} seconds.`
    });
  }
  
  // Add rate limit headers
  res.set({
    'X-RateLimit-Limit': 100,
    'X-RateLimit-Remaining': result.remaining,
    'X-RateLimit-Reset': Math.floor(Date.now() / 1000) + 60
  });
  
  next();
});

// Special rate limiting for search endpoints
app.use('/api/search', (req, res, next) => {
  const key = req.headers['x-api-key'] || req.ip;
  const result = searchLimiter.check(key);
  
  if (!result.allowed) {
    return res.status(429).json({
      success: false,
      error: 'Search rate limit exceeded',
      retryAfter: result.retryAfter,
      message: `Search limit exceeded. Try again in ${result.retryAfter} seconds.`
    });
  }
  
  next();
});

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path} - ${req.ip}`);
  next();
});

// ==================== ROUTES REGISTRATION ====================
// API Routes
app.use('/api/anime', require('./anime/index'));
app.use('/api/search', require('./anime/search'));
app.use('/api/ongoing', require('./ongoing'));
app.use('/api/completed', require('./completed'));
app.use('/api/popular', require('./popular'));
app.use('/api/schedule', require('./schedule'));
app.use('/api/genres', require('./genres'));
app.use('/api/streaming', require('./streaming'));
app.use('/api/recent', require('./recent'));
app.use('/api/movies', require('./movies'));
app.use('/api/recommendations', require('./recommendations'));
app.use('/api/home', require('./home'));
app.use('/api/stats', require('./stats'));

// Admin routes untuk management API keys
app.use('/api/admin', require('./admin'));

// API Key middleware (applied to all API routes)
const { authenticateApiKey } = require('./middleware/auth');
app.use('/api', authenticateApiKey);
// ==================== END ROUTES REGISTRATION ====================

// Health check dengan info lengkap
app.get('/', (req, res) => {
  res.json({ 
    message: 'Samehadaku Scraper API', 
    status: 'active',
    version: '2.0.1',
    features: [
      'Anime Search & Details',
      'Ongoing & Completed Anime',
      'Popular & Recommended',
      'Streaming Links',
      'Schedule & Genres',
      'Recent Episodes',
      'Movie Listings',
      'API Key Authentication',
      'Rate Limiting',
      'Caching System',
      'Admin API Key Management'
    ],
    endpoints: {
      anime: '/api/anime/{slug}',
      search: '/api/search?q={query}',
      ongoing: '/api/ongoing?page={page}',
      completed: '/api/completed?page={page}',
      popular: '/api/popular?page={page}',
      schedule: '/api/schedule',
      genres: '/api/genres',
      streaming: '/api/streaming?url={episode_url}',
      recent: '/api/recent?page={page}',
      movies: '/api/movies?page={page}',
      recommendations: '/api/recommendations',
      home: '/api/home',
      stats: '/api/stats',
      admin: {
        list_keys: '/api/admin/keys',
        generate_key: 'POST /api/admin/keys/generate',
        add_key: 'POST /api/admin/keys',
        delete_key: 'DELETE /api/admin/keys/{key}'
      }
    },
    documentation: 'Add x-api-key header to all API requests',
    rate_limits: {
      global: '100 requests per minute',
      search: '30 requests per minute'
    }
  });
});

// API Key generation endpoint (hanya untuk development)
app.get('/generate-key', (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({ 
      success: false,
      error: 'Key generation not available in production. Set API keys via environment variables.' 
    });
  }
  
  const { generateApiKey } = require('./middleware/auth');
  const apiKey = generateApiKey();
  
  res.json({
    success: true,
    apiKey,
    message: 'Save this API key for future requests. Use header: x-api-key',
    usage_example: {
      curl: `curl -H "x-api-key: ${apiKey}" http://localhost:3000/api/ongoing`,
      javascript: `
fetch('http://localhost:3000/api/ongoing', {
  headers: {
    'x-api-key': '${apiKey}'
  }
})`
    }
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    availableEndpoints: {
      public: [
        'GET /',
        'GET /generate-key (dev only)'
      ],
      api: [
        'GET /api/anime/{slug}',
        'GET /api/search?q={query}',
        'GET /api/ongoing?page={page}',
        'GET /api/completed?page={page}',
        'GET /api/popular?page={page}',
        'GET /api/schedule',
        'GET /api/genres',
        'GET /api/genres/{genre}?page={page}',
        'GET /api/streaming?url={episode_url}',
        'GET /api/recent?page={page}',
        'GET /api/movies?page={page}',
        'GET /api/recommendations',
        'GET /api/home',
        'GET /api/stats'
      ],
      admin: [
        'GET /api/admin/keys',
        'POST /api/admin/keys/generate',
        'POST /api/admin/keys',
        'DELETE /api/admin/keys/{key}'
      ]
    },
    note: 'All API endpoints require x-api-key header'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  
  // Default error
  const errorResponse = {
    success: false,
    error: process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : err.message,
    timestamp: new Date().toISOString()
  };
  
  // Add stack trace in development
  if (process.env.NODE_ENV !== 'production') {
    errorResponse.stack = err.stack;
  }
  
  // Specific error for scraping issues
  if (err.message.includes('Failed to fetch') || err.message.includes('scraping')) {
    errorResponse.error = 'Failed to fetch data from source';
    errorResponse.suggestion = 'Please try again later or check if the source is available';
  }
  
  res.status(500).json(errorResponse);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('Shutting down gracefully...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('Shutting down gracefully...');
  process.exit(0);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`
🎌 Samehadaku Scraper API 🎌
🚀 Server running on port ${PORT}
📚 API Documentation: http://localhost:${PORT}
🔑 Generate API Key: http://localhost:${PORT}/generate-key
🌐 Environment: ${process.env.NODE_ENV || 'development'}
💾 Memory: ${process.memoryUsage().heapUsed / 1024 / 1024} MB

📋 Available Endpoints:
   📖 GET  /                    - API Documentation
   🔑 GET  /generate-key        - Generate API Key (Dev only)
   🔍 GET  /api/search?q={query}- Search Anime
   📺 GET  /api/anime/{slug}    - Anime Details
   🎯 GET  /api/ongoing         - Ongoing Anime
   ✅ GET  /api/completed       - Completed Anime
   🔥 GET  /api/popular         - Popular Anime
   📅 GET  /api/schedule        - Anime Schedule
   🏷️ GET  /api/genres          - All Genres
   🎬 GET  /api/streaming       - Streaming Links
   🆕 GET  /api/recent          - Recent Episodes
   🎥 GET  /api/movies          - Anime Movies
   💫 GET  /api/recommendations - Recommendations
   🏠 GET  /api/home            - Homepage Data
   📊 GET  /api/stats           - API Statistics
   ⚙️ GET  /api/admin/keys      - Manage API Keys

⚠️ Remember to include 'x-api-key' header in all API requests!
  `);
});

module.exports = app;