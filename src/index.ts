import { Application } from 'probot' // eslint-disable-line no-unused-vars

export = (app: Application) => {
  app.on('issues.labeled', async ({ payload, github }) => {
    const projects = (await github.projects.listForRepo({
      owner: payload.repository.owner.login,
      repo: payload.repository.name
    })).data
    if (projects.length === 0) {
      console.error('could not find a project board on this repo')
      return;
    }
    const projectId = projects[0].id;

    // Get label(s) that start with status/
    const labels = payload.issue.labels.filter(l => l.name.startsWith('status/'));
    if (labels.length === 0) {
      // no status label
      return;
    }
    const status = labels[0].name.substring(7)

    // Find the corresponding column
    const columns = await github.projects.listColumns({ project_id: projectId });
    const destColumn = columns.data.find(c => c.name === status);
    if (destColumn === undefined) {
      console.error('could not find corresponding column on project board')
      return;
    }
    
    await github.projects.createCard({
      column_id: destColumn.id,
      content_id: payload.issue.id,
      content_type: 'Issue'
    })
  })
  // For more information on building apps:
  // https://probot.github.io/docs/

  // To get your app running against GitHub, see:
  // https://probot.github.io/docs/development/
}
