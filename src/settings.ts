export const TRIAGE_LABEL = "status/triage";

export const LABEL_TO_COLUMN: Record<string, string> = {
  [TRIAGE_LABEL]: "Triage",
  "status/ready-to-work-on": "Ready to Work On",
  "status/assigned": "Assigned",
  "status/in-progress": "In Progress",
  "status/in-review": "In Review",
  "status/done": "Done",
};
