import { Application } from "probot"; // eslint-disable-line no-unused-vars

const ISSUE_TO_COLUMN: Record<string, string> = {
  "status/triage": "Triage",
  "status/ready-to-work-on": "Ready to Work On",
  "status/assigned": "Assigned",
  "status/in-progress": "In Progress",
  "status/done": "Done",
};

export = (app: Application) => {
  app.on("issues.labeled", async ({ payload, github }) => {
    const projects = (
      await github.projects.listForRepo({
        owner: payload.repository.owner.login,
        repo: payload.repository.name,
      })
    ).data;
    if (projects.length === 0) {
      console.error("could not find a project board on this repo");
      return;
    }
    const projectId = projects[0].id;

    // Get label(s) that start with status/
    const labels: string[] = payload.issue.labels
      .map((l) => l.name)
      .filter((n) => n in ISSUE_TO_COLUMN);
    if (labels.length === 0) {
      // no status label
      return;
    }
    const columnName = ISSUE_TO_COLUMN[labels[0]];

    // Find the corresponding column
    const columns = await github.projects.listColumns({
      project_id: projectId,
    });
    const destColumn = columns.data.find((c) => c.name === columnName);
    if (destColumn === undefined) {
      console.error("could not find corresponding column on project board");
      return;
    }

    await github.projects.createCard({
      column_id: destColumn.id,
      content_id: payload.issue.id,
      content_type: "Issue",
    });
  });
  // For more information on building apps:
  // https://probot.github.io/docs/

  // To get your app running against GitHub, see:
  // https://probot.github.io/docs/development/
};
