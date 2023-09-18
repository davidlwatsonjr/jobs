const { parse } = require("rss-to-json");

const getFeedsResults = async (feedUrls) => {
  const feedResults = await Promise.all(
    feedUrls.map((feedUrl) => parse(feedUrl))
  );
  
  const jobs = feedResults
    .flatMap((feedResult) => feedResult.items)
    .map((job) => ({
      full_link: job.link,
      createdDate: new Date(job.created).toLocaleDateString(),
      ...job,
    }));

  jobs.sort((a, b) => b.created - a.created);

  return { jobs };
};

module.exports = { getFeedsResults };
