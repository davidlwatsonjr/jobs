const { EMAILER_BASE_URL, EMAILER_API_KEY } = process.env;

const sendEmail = async (body, subject, to) => {
  const query = new URLSearchParams({ to, subject, body });
  const url = `${EMAILER_BASE_URL}/send?${query}`;
  const headers = { "x-api-key": EMAILER_API_KEY };

  console.log(`Sending email using ${url}`);
  return await fetch(url, { headers });
};

const emailUnemailedJobs = async (jobs, toEmailAddress) => {
  const unemailedJobs = jobs.filter((job) => !job.emailed);
  if (unemailedJobs.length > 0 && toEmailAddress) {
    console.log(`Emailing ${unemailedJobs.length} jobs to ${toEmailAddress}.`);

    const subject = `${unemailedJobs.length} New Jobs Available`;
    const body = unemailedJobs
      .map((job) => {
        return `<p><a href="${job.fullLink}">${job.title} (${job.createdDate})</a></p>`;
      })
      .join("");

    for (const job of unemailedJobs) {
      job.emailed = true;
    }

    await sendEmail(body, subject, toEmailAddress);
  }
};

module.exports = { sendEmail, emailUnemailedJobs };
