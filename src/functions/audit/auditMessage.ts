import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';

const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);
const s3Client = new S3Client({});

const AUDIT_TABLE = process.env.AUDIT_TABLE!;
const AUDIT_BUCKET = process.env.AUDIT_BUCKET!;

interface AuditRecord {
  messageId: string;
  timestamp: string;
  status: 'SUCCESS' | 'FAILURE';
  details: any;
}

export const handler = async (event: any) => {
  const { messageId, status, details } = event;

  try {
    // Registra na tabela DynamoDB
    await recordAudit(messageId, status, details);

    // Salva log detalhado no S3
    await saveDetailedLog(messageId, status, details);

    return {
      statusCode: 200,
      message: 'Auditoria registrada com sucesso'
    };

  } catch (error) {
    return {
      statusCode: 500,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

async function recordAudit(messageId: string, status: 'SUCCESS' | 'FAILURE', details: any) {
  const timestamp = new Date().toISOString();

  await docClient.send(new PutCommand({
    TableName: AUDIT_TABLE,
    Item: {
      messageId,
      timestamp,
      status,
      details,
      ttl: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60) // 7 dias
    }
  }));
}

async function saveDetailedLog(messageId: string, status: 'SUCCESS' | 'FAILURE', details: any) {
  const timestamp = new Date().toISOString();
  const date = timestamp.split('T')[0];

  const logContent = {
    messageId,
    timestamp,
    status,
    details,
    environment: process.env.STAGE,
    region: process.env.REGION
  };

  const key = `logs/${date}/${messageId}.json`;

  await s3Client.send(new PutObjectCommand({
    Bucket: AUDIT_BUCKET,
    Key: key,
    Body: JSON.stringify(logContent, null, 2),
    ContentType: 'application/json'
  }));
}
