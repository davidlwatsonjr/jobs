const { myPreferredJobResults } = require("../lib/braintrust");
const { emailAllJobs } = require("../lib/emailer");
const { textRandomJob } = require("../lib/texter");
const { textBestRandomJob } = require("../lib/texter");
const { getFeedsResults } = require("../lib/feeds");
const { getFile, saveFile } = require("../lib/storage");

const FEED_URLS = {
  NO_DESK: "https://nodesk.co/remote-jobs/index.xml",
  WE_WORK_REMOTELY:
    "https://weworkremotely.com/categories/remote-programming-jobs.rss",
};

const jobs = async (req, res) => {
  const { textToNumber, emailToAddress } = req.query;

  const savedJobsFilename = "jobscout/jobs.json";
  const [{ jobs: braintrustJobs }, { jobs: feedsJobs }, knownJobsResponse] =
    await Promise.all([
      myPreferredJobResults(),
      getFeedsResults(Object.values(FEED_URLS)),
      getFile(savedJobsFilename),
    ]);
  const jobs = [...braintrustJobs, ...feedsJobs];
  saveFile(savedJobsFilename, JSON.stringify(jobs));

  const knownJobs = knownJobsResponse.ok ? await knownJobsResponse.json() : [];
  const unknownJobs = jobs.filter(
    ({ full_link }) => !knownJobs.find((job) => job.full_link === full_link),
  );

  emailAllJobs(unknownJobs, emailToAddress);
  textRandomJob(unknownJobs, textToNumber);

  res.send({ jobs });
};

module.exports = {
  jobs,
};
