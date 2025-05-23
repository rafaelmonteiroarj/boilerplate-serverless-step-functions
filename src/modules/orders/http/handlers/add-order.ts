import { PublishCommand, SNSClient } from "@aws-sdk/client-sns";
import logger from "../../../../shared/modules/logging/winston/logger";
import { OrderModel } from "../../core/model/order.model";
import { AddOrderUseCase } from "../../core/use-cases/add-order.use-case";
import { OrderRepository } from "../../persistence/repository/order.repository";
import { validationOrderSchema } from "./validation/order.validation";

const orderRepository = new OrderRepository();
const addOrderUseCase = new AddOrderUseCase(orderRepository);
const snsClient = new SNSClient({ region: process.env.REGION });

export const handler = async (event: {
  name: string;
  description: string;
  phoneNumber?: string;
}): Promise<OrderModel> => {
  try {
    const payload = validationOrderSchema.parse(event);
    const order = await addOrderUseCase.execute(payload);

    // If phone number is provided, publish to SNS topic
    if (payload.phoneNumber) {
      const topicArn = `${process.env.STAGE}-order-sms`;
      const message = `New order created: ${order.name}\nDescription: ${order.description}`;

      await snsClient.send(
        new PublishCommand({
          TopicArn: topicArn,
          Message: message,
          PhoneNumber: payload.phoneNumber,
          MessageAttributes: {
            'AWS.SNS.SMS.SenderID': {
              DataType: 'String',
              StringValue: 'ORDERS'
            },
            'AWS.SNS.SMS.SMSType': {
              DataType: 'String',
              StringValue: 'Transactional'
            }
          }
        })
      );
    }

    return order;
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
