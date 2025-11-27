class MemoryDatabase {
  constructor() {
    this.cache = new Map();
  }

  set(key, value, ttl = 300000) {
    const item = {
      value,
      expiry: Date.now() + ttl
    };
    this.cache.set(key, item);
    return true;
  }

  get(key) {
    const item = this.cache.get(key);
    if (!item) return null;

    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return null;
    }

    return item.value;
  }

  clear() {
    this.cache.clear();
  }
}

module.exports = new MemoryDatabase();