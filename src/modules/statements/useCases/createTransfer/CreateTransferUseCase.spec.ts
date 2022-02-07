import { User } from "../../../users/entities/User";
import { InMemoryUsersRepository } from "../../../users/repositories/in-memory/InMemoryUsersRepository";
import { CreateUserUseCase } from "../../../users/useCases/createUser/CreateUserUseCase";
import { OperationType } from "../../entities/Statement";
import { InMemoryStatementsRepository } from "../../repositories/in-memory/InMemoryStatementsRepository";
import { CreateStatementUseCase } from "../createStatement/CreateStatementUseCase";
import { CreateTransferError } from "./CreateTransferError";
import { CreateTransferUseCase } from "./CreateTransferUseCase";

let inMemoryStatementsRepository: InMemoryStatementsRepository;
let inMemoryUsersRepository: InMemoryUsersRepository;

let createTransferUseCase: CreateTransferUseCase;
let createStatementUseCase: CreateStatementUseCase;
let createUserUseCase: CreateUserUseCase;

let user: User;
let userForTransfer: User;

describe("Create transfer", () => {
  beforeAll(async () => {
    inMemoryStatementsRepository = new InMemoryStatementsRepository();
    inMemoryUsersRepository = new InMemoryUsersRepository();

    createUserUseCase = new CreateUserUseCase(inMemoryUsersRepository);

    createStatementUseCase = new CreateStatementUseCase(
      inMemoryUsersRepository,
      inMemoryStatementsRepository
    );

    createTransferUseCase = new CreateTransferUseCase(
      inMemoryUsersRepository,
      inMemoryStatementsRepository
    );

    user = await createUserUseCase.execute({
      name: "John Doe",
      email: "john@doe.com",
      password: "123456",
    });

    userForTransfer = await createUserUseCase.execute({
      name: "John Doe",
      email: "john2@doe.com",
      password: "123456",
    });
  });

  it("should create a new transfer", async () => {
    await createStatementUseCase.execute({
      user_id: user.id!,
      type: OperationType.DEPOSIT,
      amount: 100,
      description: "Deposit",
    });

    const transfer = await createTransferUseCase.execute({
      user_id: userForTransfer.id!,
      sender_id: user.id!,
      type: OperationType.TRANSFER,
      amount: 100,
      description: "Transfer",
    });

    expect(transfer.type).toBe(OperationType.TRANSFER);
    expect(transfer.amount).toBe(100);
    expect(transfer.description).toBe("Transfer");
    expect(transfer.sender_id).toBe(user.id);
  });

  it("should not be able to do a transfer with balance < transfer", () => {
    expect(async () => {
      await createTransferUseCase.execute({
        user_id: userForTransfer.id!,
        sender_id: user.id!,
        type: OperationType.TRANSFER,
        amount: 100,
        description: "Transfer",
      });
    }).rejects.toBeInstanceOf(CreateTransferError.InsufficientFunds);
  });
});
