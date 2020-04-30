import { Application } from "probot"; // eslint-disable-line no-unused-vars
import { issuesLabeled } from "./issues.labeled";
import { project_cardMoved } from "./project_card.moved";

export = (app: Application) => {
  app.on("issues.labeled", issuesLabeled);
  app.on("project_card.moved", project_cardMoved);
};
