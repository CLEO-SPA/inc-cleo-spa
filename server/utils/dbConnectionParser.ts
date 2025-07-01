interface DbConfig {
  user?: string;
  password?: string;
  host?: string;
  port?: number;
  database?: string;
  ssl?: any;
  maxConnections?: number;
}

export const parseConnectionString = (connectionString: string): DbConfig => {
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
    const ssl = sslMode === 'require' || sslMode === 'true' ? { rejectUnauthorized: false } : false;

    // Extract max connections if provided
    const maxConnections = url.searchParams.get('max') ? parseInt(url.searchParams.get('max') || '10') : undefined;

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
    console.error('Error parsing connection string:', error);
    return {};
  }
};

// New function to build config from individual environment variables or connection string
export const buildDbConfig = (): DbConfig => {
  // Try to use PROD_DB_URL first (connection string)
  if (process.env.PROD_DB_URL) {
    console.log('Using PROD_DB_URL connection string');
    return parseConnectionString(process.env.PROD_DB_URL);
  }

  // Fall back to individual environment variables
  console.log('Using individual DB environment variables');
  return {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 5432,
    database: process.env.DB_NAME,
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
    maxConnections: process.env.DB_MAX_CONNECTIONS ? parseInt(process.env.DB_MAX_CONNECTIONS) : 10,
  };
};

// Build simulation DB config
export const buildSimDbConfig = (): DbConfig => {
  // Try to use SIM_DB_URL first (connection string)
  if (process.env.SIM_DB_URL) {
    console.log('Using SIM_DB_URL connection string');
    return parseConnectionString(process.env.SIM_DB_URL);
  }

  // Fall back to individual environment variables with SIM_ prefix
  console.log('Using individual SIM DB environment variables');
  return {
    user: process.env.SIM_DB_USER || process.env.DB_USER,
    password: process.env.SIM_DB_PASSWORD || process.env.DB_PASSWORD,
    host: process.env.SIM_DB_HOST || process.env.DB_HOST,
    port: process.env.SIM_DB_PORT
      ? parseInt(process.env.SIM_DB_PORT)
      : process.env.DB_PORT
      ? parseInt(process.env.DB_PORT)
      : 5432,
    database: process.env.SIM_DB_NAME || process.env.DB_NAME,
    ssl: process.env.SIM_DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
    maxConnections: process.env.SIM_DB_MAX_CONNECTIONS ? parseInt(process.env.SIM_DB_MAX_CONNECTIONS) : 10,
  };
};
