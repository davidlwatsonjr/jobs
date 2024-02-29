const { getFeedsResults } = require("../lib/feeds");
const { emailAllJobs } = require("../lib/emailer");
const { textBestRandomJob } = require("../lib/texter");
const { getFile, saveFile } = require("../lib/storage");

const FEED_URLS = {
  NO_DESK: "https://nodesk.co/remote-jobs/index.xml",
  WE_WORK_REMOTELY:
    "https://weworkremotely.com/categories/remote-programming-jobs.rss",
};

const feeds = async (req, res) => {
  const { textToNumber, emailToAddress } = req.query;

  const savedJobsFilename = "jobscout/feeds.json";
  const [{ jobs }, knownJobsResponse] = await Promise.all([
    getFeedsResults(Object.values(FEED_URLS)),
    getFile(savedJobsFilename),
  ]);

  const knownJobs = knownJobsResponse.ok ? await knownJobsResponse.json() : [];
  const unknownJobs = jobs.filter(
    ({ fullLink }) => !knownJobs.find((job) => job.fullLink === fullLink),
  );

  if (emailToAddress) {
    emailAllJobs(unknownJobs, emailToAddress);
    saveFile(savedJobsFilename, JSON.stringify(jobs));
  }
  textBestRandomJob(unknownJobs, textToNumber);

  res.send({ jobs });
};

const feedsHTML = async (req, res) => {
  res.render("feeds.ejs", await getFeedsResults(Object.values(FEED_URLS)));
};

const nodesk = async (req, res) => {
  res.send(await getFeedsResults([FEED_URLS.NO_DESK]));
};

const weworkremotely = async (req, res) => {
  res.send(await getFeedsResults([FEED_URLS.WE_WORK_REMOTELY]));
};

module.exports = {
  feeds,
  feedsHTML,
  nodesk,
  weworkremotely,
};
