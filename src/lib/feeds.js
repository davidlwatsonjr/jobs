const { parse } = require("rss-to-json");
const { md5 } = require("../util/md5");

const getFeedsResults = async (feedUrls) => {
  const feedResults = await Promise.all(
    feedUrls.map(async (feedUrl) => {
      try {
        return await parse(feedUrl);
      } catch (err) {
        console.error(`ERROR parsing feed URL ${feedUrl}: ${err.message}`);
        return { items: [] };
      }
    }),
  );

  return feedResults
    .flatMap((feedResult) => feedResult.items)
    .map((job) => ({
      fullLink: job.link,
      fullLinkMD5: md5(job.link),
      createdDate: new Date(job.created).toLocaleDateString(),
      ...job,
    }));
};

module.exports = { getFeedsResults };
