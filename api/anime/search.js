const express = require('express');
const router = express.Router();
const scraper = require('../../lib/scraper');

// Search anime
router.get('/', async (req, res) => {
  try {
    const { q, page = 1 } = req.query;
    
    if (!q) {
      return res.status(400).json({
        success: false,
        error: 'Query parameter "q" is required'
      });
    }

    const results = await scraper.searchAnime(q, page);
    
    res.json({
      success: true,
      query: q,
      page: parseInt(page),
      data: results
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;