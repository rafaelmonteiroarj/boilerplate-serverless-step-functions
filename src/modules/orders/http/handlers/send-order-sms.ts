import { PublishCommand, SNSClient } from "@aws-sdk/client-sns";
import logger from "../../../../shared/modules/logging/winston/logger";
import { OrderModel } from "../../core/model/order.model";

const sns = new SNSClient({ region: process.env.REGION });

export const handler = async (event: OrderModel) => {
  const phoneNumber = event.phoneNumber;
  if (!phoneNumber) {
    logger.error("[handler - sendOrderSms] No phone number provided");
    throw new Error("No phone number provided");
  }

  const message = `Seu pedido foi criado com sucesso! Pedido: ${event.name}`;

  const command = new PublishCommand({
    Message: message,
    PhoneNumber: phoneNumber,
  });

  try {
    const data = await sns.send(command);
    logger.info("SMS enviado com sucesso", data);
    return { success: true, messageId: data.MessageId };
  } catch (error) {
    logger.error("Erro ao enviar SMS", error);
    throw error;
  }
};
