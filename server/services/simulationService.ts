import { setSimulation, queryOnPool, getProdPool } from '../config/database.js';
import { SystemParameters } from '../types/model.types.js';

const SYSTEM_PARAMS_ID = parseInt(process.env.SYSTEM_PARAMS_ID as string, 10) || 1;
const CACHE_TTL_MS = parseInt(process.env.CACHE_TTL_MS as string, 10) || 300000; // Increased cache lifetime to 5 minutes

interface SystemParametersCache {
  data: SystemParameters | null;
  lastFetched: number;
  isActiveSimulation: boolean;
}

let SysParamsCache: SystemParametersCache = {
  data: null,
  lastFetched: 0,
  isActiveSimulation: false,
};

async function fetchSysParamsFromDB(): Promise<SystemParameters | null> {
  const pool = getProdPool();
  try {
    const result = await queryOnPool<SystemParameters>(pool, 'SELECT * FROM system_parameters WHERE id = $1', [
      SYSTEM_PARAMS_ID,
    ]);

    if (result.rowCount && result.rowCount > 0) {
      return result.rows[0];
    }

    console.warn(`DB: No system parameters found for ID ${SYSTEM_PARAMS_ID}`);
    return null;
  } catch (error: unknown) {
    console.error(
      'DB Error: Error fetching system parameters:',
      error instanceof Error ? `${error.name}: ${error.message}` : error
    );
    throw error;
  }
}

interface SimState {
  isActive: boolean;
  params: SystemParameters | null;
  source: 'cache' | 'db' | 'fallback';
}

/**
 * Checks and updates the simulation state.
 * - If the cache is valid, it returns the cached data.
 * - If the cache is expired or empty, it fetches the data from the database.
 * @returns { isActive: boolean, params: object, source: string }
 * - isActive: Indicates if the simulation mode is active.
 * - params: The system parameters fetched from the database.
 * - source: Indicates the source of the data ('cache', 'db', or 'fallback').
 */
/**
 * Checks and updates the simulation state from cache or DB.
 * @returns {Promise<SimState>} An object containing the simulation state.
 */
export async function checkAndUpdateSimState(): Promise<SimState> {
  const now = Date.now();

  if (SysParamsCache.data !== null && now - SysParamsCache.lastFetched < CACHE_TTL_MS) {
    // Reduce log noise - only log cache hits occasionally
    if (Math.random() < 0.1) {
      // Log 10% of cache hits
      console.log('CACHE: Serving system parameters from cache.');
    }
    return {
      isActive: SysParamsCache.isActiveSimulation,
      params: SysParamsCache.data,
      source: 'cache',
    };
  }

  try {
    console.log('DB: Fetching system parameters from database...');
    const paramsFromDB = await fetchSysParamsFromDB();

    const currentIsActiveSimulation = paramsFromDB?.is_simulation ?? false;

    SysParamsCache = {
      data: paramsFromDB,
      lastFetched: now,
      isActiveSimulation: currentIsActiveSimulation,
    };

    setSimulation(currentIsActiveSimulation);

    console.log(`DB: Fetched params. Simulation active: ${currentIsActiveSimulation}`);
    return {
      isActive: currentIsActiveSimulation,
      params: paramsFromDB,
      source: 'db',
    };
  } catch (error: unknown) {
    console.error(
      'FALLBACK: Error updating simulation state from DB. Using last known/default state.',
      error instanceof Error ? `${error.name}: ${error.message}` : error
    );
    return {
      isActive: SysParamsCache.isActiveSimulation,
      params: SysParamsCache.data,
      source: 'fallback',
    };
  }
}

interface CurrentSimStatusInfo {
  isActive: boolean;
  params: SystemParameters | null;
  lastFetchedUTC: string;
  lastFetchedTimestamp: number;
}

export const getCurrentSimStatus = (): CurrentSimStatusInfo => {
  return {
    isActive: SysParamsCache.isActiveSimulation,
    params: SysParamsCache.data,
    lastFetchedUTC: SysParamsCache.lastFetched === 0 ? 'Never' : new Date(SysParamsCache.lastFetched).toUTCString(),
    lastFetchedTimestamp: SysParamsCache.lastFetched,
  };
};
