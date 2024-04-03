const { fetch } = require("@davidlwatsonjr/fetch-retry-with-cache");

const { filterForUntextedJobs, filterforNewJobs } = require("./jobs");

const { TEXTER_BASE_URL, TEXTER_API_KEY } = process.env;

if (!TEXTER_BASE_URL || !TEXTER_API_KEY) {
  console.warn(
    "TEXTER_BASE_URL and TEXTER_API_KEY environment variables need to be set for emailer to work.",
  );
}

const sendText = async (body, to) => {
  if (!TEXTER_BASE_URL || !TEXTER_API_KEY) {
    return;
  }
  const query = new URLSearchParams({ to, body });
  const url = `${TEXTER_BASE_URL}/send?${query}`;
  const headers = { "x-api-key": TEXTER_API_KEY };

  console.log(`Sending text using ${url}`);
  return await fetch(url, { headers });
};

const textFirstJob = async (jobs, toNumber) => {
  if (jobs.length > 0 && toNumber) {
    const { fullLink } = jobs[0];

    console.log(
      `Texting first job (${fullLink}) out of ${jobs.length} to ${toNumber}.`,
    );
    await sendText(
      `${jobs.length} new jobs available. First: ${fullLink}`,
      toNumber,
    );
  }
};

const textRandomJob = async (jobs, toNumber) => {
  if (jobs.length > 0 && toNumber) {
    const { fullLink } = jobs[Math.floor(Math.random() * jobs.length)];

    console.log(
      `Texting random job (${fullLink}) out of ${jobs.length} to ${toNumber}.`,
    );
    await sendText(
      `${jobs.length} new jobs available. Random: ${fullLink}`,
      toNumber,
    );
  }
};

const textBestRandomJob = async (jobs, textToNumber) => {
  if (!textToNumber) return;
  const originalJobs = [...jobs];
  const untextedJobs = filterForUntextedJobs(originalJobs);
  const newUntextedJobs = filterforNewJobs(untextedJobs);
  const textableJobs =
    (newUntextedJobs.length && newUntextedJobs) ||
    (untextedJobs.length && untextedJobs) ||
    originalJobs;
  const randomJob =
    textableJobs[Math.floor(Math.random() * textableJobs.length)];
  const { fullLink } = randomJob;

  console.log(
    `Texting best (random, new, untexted) job out of ${originalJobs.length} to ${textToNumber}.`,
  );
  await sendText(
    `${jobs.length} new jobs available. Random: ${fullLink}`,
    textToNumber,
  );

  const originalJob = originalJobs.find((job) => job.fullLink === fullLink);
  originalJob.jobsHasTexted = true;
  return originalJobs;
};

module.exports = {
  sendText,
  textFirstJob,
  textRandomJob,
  textBestRandomJob,
};
