import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, PutCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';

const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);

const USER_LIMITS_TABLE = process.env.USER_LIMITS_TABLE!;
const DAILY_LIMIT = 1000; // Limite diário de mensagens por usuário

interface UserLimit {
  userId: string;
  date: string;
  count: number;
}

export const handler = async (event: any) => {
  const { userId, date } = event;

  try {
    // Verifica se o usuário já tem registro para hoje
    const userLimit = await getUserLimit(userId, date);

    if (!userLimit) {
      // Primeira mensagem do dia
      await createUserLimit(userId, date);
      return {
        statusCode: 200,
        message: 'Limite criado',
        currentCount: 1,
        remainingLimit: DAILY_LIMIT - 1
      };
    }

    // Verifica se atingiu o limite
    if (userLimit.count >= DAILY_LIMIT) {
      throw new Error('Limite diário atingido');
    }

    // Incrementa o contador
    const newCount = userLimit.count + 1;
    await incrementUserLimit(userId, date, newCount);

    return {
      statusCode: 200,
      message: 'Limite atualizado',
      currentCount: newCount,
      remainingLimit: DAILY_LIMIT - newCount
    };

  } catch (error) {
    return {
      statusCode: 400,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

async function getUserLimit(userId: string, date: string): Promise<UserLimit | null> {
  try {
    const result = await docClient.send(new GetCommand({
      TableName: USER_LIMITS_TABLE,
      Key: { userId, date }
    }));

    return result.Item as UserLimit || null;
  } catch (error) {
    console.error('Erro ao buscar limite do usuário:', error);
    return null;
  }
}

async function createUserLimit(userId: string, date: string) {
  await docClient.send(new PutCommand({
    TableName: USER_LIMITS_TABLE,
    Item: {
      userId,
      date,
      count: 1,
      ttl: Math.floor(Date.now() / 1000) + (2 * 24 * 60 * 60) // 2 dias
    }
  }));
}

async function incrementUserLimit(userId: string, date: string, newCount: number) {
  await docClient.send(new UpdateCommand({
    TableName: USER_LIMITS_TABLE,
    Key: { userId, date },
    UpdateExpression: 'SET #count = :count',
    ExpressionAttributeNames: {
      '#count': 'count'
    },
    ExpressionAttributeValues: {
      ':count': newCount
    }
  }));
}
