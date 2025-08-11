import 'dotenv/config';
import { createServer } from 'http';
import app from './app.js';
import { startPoolMonitoring, stopPoolMonitoring, closeAllPools } from './config/database.js';

const PORT = process.env.PORT || 3000;
const server = createServer(app);

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`http://localhost:${PORT}`);

  // Start monitoring database connections
  startPoolMonitoring();
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🔄 Gracefully shutting down server...');

  stopPoolMonitoring();

  server.close(async () => {
    console.log('🔒 HTTP server closed');

    // Close database connections
    await closeAllPools();

    console.log('✅ Graceful shutdown complete');
    process.exit(0);
  });
});

process.on('SIGTERM', async () => {
  console.log('\n🔄 Received SIGTERM, shutting down gracefully...');

  stopPoolMonitoring();
  await closeAllPools();

  process.exit(0);
});
