const express = require('express');
const router = express.Router();
const scraper = require('../lib/scraper');
const db = require('../lib/database');

// Get anime recommendations
router.get('/', async (req, res) => {
  try {
    const cacheKey = 'anime_recommendations';
    const cached = db.get(cacheKey);
    
    if (cached) {
      return res.json(cached);
    }

    const recommendations = await scraper.getRecommendations();
    
    const response = {
      success: true,
      data: recommendations
    };

    db.set(cacheKey, response, 3600000); // Cache 1 hour
    
    res.json(response);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;