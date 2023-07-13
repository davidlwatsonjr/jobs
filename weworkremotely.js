const { parse } = require('rss-to-json');

const getWeWorkRemotelyFeed = async () => {
  return await parse('https://weworkremotely.com/categories/remote-programming-jobs.rss');
}

module.exports = {
  getWeWorkRemotelyFeed
};