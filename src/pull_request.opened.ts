import { Context } from "probot";
import Webhooks from "@octokit/webhooks";
import { TRIAGE_LABEL } from "./settings";

// Move pull request around based on draft status
export async function pullrequestOpened({
  payload,
  github,
}: Context<Webhooks.WebhookPayloadIssues>) {
  console.log("PR OPENED");
}
