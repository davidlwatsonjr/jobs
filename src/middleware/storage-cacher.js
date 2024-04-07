const {
  getCacheKey,
} = require("@davidlwatsonjr/microservice-middleware/src/lib/getCacheKey");
const storage = require("../lib/google-cloud-storage");

const storageCacher = (duration, namespace, headerKeys) => {
  return async (req, res, next) => {
    if (req.query.storageCacher === "off") {
      next();
      return;
    }

    const url = req.originalUrl || req.url;
    const cacheKey = getCacheKey(url, namespace, req.headers, headerKeys);
    const cacheFilename = `${namespace}/cache/${cacheKey}`;

    const cacheObjectString = await storage.getFile(cacheFilename);

    const cacheObject = cacheObjectString
      ? JSON.parse(cacheObjectString)
      : null;
    if (cacheObject && cacheObject.expires > Date.now()) {
      res.send(cacheObject.body);
    } else {
      res.preStorageCachedSendFn = res.send;
      res.send = (body) => {
        storage.saveFile(
          cacheFilename,
          JSON.stringify({
            body,
            expires: Date.now() + (duration ? duration * 1000 : 0),
          }),
          { cacheTTL: 0 },
        );
        res.send = res.preStorageCachedSendFn;
        res.send(body);
      };
      next();
    }
  };
};

module.exports = { storageCacher };
