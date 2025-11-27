const express = require('express');
const router = express.Router();
const scraper = require('../lib/scraper');

// Get all genres
router.get('/', async (req, res) => {
  try {
    const genres = await scraper.getGenres();
    
    res.json({
      success: true,
      data: genres
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get anime by genre
router.get('/:genre', async (req, res) => {
  try {
    const { genre } = req.params;
    const { page = 1 } = req.query;
    
    const anime = await scraper.getAnimeByGenre(genre, page);
    
    res.json({
      success: true,
      genre,
      page: parseInt(page),
      data: anime
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;