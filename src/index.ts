import { Application } from "probot"; // eslint-disable-line no-unused-vars

const ISSUE_TO_COLUMN: Record<string, string> = {
  "status/triage": "Triage",
  "status/ready-to-work-on": "Ready to Work On",
  "status/assigned": "Assigned",
  "status/in-progress": "In Progress",
  "status/in-review": "In Review",
  "status/done": "Done",
};

// grpahql
const findCard = `
  query FindCard($owner: String!, $repo: String!, $issue: Int!) {
    repository(owner: $owner, name: $repo) {
      issue(number: $issue) {
        projectCards(first: 10) {
          nodes {
            column {
              databaseId
            }
            databaseId
          }
        }
      }
    }
  }
`;

export = (app: Application) => {
  app.on("issues.labeled", async ({ payload, github }) => {
    const repoId = {
      owner: payload.repository.owner.login,
      repo: payload.repository.name,
    };
    const projects = (await github.projects.listForRepo(repoId)).data;
    if (projects.length === 0) {
      console.error("could not find a project board on this repo");
      return;
    }
    const projectId = projects[0].id;

    // Get new status label
    const newStatus: string = (payload as any).label.name; //Probot types are a bit scuffed
    if (!(newStatus in ISSUE_TO_COLUMN)) {
      return;
    }
    const columnName = ISSUE_TO_COLUMN[newStatus];

    // Get rid of other label(s) that start with status/
    const otherLabels: string[] = payload.issue.labels
      .map((l) => l.name)
      .filter((n) => n in ISSUE_TO_COLUMN && n !== newStatus);
    await Promise.all(
      otherLabels.map((l) =>
        github.issues.removeLabel({
          ...repoId,
          issue_number: payload.issue.number,
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
      issue: payload.issue.number,
    });
    if (findCardResult === null) {
      console.error(
        "something went wrong with graphql to get project card from issue"
      );
      return;
    }
    const cards = findCardResult.repository.issue.projectCards.nodes;
    if (cards.length > 0) {
      // move card
      await github.projects.moveCard({
        card_id: cards[0].databaseId,
        column_id: destColumn.id,
        position: "top",
      });
    } else {
      // create card on board
      await github.projects.createCard({
        column_id: destColumn.id,
        content_id: payload.issue.id,
        content_type: "Issue",
      });
    }
  });
  // For more information on building apps:
  // https://probot.github.io/docs/

  // To get your app running against GitHub, see:
  // https://probot.github.io/docs/development/
};
