import logger from "../../../../shared/modules/logging/winston/logger";
import { OrderModel } from "../../core/model/order.model";
import { GetOrderByIdUseCase } from "../../core/use-cases/get-order-by-id.use-case";
import { OrderRepository } from "../../persistence/repository/order.repository";

const orderRepository = new OrderRepository();
const getOrderByIdUseCase = new GetOrderByIdUseCase(orderRepository);

export const handler = async (event: { id: string }): Promise<OrderModel> => {
  try {
    return await getOrderByIdUseCase.execute(event.id);
  } catch (err) {
    logger.error("[handler - getOrderById] Error:", err);
    throw new Error(
      err instanceof Error
        ? err.message
        : "[handler - getOrderById] An unexpected error occurred",
    );
  }
};
