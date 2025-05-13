import {
  DeleteItemCommand,
  DynamoDBClient,
  GetItemCommand,
  PutItemCommand,
  ScanCommand,
} from "@aws-sdk/client-dynamodb";
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb";

export class DynamoRepository<T> {
  private dynamoClient: DynamoDBClient;
  private tableName: string;

  constructor() {
    this.dynamoClient = new DynamoDBClient({ region: process.env.REGION });
    this.tableName = process.env.DYNAMO_TABLE_PROCESS!;
  }

  async list(
    ExclusiveStartKey?: Record<string, any>,
  ): Promise<{ items: T[]; lastEvaluatedKey?: Record<string, any> }> {
    const command = new ScanCommand({
      TableName: this.tableName,
      ExclusiveStartKey,
    });

    const response = await this.dynamoClient.send(command);

    const items = response.Items
      ? response.Items.map((item) => unmarshall(item) as T)
      : [];
    const lastEvaluatedKey = response.LastEvaluatedKey;

    return { items, lastEvaluatedKey };
  }

  async getFirstItem(): Promise<T | null> {
    const command = new ScanCommand({
      TableName: this.tableName,
      Limit: 1,
    });

    const response = await this.dynamoClient.send(command);

    if (!response.Items || response.Items.length === 0) {
      return null;
    }

    return unmarshall(response.Items[0]) as T;
  }

  async getById(id: string): Promise<T> {
    const command = new GetItemCommand({
      TableName: this.tableName,
      Key: marshall({ id }),
    });

    const response = await this.dynamoClient.send(command);

    if (!response.Item) {
      throw new Error(`Item with id ${id} not found`);
    }

    return unmarshall(response.Item) as T;
  }

  async update(item: T & { id: string }): Promise<T> {
    const command = new PutItemCommand({
      TableName: this.tableName,
      Item: marshall(item, {
        removeUndefinedValues: true,
        convertEmptyValues: true,
        convertClassInstanceToMap: true,
      }),
    });

    await this.dynamoClient.send(command);
    return item;
  }

  async create(item: T & { id: string }): Promise<T> {
    const command = new PutItemCommand({
      TableName: this.tableName,
      Item: marshall(item, {
        removeUndefinedValues: true,
        convertEmptyValues: true,
        convertClassInstanceToMap: true,
      }),
    });

    await this.dynamoClient.send(command);
    return item;
  }

  async deleteById(id: string): Promise<void> {
    const command = new DeleteItemCommand({
      TableName: this.tableName,
      Key: marshall({ id }),
    });

    await this.dynamoClient.send(command);
  }
}
