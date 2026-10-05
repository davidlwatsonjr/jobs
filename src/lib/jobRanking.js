const { md5 } = require("../util/md5");

const HIGH_VALUE_TERMS = [
  "ai consultant",
  "artificial intelligence consultant",
  "generative ai",
  "genai",
  "ai transformation",
  "ai solutions architect",
  "solutions architect",
  "enterprise architect",
  "software architect",
  "engineering manager",
  "director of engineering",
  "principal engineer",
  "staff engineer",
  "fractional cto",
  "technical advisor",
  "professional services",
  "forward deployed",
];

const SIDE_GIG_TERMS = [
  "contract",
  "consultant",
  "consulting",
  "fractional",
  "part time",
  "project based",
  "1099",
];

const normalizeText = (value) =>
  (value || "")
    .toString()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

const getJobFingerprint = (job) => {
  if (!job.company) {
    return md5(job.fullLink);
  }
  return md5(
    [job.company, job.title, job.location]
      .map(normalizeText)
      .filter(Boolean)
      .join("|"),
  );
};

const getJobMatchScore = (job) => {
  const title = normalizeText(job.title);
  const searchable = normalizeText(
    [job.title, job.description, job.employmentType, job.seniority].join(" "),
  );
  return (
    HIGH_VALUE_TERMS.reduce((score, term) => {
      const normalizedTerm = normalizeText(term);
      return (
        score +
        (title.includes(normalizedTerm)
          ? 8
          : searchable.includes(normalizedTerm)
            ? 3
            : 0)
      );
    }, 0) +
    SIDE_GIG_TERMS.reduce((score, term) => {
      const normalizedTerm = normalizeText(term);
      return score + (searchable.includes(normalizedTerm) ? 4 : 0);
    }, 0)
  );
};

const dedupeAndRankJobs = (jobs) => {
  const seenLinks = new Set();
  const seenFingerprints = new Set();
  return jobs
    .filter((job) => {
      if (!job?.fullLink || !job?.title) {
        return false;
      }
      const fingerprint = getJobFingerprint(job);
      if (seenLinks.has(job.fullLink) || seenFingerprints.has(fingerprint)) {
        return false;
      }
      seenLinks.add(job.fullLink);
      seenFingerprints.add(fingerprint);
      job.matchScore = getJobMatchScore(job);
      job.fingerprint = fingerprint;
      return true;
    })
    .sort(
      (a, b) =>
        b.matchScore - a.matchScore ||
        new Date(b.createdDate) - new Date(a.createdDate),
    );
};

module.exports = {
  dedupeAndRankJobs,
  getJobFingerprint,
  getJobMatchScore,
};
