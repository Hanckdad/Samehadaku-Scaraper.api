class MemoryDatabase {
  constructor() {
    this.cache = new Map();
    this.stats = {
      requests: 0,
      cacheHits: 0,
      cacheMisses: 0
    };
  }

  set(key, value, ttl = 300000) { // 5 minutes default
    const item = {
      value,
      expiry: Date.now() + ttl
    };
    this.cache.set(key, item);
    return true;
  }

  get(key) {
    this.stats.requests++;
    
    const item = this.cache.get(key);
    if (!item) {
      this.stats.cacheMisses++;
      return null;
    }

    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      this.stats.cacheMisses++;
      return null;
    }

    this.stats.cacheHits++;
    return item.value;
  }

  delete(key) {
    return this.cache.delete(key);
  }

  clear() {
    this.cache.clear();
    this.stats = {
      requests: 0,
      cacheHits: 0,
      cacheMisses: 0
    };
  }

  getStats() {
    const hitRate = this.stats.requests > 0 
      ? (this.stats.cacheHits / this.stats.requests) * 100 
      : 0;
    
    return {
      ...this.stats,
      hitRate: hitRate.toFixed(2) + '%',
      cacheSize: this.cache.size
    };
  }
}

module.exports = new MemoryDatabase();