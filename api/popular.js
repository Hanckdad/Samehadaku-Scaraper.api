const express = require('express');
const router = express.Router();
const scraper = require('../lib/scraper');
const db = require('../lib/database');

// Get popular anime
router.get('/', async (req, res) => {
  try {
    const { page = 1 } = req.query;
    
    const cacheKey = `popular_${page}`;
    const cached = db.get(cacheKey);
    
    if (cached) {
      return res.json(cached);
    }

    const popular = await scraper.getPopularAnime(page);
    
    const response = {
      success: true,
      page: parseInt(page),
      data: popular,
      total: popular.length
    };

    db.set(cacheKey, response, 300000); // Cache 5 minutes
    
    res.json(response);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;