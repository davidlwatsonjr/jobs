const addJobScoutFlags = (jobs, knownJobs) => {
  return jobs.map((job) => {
    const knownJob = knownJobs.find(
      (knownJob) => knownJob.fullLink === job.fullLink,
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
