const express = require('express');
const router = express.Router();
const scraper = require('../lib/scraper');
const db = require('../lib/database');

// Get homepage data (ongoing, popular, latest)
router.get('/', async (req, res) => {
  try {
    const cacheKey = 'homepage_data';
    const cached = db.get(cacheKey);
    
    if (cached) {
      return res.json(cached);
    }

    const [ongoing, popular, latest] = await Promise.all([
      scraper.getOngoingAnime(1),
      scraper.getPopularAnime(1),
      scraper.getOngoingAnime(1) // Using ongoing as latest for now
    ]);

    const response = {
      success: true,
      data: {
        ongoing: ongoing.slice(0, 12),
        popular: popular.slice(0, 12),
        latest: latest.slice(0, 12),
        lastUpdated: new Date().toISOString()
      }
    };

    db.set(cacheKey, response, 300000); // Cache for 5 minutes
    
    res.json(response);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;