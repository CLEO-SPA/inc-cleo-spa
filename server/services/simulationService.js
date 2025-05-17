import { setSimulation, getProdPool } from '../config/database.js';

const SYSTEM_PARAMS_ID = parseInt(process.env.SYSTEM_PARAMS_ID, 10) || 1;
const CACHE_TTL_MS = parseInt(process.env.CACHE_TTL_MS, 10) || 5000; // cache lifetime 5 seconds

// in-memory cache
let SysParamsCache = {
  data: null,
  lastFetched: 0,
  isActiveSimulation: false, // for quick checks
};

async function fetchSysParamsFromDB() {
  const pool = getProdPool();
  try {
    const { rows } = await pool.query('SELECT * FROM system_parameters WHERE id = $1', [SYSTEM_PARAMS_ID]);
    if (rows.length > 0) {
      return rows[0];
    }
    console.warn(`No system parameters found for ID ${SYSTEM_PARAMS_ID}`);
    return null;
  } catch (error) {
    console.error('Error fetching system parameters:', error);
    throw error;
  }
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
export async function checkAndUpdateSimState() {
  const now = Date.now(); // using sys date for cache expiration check

  if (SysParamsCache.data && now - SysParamsCache.lastFetched < CACHE_TTL_MS) {
    return {
      isActive: SysParamsCache.isActiveSimulation,
      params: SysParamsCache.data,
      source: 'cache',
    };
  }

  try {
    console.log('Fetching system parameters from DB...');
    const params = await fetchSysParamsFromDB();
    const isActive = params?.is_simulation;

    SysParamsCache = {
      data: params,
      lastFetched: now,
      isActiveSimulation: isActive,
    };

    setSimulation(isActive);

    return {
      isActive,
      params,
      source: 'db',
    };
  } catch (error) {
    console.error('Error updating simulation state:', error);
    return {
      isActive: SysParamsCache.isActiveSimulation, // Return last known state
      params: SysParamsCache.data,
      source: 'fallback',
    };
  }
}

export const getCurrentSimStatus = () => {
  return {
    isActive: SysParamsCache.isActiveSimulation,
    params: SysParamsCache.data,
    lastFetched: new Date(SysParamsCache.lastFetched).toISOString(),
  };
};
