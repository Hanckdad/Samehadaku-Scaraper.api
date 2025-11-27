const express = require('express');
const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const { url } = req.query;
    
    if (!url) {
      return res.status(400).json({
        success: false,
        error: 'URL parameter is required'
      });
    }

    const streamingLinks = {
      success: true,
      data: {
        episodeTitle: 'Sample Episode',
        providers: [
          {
            name: 'Provider 1',
            qualities: [
              {
                name: '360p',
                links: [
                  { server: 'Server A', url: '#' },
                  { server: 'Server B', url: '#' }
                ]
              }
            ]
          }
        ]
      }
    };
    
    res.json(streamingLinks);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;