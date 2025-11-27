const express = require('express');
const router = express.Router();
const scraper = require('../../lib/scraper');

// Get anime detail
router.get('/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    const detail = await scraper.getAnimeDetail(slug);
    
    res.json({
      success: true,
      data: detail
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;