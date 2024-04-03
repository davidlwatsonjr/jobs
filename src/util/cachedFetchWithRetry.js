const memoryCache = {};

const convertTextToPartialFetchReponse = (text) => ({
  ok: async () => Promise.resolve(true),
  text: async () => Promise.resolve(text),
  json: async () => Promise.resolve(JSON.parse(text)),
});

const fetch = async (url, options) => {
  const cacheKeySeed = JSON.stringify({ url, options });
  const cacheKey = require("crypto")
    .createHash("md5")
    .update(cacheKeySeed)
    .digest("hex");

  if (!memoryCache[cacheKey]) {
    console.log(`Cache key not found: ${cacheKey}`);

    let fetchFn;
    try {
      fetchFn = require("fetch-retry")(global.fetch);
    } catch (err) {
      fetchFn = global.fetch;
    }

    const retryConfig = {
      retries: 5,
      retryDelay: (attempt) => Math.pow(2, attempt) * 500,
    };

    const fetchResponse = await fetchFn(url, { ...retryConfig, ...options });
    memoryCache[cacheKey] = await fetchResponse.text();

    setTimeout(() => {
      delete memoryCache[cacheKey];
    }, 60000);
  }

  console.log(`Returning cached ${cacheKey}`);
  return Promise.resolve(
    convertTextToPartialFetchReponse(memoryCache[cacheKey]),
  );
};

module.exports = { fetch };
