const addJobsFlags = (jobs, knownJobs) => {
  return jobs.map((job) => {
    const knownJob = knownJobs.find(
      (knownJob) => knownJob.fullLink === job.fullLink,
    );
    return {
      ...job,
      isNewToJobs: !!knownJob,
      jobsHasTexted: !!knownJob?.jobsHasTexted,
    };
  });
};

const filterForUntextedJobs = (jobs) =>
  jobs.filter((job) => !job.jobsHasTexted);

const filterforNewJobs = (jobs) => jobs.filter((job) => job.isNewToJobs);

module.exports = {
  addJobsFlags,
  filterForUntextedJobs,
  filterforNewJobs,
};
