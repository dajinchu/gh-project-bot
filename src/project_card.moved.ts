import { Context } from "probot";
import { WebhookPayloadProjectCard } from "@octokit/webhooks";
import { LABEL_TO_COLUMN } from "./settings";
import { findKey } from "lodash";

// Sync project board => labels
export async function project_cardMoved({
  payload,
  github,
}: Context<WebhookPayloadProjectCard>) {
  const newColumn = payload.project_card.column_id;
  const columnName = (await github.projects.getColumn({ column_id: newColumn }))
    .data.name;
  const labelName = findKey(LABEL_TO_COLUMN, (c) => c === columnName);
  if (labelName === undefined) {
    console.log("project card moved to column with no corresponding label");
    return;
  }
  const issueNum: number = issueNumFromURL(
    (payload.project_card as any).content_url
  );
  await github.issues.addLabels({
    owner: payload.repository.owner.login,
    repo: payload.repository.name,
    issue_number: issueNum,
    labels: [labelName],
  });
}

function issueNumFromURL(url: string): number {
  const parts = url.split("/");
  if (parts.length < 2) {
    throw "NaN issue num from content_url";
  }
  const num = Number(parts[parts.length - 1]);
  if (isNaN(num) || parts[parts.length - 2] !== "issues") {
    throw "NaN issue num from content_url";
  }
  return num;
}
