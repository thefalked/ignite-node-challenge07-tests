import request from "supertest";
import { Connection } from "typeorm";

import { app } from "../../../../app";
import createConnection from "../../../../database/index";

let connection: Connection;
let userToken: string;
describe("Create Statement Controller", () => {
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

    userToken = token;
  });

  afterAll(async () => {
    await connection.dropDatabase();
    await connection.close();
  });

  it("Should be able to create a statement with deposit type", async () => {
    const response = await request(app)
      .post("/api/v1/statements/deposit")
      .set({
        authorization: `Bearer ${userToken}`,
      })
      .send({
        amount: 100,
        description: "Adding cash",
      });

    expect(response.statusCode).toBe(201);
    expect(response.body).toHaveProperty("id");
  });

  it("Should be able to create a statement with withdraw type", async () => {
    const response = await request(app)
      .post("/api/v1/statements/withdraw")
      .set({
        authorization: `Bearer ${userToken}`,
      })
      .send({
        amount: 100,
        description: "Removing cash",
      });

    expect(response.statusCode).toBe(201);
    expect(response.body).toHaveProperty("id");
  });

  it("Should not be able to create a statement with withdraw type and insufficient amount", async () => {
    const response = await request(app)
      .post("/api/v1/statements/withdraw")
      .set({
        authorization: `Bearer ${userToken}`,
      })
      .send({
        amount: 100,
        description: "Removing cash",
      });

    expect(response.statusCode).toBe(400);
    expect(response.body).toStrictEqual({ message: "Insufficient funds" });
  });
});
