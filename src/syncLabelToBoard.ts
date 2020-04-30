import {
  WebhookPayloadPullRequestPullRequest,
  WebhookPayloadIssuesIssue,
  PayloadRepository,
} from "@octokit/webhooks";
import { GitHubAPI } from "probot";
import { LABEL_TO_COLUMN } from "./settings";

type PRorIssue =
  | WebhookPayloadPullRequestPullRequest
  | WebhookPayloadIssuesIssue;

const findCard = `
  query FindCard($owner: String!, $repo: String!, $issue: Int!) {
    repository(owner: $owner, name: $repo) {
      issueOrPullRequest(number: $issue) {
        ... on PullRequest {
          projectCards(first: 10) {
            nodes {
              databaseId
              column {
                databaseId
              }
            }
          }
        }
        ... on Issue {
          projectCards(first: 10) {
            nodes {
              databaseId
              column {
                databaseId
              }
            }
          }
        }
      }
    }
  }
`;
// import nock from 'nock'

interface SyncLabelToBoardArgs {
  prOrIssue: PRorIssue;
  repo: PayloadRepository;
  isPR: boolean;
  newLabel: string;
  github: GitHubAPI;
}

export async function syncLabelToBoard({
  prOrIssue,
  repo,
  isPR,
  newLabel,
  github,
}: SyncLabelToBoardArgs) {
  // nock.recorder.rec();
  const repoId = {
    owner: repo.owner.login,
    repo: repo.name,
  };
  const projects = (await github.projects.listForRepo(repoId)).data;
  if (projects.length === 0) {
    console.error("could not find a project board on this repo");
    return;
  }
  const projectId = projects[0].id;

  // Get new status label
  if (!(newLabel in LABEL_TO_COLUMN)) {
    return;
  }
  const columnName = LABEL_TO_COLUMN[newLabel];

  // Get rid of other label(s) that start with status/
  const otherLabels: string[] = prOrIssue.labels
    .map((l) => l.name)
    .filter((n) => n in LABEL_TO_COLUMN && n !== newLabel);
  await Promise.all(
    otherLabels.map((l) =>
      github.issues.removeLabel({
        ...repoId,
        issue_number: prOrIssue.number,
        name: l,
      })
    )
  );

  // Find the corresponding column to move to
  const columns = await github.projects.listColumns({
    project_id: projectId,
  });
  const destColumn = columns.data.find((c) => c.name === columnName);
  if (destColumn === undefined) {
    console.error("could not find corresponding column on project board");
    return;
  }

  // Find the card on the project board.
  // Github REST API gives us no way to go from issue => card_id, but GraphQL does ;)
  const findCardResult = await github.graphql(findCard, {
    ...repoId,
    issue: prOrIssue.number,
  });
  if (findCardResult === null) {
    console.error(
      "something went wrong with graphql to get project card from issue"
    );
    return;
  }
  const card = findCardResult.repository.issueOrPullRequest.projectCards.nodes.pop();
  if (card === undefined) {
    // create card on board
    await github.projects.createCard({
      column_id: destColumn.id,
      content_id: prOrIssue.id,
      content_type: isPR ? "PullRequest" : "Issue",
    });
  } else if (card.column.databaseId !== destColumn.id) {
    // move card only if not already in the right column
    await github.projects.moveCard({
      card_id: card.databaseId,
      column_id: destColumn.id,
      position: "top",
    });
  }
}
