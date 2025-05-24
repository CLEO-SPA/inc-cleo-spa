import { getProdPool } from '../config/database.js';

let sseClients = [];
let pgListenerClient = null;

/**
 * Add an SSE client to the list
 */
function addSseClient(req, res) {
  const clientId = Date.now();
  const newClient = { id: clientId, res: res };

  sseClients.push(newClient);
  console.log(`SSE client ${clientId} connected. Total: ${sseClients.length}`);

  // Remove client when connection closes
  req.on('close', () => {
    sseClients = sseClients.filter((client) => client.id !== clientId);
    console.log(`SSE client ${clientId} disconnected. Total: ${sseClients.length}`);
  });
}

/**
 * Send message to all SSE clients
 */
function broadcastMessage(data, eventName = 'message') {
  console.log(`Broadcasting to ${sseClients.length} clients:`, data);

  sseClients = sseClients.filter((client) => {
    try {
      client.res.write(`event: ${eventName}\n`);
      client.res.write(`data: ${JSON.stringify(data)}\n\n`);
      return true;
    } catch (err) {
      console.log(`Removing dead client ${client.id}`);
      return false;
    }
  });
}

/**
 * Setup PostgreSQL LISTEN
 */
async function setupPgListener() {
  try {
    const pool = getProdPool();
    pgListenerClient = await pool.connect();

    console.log(`Connected to PostgreSQL (PID: ${pgListenerClient.processID})`);

    // Handle notifications
    pgListenerClient.on('notification', (msg) => {
      console.log('=== NOTIFICATION RECEIVED ===');
      console.log('Channel:', msg.channel);
      console.log('Payload:', msg.payload);

      if (msg.channel === 'db_changes') {
        try {
          const payload = JSON.parse(msg.payload);
          broadcastMessage(payload, 'db_change');
        } catch (err) {
          console.error('Error parsing notification:', err.message);
        }
      }
    });

    // Handle errors
    pgListenerClient.on('error', (err) => {
      console.error('PostgreSQL error:', err.message);
      pgListenerClient = null;
      setTimeout(setupPgListener, 5000); // Retry after 5 seconds
    });

    pgListenerClient.on('end', () => {
      console.log('PostgreSQL connection ended');
      pgListenerClient = null;
      setTimeout(setupPgListener, 5000); // Retry after 5 seconds
    });

    // Start listening
    await pgListenerClient.query('LISTEN db_changes');
    console.log('Successfully listening to channel "db_changes"');
  } catch (err) {
    console.error('Failed to setup PostgreSQL listener:', err.message);
    pgListenerClient = null;
    setTimeout(setupPgListener, 5000); // Retry after 5 seconds
  }
}

/**
 * Test function to send notification from same connection
 */
async function testNotification() {
  if (pgListenerClient) {
    try {
      await pgListenerClient.query(
        `NOTIFY db_changes, '{"table": "test", "action": "manual", "data": {"test": true}}'`
      );
      console.log('Test notification sent');
    } catch (err) {
      console.error('Test notification failed:', err.message);
    }
  } else {
    console.log('No PostgreSQL client connected');
  }
}

// Start the service
setupPgListener();

export { addSseClient, broadcastMessage, testNotification };
