const express = require('express');
const router = express.Router();
const db = require('./database');

router.get('/', (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        status: 'active',
        timestamp: new Date().toISOString(),
        memory: process.memoryUsage(),
        uptime: process.uptime()
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;