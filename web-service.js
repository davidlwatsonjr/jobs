const express = require('express');
const { myPreferredJobResults } = require('./braintrust');
const { sendText } = require('./twilio');

const app = express();

app.get('/', async (req, res) => {
  const { textToNumber } = req.query;

  const jobs = await myPreferredJobResults();

  if (jobs.length > 0 && textToNumber) {
    const randomJobId = jobs[Math.floor(Math.random() * jobs.length)].id;
    await sendText(
      `${jobs.length} new Braintrust jobs available. https://app.usebraintrust.com/jobs/${randomJobId}/`, textToNumber
    );
  }

  res.send({ count: jobs.length, jobs });
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(
    `The job-scout container started successfully and is listening for HTTP requests on ${PORT}`
  );
});