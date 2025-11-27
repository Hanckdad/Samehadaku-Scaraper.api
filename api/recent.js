const express = require('express');
const router = express.Router();
const scraper = require('../lib/scraper');

// Get recent episodes
router.get('/', async (req, res) => {
  try {
    const { page = 1 } = req.query;
    const recent = await scraper.getRecentEpisodes(page);
    
    res.json({
      success: true,
      page: parseInt(page),
      data: recent
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;