import { NotFoundDomainException } from "../../../../shared/core/exception/not-found-domain.exception";
import { OrderRepository } from "../../persistence/repository/order.repository";
import { OrderModel } from "../model/order.model";

export class GetOrderByIdUseCase {
  constructor(private readonly orderRepository: OrderRepository) {}

  async execute(id: string): Promise<OrderModel> {
    const order = await this.orderRepository.getById(id).catch(() => null);

    if (!order) {
      throw new NotFoundDomainException(`Order with id ${id} not found.`);
    }

    return order;
  }
}
