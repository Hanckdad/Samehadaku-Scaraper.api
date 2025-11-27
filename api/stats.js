const express = require('express');
const router = express.Router();
const db = require('../lib/database');
const { authenticateApiKey } = require('../middleware/auth');

// Get API statistics
router.get('/', authenticateApiKey, (req, res) => {
  try {
    const cacheStats = db.getStats();
    
    res.json({
      success: true,
      stats: {
        cache: cacheStats,
        server: {
          uptime: process.uptime(),
          memory: process.memoryUsage(),
          nodeVersion: process.version,
          platform: process.platform
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Clear cache
router.delete('/cache', authenticateApiKey, (req, res) => {
  try {
    db.clear();
    
    res.json({
      success: true,
      message: 'Cache cleared successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;