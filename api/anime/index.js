const express = require('express');
const router = express.Router();
const scraper = require('../scraper');
const db = require('../database');

router.get('/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    
    const cacheKey = `anime_${slug}`;
    const cached = db.get(cacheKey);
    
    if (cached) {
      return res.json(cached);
    }

    // For now, return sample data
    const detail = {
      title: slug.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
      slug: slug,
      thumbnail: 'https://via.placeholder.com/400x600/333/fff?text=Anime+Detail',
      synopsis: `This is the synopsis for ${slug}. The story follows...`,
      rating: '8.5',
      episodeList: [
        { number: '1', title: 'Episode 1', url: '#' },
        { number: '2', title: 'Episode 2', url: '#' }
      ]
    };

    const response = {
      success: true,
      data: detail
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