const { myPreferredJobResults } = require("../lib/braintrust");
const { emailAllJobs } = require("../lib/emailer");
const { textRandomJob } = require("../lib/texter");
const { getFile, saveFile } = require("../lib/storage");

const braintrust = async (req, res) => {
  const { textToNumber, emailToAddress } = req.query;

  const savedJobsFilename = "jobscout/braintrust.json";
  const [{ jobs }, knownJobsResponse] = await Promise.all([
    myPreferredJobResults(),
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
  textRandomJob(unknownJobs, textToNumber);

  res.send({ jobs });
};

const braintrustHTML = async (req, res) => {
  res.render("braintrust.ejs", await myPreferredJobResults());
};

module.exports = {
  braintrust,
  braintrustHTML,
};
