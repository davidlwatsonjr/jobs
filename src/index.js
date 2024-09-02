const { SECRETS } = process.env;
if (SECRETS) {
  try {
    const secrets = JSON.parse(SECRETS.replace(/\n/g, ""));
    Object.keys(secrets).forEach((key) => {
      process.env[key] = secrets[key];
    });
  } catch (e) {
    console.error("Error parsing SECRETS JSON", e);
  }
}

const express = require("express");
const cors = require("cors");
const {
  gcpLogTransformer,
  requestLogger,
  serverErrorHandler,
  authAPIRequest,
  gcStorageCacher,
  gcStorageCacheBuster,
  memoryCacher,
  memoryCacheBuster,
} = require("@davidlwatsonjr/microservice-middleware");
const { getJobs, putJob } = require("./controllers/jobs");
const {
  braintrust,
  braintrustApplications,
} = require("./controllers/braintrust");
const { feeds, nodesk, weworkremotely } = require("./controllers/feeds");
const { isUUID } = require("./util/isUUID");

const { GCS_BUCKET, MEMORY_CACHE_TTL, STORAGE_CACHE_TTL } = process.env;
const DEFAULT_MEMORY_CACHE_TTL = 60;
const DEFAULT_STORAGE_CACHE_TTL = 60;

const app = express();

app.use(gcpLogTransformer);
app.use(requestLogger);

app.use(
  cors({ origin: [/[a-z]+\.davidlwatsonjr\.com/, "http://localhost:3000"] }),
);

app.get("/ping", async (req, res) => {
  res.send("pong");
});

const apiAuthHandler = authAPIRequest("JOBS");
const useUserUUIDOrAPIKey = (req, res, next) => {
  isUUID(req.headers["x-useruuid"]) ? next() : apiAuthHandler(req, res, next);
};

const memoryCacheTTL = !isNaN(parseInt(MEMORY_CACHE_TTL))
  ? parseInt(MEMORY_CACHE_TTL)
  : DEFAULT_MEMORY_CACHE_TTL;
const storageCacheTTL = !isNaN(parseInt(STORAGE_CACHE_TTL))
  ? parseInt(STORAGE_CACHE_TTL)
  : DEFAULT_STORAGE_CACHE_TTL;
app.get(
  "*",
  memoryCacher(memoryCacheTTL, "jobs", ["x-api-key", "x-useruuid"]),
  gcStorageCacher(GCS_BUCKET, storageCacheTTL, "jobs", [
    "x-api-key",
    "x-useruuid",
  ]),
);

app.get("/jobs", getJobs);
app.put(
  "/jobs/:fullLinkMD5",
  useUserUUIDOrAPIKey,
  express.json(),
  memoryCacheBuster("jobs", ["x-api-key", "x-useruuid"], ["/jobs"]),
  gcStorageCacheBuster(
    GCS_BUCKET,
    "jobs",
    ["x-api-key", "x-useruuid"],
    ["/jobs"],
  ),
  putJob,
);

app.get("/braintrust", braintrust);
app.get("/braintrust/applications", braintrustApplications);

app.get("/feeds", feeds);
app.get("/nodesk", nodesk);
app.get("/weworkremotely", weworkremotely);

app.use(serverErrorHandler);

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(
    `The jobs container started successfully and is listening for HTTP requests on ${PORT}`,
  );
});
