import request from "supertest";
import { Connection } from "typeorm";

import { app } from "../../../../app";
import createConnection from "../../../../database/index";

let connection: Connection;
let userToken: string;
let userTransferToken: string;

describe("Get Balance Controller", () => {
  beforeAll(async () => {
    connection = await createConnection();

    await connection.runMigrations();

    await request(app).post("/api/v1/users").send({
      name: "teste",
      email: "admin@rentx.com",
      password: "admin",
    });

    await request(app).post("/api/v1/users").send({
      name: "teste user",
      email: "user@rentx.com",
      password: "user",
    });

    const {
      body: { token },
    } = await request(app).post("/api/v1/sessions").send({
      email: "admin@rentx.com",
      password: "admin",
    });

    const {
      body: {
        token: token_user,
        user: { id },
      },
    } = await request(app).post("/api/v1/sessions").send({
      email: "user@rentx.com",
      password: "user",
    });

    await request(app)
      .post("/api/v1/statements/deposit")
      .set({
        authorization: `Bearer ${token}`,
      })
      .send({
        amount: 150,
        description: "Adding cash",
      });

    await request(app)
      .post("/api/v1/statements/withdraw")
      .set({
        authorization: `Bearer ${token}`,
      })
      .send({
        amount: 100,
        description: "Removing cash",
      });

    await request(app)
      .post(`/api/v1/statements/transfers/${id}`)
      .set({
        authorization: `Bearer ${token}`,
      })
      .send({
        amount: 50,
        description: "Transfering cash",
      });

    userTransferToken = token_user;
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
    expect(response.body.statement).toHaveLength(3);
  });

  it("Should be able to get the balance of a transference", async () => {
    const response = await request(app)
      .get("/api/v1/statements/balance")
      .set({
        authorization: `Bearer ${userTransferToken}`,
      });

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty("balance");
    expect(response.body.balance).toBe(50);
    expect(response.body).toHaveProperty("statement");
    expect(response.body.statement).toHaveLength(1);
    expect(response.body.statement[0]).toHaveProperty("sender_id");
  });

  it("Should not be able to get the balance with invalid token", async () => {
    const response = await request(app).get("/api/v1/statements/balance").set({
      authorization: "Bearer invalid_token",
    });

    expect(response.statusCode).toBe(401);
    expect(response.body).toStrictEqual({ message: "JWT invalid token!" });
  });
});
