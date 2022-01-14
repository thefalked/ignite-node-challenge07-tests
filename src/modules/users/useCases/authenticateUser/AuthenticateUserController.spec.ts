import request from "supertest";
import { Connection } from "typeorm";

import { app } from "../../../../app";
import createConnection from "../../../../database/index";

let connection: Connection;
describe("Authenticate User Controller", () => {
  beforeAll(async () => {
    connection = await createConnection();

    await connection.runMigrations();

    await request(app).post("/api/v1/users").send({
      name: "teste",
      email: "admin@rentx.com",
      password: "admin",
    });
  });

  afterAll(async () => {
    await connection.dropDatabase();
    await connection.close();
  });

  it("Should be able to create a new session", async () => {
    const response = await request(app).post("/api/v1/sessions").send({
      email: "admin@rentx.com",
      password: "admin",
    });

    expect(response.statusCode).toBe(200);
    expect(response.body.user).toHaveProperty("id");
    expect(response.body).toHaveProperty("token");
  });

  it("Should not be able to create a new session with invalid email", async () => {
    const response = await request(app).post("/api/v1/sessions").send({
      email: "invalid@email.com",
      password: "admin",
    });

    expect(response.statusCode).toBe(401);
    expect(response.body).toStrictEqual({
      message: "Incorrect email or password",
    });
  });

  it("Should not be able to create a new session with invalid password", async () => {
    const response = await request(app).post("/api/v1/sessions").send({
      email: "admin@rentx.com",
      password: "invalid_password",
    });

    expect(response.statusCode).toBe(401);
    expect(response.body).toStrictEqual({
      message: "Incorrect email or password",
    });
  });
});
