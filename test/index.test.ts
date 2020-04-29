// You can import your modules
// import index from '../src/index'

import nock from "nock";
// Requiring our app implementation
import myProbotApp from "../src";
import { Probot } from "probot";
import fs from "fs";
import path from "path";

const nockGH = nock("https://api.github.com");

const REPO = {
  name: "gh-project-bot",
  owner: {
    login: "dajinchu",
  },
};
const COL_ID_ASSIGNED = 1;
const PROJ_ID = 42;
const ISSUE_NUM = 9;
const ISSUE_ID = 123456;

describe("My Probot app", () => {
  let probot: any;
  let mockCert: string;

  beforeAll((done: Function) => {
    fs.readFile(
      path.join(__dirname, "fixtures/mock-cert.pem"),
      "utf8",
      (err: Error | null, cert: string) => {
        if (err) return done(err);
        mockCert = cert;
        done();
      }
    );
  });

  beforeEach(() => {
    nock.disableNetConnect();
    // Test that we correctly return a test token
    // Load our app into probot
    probot = new Probot({ id: 123, cert: mockCert });
    probot.load(myProbotApp);
  });

  describe("issue.labeled", () => {
    function mockIssueLabeled(newLabel: string, allLabels: string[]) {
      return {
        name: "issues",
        payload: {
          action: "labeled",
          label: {
            name: newLabel,
          },
          issue: {
            id: ISSUE_ID,
            number: ISSUE_NUM,
            user: {
              login: "dajinchu",
            },
            labels: allLabels.map((name) => ({ name })),
          },
          repository: REPO,
        },
      };
    }
    beforeEach(() => {
      nockGH
        .post("/app/installations/2/access_tokens")
        .reply(200, { token: "test" });

      nockGH
        .get("/repos/dajinchu/gh-project-bot/projects")
        .reply(200, [{ id: PROJ_ID }]);

      nockGH.get(`/projects/${PROJ_ID}/columns`).reply(200, [
        { id: 29, name: "Triage" },
        { id: COL_ID_ASSIGNED, name: "Assigned" },
        { id: 3, name: "In Review" },
      ]);
    });

    it("moves issue to project board when tagged", async (done) => {
      // Test that card created in assigned column
      nockGH
        .post("/projects/columns/1/cards", (body: any) => {
          done(
            expect(body).toMatchObject({
              content_id: ISSUE_ID,
              content_type: "Issue",
            })
          );
          return true;
        })
        .reply(201);

      // Receive a webhook event
      await probot.receive(
        mockIssueLabeled("status/assigned", [
          "status/assigned",
          "priority/high",
        ])
      );
    });

    it("removes old status tags", async (done) => {
      nockGH
        .delete(
          `/repos/dajinchu/gh-project-bot/issues/${ISSUE_NUM}/labels/status/triage`
        )
        .reply(200);
      nockGH
        .post(`/projects/columns/${COL_ID_ASSIGNED}/cards`, (body: any) => {
          done(
            expect(body).toMatchObject({
              content_id: ISSUE_ID,
              content_type: "Issue",
            })
          );
          return true;
        })
        .reply(201);

      // Receive a webhook event
      await probot.receive(
        mockIssueLabeled("status/assigned", [
          "status/assigned",
          "status/triage",
        ])
      );
    });
    it("gracefully handles not finding any status tags", async () => {
      expect(
        probot.receive(mockIssueLabeled("priority/high", ["priority/high"]))
      ).resolves.not.toThrow();
    });
  });

  afterEach(() => {
    nock.cleanAll();
    nock.enableNetConnect();
  });
});
