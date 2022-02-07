import { Request, Response } from "express";
import { container } from "tsyringe";
import { OperationType } from "../../entities/Statement";

import { CreateTransferUseCase } from "./CreateTransferUseCase";

export class CreateTransferController {
  async execute(request: Request, response: Response) {
    const { user_id } = request.params;
    const { id: sender_id } = request.user;
    const { amount, description } = request.body;

    const createTransfer = container.resolve(CreateTransferUseCase);

    const transfer = await createTransfer.execute({
      user_id: String(user_id),
      sender_id,
      type: "transfer" as OperationType,
      amount,
      description,
    });

    return response.status(201).json(transfer);
  }
}
