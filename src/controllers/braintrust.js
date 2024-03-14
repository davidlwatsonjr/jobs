const {
  getUnappliedMatchingOpenEngineeringJobs,
  getAllApplications,
} = require("../lib/braintrust");
const { emailUnemailedJobs } = require("../lib/emailer");
const { textRandomJob } = require("../lib/texter");
const { getFile, saveFile } = require("../lib/storage");

const braintrust = async (req, res) => {
  const { textToNumber, emailToAddress } = req.query;

  const savedJobsFilename = "jobs/braintrust.json";
  const [jobs, knownJobsResponse] = await Promise.all([
    getUnappliedMatchingOpenEngineeringJobs(),
    getFile(savedJobsFilename),
  ]);

  const knownJobs = knownJobsResponse?.ok ? await knownJobsResponse.json() : [];
  const unknownJobs = jobs.filter(
    ({ fullLink }) => !knownJobs.find((job) => job.fullLink === fullLink),
  );

  if (emailToAddress) {
    emailUnemailedJobs(unknownJobs, emailToAddress);
    saveFile(savedJobsFilename, JSON.stringify(jobs));
  }
  textRandomJob(unknownJobs, textToNumber);

  res.send({ jobs });
};

const braintrustApplications = async (req, res) => {
  const applications = await getAllApplications();
  res.send({ applications });
};

module.exports = {
  braintrust,
  braintrustApplications,
};
