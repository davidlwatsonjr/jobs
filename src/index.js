require("dotenv").config();

const express = require("express");
const cors = require("cors");
const {
  gcpLogTransformer,
  requestLogger,
  serverErrorHandler,
  authAPIRequest,
} = require("@davidlwatsonjr/microservice-middleware");
const { getJobs, putJob } = require("./controllers/jobs");
const { braintrust } = require("./controllers/braintrust");
const { feeds, nodesk, weworkremotely } = require("./controllers/feeds");
const { isUUID } = require("./util/isUUID");

const app = express();

app.use(gcpLogTransformer);
app.use(requestLogger);

app.use(
  cors({ origin: [/[a-z]+\.davidlwatsonjr\.com/, "http://localhost:3000"] }),
);

app.get("/ping", async (req, res) => {
  res.send("pong");
});

const useUserUUIDOrAPIKey = (req, res, next) => {
  isUUID(req.headers["x-useruuid"]) ? next() : authAPIRequest(req, res, next);
};

app.get("/jobs", getJobs);
app.put("/jobs/:fullLinkMD5", useUserUUIDOrAPIKey, express.json(), putJob);

app.get("/braintrust", braintrust);

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
