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
    // Load our app into probot
    probot = new Probot({ id: 123, cert: mockCert });
    probot.load(myProbotApp);
  });

  test("moves issue to project board when tagged", async (done) => {
    // Test that we correctly return a test token
    nockGH
      .post("/app/installations/2/access_tokens")
      .reply(200, { token: "test" });

    nockGH
      .get("/repos/dajinchu/gh-project-bot/projects")
      .reply(200, [{ id: 42 }]);

    nockGH.get("/projects/42/columns").reply(200, [
      { id: 1, name: "Assigned" },
      { id: 3, name: "In Review" },
    ]);

    // Test that card created in assigned column
    nockGH
      .post("/projects/columns/1/cards", (body: any) => {
        done(
          expect(body).toMatchObject({
            content_id: 123456,
            content_type: "Issue",
          })
        );
        return true;
      })
      .reply(201);

    // Receive a webhook event
    await probot.receive({
      name: "issues",
      payload: {
        action: "labeled",
        issue: {
          id: 123456,
          user: {
            login: "dajinchu",
          },
          labels: [
            {
              name: "priority/high",
            },
            {
              name: "status/assigned",
            },
          ],
        },
        repository: REPO,
      },
    });
  });

  afterEach(() => {
    nock.cleanAll();
    nock.enableNetConnect();
  });
});

// For more information about testing with Jest see:
// https://facebook.github.io/jest/

// For more information about using TypeScript in your tests, Jest recommends:
// https://github.com/kulshekhar/ts-jest

// For more information about testing with Nock see:
// https://github.com/nock/nock
