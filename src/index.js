require("dotenv").config();

const path = require("path");
const express = require("express");
const { myPreferredJobResults } = require("./lib/braintrust");
const { getFeedsResults } = require("./lib/feeds");
const { textRandomJob, textFirstJob } = require("./lib/texter");

const FEED_URLS = {
  NO_DESK: "https://nodesk.co/remote-jobs/index.xml",
  WE_WORK_REMOTELY:
    "https://weworkremotely.com/categories/remote-programming-jobs.rss",
};

const app = express();

app.use(express.static("src/public"));
app.set("views", path.join(__dirname, "views"));

app.use((req, res, next) => {
  console.log(`${req.method} request for '${req.url}'`);
  next();
});

app.get("/ping", async (req, res) => {
  res.send("pong");
});

app.get("/braintrust", async (req, res) => {
  const jobResults = await myPreferredJobResults();

  textRandomJob(jobResults.jobs, req.query.textToNumber);

  res.send(jobResults);
});

app.get("/braintrust.html", async (req, res) => {
  res.render("braintrust.ejs", await myPreferredJobResults());
});

app.get("/feeds", async (req, res) => {
  const feedsResults = await getFeedsResults(Object.values(FEED_URLS));

  textFirstJob(feedsResults.jobs, req.query.textToNumber);

  res.send(feedsResults);
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

app.use((err, req, res, next) => {
  const { message } = err;
  console.error(`ERROR - ${message}`);
  res.status(500).send(message);
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(
    `The job-scout container started successfully and is listening for HTTP requests on ${PORT}`
  );
});
