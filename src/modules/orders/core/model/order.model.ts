import { v4 as uuidv7 } from "uuid";
import {
  DefaultModel,
  WithOptional,
} from "../../../../shared/core/model/default.model";

export class OrderModel extends DefaultModel {
  name!: string;
  description!: string;
  phoneNumber?: string;

  private constructor(data: Partial<OrderModel>) {
    super();
    Object.assign(this, data);
  }

  static create(
    data: WithOptional<OrderModel, "id" | "createdAt" | "updatedAt">,
  ): OrderModel {
    return new OrderModel({
      ...data,
      id: data.id ? data.id : uuidv7(),
      createdAt: data.createdAt ? data.createdAt : new Date(),
      updatedAt: data.updatedAt ? data.updatedAt : new Date(),
      phoneNumber: data.phoneNumber,
    });
  }

  static createFrom(data: OrderModel): OrderModel {
    return new OrderModel({
      ...data,
    });
  }

  static mapper(data: OrderModel): OrderModel {
    return new OrderModel({
      ...data,
    });
  }
}
