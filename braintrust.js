require("dotenv").config();
const {
  BRAINTRUST_SESSION_ID,
  BRAINTRUST_API_BASE_URL,
} = process.env;

const ENGINEERING_ROLE_ID = 5;

const desiredHourlyBudgetMinimumUsd = 100;
const undesiredJobIds = [7183];
const undesiredEmployerNames = [];
const undesiredLocations = [];
const undesiredSkillMatchLevels = ["No match"];

const defaultJobSearchParams = {
  page: 1,
  ordering: "-created",
  availability_from: 5,
  availability_to: 40,
  page_size: 100,
};

const fetchHeaders = {
  headers: { cookie: `sessionid=${BRAINTRUST_SESSION_ID}` },
};

const getOpenApplications = async () => {
  const response = await fetch(
    `${BRAINTRUST_API_BASE_URL}/freelancer_bids/?page_size=0&current=true`,
    fetchHeaders
  );
  return await response.json();
};

const getClosedApplications = async () => {
  const response = await fetch(
    `${BRAINTRUST_API_BASE_URL}/freelancer_bids/?page_size=0&historical=true`,
    fetchHeaders
  );
  return await response.json();
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

const searchOpenJobs = async (criteria) => {
  const params = Object.assign({}, defaultJobSearchParams, criteria);
  const paramString = Object.entries(params)
    .map(([key, value]) => `${key}=${value}`)
    .join("&");
  const response = await fetch(
    `${BRAINTRUST_API_BASE_URL}/jobs/?${paramString}`,
    fetchHeaders
  );
  return await response.json();
};

const getMatchingOpenEngineeringJobs = async () => {
  const openJobs = await searchOpenJobs({
    role: ENGINEERING_ROLE_ID,
    hourly_budget_minimum_usd: desiredHourlyBudgetMinimumUsd,
  });
  return openJobs.results.filter(
    (job) => !undesiredSkillMatchLevels.includes(job.skills_match_level)
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
  return Array.from(
    new Set(openJobs.results.map((job) => job.skills_match_level))
  );
};

const myPreferredJobResults = async () => {
  return (await getUnappliedMatchingOpenEngineeringJobs()).filter(
    (job) =>
      !(
        undesiredEmployerNames.includes(job.employer.name) ||
        undesiredJobIds.includes(job.id) ||
        undesiredLocations.some((location) =>
          job.locations.map(({ location }) => location).includes(location)
        )
      ));
}

module.exports = {
  myPreferredJobResults
}