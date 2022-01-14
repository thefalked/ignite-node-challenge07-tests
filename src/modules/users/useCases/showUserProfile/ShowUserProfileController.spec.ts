import request from "supertest";
import { Connection } from "typeorm";

import { app } from "../../../../app";
import createConnection from "../../../../database/index";

let connection: Connection;
let userToken: string;
describe("Show User Profile Controller", () => {
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

  it("Should be able to get the user profile", async () => {
    const response = await request(app)
      .get("/api/v1/profile")
      .set({
        authorization: `Bearer ${userToken}`,
      });

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty("id");
  });

  it("Should not be able to get the user profile with a invalid token", async () => {
    const response = await request(app).post("/api/v1/profile").set({
      authorization: "Bearer invalid_token",
    });

    expect(response.statusCode).toBe(401);
    expect(response.body).toStrictEqual({
      message: "JWT invalid token!",
    });
  });

  it("Should not be able to get the user profile without a token", async () => {
    const response = await request(app).post("/api/v1/profile");

    expect(response.statusCode).toBe(401);
    expect(response.body).toStrictEqual({
      message: "JWT token is missing!",
    });
  });
});
