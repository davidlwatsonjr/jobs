const { getFeedsResults } = require("../lib/feeds");
const { emailAllJobs } = require("../lib/emailer");
const { textBestRandomJob } = require("../lib/texter");
const { getFirstFile, uploadFile, updateFile } = require("../lib/storage");
const { addJobScoutFlags } = require("../lib/jobscout");

const FEED_URLS = {
  NO_DESK: "https://nodesk.co/remote-jobs/index.xml",
  WE_WORK_REMOTELY:
    "https://weworkremotely.com/categories/remote-programming-jobs.rss",
};

const feeds = async (req, res) => {
  const { textToNumber, emailToAddress } = req.query;

  const jobsStorageFilename = "jobscout.json";
  const [knownFeedsFileResponse, { jobs }] = await Promise.all([
    getFirstFile(`name='${jobsStorageFilename}'`),
    getFeedsResults(Object.values(FEED_URLS)),
  ]);

  emailAllJobs(jobs, emailToAddress);

  const knownJobs =
    (knownFeedsFileResponse && JSON.parse(knownFeedsFileResponse.data)) || [];
  const jobScoutJobs = addJobScoutFlags(jobs, knownJobs);

  await textBestRandomJob(jobScoutJobs, textToNumber);

  try {
    updateFile(knownFeedsFileResponse.params.id, JSON.stringify(jobScoutJobs));
  } catch (err) {
    uploadFile(JSON.stringify(jobScoutJobs), jobsStorageFilename);
  }

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
