const {myPreferredJobResults} = require("./braintrust.js");
const {sendText} = require("./twilio.js");

require("dotenv").config();

(async () => {
  // Log Braintrust match levels
  // console.log(await getBraintrustMatchLevels());

  // Check your existing applications
  // console.log(await getAllApplications());

  // Check out your not-hired feedback
  // console.log(await getNotHiredFeedback());

  // Check for new jobs you might like
  const jobs = await myPreferredJobResults();

  console.log(
    jobs.map((job) => ({
      jobId: job.id,
      jobUrl: `https://app.usebraintrust.com/jobs/${job.id}/`,
      employerName: job.employer.name,
      title: job.title,
      budgetMax: job.budget_maximum_usd,
      hours: job.expected_hours_per_week,
      // applicationQuestions: job.application_questions.map((question) => question.question),
      jobMainSkill: job.main_skills.map(({ name }) => name),
      skillMatchLevel: job.skills_match_level,
      locations: job.locations.map(({ location }) => location),
    }))
  );
  console.log(jobs.length);

  if (jobs.length > 0) {
    await sendText(
      `${jobs.length} new Braintrust jobs available. https://app.usebraintrust.com/jobs/${jobs[0].id}/`
    );
  }
})();
