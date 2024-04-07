const {
  getCacheKey,
} = require("@davidlwatsonjr/microservice-middleware/src/lib/getCacheKey");
const storage = require("../lib/google-cloud-storage");

const storageCacheBuster = (namespace, headerKeys, urls = []) => {
  return (req, res, next) => {
    if (!urls?.length) {
      urls = [req.originalUrl || req.url];
    }
    urls.map((url) => {
      const cacheKey = getCacheKey(url, namespace, req.headers, headerKeys);
      const cacheFilename = `${namespace}/cache/${cacheKey}`;
      return storage.deleteFile(cacheFilename);
    });
    next();
  };
};

module.exports = { storageCacheBuster };
