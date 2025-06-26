import pg, { Pool } from 'pg';
import 'dotenv/config';
import { parseConnectionString } from '../utils/dbConnectionParser.js';

function LoggingProxy(actualPool: Pool, poolName: string, filter: string[] = []): Pool {
  return new Proxy(actualPool, {
    get: (target, propKey, receiver) => {
      const originalValue = target[propKey as keyof Pool];

      if (propKey === 'query' && typeof originalValue === 'function') {
        return function (this: Pool, ...args: any[]) {
          let sql: string = 'N/A';
          let params: any[] | undefined;

          const queryTextOrConfig = args[0];
          const valuesOrCallback = args[1];

          if (typeof queryTextOrConfig === 'string') {
            sql = queryTextOrConfig;
            if (typeof valuesOrCallback === 'function' || args.length === 1) {
              params = undefined;
            } else {
              // query(text, values, ...)
              params = valuesOrCallback as any[];
            }
          } else if (typeof queryTextOrConfig === 'object' && queryTextOrConfig !== null && queryTextOrConfig.text) {
            sql = queryTextOrConfig.text;
            params = queryTextOrConfig.values;
          }

          const lowerSql = sql.toLowerCase();
          const shouldLog = !filter.some((t) => {
            return lowerSql.includes(t.toLowerCase());
          });

          if (shouldLog) {
            console.log(
              `\n${poolName} | EXECUTING QUERY (Proxy) | Query: ${sql} | Parameters: ${
                params ? JSON.stringify(params) : 'None'
              }`
            );
          }
          return (originalValue as Function).apply(target, args);
        };
      }

      if (typeof originalValue === 'function') {
        return function (...args: any[]) {
          return (originalValue as Function).apply(target, args);
        };
      }
      return originalValue;
    },
  });
}

let isSimulationMode: boolean = false;

function createNamedPool(EnvConfig: string, poolName: string, filter: string[] = []): pg.Pool {
  const connectionString = EnvConfig;
  const dbConfig = parseConnectionString(connectionString);

  const pool = new pg.Pool({
    ...dbConfig,
    max: dbConfig.maxConnections || parseInt(process.env.DB_MAX_CONNECTIONS || '10', 10) || 10,
  });

  pool.on('error', (err: Error) => {
    console.error(`${poolName} | Actual Pool Idle client error:`, err.message, err.stack);
  });

  // Attach to proxy
  const proxiedPool = LoggingProxy(pool, poolName, filter);
  return proxiedPool;
}

const tablesToExcludeFromLogging: string[] = ['sessions', 'system_parameters'];

const prodPool: pg.Pool = createNamedPool(process.env.PROD_DB_URL as string, 'PRODUCTION', tablesToExcludeFromLogging);
const simPool: pg.Pool = createNamedPool(process.env.SIM_DB_URL as string, 'SIMULATION', tablesToExcludeFromLogging);

export function setSimulation(simulationEnabled: boolean) {
  isSimulationMode = !!simulationEnabled;
  console.log(`Simulation mode set to: ${isSimulationMode}`);
}

export function getIsSimulation() {
  return isSimulationMode;
}

export function pool(): pg.Pool {
  return isSimulationMode ? simPool : prodPool;
}

export function getProdPool(): pg.Pool {
  return prodPool;
}

// generalised function for simple statements that changes the database
export async function withTransaction<T>(callback: (client: pg.PoolClient) => Promise<T>): Promise<T> {
  const client = await pool().connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}