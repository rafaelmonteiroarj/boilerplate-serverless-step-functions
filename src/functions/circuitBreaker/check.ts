import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, PutCommand } from '@aws-sdk/lib-dynamodb';

const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);

const CIRCUIT_BREAKER_TABLE = process.env.CIRCUIT_BREAKER_TABLE!;
const FAILURE_THRESHOLD = 5;
const TIMEOUT_MINUTES = 5;

interface CircuitBreakerState {
  serviceName: string;
  state: 'CLOSED' | 'OPEN' | 'HALF_OPEN';
  failureCount: number;
  lastFailureTime: number;
}

export const handler = async (event: any) => {
  const serviceName = event.serviceName || 'SNS_SMS';

  try {
    // Busca o status atual do circuit breaker
    const circuitStatus = await getCircuitStatus(serviceName);

    // Verifica se o circuito está aberto
    if (circuitStatus.state === 'OPEN') {
      const now = Date.now();
      const timeSinceOpen = now - circuitStatus.lastFailureTime;

      // Se passou do timeout, tenta meio-aberto
      if (timeSinceOpen > (TIMEOUT_MINUTES * 60 * 1000)) {
        await updateCircuitState(serviceName, 'HALF_OPEN', now);
        return {
          statusCode: 200,
          circuitState: 'HALF_OPEN',
          message: 'Circuit breaker em estado meio-aberto, tentando requisição'
        };
      }

      // Circuito ainda aberto, rejeita requisição
      throw new Error('Circuit breaker OPEN - serviço indisponível');
    }

    return {
      statusCode: 200,
      circuitState: circuitStatus.state,
      message: 'Circuit breaker fechado, prosseguir com requisição'
    };

  } catch (error) {
    return {
      statusCode: 500,
      error: error instanceof Error ? error.message : 'Unknown error',
      circuitState: 'UNKNOWN'
    };
  }
};

async function getCircuitStatus(serviceName: string): Promise<CircuitBreakerState> {
  try {
    const result = await docClient.send(new GetCommand({
      TableName: CIRCUIT_BREAKER_TABLE,
      Key: { serviceName }
    }));

    return result.Item as CircuitBreakerState || {
      serviceName,
      state: 'CLOSED',
      failureCount: 0,
      lastFailureTime: 0
    };
  } catch (error) {
    // Se não conseguir ler, assume fechado
    return {
      serviceName,
      state: 'CLOSED',
      failureCount: 0,
      lastFailureTime: 0
    };
  }
}

async function updateCircuitState(serviceName: string, state: CircuitBreakerState['state'], timestamp: number) {
  await docClient.send(new PutCommand({
    TableName: CIRCUIT_BREAKER_TABLE,
    Item: {
      serviceName,
      state,
      lastFailureTime: timestamp,
      failureCount: state === 'CLOSED' ? 0 : undefined,
      ttl: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 horas
    }
  }));
}
