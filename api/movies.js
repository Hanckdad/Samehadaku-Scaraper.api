const express = require('express');
const router = express.Router();
const scraper = require('../lib/scraper');

// Get anime movies
router.get('/', async (req, res) => {
  try {
    const { page = 1 } = req.query;
    const movies = await scraper.getMovies(page);
    
    res.json({
      success: true,
      page: parseInt(page),
      data: movies
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;