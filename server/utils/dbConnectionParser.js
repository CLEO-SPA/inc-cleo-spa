// Parse a PostgreSQL connection string into config object
export const parseConnectionString = (connectionString) => {
  // Return empty object if no connection string provided
  if (!connectionString) return {};

  try {
    // Example connection string format:
    // postgresql://username:password@host:port/database?sslmode=require
    const url = new URL(connectionString);

    // Extract username and password
    const user = url.username;
    const password = url.password;

    // Extract host and port
    const host = url.hostname;
    const port = url.port ? parseInt(url.port) : 5432; // Default PostgreSQL port

    // Extract database name (remove leading slash)
    const database = url.pathname.substring(1);

    // Check SSL parameters in query string
    const sslMode = url.searchParams.get('sslmode');
    const ssl = sslMode === 'require' || sslMode === 'true' ? { rejectUnauthorized: true } : false;

    // Extract max connections if provided
    const maxConnections = url.searchParams.get('max') ? parseInt(url.searchParams.get('max')) : null;

    return {
      user,
      password,
      host,
      port,
      database,
      ssl,
      maxConnections,
    };
  } catch (error) {
    console.error('Error parsing connection string:', error.message);
    return {};
  }
};
