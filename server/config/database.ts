import pg from 'pg';
import 'dotenv/config';
import { parseConnectionString } from '../utils/dbConnectionParser.js';

let isSimulationMode: boolean = false;

function createNamedPool(EnvConfig: string, poolName: string): pg.Pool {
  const connectionString = EnvConfig;
  const dbConfig = parseConnectionString(connectionString);

  const pool = new pg.Pool({
    ...dbConfig,
    max: dbConfig.maxConnections || parseInt(process.env.DB_MAX_CONNECTIONS || '10', 10) || 10,
  });

  // const oldQuery = pool.query;

  // (pool as any).query = function <T extends pg.QueryResultRow = any>(
  //   this: pg.Pool,
  //   sql: string,
  //   params: any[]
  // ): Promise<pg.QueryResult<T>> {
  //   const queryTextToLog = typeof sql === 'string' ? sql : '';
  //   const paramsToLog = params;

  //   console.log(
  //     `${poolName} | Executing query: ${queryTextToLog} | Parameters: ${
  //       paramsToLog ? JSON.stringify(paramsToLog) : 'None'
  //     }`
  //   );
  //   return oldQuery.apply(this, [sql, params]) as unknown as Promise<pg.QueryResult<T>>;
  // };
  return pool;
}

const prodPool: pg.Pool = createNamedPool(process.env.PROD_DB_URL as string, 'PRODUCTION');
const simPool: pg.Pool = createNamedPool(process.env.SIM_DB_URL as string, 'SIMULATION');

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
