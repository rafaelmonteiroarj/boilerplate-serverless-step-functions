import logger from "../../../../shared/modules/logging/winston/logger";
import { OrderModel } from "../../core/model/order.model";
import { AddOrderUseCase } from "../../core/use-cases/add-order.use-case";
import { OrderRepository } from "../../persistence/repository/order.repository";
import { validationOrderSchema } from "./validation/order.validation";

const orderRepository = new OrderRepository();
const addOrderUseCase = new AddOrderUseCase(orderRepository);

export const handler = async (event: {
  name: string;
  description: string;
  phoneNumber?: string;
}): Promise<OrderModel> => {
  try {
    const payload = validationOrderSchema.parse(event);
    return await addOrderUseCase.execute(payload);
  } catch (err) {
    logger.error("[handler - addOrder] Error:", err);

    if (err instanceof Error && "flatten" in err) {
      throw new Error(
        JSON.stringify({
          message: "Validation failed",
          details: (err as any).flatten().fieldErrors,
        }),
      );
    }

    throw new Error(
      err instanceof Error
        ? err.message
        : "[handler - addOrder] An unexpected error occurred",
    );
  }
};
