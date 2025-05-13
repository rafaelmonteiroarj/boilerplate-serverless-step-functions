import { DynamoRepository } from "../../../../shared/modules/persistence/dynamo.repository";
import { OrderModel } from "../../core/model/order.model";
import { CreateOrderDTO } from "../../http/handlers/dtos/create-order.dto";

export class OrderRepository extends DynamoRepository<OrderModel> {
  constructor() {
    super();
  }

  async create(order: CreateOrderDTO): Promise<OrderModel> {
    const orderModel = OrderModel.create(order);
    await super.create(orderModel);

    return orderModel;
  }

  async getById(id: string): Promise<OrderModel> {
    return super.getById(id);
  }

  async update(order: OrderModel & { id: string }): Promise<OrderModel> {
    return super.update(order);
  }

  async deleteById(id: string): Promise<void> {
    return super.deleteById(id);
  }

  async list(ExclusiveStartKey?: Record<string, any>) {
    return super.list(ExclusiveStartKey);
  }

  async getFirstItem(): Promise<OrderModel | null> {
    return super.getFirstItem();
  }

  async getByName(name: string): Promise<OrderModel | null> {
    const { items } = await this.list();
    return items.find((item) => item.name === name) || null;
  }
}
