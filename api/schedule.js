const express = require('express');
const router = express.Router();
const scraper = require('../lib/scraper');
const db = require('../lib/database');

// Get anime schedule
router.get('/', async (req, res) => {
  try {
    const cacheKey = 'schedule';
    const cached = db.get(cacheKey);
    
    if (cached) {
      return res.json(cached);
    }

    const schedule = await scraper.getSchedule();
    
    const response = {
      success: true,
      data: schedule
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