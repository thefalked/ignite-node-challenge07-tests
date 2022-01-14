import request from "supertest";
import { Connection } from "typeorm";

import { app } from "../../../../app";
import createConnection from "../../../../database/index";
import { CreateUserError } from "./CreateUserError";

let connection: Connection;
describe("Create User Controller", () => {
  beforeAll(async () => {
    connection = await createConnection();

    await connection.runMigrations();
  });

  afterAll(async () => {
    await connection.dropDatabase();
    await connection.close();
  });

  it("Should be able to create a new user", async () => {
    const response = await request(app).post("/api/v1/users").send({
      name: "teste",
      email: "admin@rentx.com",
      password: "admin",
    });

    expect(response.statusCode).toBe(201);
  });

  it("Should not be able to create another user with the same email", async () => {
    await request(app).post("/api/v1/users").send({
      name: "teste",
      email: "check@same.email",
      password: "admin",
    });

    const response = await request(app).post("/api/v1/users").send({
      name: "teste",
      email: "check@same.email",
      password: "admin",
    });

    expect(response.statusCode).toBe(400);
    expect(response.body).toStrictEqual({ message: "User already exists" });
  });
});
