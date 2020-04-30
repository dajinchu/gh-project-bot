import { Context } from "probot";
import { WebhookPayloadPullRequest } from "@octokit/webhooks";

// Move pull request around based on draft status
export async function pull_requestOpened({
  payload,
  github,
}: Context<WebhookPayloadPullRequest>) {
  github;
  payload;
  console.log("PR OPENED");
  // github.pulls.
  // await github.issues.addLabels({
  //   owner: payload.repository.owner.login,
  //   repo: payload.repository.name,
  //   issue_number: payload.issue.number,
  //   labels: [TRIAGE_LABEL],
  // });
}
