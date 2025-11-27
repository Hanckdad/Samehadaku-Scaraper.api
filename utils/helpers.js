function generateSlug(text) {
  return text
    .toLowerCase()
    .replace(/[^\w ]+/g, '')
    .replace(/ +/g, '-');
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function validatePage(page) {
  const pageNum = parseInt(page) || 1;
  return Math.max(1, pageNum);
}

function sanitizeHtml(text) {
  if (!text) return '';
  return text
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<[^>]*>/g, '')
    .trim();
}

function formatAnimeResponse(data, additionalInfo = {}) {
  return {
    success: true,
    timestamp: new Date().toISOString(),
    ...additionalInfo,
    data: data
  };
}

function formatErrorResponse(error, statusCode = 500) {
  return {
    success: false,
    error: error.message,
    timestamp: new Date().toISOString(),
    statusCode: statusCode
  };
}

module.exports = {
  generateSlug,
  delay,
  validatePage,
  sanitizeHtml,
  formatAnimeResponse,
  formatErrorResponse
};