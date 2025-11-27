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

// Simple health check first
app.get('/', (req, res) => {
  res.json({ 
    message: 'Samehadaku Scraper API', 
    status: 'active',
    version: '2.0.1',
    note: 'API is starting up...'
  });
});

// Try to load other modules with error handling
try {
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
        retryAfter: result.retryAfter
      });
    }
    
    res.set({
      'X-RateLimit-Limit': 100,
      'X-RateLimit-Remaining': result.remaining,
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
        retryAfter: result.retryAfter
      });
    }
    
    next();
  });

} catch (error) {
  console.log('Rate limiter not available:', error.message);
}

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Load routes with error handling
const loadRoute = (path, route) => {
  try {
    app.use(path, require(route));
    console.log(`✓ Loaded route: ${path}`);
  } catch (error) {
    console.log(`✗ Failed to load route ${path}:`, error.message);
    // Create a simple error route
    app.use(path, (req, res) => {
      res.status(500).json({
        success: false,
        error: `Route ${path} is temporarily unavailable`,
        message: error.message
      });
    });
  }
};

// Load API routes
loadRoute('/api/anime', './anime/index');
loadRoute('/api/search', './anime/search');
loadRoute('/api/ongoing', './ongoing');
loadRoute('/api/completed', './completed'); 
loadRoute('/api/popular', './popular');
loadRoute('/api/schedule', './schedule');
loadRoute('/api/genres', './genres');
loadRoute('/api/streaming', './streaming');
loadRoute('/api/recent', './recent');
loadRoute('/api/movies', './movies');
loadRoute('/api/recommendations', './recommendations');
loadRoute('/api/home', './home');
loadRoute('/api/stats', './stats');
loadRoute('/api/admin', './admin');

// API Key middleware (with error handling)
try {
  const { authenticateApiKey } = require('./middleware/auth');
  app.use('/api', authenticateApiKey);
  console.log('✓ API Key authentication loaded');
} catch (error) {
  console.log('✗ API Key auth failed:', error.message);
  app.use('/api', (req, res, next) => next()); // Skip auth if failed
}

// Enhanced health check
app.get('/health', (req, res) => {
  res.json({ 
    success: true,
    message: 'API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    memory: process.memoryUsage(),
    uptime: process.uptime()
  });
});

// API Key generation endpoint
app.get('/generate-key', (req, res) => {
  try {
    if (process.env.NODE_ENV === 'production') {
      return res.status(403).json({ 
        success: false,
        error: 'Key generation not available in production' 
      });
    }
    
    const { generateApiKey } = require('./middleware/auth');
    const apiKey = generateApiKey();
    
    res.json({
      success: true,
      apiKey,
      message: 'Save this API key'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to generate key',
      message: error.message
    });
  }
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    path: req.path
  });
});

// Error handling
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    ...(process.env.NODE_ENV !== 'production' && { message: err.message })
  });
});

const PORT = process.env.PORT || 3000;

// Export for Vercel
module.exports = app;

// Only listen if not in Vercel
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}