const path = require('path');
const express = require('express');
const { myPreferredJobResults } = require('./lib/braintrust');
const { textRandomJob } = require('./lib/twilio');
const { getFeedsResults } = require('./lib/feeds');

const FEED_URLS = {
  NO_DESK: 'https://nodesk.co/remote-jobs/index.xml',
  WE_WORK_REMOTELY: 'https://weworkremotely.com/categories/remote-programming-jobs.rss'
};

const app = express();

app.use(express.static('public'));
app.set('views', path.join(__dirname, '/views'));

app.use((req, res, next) => {
  console.log(`${req.method} request for '${req.url}'`);
  next();
});

app.get('/ping', async (req, res) => {
  res.send('pong');
});

app.get('/braintrust', async (req, res) => {
  const jobs = await myPreferredJobResults();

  const { textToNumber } = req.query;
  textRandomJob(jobs, textToNumber);

  res.send({ count: jobs.length, links: jobs.map(job => job.full_link), jobs });
});

app.get('/braintrust.html', async (req, res) => {
  res.render('braintrust.ejs', { jobs: await myPreferredJobResults() });
});

app.get('/feeds.html', async (req, res) => {
  res.render('feeds.ejs', { jobs: (await getFeedsResults(Object.values(FEED_URLS))).jobs });
});

app.get('/nodesk', async (req, res) => {
  res.send(await getFeedsResults([FEED_URLS.NO_DESK]));
});

app.get('/weworkremotely', async (req, res) => {
  res.send(await getFeedsResults([FEED_URLS.WE_WORK_REMOTELY]));
});

app.get('/feeds', async (req, res) => {
  res.send(await getFeedsResults(Object.values(FEED_URLS)));
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(
    `The job-scout container started successfully and is listening for HTTP requests on ${PORT}`
  );
});