const { md5 } = require("../util/md5");

const {
  BRAINTRUST_SESSION_ID,
  BRAINTRUST_API_BASE_URL,
  DESIRED_HOURLY_BUDGET_MINIMUM_USD,
  UNDESIRED_JOB_IDS,
  UNDESIRED_EMPLOYER_NAMES,
  UNDESIRED_LOCATIONS,
  UNDESIRED_SKILL_MATCH_LEVELS,
} = process.env;

const ENGINEERING_ROLE_ID = 5;

const desiredHourlyBudgetMinimumUsd = Number(DESIRED_HOURLY_BUDGET_MINIMUM_USD);
const undesiredJobIds = UNDESIRED_JOB_IDS.split("|").map(Number);
const undesiredEmployerNames = UNDESIRED_EMPLOYER_NAMES.split("|");
const undesiredLocations = UNDESIRED_LOCATIONS.split("|");
const undesiredSkillMatchLevels = UNDESIRED_SKILL_MATCH_LEVELS.split("|");

const defaultJobSearchParams = {
  page: 1,
  ordering: "-created",
  availability_from: 5,
  availability_to: 40,
  page_size: 100,
};

const fetchOptions = {
  headers: { cookie: `sessionid=${BRAINTRUST_SESSION_ID}` },
};

const makeApplicationsRequest = async (paramString) => {
  try {
    const response = await fetch(
      `${BRAINTRUST_API_BASE_URL}/freelancer_bids/?${paramString}`,
      fetchOptions,
    );

    const results = await response.json();
    if (!Array.isArray(results)) {
      throw new Error(JSON.stringify(results));
    }

    return results;
  } catch (error) {
    console.error(
      `ERROR making Braintrust /freelancer_bids request: ${error.message}`,
    );
    return [];
  }
};

const getOpenApplications = async () => {
  return await makeApplicationsRequest("page_size=0&current=true");
};

const getClosedApplications = async () => {
  return await makeApplicationsRequest("page_size=0&historical=true");
};

const getAllApplications = async () => {
  const [openApplications, closedApplications] = await Promise.all([
    getOpenApplications(),
    getClosedApplications(),
  ]);
  return [...openApplications, ...closedApplications];
};

const getNotHiredFeedback = async () => {
  const applications = await getAllApplications();
  return applications
    .filter((application) => application.not_hiring_feedback.length > 0)
    .map((application) => ({
      jobTitle: application.job.title,
      employer: application.job.employer.name,
      rateRequested: application.payment_amount,
      notHiredFeedback: application.not_hiring_feedback,
    }));
};

const makeJobsRequest = async (paramString) => {
  try {
    const response = await fetch(
      `${BRAINTRUST_API_BASE_URL}/jobs/?${paramString}`,
      fetchOptions,
    );
    return await response.json();
  } catch (error) {
    console.error(`ERROR making Braintrust /jobs request: ${error.message}`);
    return { results: [] };
  }
};

const searchOpenJobs = async (criteria) => {
  const params = { ...defaultJobSearchParams, ...criteria };
  const paramString = Object.entries(params)
    .map(([key, value]) => `${key}=${value}`)
    .join("&");
  const openJobs = await makeJobsRequest(paramString);
  return openJobs.results.map((job) => ({
    fullLink: `https://app.usebraintrust.com/jobs/${job.id}`,
    fullLinkMD5: md5(`https://app.usebraintrust.com/jobs/${job.id}`),
    createdDate: new Date(job.created).toLocaleDateString(),
    ...job,
  }));
};

const getMatchingOpenEngineeringJobs = async () => {
  const openJobs = await searchOpenJobs({
    role: ENGINEERING_ROLE_ID,
    hourly_budget_minimum_usd: desiredHourlyBudgetMinimumUsd,
  });
  return openJobs.filter(
    (job) => !undesiredSkillMatchLevels.includes(job.skills_match_level),
  );
};

const getUnappliedMatchingOpenEngineeringJobs = async () => {
  const jobs = await getMatchingOpenEngineeringJobs();
  const applications = await getAllApplications();
  const appliedJobIds = applications.map((application) => application.job.id);
  return jobs.filter((job) => !appliedJobIds.includes(job.id));
};

const getBraintrustMatchLevels = async () => {
  const openJobs = await searchOpenJobs();
  return Array.from(new Set(openJobs.map((job) => job.skills_match_level)));
};

const myPreferredJobResults = async () => {
  const jobs = (await getUnappliedMatchingOpenEngineeringJobs()).filter(
    (job) =>
      !(
        undesiredEmployerNames.includes(job.employer.name) ||
        undesiredJobIds.includes(job.id) ||
        undesiredLocations.some((location) =>
          job.locations.map(({ location }) => location).includes(location),
        )
      ),
  );

  return { jobs };
};

module.exports = {
  getMatchingOpenEngineeringJobs,
  myPreferredJobResults,
};
