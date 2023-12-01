const { myPreferredJobResults } = require("../lib/braintrust");
const { textRandomJob } = require("../lib/texter");
const { emailAllJobs } = require("../lib/emailer");

const braintrust = async (req, res) => {
  const { textToNumber, emailToAddress } = req.query;

  const jobResults = await myPreferredJobResults();
  const { jobs } = jobResults;

  emailAllJobs(jobs, emailToAddress);
  textRandomJob(jobs, textToNumber);

  res.send(jobResults);
};

const braintrustHTML = async (req, res) => {
  res.render("braintrust.ejs", await myPreferredJobResults());
};

module.exports = {
  braintrust,
  braintrustHTML,
};
