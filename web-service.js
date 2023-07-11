const express = require('express');
const { myPreferredJobResults } = require('./braintrust');
const { sendText } = require('./twilio');

const app = express();

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

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(
    `The job-scout container started successfully and is listening for HTTP requests on ${PORT}`
  );
});