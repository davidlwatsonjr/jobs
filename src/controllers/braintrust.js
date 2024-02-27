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
  saveFile(savedJobsFilename, JSON.stringify(jobs));

  const knownJobs = knownJobsResponse.ok ? await knownJobsResponse.json() : [];
  const unknownJobs = jobs.filter(
    ({ id }) => !knownJobs.find((job) => job.id === id),
  );

  emailAllJobs(unknownJobs, emailToAddress);
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
