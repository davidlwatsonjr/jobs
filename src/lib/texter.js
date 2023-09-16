const { TEXTER_BASE_URL, TEXTER_API_KEY } = process.env;

const sendText = async (body, to) => {
  const query = new URLSearchParams({ to, body });
  const url = `${TEXTER_BASE_URL}/send?${query}`;
  const headers = { "x-api-key": TEXTER_API_KEY };

  console.log(`Sending text using ${url}`);
  return await fetch(url, { headers });
};

const textFirstJob = async (jobs, toNumber) => {
  if (jobs.length > 0 && toNumber) {
    console.log(`Texting first job out of ${jobs.length} to ${toNumber}.`);

    const firstJobFullLink = jobs[0].full_link;
    await sendText(
      `${jobs.length} new jobs available. First: ${firstJobFullLink}`,
      toNumber
    );
  }
};

const textRandomJob = async (jobs, toNumber) => {
  if (jobs.length > 0 && toNumber) {
    console.log(`Texting random job out of ${jobs.length} to ${toNumber}.`);

    const randomJobFullLink =
      jobs[Math.floor(Math.random() * jobs.length)].full_link;
    await sendText(
      `${jobs.length} new jobs available. Random: ${randomJobFullLink}`,
      toNumber
    );
  }
};

module.exports = {
  sendText,
  textFirstJob,
  textRandomJob,
};
