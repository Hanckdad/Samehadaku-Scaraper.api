const express = require('express');
const router = express.Router();
const scraper = require('./scraper');
const db = require('./database');

router.get('/', async (req, res) => {
  try {
    const cacheKey = 'homepage';
    const cached = db.get(cacheKey);
    
    if (cached) {
      return res.json(cached);
    }

    const [ongoing, popular, recent] = await Promise.all([
      scraper.getOngoingAnime(1),
      scraper.getPopularAnime(1),
      scraper.getRecentEpisodes(1)
    ]);

    const response = {
      success: true,
      data: {
        ongoing: ongoing.slice(0, 12),
        popular: popular.slice(0, 12),
        recent: recent.slice(0, 12)
      }
    };

    db.set(cacheKey, response, 300000);
    
    res.json(response);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;