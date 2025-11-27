const express = require('express');
const router = express.Router();
const scraper = require('./scraper');
const db = require('./database');

router.get('/', async (req, res) => {
  try {
    const { page = 1 } = req.query;
    
    const cacheKey = `recent_${page}`;
    const cached = db.get(cacheKey);
    
    if (cached) {
      return res.json(cached);
    }

    const recent = await scraper.getRecentEpisodes(page);
    
    const response = {
      success: true,
      page: parseInt(page),
      data: recent
    };

    db.set(cacheKey, response, 180000);
    
    res.json(response);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;