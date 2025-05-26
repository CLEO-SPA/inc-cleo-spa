import { PoolClient, Notification } from 'pg';
import { Request, Response } from 'express';
import { getProdPool } from '../config/database.js';

// Interface for an SSE client
interface SseClient {
  id: number;
  res: Response;
}

interface DbChangePayload {
  table: string;
  action: string;
  data: any;
}

let sseClients: SseClient[] = [];
let pgListenerClient: PoolClient | null = null;

/**
 * Add an SSE client to the list.
 * Assumes SSE headers (Content-Type, Cache-Control, Connection) are set on 'res' by the caller.
 */
function addSseClient(req: Request, res: Response): void {
  const clientId = Date.now();

  const newClient: SseClient = { id: clientId, res: res };

  sseClients.push(newClient);
  console.log(`SSE client ${clientId} connected. Total: ${sseClients.length}`);

  // Remove client when connection closes
  req.on('close', () => {
    sseClients = sseClients.filter((client) => client.id !== clientId);
    console.log(`SSE client ${clientId} disconnected. Total: ${sseClients.length}`);
  });
}

/**
 * Send message to all connected SSE clients.
 */
function broadcastMessage(data: any, eventName: string = 'message'): void {
  if (sseClients.length === 0) {
    // console.log('No SSE clients connected to broadcast to.');
    return;
  }
  console.log(`Broadcasting event "${eventName}" to ${sseClients.length} clients with data:`, data);

  sseClients = sseClients.filter((client) => {
    try {
      if (client.res.writableEnded) {
        console.log(`Client ${client.id} response stream ended. Removing.`);
        return false;
      }
      client.res.write(`event: ${eventName}\n`);
      client.res.write(`data: ${JSON.stringify(data)}\n\n`);
      return true;
    } catch (err: unknown) {
      console.error(`Error writing to client ${client.id}, removing:`, err instanceof Error ? err.message : err);
      return false;
    }
  });
}

/**
 * Setup PostgreSQL LISTEN to a channel for database change notifications.
 */
async function setupPgListener(): Promise<void> {
  try {
    const pool = getProdPool();
    if (pgListenerClient) {
      console.log('PostgreSQL listener already connected or attempting to connect. Skipping setup.');
      return;
    }
    pgListenerClient = await pool.connect();

    console.log(`PostgreSQL Listener: Connected`);

    // Handle notifications
    pgListenerClient.on('notification', (msg: Notification) => {
      console.log('=== PG NOTIFICATION RECEIVED ===');
      console.log('Channel:', msg.channel);
      console.log('Raw Payload:', msg.payload);

      if (msg.channel === 'db_changes' && msg.payload) {
        try {
          const payload: DbChangePayload = JSON.parse(msg.payload);
          console.log('Parsed Payload:', payload);
          broadcastMessage(payload, 'db_change');
        } catch (parseError: unknown) {
          console.error(
            'PostgreSQL Listener Error: Error parsing notification payload:',
            parseError instanceof Error ? parseError.message : parseError
          );
        }
      }
    });

    // Handle client errors
    pgListenerClient.on('error', (err: Error) => {
      console.error('PostgreSQL Listener Error:', err.message);
      if (pgListenerClient) {
        pgListenerClient.release(true);
      }
      pgListenerClient = null;
      console.log('Retrying PostgreSQL listener setup in 5 seconds...');
      setTimeout(setupPgListener, 5000);
    });

    // Handle connection end
    pgListenerClient.on('end', () => {
      console.log('PostgreSQL Listener: Connection ended.');
      if (pgListenerClient) {
      }
      pgListenerClient = null;
      console.log('Retrying PostgreSQL listener setup in 5 seconds...');
      setTimeout(setupPgListener, 5000);
    });

    await pgListenerClient.query('LISTEN db_changes');
    console.log('PostgreSQL Listener: Successfully listening to channel "db_changes"');
  } catch (setupErr: unknown) {
    console.error('PostgreSQL Listener Setup Failed:', setupErr instanceof Error ? setupErr.message : setupErr);
    if (pgListenerClient) {
      pgListenerClient.release(setupErr instanceof Error ? setupErr : undefined);
    }
    pgListenerClient = null;
    console.log('Retrying PostgreSQL listener setup in 5 seconds...');
    setTimeout(setupPgListener, 5000);
  }
}

/**
 * Test function to send a PostgreSQL notification from the same connection.
 */
async function testNotification(): Promise<void> {
  if (pgListenerClient) {
    try {
      const testPayload: DbChangePayload = {
        table: 'test_table',
        action: 'manual_test',
        data: { timestamp: new Date().toISOString(), value: Math.random() },
      };
      await pgListenerClient.query(`NOTIFY db_changes, '${JSON.stringify(testPayload)}'`);
      console.log('Test notification sent with payload:', testPayload);
    } catch (err: unknown) {
      console.error('Test notification failed:', err instanceof Error ? err.message : err);
    }
  } else {
    console.log('No PostgreSQL listener client connected to send test notification.');
  }
}

setupPgListener();

export { addSseClient, broadcastMessage, testNotification, setupPgListener };
