import { Context } from "probot";
import Webhooks from "@octokit/webhooks";
import { TRIAGE_LABEL } from "./settings";

// Add Triage label when an issue is opened
export async function issuesOpened({
  payload,
  github,
}: Context<Webhooks.WebhookPayloadIssues>) {
  await github.issues.addLabels({
    owner: payload.repository.owner.login,
    repo: payload.repository.name,
    issue_number: payload.issue.number,
    labels: [TRIAGE_LABEL],
  });
}
