const express = require('express');
const router = express.Router();
const { 
  generateApiKey, 
  addApiKey, 
  removeApiKey, 
  listApiKeys
} = require('../middleware/auth');

// Get all API keys
router.get('/keys', (req, res) => {
  try {
    const keys = listApiKeys();
    
    res.json({
      success: true,
      count: keys.length,
      keys: keys.map(key => ({
        key: key,
        masked: key.substring(0, 8) + '...' + key.substring(key.length - 4)
      }))
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Generate new API key
router.post('/keys/generate', (req, res) => {
  try {
    const apiKey = generateApiKey();
    
    res.json({
      success: true,
      apiKey,
      message: 'New API key generated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Add existing API key
router.post('/keys', (req, res) => {
  try {
    const { apiKey } = req.body;
    
    if (!apiKey) {
      return res.status(400).json({
        success: false,
        error: 'API key is required'
      });
    }
    
    addApiKey(apiKey);
    
    res.json({
      success: true,
      message: 'API key added successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Remove API key
router.delete('/keys/:key', (req, res) => {
  try {
    const { key } = req.params;
    
    const removed = removeApiKey(key);
    
    if (!removed) {
      return res.status(404).json({
        success: false,
        error: 'API key not found'
      });
    }
    
    res.json({
      success: true,
      message: 'API key removed successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;