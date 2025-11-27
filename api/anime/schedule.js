const express = require('express');
const router = express.Router();
const scraper = require('../lib/scraper');

// Get anime schedule
router.get('/', async (req, res) => {
  try {
    const schedule = await scraper.getSchedule();
    
    res.json({
      success: true,
      data: schedule
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;