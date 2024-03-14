const { getMatchingOpenEngineeringJobs } = require("../lib/braintrust");
const { emailUnemailedJobs } = require("../lib/emailer");
const { textRandomJob } = require("../lib/texter");
const { getFeedsResults } = require("../lib/feeds");
const { getFile, saveFile } = require("../lib/storage");
const { isUUID } = require("../util/isUUID");

const FEED_URLS = {
  NO_DESK: "https://nodesk.co/remote-jobs/index.xml",
  WE_WORK_REMOTELY:
    "https://weworkremotely.com/categories/remote-programming-jobs.rss",
};

const defaultSavedJobsFilename = "jobs/jobs.json";

const getJobs = async (req, res) => {
  const userUUID = req.headers["x-useruuid"];
  const savedJobsFilename = isUUID(userUUID)
    ? `jobs/by-user-uuid/${userUUID}.json`
    : defaultSavedJobsFilename;
  const { textToNumber, emailToAddress } = req.query;

  const [braintrustJobs, { jobs: feedsJobs }, savedJobsResponse] =
    await Promise.all([
      getMatchingOpenEngineeringJobs(),
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

  emailUnemailedJobs(jobs, emailToAddress);
  textRandomJob(newCurrentJobs, textToNumber);

  saveFile(savedJobsFilename, JSON.stringify(jobs));
  res.send({ jobs });
};

const putJob = async (req, res) => {
  const userUUID = req.headers["x-useruuid"];
  const savedJobsFilename = isUUID(userUUID)
    ? `jobs/by-user-uuid/${userUUID}.json`
    : defaultSavedJobsFilename;
  const { fullLinkMD5 } = req.params;
  const { body } = req;

  const savedJobsResponse = await getFile(savedJobsFilename);
  const savedJobs = savedJobsResponse.ok ? await savedJobsResponse.json() : [];

  const job = savedJobs.find((job) => job.fullLinkMD5 === fullLinkMD5);
  if (!job) {
    res.status(404).send({ error: "Job not found." });
    return;
  }

  Object.assign(job, body);
  await saveFile(savedJobsFilename, JSON.stringify(savedJobs));
  res.send({ job });
};

module.exports = {
  getJobs,
  putJob,
};
