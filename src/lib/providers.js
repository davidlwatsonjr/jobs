const { fetch } = require("@davidlwatsonjr/fetch-retry-with-cache");
const { md5 } = require("../util/md5");

const SEARCH_TERMS = [
  "engineering manager",
  "solutions architect",
  "ai consultant",
  "principal engineer",
];

const splitEnvList = (value) =>
  value
    ? value
        .split("|")
        .map((item) => item.trim())
        .filter(Boolean)
    : [];

const toDateString = (value) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? new Date().toLocaleDateString()
    : date.toLocaleDateString();
};

const normalizeJob = ({
  source,
  sourceId,
  title,
  company,
  location,
  employmentType,
  seniority,
  salaryMin,
  salaryMax,
  salaryCurrency,
  publishedAt,
  description,
  fullLink,
}) => ({
  source,
  sourceId: sourceId?.toString(),
  title,
  company,
  location,
  employmentType,
  seniority,
  salaryMin,
  salaryMax,
  salaryCurrency,
  publishedAt,
  createdDate: toDateString(publishedAt),
  description,
  fullLink,
  fullLinkMD5: md5(fullLink),
});

const requestJson = async (url, source) => {
  try {
    const response = await fetch(url, {
      headers: { Accept: "application/json" },
    });
    if (!response.ok) {
      throw new Error(`${response.status} ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`ERROR fetching ${source}: ${error.message}`);
    return null;
  }
};

const getJobicyJobs = async () => {
  const urls = SEARCH_TERMS.map((tag) => {
    const params = new URLSearchParams({ count: 100, geo: "usa", tag });
    return `https://jobicy.com/api/v2/remote-jobs?${params}`;
  });
  const responses = await Promise.all(
    urls.map((url) => requestJson(url, "Jobicy")),
  );
  return responses
    .flatMap((response) => response?.jobs || [])
    .map((job) =>
      normalizeJob({
        source: "Jobicy",
        sourceId: job.id,
        title: job.jobTitle,
        company: job.companyName,
        location: job.jobGeo,
        employmentType: job.jobType,
        seniority: job.jobLevel,
        salaryMin: job.salaryMin,
        salaryMax: job.salaryMax,
        salaryCurrency: job.salaryCurrency,
        publishedAt: job.pubDate,
        description: job.jobDescription,
        fullLink: job.url,
      }),
    );
};

const getHimalayasJobs = async () => {
  const urls = SEARCH_TERMS.map((q) => {
    const params = new URLSearchParams({ q, country: "US", sort: "recent" });
    return `https://himalayas.app/jobs/api/search?${params}`;
  });
  const responses = await Promise.all(
    urls.map((url) => requestJson(url, "Himalayas")),
  );
  return responses
    .flatMap((response) => response?.jobs || [])
    .map((job) =>
      normalizeJob({
        source: "Himalayas",
        sourceId: job.guid,
        title: job.title,
        company: job.companyName,
        location: job.locationRestrictions
          ?.map(({ name }) => name)
          .join(", "),
        employmentType: job.employmentType,
        seniority: job.seniority?.join(", "),
        salaryMin: job.minSalary,
        salaryMax: job.maxSalary,
        salaryCurrency: job.currency,
        publishedAt: job.pubDate,
        description: job.description,
        fullLink: job.applicationLink,
      }),
    );
};

const getAdzunaJobs = async () => {
  const { ADZUNA_APP_ID, ADZUNA_APP_KEY } = process.env;
  if (!ADZUNA_APP_ID || !ADZUNA_APP_KEY) {
    return [];
  }
  const urls = SEARCH_TERMS.map((what) => {
    const params = new URLSearchParams({
      app_id: ADZUNA_APP_ID,
      app_key: ADZUNA_APP_KEY,
      results_per_page: 50,
      what,
      where: "remote",
      sort_by: "date",
      "content-type": "application/json",
    });
    return `https://api.adzuna.com/v1/api/jobs/us/search/1?${params}`;
  });
  const responses = await Promise.all(
    urls.map((url) => requestJson(url, "Adzuna")),
  );
  return responses
    .flatMap((response) => response?.results || [])
    .map((job) =>
      normalizeJob({
        source: "Adzuna",
        sourceId: job.id,
        title: job.title,
        company: job.company?.display_name,
        location: job.location?.display_name,
        employmentType: [job.contract_time, job.contract_type]
          .filter(Boolean)
          .join(" / "),
        salaryMin: job.salary_min,
        salaryMax: job.salary_max,
        publishedAt: job.created,
        description: job.description,
        fullLink: job.redirect_url,
      }),
    );
};

const getGreenhouseJobs = async () => {
  const boards = splitEnvList(process.env.GREENHOUSE_BOARDS);
  const responses = await Promise.all(
    boards.map(async (board) => ({
      board,
      response: await requestJson(
        `https://boards-api.greenhouse.io/v1/boards/${encodeURIComponent(
          board,
        )}/jobs?content=true`,
        `Greenhouse:${board}`,
      ),
    })),
  );
  return responses.flatMap(({ board, response }) =>
    (response?.jobs || []).map((job) =>
      normalizeJob({
        source: `Greenhouse:${board}`,
        sourceId: job.id,
        title: job.title,
        company: board,
        location: job.location?.name,
        publishedAt: job.updated_at,
        description: job.content,
        fullLink: job.absolute_url,
      }),
    ),
  );
};

const getLeverJobs = async () => {
  const sites = splitEnvList(process.env.LEVER_SITES);
  const responses = await Promise.all(
    sites.map(async (site) => ({
      site,
      response: await requestJson(
        `https://api.lever.co/v0/postings/${encodeURIComponent(site)}?mode=json`,
        `Lever:${site}`,
      ),
    })),
  );
  return responses.flatMap(({ site, response }) =>
    (Array.isArray(response) ? response : []).map((job) =>
      normalizeJob({
        source: `Lever:${site}`,
        sourceId: job.id,
        title: job.text,
        company: site,
        location: job.categories?.location,
        employmentType: job.categories?.commitment,
        publishedAt: job.createdAt || Date.now(),
        description: job.descriptionPlain || job.description,
        fullLink: job.hostedUrl || job.applyUrl,
      }),
    ),
  );
};

const getAshbyJobs = async () => {
  const boards = splitEnvList(process.env.ASHBY_BOARDS);
  const responses = await Promise.all(
    boards.map(async (board) => ({
      board,
      response: await requestJson(
        `https://api.ashbyhq.com/posting-api/job-board/${encodeURIComponent(
          board,
        )}?includeCompensation=true`,
        `Ashby:${board}`,
      ),
    })),
  );
  return responses.flatMap(({ board, response }) =>
    (response?.jobs || []).map((job) =>
      normalizeJob({
        source: `Ashby:${board}`,
        sourceId: job.jobUrl || job.applyUrl,
        title: job.title,
        company: board,
        location: job.location,
        employmentType: job.employmentType,
        salaryMin: job.compensation?.minValue,
        salaryMax: job.compensation?.maxValue,
        salaryCurrency: job.compensation?.currencyCode,
        publishedAt: job.publishedAt || job.updatedAt || Date.now(),
        description: job.descriptionHtml || job.descriptionPlain,
        fullLink: job.jobUrl || job.applyUrl,
      }),
    ),
  );
};

const getProviderJobs = async () => {
  const results = await Promise.all([
    getJobicyJobs(),
    getHimalayasJobs(),
    getAdzunaJobs(),
    getGreenhouseJobs(),
    getLeverJobs(),
    getAshbyJobs(),
  ]);
  return results.flat().filter(({ fullLink, title }) => fullLink && title);
};

module.exports = {
  getProviderJobs,
};
