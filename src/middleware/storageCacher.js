const {
  getCacheKey,
} = require("@davidlwatsonjr/microservice-middleware/src/lib/getCacheKey");
const storage = require("../lib/storage");

const storageCacher = (duration, namespace, headerKeys) => {
  return async (req, res, next) => {
    if (req.query.storageCacher === "off") {
      next();
      return;
    }

    const url = req.originalUrl || req.url;
    const cacheKey = getCacheKey(url, namespace, req.headers, headerKeys);
    const cacheFilename = `jobs/cache/${cacheKey}`;
    const cachedStorageResponse = await storage.getFile(cacheFilename);

    const cachedBody = cachedStorageResponse?.ok
      ? await cachedStorageResponse.json()
      : null;
    if (cachedBody && cachedBody.expires > Date.now()) {
      res.send(cachedBody.body);
    } else {
      res.sendStorageCachedResponse = res.send;
      res.send = (body) => {
        storage.saveFile(
          cacheFilename,
          JSON.stringify({
            body,
            expires: Date.now() + (duration ? duration * 1000 : 0),
          }),
          { cacheTTL: 0 },
        );
        res.sendStorageCachedResponse(body);
      };
      next();
    }
  };
};

module.exports = { storageCacher };
