const { parse } = require('rss-to-json');

const getFeedsResults = async (feedUrls) => {
  const feedResults = await Promise.all(feedUrls.map(feedUrl => parse(feedUrl)));
  const feedItems = feedResults.flatMap(feedResult => feedResult.items);
  feedItems.sort((a, b) => { return b.created - a.created });

  const jobs = feedItems.map(item => ({ title: item.title, full_link: item.link }));
  const links = jobs.map(job => job.full_link);
  const count = jobs.length;

  return { count, links, jobs, feedItems, feedResults };
};

module.exports = { getFeedsResults };