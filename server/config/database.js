import pg from 'pg';
import 'dotenv/config';
import { parseConnectionString } from '../utils/dbConnectionParser.js';

let isSimulationMode = false;

function createNamedPool(EnvConfig, poolName) {
  const connectionString = EnvConfig;
  const dbConfig = parseConnectionString(connectionString);

  const pool = new pg.Pool({
    ...dbConfig,
    max: dbConfig.maxConnections || parseInt(process.env.DB_MAX_CONNECTIONS, 10) || 10,
  });

  const oldQuery = pool.query;
  pool.query = function (...args) {
    const [sql, params] = args;
    console.log(`${poolName} | Executing query: ${sql} | Parameters: ${params ? JSON.stringify(params) : 'None'}`);
    return oldQuery.apply(pool, args);
  };
  return pool;
}

const prodPool = createNamedPool(process.env.PROD_DB_URL, 'PRODUCTION');
const simPool = createNamedPool(process.env.SIM_DB_URL, 'SIMULATION');

export function setSimulation(simulationEnabled) {
  isSimulationMode = !!simulationEnabled; // explicitly convert to boolean
  console.log(`Simulation mode set to: ${isSimulationMode}`);
}

export function getIsSimulation() {
  return isSimulationMode;
}

export function pool() {
  return isSimulationMode ? simPool : prodPool;
}

export function getProdPool() {
  return prodPool;
}
