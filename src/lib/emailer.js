const { EMAILER_BASE_URL, EMAILER_API_KEY } = process.env;

const sendEmail = async (body, subject, to) => {
  const query = new URLSearchParams({ to, subject, body });
  const url = `${EMAILER_BASE_URL}/send?${query}`;
  const headers = { "x-api-key": EMAILER_API_KEY };

  console.log(`Sending email using ${url}`);
  return await fetch(url, { headers });
};

const emailAllJobs = async (jobs, toEmailAddress) => {
  if (jobs.length > 0 && toEmailAddress) {
    console.log(`Emailing ${jobs.length} jobs to ${toEmailAddress}.`);

    const subject = `${jobs.length} New Jobs Available`;
    const body = jobs
      .map((job) => {
        return `<p><a href="${job.full_link}">${job.title} (${job.createdDate})</a></p>`;
      })
      .join("");

    await sendEmail(body, subject, toEmailAddress);
  }
};

module.exports = { sendEmail, emailAllJobs };
