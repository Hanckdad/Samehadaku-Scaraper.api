const express = require('express');
const router = express.Router();
const scraper = require('../lib/scraper');

// Get streaming links
router.get('/', async (req, res) => {
  try {
    const { url } = req.query;
    
    if (!url) {
      return res.status(400).json({
        success: false,
        error: 'URL parameter is required'
      });
    }

    const streamingLinks = await scraper.getStreamingLinks(url);
    
    res.json({
      success: true,
      data: streamingLinks
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;