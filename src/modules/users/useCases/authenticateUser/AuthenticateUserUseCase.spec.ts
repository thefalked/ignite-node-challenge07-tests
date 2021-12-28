import { InMemoryUsersRepository } from "../../repositories/in-memory/InMemoryUsersRepository";
import { CreateUserUseCase } from "../createUser/CreateUserUseCase";
import { AuthenticateUserUseCase } from "./AuthenticateUserUseCase";
import { IncorrectEmailOrPasswordError } from "./IncorrectEmailOrPasswordError";

let inMemoryUsersRepository: InMemoryUsersRepository;
let authenticateUserUseCase: AuthenticateUserUseCase;
let createUserUseCase: CreateUserUseCase;

describe("Create User", () => {
  beforeAll(() => {
    inMemoryUsersRepository = new InMemoryUsersRepository();

    authenticateUserUseCase = new AuthenticateUserUseCase(
      inMemoryUsersRepository
    );

    createUserUseCase = new CreateUserUseCase(inMemoryUsersRepository);
  });

  it("should be able to login", async () => {
    const user = {
      name: "John Doe",
      email: "john@doe.com",
      password: "123456",
    };

    await createUserUseCase.execute(user);

    const userLogin = await authenticateUserUseCase.execute({
      email: user.email,
      password: user.password,
    });

    expect(userLogin).toHaveProperty("token");
  });

  it("should not be able to login with incorrect password", () => {
    expect(async () => {
      const user = {
        name: "John Doe",
        email: "john2@doe.com",
        password: "teste",
      };

      await createUserUseCase.execute(user);

      await authenticateUserUseCase.execute({
        email: user.email,
        password: "errorTest",
      });
    }).rejects.toBeInstanceOf(IncorrectEmailOrPasswordError);
  });

  it("should not be able to login with incorrect email", () => {
    expect(async () => {
      const user = {
        name: "John Doe",
        email: "john3@doe.com",
        password: "teste",
      };

      await createUserUseCase.execute(user);

      await authenticateUserUseCase.execute({
        email: "incorrect@email.com",
        password: user.password,
      });
    }).rejects.toBeInstanceOf(IncorrectEmailOrPasswordError);
  });
});
