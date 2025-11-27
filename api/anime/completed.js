const express = require('express');
const router = express.Router();
const scraper = require('../lib/scraper');

// Get completed anime
router.get('/', async (req, res) => {
  try {
    const { page = 1 } = req.query;
    const completed = await scraper.getCompletedAnime(page);
    
    res.json({
      success: true,
      page: parseInt(page),
      data: completed
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;