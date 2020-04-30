import { Application } from "probot"; // eslint-disable-line no-unused-vars
import { issuesLabeled } from "./issues.labeled";
import { project_cardMoved } from "./project_card.moved";
import { issuesOpened } from "./issues.opened";
import { pullrequestOpened } from "./pull_request.opened";

export = (app: Application) => {
  app.on("issues.opened", issuesOpened);
  app.on("issues.labeled", issuesLabeled);
  app.on("project_card.moved", project_cardMoved);
  app.on("pull_request.opened", pullrequestOpened);
};
