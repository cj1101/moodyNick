const fs = require('fs');
const path = require('path');

const CACHE_DIR = path.join(__dirname, '..', 'data');
const CACHE_FILE = path.join(CACHE_DIR, 'topProducts.json');

const ensureCacheDir = () => {
  if (!fs.existsSync(CACHE_DIR)) {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
  }
};

const readCacheFile = () => {
  try {
    if (!fs.existsSync(CACHE_FILE)) {
      return null;
    }

    const fileContents = fs.readFileSync(CACHE_FILE, 'utf8');
    if (!fileContents.trim()) {
      return null;
    }

    const parsed = JSON.parse(fileContents);
    if (parsed && Array.isArray(parsed.products)) {
      return parsed;
    }

    return null;
  } catch (error) {
    console.error('[ProductCache] Failed to read cache file:', error);
    return null;
  }
};

const writeCacheFile = (products) => {
  try {
    ensureCacheDir();
    const payload = {
      products,
      lastUpdated: new Date().toISOString(),
    };

    fs.writeFileSync(CACHE_FILE, JSON.stringify(payload, null, 2), 'utf8');
  } catch (error) {
    console.error('[ProductCache] Failed to write cache file:', error);
  }
};

const getCachedProducts = () => {
  const cached = readCacheFile();
  return cached ? cached.products : null;
};

module.exports = {
  getCachedProducts,
  writeCacheFile,
  CACHE_FILE,
};

