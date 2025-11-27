class RateLimiter {
  constructor(maxRequests, windowMs) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
    this.requests = new Map();
  }

  cleanup() {
    const now = Date.now();
    for (const [key, value] of this.requests.entries()) {
      if (now - value.startTime > this.windowMs) {
        this.requests.delete(key);
      }
    }
  }

  check(key) {
    this.cleanup();
    
    const now = Date.now();
    const clientData = this.requests.get(key) || { count: 0, startTime: now };
    
    if (now - clientData.startTime > this.windowMs) {
      // Reset counter for new window
      clientData.count = 1;
      clientData.startTime = now;
      this.requests.set(key, clientData);
      return { allowed: true, remaining: this.maxRequests - 1 };
    }
    
    if (clientData.count >= this.maxRequests) {
      return { 
        allowed: false, 
        remaining: 0,
        retryAfter: Math.ceil((clientData.startTime + this.windowMs - now) / 1000)
      };
    }
    
    clientData.count++;
    this.requests.set(key, clientData);
    
    return { 
      allowed: true, 
      remaining: this.maxRequests - clientData.count 
    };
  }
}

// Global rate limiter: 100 requests per minute per API key/IP
const globalLimiter = new RateLimiter(100, 60000);

// More strict limiter for search endpoints
const searchLimiter = new RateLimiter(30, 60000);

module.exports = {
  globalLimiter,
  searchLimiter,
  RateLimiter
};