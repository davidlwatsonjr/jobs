require("dotenv").config();

const path = require("path");
const express = require("express");
const { myPreferredJobResults } = require("./lib/braintrust");
const {
  gcpLogTransformer,
  requestLogger,
  serverErrorHandler,
} = require("@davidlwatsonjr/microservice-middleware");
const { getFeedsResults } = require("./lib/feeds");
const { textRandomJob } = require("./lib/texter");
const { emailAllJobs } = require("./lib/emailer");
const { sendText } = require("./lib/texter");
const { getFirstFile, uploadFile, updateFile } = require("./lib/storage");  

const FEED_URLS = {
  NO_DESK: "https://nodesk.co/remote-jobs/index.xml",
  WE_WORK_REMOTELY:
    "https://weworkremotely.com/categories/remote-programming-jobs.rss",
};

const app = express();

app.use(gcpLogTransformer);
app.use(requestLogger);

app.use(express.static("src/public"));
app.set("views", path.join(__dirname, "views"));

app.get("/ping", async (req, res) => {
  res.send("pong");
});

app.get("/braintrust", async (req, res) => {
  const { textToNumber, emailToAddress } = req.query;

  const jobResults = await myPreferredJobResults();
  const { jobs } = jobResults;

  emailAllJobs(jobs, emailToAddress);
  textRandomJob(jobs, textToNumber);

  res.send(jobResults);
});

app.get("/braintrust.html", async (req, res) => {
  res.render("braintrust.ejs", await myPreferredJobResults());
});

const addJobScoutFlags = (jobs, knownJobs) => {
  return jobs.map((job) => {
    const knownJob = knownJobs.find(
      (knownJob) => knownJob.full_link === job.full_link
    );
    return {
      ...job,
      isNewToJobScout: !!knownJob,
      jobScoutHasTexted: !!(knownJob && knownJob.jobScoutHasTexted),
    };
  });
};

const filterForUntextedJobs = (jobs) =>
  jobs.filter((job) => !job.jobScoutHasTexted);

const filterforNewJobs = (jobs) => jobs.filter((job) => job.isNewToJobScout);

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
  const { full_link } = randomJob;

  console.log(
    `Texting best (random, new, untexted) job out of ${originalJobs.length} to ${textToNumber}.`
  );
  await sendText(
    `${jobs.length} new jobs available. Random: ${full_link}`,
    textToNumber
  );

  const originalJob = originalJobs.find((job) => job.full_link === full_link);
  originalJob.jobScoutHasTexted = true;
  return originalJobs;
};

app.get("/feeds", async (req, res) => {
  const { textToNumber, emailToAddress } = req.query;

  const jobsStorageFilename = "jobscout.json";
  const [knownFeedsFileResponse, { jobs }] = await Promise.all([
    getFirstFile(`name='${jobsStorageFilename}'`),
    getFeedsResults(Object.values(FEED_URLS)),
  ]);

  emailAllJobs(jobs, emailToAddress);

  const knownJobs =
    (knownFeedsFileResponse && JSON.parse(knownFeedsFileResponse.data)) || [];
  const jobScoutJobs = addJobScoutFlags(jobs, knownJobs);

  await textBestRandomJob(jobScoutJobs, textToNumber);

  try {
    updateFile(knownFeedsFileResponse.params.id, JSON.stringify(jobScoutJobs));
  } catch (err) {
    uploadFile(JSON.stringify(jobScoutJobs), jobsStorageFilename);
  }

  res.send({ jobs });
});

app.get("/feeds.html", async (req, res) => {
  res.render("feeds.ejs", await getFeedsResults(Object.values(FEED_URLS)));
});

app.get("/nodesk", async (req, res) => {
  res.send(await getFeedsResults([FEED_URLS.NO_DESK]));
});

app.get("/weworkremotely", async (req, res) => {
  res.send(await getFeedsResults([FEED_URLS.WE_WORK_REMOTELY]));
});

app.use(serverErrorHandler);

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(
    `The job-scout container started successfully and is listening for HTTP requests on ${PORT}`
  );
});
