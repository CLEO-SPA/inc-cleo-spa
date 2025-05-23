import { pool } from '../config/database.js';
import { encodeCursor } from '../utils/cursorUtils.js';

const getPaginatedCarePackages = async (
  limit,
  { after, before, page, searchTerm } = {},
  start_date_utc,
  end_date_utc
) => {
  let baseQuery = `FROM care_packages`;
  let whereConditions = [];
  let filterParams = [];
  let currentFilterParamIndex = 1;
  let offset = 0;

  if (searchTerm) {
    whereConditions.push(
      `(care_package_name ILIKE $${currentFilterParamIndex} OR care_package_remarks ILIKE $${
        currentFilterParamIndex + 1
      })`
    );
    filterParams.push(`%${searchTerm}%`, `%${searchTerm}%`);
    currentFilterParamIndex += 2;
  }

  if (start_date_utc) {
    whereConditions.push(`created_at >= $${currentFilterParamIndex}`);
    filterParams.push(new Date(start_date_utc).toISOString());
    currentFilterParamIndex++;
  }
  if (end_date_utc) {
    whereConditions.push(`created_at <= $${currentFilterParamIndex}`);
    filterParams.push(new Date(end_date_utc).toISOString());
    currentFilterParamIndex++;
  }

  // Define WHERE clause and parameters specifically for the COUNT query.
  // These are based on the initial filters only.
  const countQuerySpecificWhereClause = whereConditions.length > 0 ? `WHERE ` + whereConditions.join(' AND ') : '';
  const countQuerySpecificParams = [...filterParams];

  let mainQuery;
  let mainQueryParams = [...filterParams]; // These will be augmented for the main data fetch.
  let orderBy = `ORDER BY created_at ASC, id ASC`;
  // This will be the WHERE clause for the main data fetching query. Initialize with base filters.
  let mainQueryEffectiveWhereClause = countQuerySpecificWhereClause;


  if (page && page > 0) {
    offset = (page - 1) * limit;
    // Main query uses the base filters + offset/limit.
    mainQuery = `SELECT * ${baseQuery} ${mainQueryEffectiveWhereClause} ${orderBy} OFFSET $${mainQueryParams.length + 1} LIMIT $${
      mainQueryParams.length + 2
    }`;
    mainQueryParams.push(offset, limit);
  } else {
    // Cursor-based pagination
    let cursorSpecificConditionsSql = []; // Holds SQL for cursor-specific conditions

    // Parameter indices for cursor conditions are based on the current length of mainQueryParams.
    if (after) {
      cursorSpecificConditionsSql.push(
        `(created_at > $${mainQueryParams.length + 1} OR (created_at = $${mainQueryParams.length + 1} AND id > $${
          mainQueryParams.length + 2
        }))`
      );
      mainQueryParams.push(after.createdAt.toISOString(), after.id);
    } else if (before) {
      cursorSpecificConditionsSql.push(
        `(created_at < $${mainQueryParams.length + 1} OR (created_at = $${mainQueryParams.length + 1} AND id < $${
          mainQueryParams.length + 2
        }))`
      );
      mainQueryParams.push(before.createdAt.toISOString(), before.id);
      orderBy = `ORDER BY created_at DESC, id DESC`; // Reverse order for 'before'
    }

    // Append cursor-specific conditions to the main query's WHERE clause
    if (cursorSpecificConditionsSql.length > 0) {
      if (mainQueryEffectiveWhereClause === '') { // If no initial filters
        mainQueryEffectiveWhereClause = `WHERE ` + cursorSpecificConditionsSql.join(' AND ');
      } else { // Append to existing filters
        mainQueryEffectiveWhereClause += ` AND ` + cursorSpecificConditionsSql.join(' AND ');
      }
    }

    // mainQueryParams now contains initial filter params + cursor params.
    // The LIMIT parameter will be the next one.
    mainQuery = `SELECT * ${baseQuery} ${mainQueryEffectiveWhereClause} ${orderBy} LIMIT $${mainQueryParams.length + 1}`;
    mainQueryParams.push(limit + 1); // Fetch one extra record for hasNextPage check
  }

  let totalCount = null;
  let carePackages = [];
  let hasNextPage = false;
  let hasPreviousPage = false;
  let startCursor = null;
  let endCursor = null;

  try {
    const { rows } = await pool().query(mainQuery, mainQueryParams);

    // Use the dedicated WHERE clause and parameters for the count query.
    const countQueryString = `SELECT COUNT(*) ${baseQuery} ${countQuerySpecificWhereClause}`;
    const { rows: countRows } = await pool().query(countQueryString, countQuerySpecificParams);

    totalCount = parseInt(countRows[0].count, 10);

    if (page && page > 0) {
      // Offset-based results
      carePackages = rows;
      hasNextPage = offset + limit < totalCount;
      hasPreviousPage = offset > 0;

      // For offset-based, generate cursors from the fetched data if needed
      if (carePackages.length > 0) {
        startCursor = encodeCursor(carePackages[0].created_at, carePackages[0].id);
        endCursor = encodeCursor(
          carePackages[carePackages.length - 1].created_at,
          carePackages[carePackages.length - 1].id
        );
      }
    } else {
      // Cursor-based results
      if (rows.length > limit) {
        hasNextPage = true;
        carePackages = rows.slice(0, limit); // Remove the extra record
      } else {
        carePackages = rows;
      }

      // If fetching 'before', reverse the packages to maintain ascending order for the client
      if (before) {
        carePackages.reverse();
      }

      // Calculate cursors for the current page
      if (carePackages.length > 0) {
        startCursor = encodeCursor(carePackages[0].created_at, carePackages[0].id);
        endCursor = encodeCursor(
          carePackages[carePackages.length - 1].created_at,
          carePackages[carePackages.length - 1].id
        );
      }

      // Determine hasPreviousPage for cursor-based
      if (after && carePackages.length > 0) {
        hasPreviousPage = true;
      } else if (!after && !before && carePackages.length > 0) {
        hasPreviousPage = false;
      } else if (before && carePackages.length > 0) {
        // If 'before' was used and we got results, there's implicitly a next page
        hasNextPage = true;
      }
    }

    return {
      data: carePackages,
      pageInfo: {
        startCursor: startCursor,
        endCursor: endCursor,
        hasNextPage: hasNextPage,
        hasPreviousPage: hasPreviousPage,
        totalCount: totalCount,
      },
    };
  } catch (error) {
    console.error('Error in CarePackageModel.getPaginatedCarePackages:', error);
    throw new Error('Could not retrieve paginated care packages.');
  }
};

const getCarePackageById = async (id) => {
  try {
    const query = `SELECT * FROM care_packages
                  WHERE id = $1`;
    const values = [id];
    const { rows } = pool().query(query, values);

    return rows;
  } catch (error) {
    console.error('Error in CarePackageModel.getCarePackageById:', error);
    throw new Error('Could not retrieve care package by id');
  }
};

export default {
  getPaginatedCarePackages,
  getCarePackageById,
};
