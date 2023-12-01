const addJobScoutFlags = (jobs, knownJobs) => {
  return jobs.map((job) => {
    const knownJob = knownJobs.find(
      (knownJob) => knownJob.full_link === job.full_link
    );
    return {
      ...job,
      isNewToJobScout: !!knownJob,
      jobScoutHasTexted: !!(knownJob && knownJob.jobScoutHasTexted),
    };
  });
};

const filterForUntextedJobs = (jobs) =>
  jobs.filter((job) => !job.jobScoutHasTexted);

const filterforNewJobs = (jobs) => jobs.filter((job) => job.isNewToJobScout);

module.exports = {
  addJobScoutFlags,
  filterForUntextedJobs,
  filterforNewJobs,
};
