const express = require('express');
const { myPreferredJobResults } = require('./braintrust');
const { sendText } = require('./twilio');
const { getFeedsResults } = require('./feeds');

const FEED_URLS = {
  NO_DESK: 'https://nodesk.co/remote-jobs/index.xml',
  WE_WORK_REMOTELY: 'https://weworkremotely.com/categories/remote-programming-jobs.rss'
};

const app = express();

app.use(express.static('public'));

app.use((req, res, next) => {
  console.log(`${req.method} request for '${req.url}'`);
  next();
});

app.get('/ping', async (req, res) => {
  res.send('pong');
});

app.get('/braintrust', async (req, res) => {
  const { textToNumber } = req.query;

  const jobs = (await myPreferredJobResults()).map(job => ({
    full_link: `https://app.usebraintrust.com/jobs/${job.id}`,
    ...job
  }));

  if (jobs.length > 0 && textToNumber) {
    const randomJobFullLink = jobs[Math.floor(Math.random() * jobs.length)].full_link;
    await sendText(
      `${jobs.length} new Braintrust jobs available. ${randomJobFullLink}`, textToNumber
    );
  }

  res.send({ count: jobs.length, links: jobs.map(job => job.full_link), jobs });
});

app.get('/braintrust.html', async (req, res) => {
  const jobs = (await myPreferredJobResults()).map(job => ({
    full_link: `https://app.usebraintrust.com/jobs/${job.id}`,
    ...job
  }));

  res.render('braintrust.ejs', { jobs });
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