import { InMemoryUsersRepository } from "../../repositories/in-memory/InMemoryUsersRepository";
import { CreateUserUseCase } from "../createUser/CreateUserUseCase";
import { ShowUserProfileError } from "./ShowUserProfileError";
import { ShowUserProfileUseCase } from "./ShowUserProfileUseCase";

let inMemoryUsersRepository: InMemoryUsersRepository;
let createUserUseCase: CreateUserUseCase;
let showUserProfileUseCase: ShowUserProfileUseCase;

describe("Create User", () => {
  beforeAll(() => {
    inMemoryUsersRepository = new InMemoryUsersRepository();

    createUserUseCase = new CreateUserUseCase(inMemoryUsersRepository);

    showUserProfileUseCase = new ShowUserProfileUseCase(
      inMemoryUsersRepository
    );
  });

  it("should be show user information", async () => {
    const user = await createUserUseCase.execute({
      name: "John Doe",
      email: "john@doe.com",
      password: "123456",
    });

    const userProfile = await showUserProfileUseCase.execute(user.id!);

    expect(userProfile).toBe(user);
  });

  it("should not show user information if id is incorrect", () => {
    expect(async () => {
      await createUserUseCase.execute({
        name: "John Doe",
        email: "john2@doe.com",
        password: "123456",
      });

      await showUserProfileUseCase.execute("incorrect_id");
    }).rejects.toBeInstanceOf(ShowUserProfileError);
  });
});
