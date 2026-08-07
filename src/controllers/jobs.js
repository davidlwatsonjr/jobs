const { getOpenEngineeringJobs } = require("../lib/braintrust");
const { emailUnemailedJobs } = require("../lib/emailer");
const { textRandomJob } = require("../lib/texter");
const { getFeedsResults } = require("../lib/feeds");
const { getProviderJobs } = require("../lib/providers");
const { dedupeAndRankJobs } = require("../lib/jobRanking");
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
    ? getFile(userJobsSettingsFilename, { cacheTTL: 0 })
    : Promise.resolve({ ok: false });
  const { textToNumber, emailToAddress } = req.query;

  const [
    braintrustJobs,
    feedsJobs,
    providerJobs,
    savedJobsResponse,
    userJobsSettingsResponse,
  ] = await Promise.all([
    getOpenEngineeringJobs(),
    getFeedsResults(Object.values(FEED_URLS)),
    getProviderJobs(),
    getFile(defaultSavedJobsFilename),
    userJobsSettingsPromise,
  ]);
  const currentJobs = dedupeAndRankJobs([
    ...braintrustJobs,
    ...feedsJobs,
    ...providerJobs,
  ]);
  const savedJobs = savedJobsResponse?.ok ? await savedJobsResponse.json() : [];

  const newCurrentJobs = currentJobs.filter(
    ({ fullLinkMD5 }) =>
      !savedJobs.find((job) => job.fullLinkMD5 === fullLinkMD5),
  );

  const jobs = currentJobs.map((currentJob) => {
    const savedJob = savedJobs.find(
      ({ fullLinkMD5 }) => fullLinkMD5 === currentJob.fullLinkMD5,
    );
    return savedJob ? { ...savedJob, ...currentJob } : currentJob;
  });

  await Promise.all([
    emailUnemailedJobs(jobs, emailToAddress),
    textRandomJob(newCurrentJobs, textToNumber),
  ]);

  saveFile(defaultSavedJobsFilename, JSON.stringify(jobs));

  const userJobsSettings = userJobsSettingsResponse?.ok
    ? await userJobsSettingsResponse.json()
    : [];
  for (const job of jobs) {
    const userJobSettings = userJobsSettings?.find(
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

  const savedJobsResponse = await getFile(savedJobsFilename, { cacheTTL: 0 });
  const savedJobs = savedJobsResponse?.ok ? await savedJobsResponse.json() : [];

  const existingJob = savedJobs.find((job) => job.fullLinkMD5 === fullLinkMD5);
  const newJob = { fullLinkMD5, ...body };

  if (existingJob) {
    Object.assign(existingJob, newJob);
  } else {
    savedJobs.push(newJob);
  }

  saveFile(savedJobsFilename, JSON.stringify(savedJobs), { cacheTTL: 0 });

  res.send(newJob);
};

module.exports = {
  getJobs,
  putJob,
};
