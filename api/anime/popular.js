const express = require('express');
const router = express.Router();
const scraper = require('../lib/scraper');

// Get popular anime
router.get('/', async (req, res) => {
  try {
    const { page = 1 } = req.query;
    const popular = await scraper.getPopularAnime(page);
    
    res.json({
      success: true,
      page: parseInt(page),
      data: popular
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;