const express = require('express');
const router = express.Router();
const scraper = require('./scraper');
const db = require('./database');

router.get('/', async (req, res) => {
  try {
    const cacheKey = 'genres';
    const cached = db.get(cacheKey);
    
    if (cached) {
      return res.json(cached);
    }

    const genres = await scraper.getGenres();
    
    const response = {
      success: true,
      data: genres
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

router.get('/:genre', async (req, res) => {
  try {
    const { genre } = req.params;
    const { page = 1 } = req.query;
    
    const cacheKey = `genre_${genre}_${page}`;
    const cached = db.get(cacheKey);
    
    if (cached) {
      return res.json(cached);
    }

    const anime = await scraper.searchAnime(genre, page);
    
    const response = {
      success: true,
      genre,
      page: parseInt(page),
      data: anime
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