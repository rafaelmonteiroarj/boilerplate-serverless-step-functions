import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, PutCommand } from '@aws-sdk/lib-dynamodb';

const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);

const CIRCUIT_BREAKER_TABLE = process.env.CIRCUIT_BREAKER_TABLE!;
const AUDIT_TABLE = process.env.AUDIT_TABLE!;
const FAILURE_THRESHOLD = 5;

interface CircuitBreakerState {
  serviceName: string;
  state: 'CLOSED' | 'OPEN' | 'HALF_OPEN';
  failureCount: number;
  lastFailureTime: number;
}

export const handler = async (event: any) => {
  const { serviceName, success, messageId } = event;

  try {
    const circuitStatus = await getCircuitStatus(serviceName);

    if (success) {
      // Sucesso - reset o contador se estava meio-aberto
      if (circuitStatus.state === 'HALF_OPEN') {
        await updateCircuitState(serviceName, 'CLOSED', 0);
      }

      // Registra sucesso na tabela de auditoria
      await auditMessage(messageId, 'SUCCESS', event);

      return {
        statusCode: 200,
        message: 'Sucesso registrado'
      };
    } else {
      // Falha - incrementa contador
      const newFailureCount = (circuitStatus.failureCount || 0) + 1;
      const now = Date.now();

      if (newFailureCount >= FAILURE_THRESHOLD) {
        // Abre o circuito
        await updateCircuitState(serviceName, 'OPEN', now);

        // Registra falha na tabela de auditoria
        await auditMessage(messageId, 'FAILURE', {
          ...event,
          failureCount: newFailureCount,
          circuitState: 'OPEN'
        });

        return {
          statusCode: 200,
          message: 'Circuit breaker ABERTO devido a muitas falhas'
        };
      } else {
        // Apenas incrementa contador
        await updateCircuitState(serviceName, 'CLOSED', now, newFailureCount);

        // Registra falha na tabela de auditoria
        await auditMessage(messageId, 'FAILURE', {
          ...event,
          failureCount: newFailureCount,
          circuitState: 'CLOSED'
        });
      }
    }

    return {
      statusCode: 200,
      message: 'Falha registrada'
    };

  } catch (error) {
    return {
      statusCode: 500,
      error: error instanceof Error ? error.message : 'Unknown error'
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
    return {
      serviceName,
      state: 'CLOSED',
      failureCount: 0,
      lastFailureTime: 0
    };
  }
}

async function updateCircuitState(
  serviceName: string,
  state: CircuitBreakerState['state'],
  timestamp: number,
  failureCount?: number
) {
  await docClient.send(new PutCommand({
    TableName: CIRCUIT_BREAKER_TABLE,
    Item: {
      serviceName,
      state,
      lastFailureTime: timestamp,
      failureCount: failureCount ?? (state === 'CLOSED' ? 0 : undefined),
      ttl: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 horas
    }
  }));
}

async function auditMessage(messageId: string, status: 'SUCCESS' | 'FAILURE', details: any) {
  await docClient.send(new PutCommand({
    TableName: AUDIT_TABLE,
    Item: {
      messageId,
      timestamp: new Date().toISOString(),
      status,
      details,
      ttl: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60) // 7 dias
    }
  }));
}
