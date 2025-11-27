const validApiKeys = new Set(['Bayu Official', 'test', 'demo', 'any-key']);

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
  // ✅ NONAKTIFKAN AUTH - TERIMA SEMUA REQUEST
  console.log(`✅ Request accepted: ${req.method} ${req.path} - Key: ${req.headers['x-api-key'] || 'none'}`);
  return next();
  
  /* KODE ASLI (DICOMMENT):
  const apiKey = req.headers['x-api-key'];
  
  if (!apiKey) {
    return res.status(401).json({ 
      success: false,
      error: 'API key required'
    });
  }
  
  if (!validApiKeys.has(apiKey)) {
    return res.status(403).json({ 
      success: false,
      error: 'Invalid API key'
    });
  }
  
  next();
  */
}

module.exports = {
  generateApiKey,
  addApiKey,
  removeApiKey,
  listApiKeys,
  authenticateApiKey,
  validApiKeys
};