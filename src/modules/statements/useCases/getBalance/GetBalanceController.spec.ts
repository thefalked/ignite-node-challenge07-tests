import request from "supertest";
import { Connection } from "typeorm";

import { app } from "../../../../app";
import createConnection from "../../../../database/index";

let connection: Connection;
let userToken: string;
describe("Get Balance Controller", () => {
  beforeAll(async () => {
    connection = await createConnection();

    await connection.runMigrations();

    await request(app).post("/api/v1/users").send({
      name: "teste",
      email: "admin@rentx.com",
      password: "admin",
    });

    const {
      body: { token },
    } = await request(app).post("/api/v1/sessions").send({
      email: "admin@rentx.com",
      password: "admin",
    });

    await request(app)
      .post("/api/v1/statements/deposit")
      .set({
        authorization: `Bearer ${token}`,
      })
      .send({
        amount: 100,
        description: "Adding cash",
      });

    await request(app)
      .post("/api/v1/statements/deposit")
      .set({
        authorization: `Bearer ${token}`,
      })
      .send({
        amount: 100,
        description: "Adding cash",
      });

    userToken = token;
  });

  afterAll(async () => {
    await connection.dropDatabase();
    await connection.close();
  });

  it("Should be able to get the balance", async () => {
    const response = await request(app)
      .get("/api/v1/statements/balance")
      .set({
        authorization: `Bearer ${userToken}`,
      });

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty("balance");
    expect(response.body).toHaveProperty("statement");
    expect(response.body.statement).toHaveLength(2);
  });

  it("Should not be able to get the balance with invalid token", async () => {
    const response = await request(app).get("/api/v1/statements/balance").set({
      authorization: "Bearer invalid_token",
    });

    expect(response.statusCode).toBe(401);
    expect(response.body).toStrictEqual({ message: "JWT invalid token!" });
  });
});
