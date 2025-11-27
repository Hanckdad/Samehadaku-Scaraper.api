const validApiKeys = new Set();

// Generate API key (you can store this in environment variables)
function generateApiKey() {
  const { v4: uuidv4 } = require('uuid');
  const apiKey = uuidv4();
  validApiKeys.add(apiKey);
  return apiKey;
}

function authenticateApiKey(req, res, next) {
  const apiKey = req.headers['x-api-key'];
  
  if (!apiKey) {
    return res.status(401).json({ error: 'API key required' });
  }
  
  if (!validApiKeys.has(apiKey)) {
    return res.status(403).json({ error: 'Invalid API key' });
  }
  
  next();
}

module.exports = {
  generateApiKey,
  authenticateApiKey,
  validApiKeys
};