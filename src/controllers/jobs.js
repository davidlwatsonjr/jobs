const { myPreferredJobResults } = require("../lib/braintrust");
const { emailAllJobs } = require("../lib/emailer");
const { textRandomJob } = require("../lib/texter");
const { getFeedsResults } = require("../lib/feeds");
const { getFile, saveFile } = require("../lib/storage");

const FEED_URLS = {
  NO_DESK: "https://nodesk.co/remote-jobs/index.xml",
  WE_WORK_REMOTELY:
    "https://weworkremotely.com/categories/remote-programming-jobs.rss",
};

const jobs = async (req, res) => {
  const { textToNumber, emailToAddress } = req.query;

  const savedJobsFilename = "jobs/jobs.json";
  const [{ jobs: braintrustJobs }, { jobs: feedsJobs }, savedJobsResponse] =
    await Promise.all([
      myPreferredJobResults(),
      getFeedsResults(Object.values(FEED_URLS)),
      getFile(savedJobsFilename),
    ]);
  const currentJobs = [...braintrustJobs, ...feedsJobs];
  const savedJobs = savedJobsResponse.ok ? await savedJobsResponse.json() : [];

  const newCurrentJobs = currentJobs.filter(
    ({ fullLink }) => !savedJobs.find((job) => job.fullLink === fullLink),
  );

  const savedCurrentJobs = savedJobs.filter(({ fullLink }) =>
    currentJobs.find((job) => job.fullLink === fullLink),
  );

  const jobs = [...newCurrentJobs, ...savedCurrentJobs];
  jobs.sort((a, b) => new Date(b.createdDate) - new Date(a.createdDate));

  if (emailToAddress) {
    emailAllJobs(newCurrentJobs, emailToAddress);
    saveFile(savedJobsFilename, JSON.stringify(jobs));
  }
  textRandomJob(newCurrentJobs, textToNumber);

  res.send({ jobs });
};

module.exports = {
  jobs,
};
