const { getOpenEngineeringJobs } = require("../lib/braintrust");
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
  const userJobsSettingsFilename = `jobs/by-user-uuid/${userUUID}.json`;
  const userJobsSettingsPromise = isUUID(userUUID)
    ? getFile(userJobsSettingsFilename)
    : Promise.resolve({ ok: false });
  const { textToNumber, emailToAddress } = req.query;

  const [
    braintrustJobs,
    { jobs: feedsJobs },
    savedJobsResponse,
    userJobsSettingsResponse,
  ] = await Promise.all([
    getOpenEngineeringJobs(),
    getFeedsResults(Object.values(FEED_URLS)),
    getFile(defaultSavedJobsFilename),
    userJobsSettingsPromise,
  ]);
  const currentJobs = [...braintrustJobs, ...feedsJobs];
  const savedJobs = savedJobsResponse?.ok ? await savedJobsResponse.json() : [];

  const newCurrentJobs = currentJobs.filter(
    ({ fullLinkMD5 }) =>
      !savedJobs.find((job) => job.fullLinkMD5 === fullLinkMD5),
  );

  const savedCurrentJobs = savedJobs.filter(({ fullLinkMD5 }) =>
    currentJobs.find((job) => job.fullLinkMD5 === fullLinkMD5),
  );

  const jobs = [...newCurrentJobs, ...savedCurrentJobs];
  jobs.sort((a, b) => new Date(b.createdDate) - new Date(a.createdDate));

  await Promise.all([
    emailUnemailedJobs(jobs, emailToAddress),
    textRandomJob(newCurrentJobs, textToNumber),
  ]);

  saveFile(defaultSavedJobsFilename, JSON.stringify(jobs));

  const userJobsSettings = userJobsSettingsResponse?.ok
    ? await userJobsSettingsResponse.json()
    : [];
  for (const job of jobs) {
    const userJobSettings = userJobsSettings.find(
      (userJobSetting) => userJobSetting.fullLinkMD5 === job.fullLinkMD5,
    );
    if (userJobSettings) {
      Object.assign(job, userJobSettings);
    }
  }

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
  const savedJobs = savedJobsResponse?.ok ? await savedJobsResponse.json() : [];

  const existingJob = savedJobs.find((job) => job.fullLinkMD5 === fullLinkMD5);
  const newJob = { fullLinkMD5, ...body };

  if (existingJob) {
    Object.assign(existingJob, newJob);
  } else {
    savedJobs.push(newJob);
  }

  saveFile(savedJobsFilename, JSON.stringify(savedJobs));

  res.send(newJob);
};

module.exports = {
  getJobs,
  putJob,
};
