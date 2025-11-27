const express = require('express');
const router = express.Router();

// ✅ GUNAKAN PATH RELATIVE DI FOLDER YANG SAMA
const scraper = require('./scraper');
const db = require('./database');

router.get('/', async (req, res) => {
  try {
    const { page = 1 } = req.query;
    
    const cacheKey = `ongoing_${page}`;
    const cached = db.get(cacheKey);
    
    if (cached) {
      return res.json(cached);
    }

    const ongoing = await scraper.getOngoingAnime(page);
    
    const response = {
      success: true,
      page: parseInt(page),
      data: ongoing,
      total: ongoing.length
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