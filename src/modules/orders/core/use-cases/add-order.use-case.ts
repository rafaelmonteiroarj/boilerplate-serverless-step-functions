import { DomainException } from "../../../../shared/core/exception/domain.exception";
import { CreateOrderDTO } from "../../http/handlers/dtos/create-order.dto";
import { OrderRepository } from "../../persistence/repository/order.repository";
import { OrderModel } from "../model/order.model";

export class AddOrderUseCase {
  constructor(private readonly userRepository: OrderRepository) {}

  async execute(data: CreateOrderDTO): Promise<OrderModel> {
    const checkIsOrder = await this.userRepository.getByName(data.name);

    if (checkIsOrder) {
      throw new DomainException("Order with this name already exists.");
    }

    const createdOrder = await this.userRepository.create(data);

    if (!createdOrder) {
      throw new Error("Failed to create order.");
    }

    return createdOrder;
  }
}
