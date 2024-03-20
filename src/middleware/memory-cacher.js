const crypto = require("crypto");
const memoryCache = require("memory-cache");

const memoryCacher = (
  duration,
  namespace = "memory-cache",
  headerKeys = [],
) => {
  return (req, res, next) => {
    const url = req.originalUrl || req.url;
    const { headers } = req;
    const headerString = headerKeys
      .map((key) => key + "=" + headers[key])
      .join("&");
    const cacheKeyString = `${namespace}:${url}:${headerString}`;
    const cacheKey = crypto
      .createHash("md5")
      .update(cacheKeyString)
      .digest("hex");
    const cachedBody = memoryCache.get(cacheKey);
    if (cachedBody) {
      res.send(cachedBody);
      return;
    } else {
      res.sendResponse = res.send;
      res.send = (body) => {
        memoryCache.put(cacheKey, body, duration ? duration * 1000 : undefined);
        res.sendResponse(body);
      };
      next();
    }
  };
};

module.exports = { memoryCacher };
