const { parse } = require("rss-to-json");
const { md5 } = require("../util/md5");

const getFeedsResults = async (feedUrls) => {
  const feedResults = await Promise.all(
    feedUrls.map((feedUrl) => parse(feedUrl)),
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
