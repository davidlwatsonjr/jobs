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
    const { full_link } = jobs[0];

    console.log(
      `Texting first job (${full_link}) out of ${jobs.length} to ${toNumber}.`
    );
    await sendText(
      `${jobs.length} new jobs available. First: ${full_link}`,
      toNumber
    );
  }
};

const textRandomJob = async (jobs, toNumber) => {
  if (jobs.length > 0 && toNumber) {
    const { full_link } = jobs[Math.floor(Math.random() * jobs.length)];

    console.log(
      `Texting random job (${full_link}) out of ${jobs.length} to ${toNumber}.`
    );
    await sendText(
      `${jobs.length} new jobs available. Random: ${full_link}`,
      toNumber
    );
  }
};

module.exports = {
  sendText,
  textFirstJob,
  textRandomJob,
};
