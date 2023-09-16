const { TEXTER_BASE_URL, TEXTER_API_KEY } = process.env;

const sendText = async (body, to) => {
  const query = new URLSearchParams({ to, body });
  const url = `${TEXTER_BASE_URL}/send?${query}`;
  const headers = { "x-api-key": TEXTER_API_KEY };

  console.log(`Sending text using ${url}`);
  return await fetch(url, { headers });
};

const textRandomJob = async (jobs, toNumber) => {
  if (jobs.length > 0 && toNumber) {
    console.log(`Texting random job out of ${jobs.length} jobs to ${toNumber}`);

    const randomJobFullLink =
      jobs[Math.floor(Math.random() * jobs.length)].full_link;
    await sendText(
      `${jobs.length} new Braintrust jobs available. ${randomJobFullLink}`,
      toNumber
    );
  }
};

module.exports = {
  sendText,
  textRandomJob,
};
