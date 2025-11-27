const validApiKeys = new Set();

// Load API keys from environment variables in production
if (process.env.NODE_ENV === 'production') {
  const envApiKeys = process.env.API_KEYS;
  if (envApiKeys) {
    envApiKeys.split(',').forEach(key => {
      if (key.trim()) {
        validApiKeys.add(key.trim());
      }
    });
    console.log(`Loaded ${validApiKeys.size} API keys from environment`);
  }
}

function generateApiKey() {
  const { v4: uuidv4 } = require('uuid');
  const apiKey = uuidv4();
  validApiKeys.add(apiKey);
  return apiKey;
}

function addApiKey(apiKey) {
  validApiKeys.add(apiKey);
  return true;
}

function removeApiKey(apiKey) {
  return validApiKeys.delete(apiKey);
}

function listApiKeys() {
  return Array.from(validApiKeys);
}

function authenticateApiKey(req, res, next) {
  // Skip auth untuk health check dan key generation
  if (req.path === '/' || req.path === '/generate-key') {
    return next();
  }
  
  // ✅ PERBAIKI: Untuk admin routes, kita tetap butuh auth
  const apiKey = req.headers['x-api-key'];
  
  if (!apiKey) {
    return res.status(401).json({ 
      success: false,
      error: 'API key required',
      message: 'Include x-api-key header in your request'
    });
  }
  
  if (!validApiKeys.has(apiKey)) {
    return res.status(403).json({ 
      success: false,
      error: 'Invalid API key',
      message: 'The provided API key is not valid'
    });
  }
  
  next();
}

module.exports = {
  generateApiKey,
  addApiKey,
  removeApiKey,
  listApiKeys,
  authenticateApiKey,
  validApiKeys
};