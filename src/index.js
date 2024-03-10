require("dotenv").config();

const path = require("path");
const express = require("express");
const {
  gcpLogTransformer,
  requestLogger,
  serverErrorHandler,
} = require("@davidlwatsonjr/microservice-middleware");
const { jobs } = require("./controllers/jobs");
const { braintrust, braintrustHTML } = require("./controllers/braintrust");
const {
  feeds,
  feedsHTML,
  nodesk,
  weworkremotely,
} = require("./controllers/feeds");

const app = express();

app.use(gcpLogTransformer);
app.use(requestLogger);

app.use(express.static("src/public"));
app.set("views", path.join(__dirname, "views"));

app.get("/ping", async (req, res) => {
  res.send("pong");
});

app.get("/jobs", jobs);

app.get("/braintrust", braintrust);
app.get("/braintrust.html", braintrustHTML);

app.get("/feeds", feeds);
app.get("/feeds.html", feedsHTML);
app.get("/nodesk", nodesk);
app.get("/weworkremotely", weworkremotely);

app.use(serverErrorHandler);

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(
    `The jobs container started successfully and is listening for HTTP requests on ${PORT}`,
  );
});
