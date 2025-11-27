const express = require('express');
const router = express.Router();
const scraper = require('./scraper');
const db = require('./database');

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

    db.set(cacheKey, response, 3600000);
    
    res.json(response);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;