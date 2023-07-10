const express = require('express');
const { myPreferredJobResults } = require('./braintrust');
const { sendText } = require('./twilio');

const app = express();

app.get('/', async (req, res) => {
  const jobs = await myPreferredJobResults();

  if (jobs.length > 0) {
    await sendText(
      `${jobs.length} new Braintrust jobs available. https://app.usebraintrust.com/jobs/${jobs[0].id}/`
    );
  }

  res.send(jobs);
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(
    `The job-scout container started successfully and is listening for HTTP requests on ${PORT}`
  );
});