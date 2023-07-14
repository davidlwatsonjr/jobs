const { parse } = require('rss-to-json');

const getFeedsResults = async (feedUrls) => {
    const feedResults = await Promise.all(feedUrls.map(feedUrl => parse(feedUrl)));
    const feedItems = feedResults.flatMap(feedResult => feedResult.items);
  
    const jobs = feedItems.map(item => ({ title: item.title, link: item.link }));
    const links = jobs.map(job => job.link);
    const count = jobs.length;
  
    return { count, links, jobs, feedResults };
  };
  
  module.exports = { getFeedsResults };