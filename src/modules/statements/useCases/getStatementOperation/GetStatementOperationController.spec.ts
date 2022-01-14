import request from "supertest";
import { Connection } from "typeorm";

import { app } from "../../../../app";
import createConnection from "../../../../database/index";

let connection: Connection;
let userToken: string;
let statement_deposit_id: string;
let statement_withdraw_id: string;
describe("Get Statement Controller", () => {
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

    const {
      body: { id: depositId },
    } = await request(app)
      .post("/api/v1/statements/deposit")
      .set({
        authorization: `Bearer ${token}`,
      })
      .send({
        amount: 100,
        description: "Adding cash",
      });

    statement_deposit_id = depositId;

    const {
      body: { id: withdrawId },
    } = await request(app)
      .post("/api/v1/statements/withdraw")
      .set({
        authorization: `Bearer ${token}`,
      })
      .send({
        amount: 100,
        description: "Adding cash",
      });

    statement_withdraw_id = withdrawId;

    userToken = token;
  });

  afterAll(async () => {
    await connection.dropDatabase();
    await connection.close();
  });

  it("Should be able to get a deposit statement", async () => {
    const response = await request(app)
      .get(`/api/v1/statements/${statement_deposit_id}`)
      .set({
        authorization: `Bearer ${userToken}`,
      });

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty("id");
    expect(response.body).toHaveProperty("amount");
    expect(response.body.amount).toBe("100.00");
  });

  it("Should be able to get a withdraw statement", async () => {
    const response = await request(app)
      .get(`/api/v1/statements/${statement_withdraw_id}`)
      .set({
        authorization: `Bearer ${userToken}`,
      });

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty("id");
    expect(response.body).toHaveProperty("amount");
    expect(response.body.amount).toBe("100.00");
  });

  it("Should not be able to get a statement with invalid id", async () => {
    const randomUUID = "d9abf7fe-ff0b-467e-a9fc-c767eb1852e8";

    const response = await request(app)
      .get(`/api/v1/statements/${randomUUID}`)
      .set({
        authorization: `Bearer ${userToken}`,
      });

    expect(response.statusCode).toBe(404);
    expect(response.body).toStrictEqual({ message: "Statement not found" });
  });
});
