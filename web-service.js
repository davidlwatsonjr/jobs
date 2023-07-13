const express = require('express');
const { myPreferredJobResults } = require('./braintrust');
const { sendText } = require('./twilio');
const { getWeWorkRemotelyFeed } = require('./weworkremotely');

const app = express();

app.get('/ping', (req, res) => {
  res.send('pong');
});

app.get('/', async (req, res) => {
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

app.get('/weworkremotely', async (req, res) => {
  const weworkremotelyFeed = await getWeWorkRemotelyFeed();

  const jobs = weworkremotelyFeed.items.map(item => ({ title: item.title, link: item.link, category: item.category }));

  res.send({ count: jobs.length, links: jobs.map(job => job.link), jobs });
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(
    `The job-scout container started successfully and is listening for HTTP requests on ${PORT}`
  );
});