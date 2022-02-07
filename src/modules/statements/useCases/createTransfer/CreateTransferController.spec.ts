import request from "supertest";
import { Connection } from "typeorm";

import { app } from "../../../../app";
import createConnection from "../../../../database/index";

let connection: Connection;
let userToken: string;
let userTransferId: string;

describe("Create Transfer Controller", () => {
  beforeAll(async () => {
    connection = await createConnection();

    await connection.runMigrations();

    await request(app).post("/api/v1/users").send({
      name: "teste",
      email: "admin@rentx.com",
      password: "admin",
    });

    await request(app).post("/api/v1/users").send({
      name: "teste",
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
        user: { id },
      },
    } = await request(app).post("/api/v1/sessions").send({
      email: "user@rentx.com",
      password: "user",
    });

    userTransferId = id;
    userToken = token;
  });

  afterAll(async () => {
    await connection.dropDatabase();
    await connection.close();
  });

  it("Should be able to create a statement with transfer type", async () => {
    await request(app)
      .post("/api/v1/statements/deposit")
      .set({
        authorization: `Bearer ${userToken}`,
      })
      .send({
        amount: 100,
        description: "Adding cash",
      });

    const response = await request(app)
      .post(`/api/v1/statements/transfers/${userTransferId}`)
      .set({
        authorization: `Bearer ${userToken}`,
      })
      .send({
        amount: 100,
        description: "Transfering cash",
      });

    expect(response.statusCode).toBe(201);
    expect(response.body).toHaveProperty("id");
    expect(response.body).toHaveProperty("sender_id");
  });

  it("Should not be able to create a statement with transfer type and insufficient amount", async () => {
    const response = await request(app)
      .post(`/api/v1/statements/transfers/${userTransferId}`)
      .set({
        authorization: `Bearer ${userToken}`,
      })
      .send({
        amount: 100,
        description: "Transfering cash",
      });

    expect(response.statusCode).toBe(400);
    expect(response.body).toStrictEqual({ message: "Insufficient funds" });
  });

  it("Should not be able to create a statement with transfer type and invalid user", async () => {
    const randomUUID = "d9abf7fe-ff0b-467e-a9fc-c767eb1852e8";

    const response = await request(app)
      .post(`/api/v1/statements/transfers/${randomUUID}`)
      .set({
        authorization: `Bearer ${userToken}`,
      })
      .send({
        amount: 100,
        description: "Transfering cash",
      });

    expect(response.statusCode).toBe(404);
    expect(response.body).toStrictEqual({ message: "User not found" });
  });
});
