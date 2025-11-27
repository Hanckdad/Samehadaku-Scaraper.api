const express = require('express');
const router = express.Router();
const scraper = require('../scraper');
const db = require('../database');

router.get('/', async (req, res) => {
  try {
    const { q, page = 1 } = req.query;
    
    if (!q) {
      return res.status(400).json({
        success: false,
        error: 'Query parameter "q" is required'
      });
    }

    const cacheKey = `search_${q}_${page}`;
    const cached = db.get(cacheKey);
    
    if (cached) {
      return res.json(cached);
    }

    const results = await scraper.searchAnime(q, page);
    
    const response = {
      success: true,
      query: q,
      page: parseInt(page),
      data: results
    };

    db.set(cacheKey, response, 300000);
    
    res.json(response);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;