import { pool, getProdPool as prodPool } from '../config/database.js';
import { UserAuth } from '../types/model.types.js';
import { PoolClient } from 'pg';
import { PaginatedOptions, PaginatedReturn } from '../types/common.types.js';

const createSuperUser = async (email: string, password_hash: string) => {
  try {
    const query = `CALL create_temp_su($1, $2)`;
    const values = [email, password_hash];
    await pool().query(query, values);
    return { success: true, message: 'Super user created successfully' };
  } catch (error) {
    console.error('Error creating super user:', error);
    throw new Error('Error creating super user');
  }
};

const getUserCount = async () => {
  try {
    const query = `SELECT COUNT(*) FROM user_auth`;
    const result = await pool().query(query);
    const count = parseInt(result.rows[0].count, 10);
    return count;
  } catch (error) {
    console.error('Error getting user count:', error);
    throw new Error('Error getting user count');
  }
};

/**
 * !! USE THIS FUNCTION ONLY FOR AUTHENTICATION !!
 * This func uses productive DB to fetch login data
 * @param email
 * @returns
 */
const getAuthUser = async (identity: string) => {
  try {
    const query = `
      SELECT 
        ua.id, 
        ua.email,
        ua.password,
        r.role_name,
        u.username
      FROM user_auth ua
      INNER JOIN user_to_role utr ON ua.id = utr.user_auth_id
      INNER JOIN roles r ON utr.role_id = r.id
      INNER JOIN users u ON ua.id = u.user_auth_id
      WHERE ua.email = $1 OR u.username = $1
      `;
    const values = [identity];
    const result = await prodPool().query(query, values);

    if (result.rows.length === 0) {
      return null;
    }

    result.rows.forEach((row) => {
      row.role_name = row.role_name.toLowerCase().replace(' ', '_');
    });

    return result.rows[0];
  } catch (error) {
    console.error('Error fetching user data', error);
    throw new Error('Error fetching user data');
  }
};

const getUserData = async (identity: string) => {
  try {
    const query = `
      SELECT 
        ua.id, 
        ua.email,
        ua.password,
        r.role_name,
        u.username
      FROM user_auth ua
      INNER JOIN user_to_role utr ON ua.id = utr.user_auth_id
      INNER JOIN roles r ON utr.role_id = r.id
      INNER JOIN users u ON ua.id = u.user_auth_id
      WHERE ua.email = $1 OR u.username = $1
      `;
    const values = [identity];
    const result = await pool().query(query, values);

    if (result.rows.length === 0) {
      return null;
    }

    result.rows.forEach((row) => {
      row.role_name = row.role_name.toLowerCase().replace(' ', '_');
    });

    return result.rows[0];
  } catch (error) {
    console.error('Error fetching user data', error);
    throw new Error('Error fetching user data');
  }
};

const updateUserTimestamp = async (email: string) => {
  try {
    await pool().query(`UPDATE users SET updated_at = NOW() WHERE email = $1`, [email]);
  } catch (error) {
    console.error('Error updating user timestamp:', error);
    throw new Error('Error updating user timestamp');
  }
};

const updateUserPassword = async (email: string, password_hash: string, isInvite: boolean = false) => {
  const client = await pool().connect();

  try {
    await client.query('BEGIN');
    const query = `
      UPDATE user_auth
      SET password = $1
      WHERE email = $2
      RETURNING *;
    `;
    const values = [password_hash, email];
    const result = await client.query(query, values);
    const updatedAuth = result.rows[0];

    if (isInvite) {
      const query = `
        UPDATE users
        SET verified_status_id = (SELECT get_or_create_status('Verified'))
        WHERE email = $1;
      `;
      const values = [email];
      await client.query(query, values);
    }

    await client.query('COMMIT');
    return updatedAuth;
  } catch (error) {
    console.error('Error updating user password:', error);
    await client.query('ROLLBACK');
    throw new Error('Error updating user password');
  } finally {
    client.release();
  }
};

const checkUserEmailExists = async (email: string) => {
  try {
    const query = `
      SELECT id FROM users WHERE email = $1;
    `;

    const { rowCount } = await pool().query(query, [email]);
    return rowCount == null;
  } catch (error) {
    throw error;
  }
};

interface NewUserData {
  email: string;
  username: string;
  password_hash: string;
  role_name: string;
  created_at?: string;
  updated_at?: string;
}

const createUserModel = async (data: NewUserData) => {
  const client = await pool().connect();
  try {
    await client.query('BEGIN');

    const ua_query = `
      INSERT INTO user_auth (
        email, password, created_at, updated_at
      )
      VALUES ($1, $2, $3, $4)
      RETURNING id
    `;

    const { rows: ua_result } = await client.query<UserAuth>(ua_query, [
      data.email,
      data.password_hash,
      data.created_at,
      data.updated_at,
    ]);

    const ua_to_role_query = `
      INSERT INTO user_to_role (user_auth_id, role_id)
      VALUES ($1, (SELECT get_or_create_roles($2)))
    `;

    await client.query(ua_to_role_query, [ua_result[0].id, data.role_name]);

    const u_query = `
      INSERT INTO users (
        username, email, user_auth_id, created_at, updated_at, verified_status_id
      )
      VALUES ($1, $2, $3, $4, $5, (SELECT get_or_create_status('UNVERIFIED')))
      RETURNING id
    `;
    const userResult = await client.query<{ id: string }>(u_query, [
      data.username,
      data.email,
      data.created_at,
      data.updated_at,
    ]);
    const userId = userResult.rows[0].id;

    await client.query('COMMIT');
    return { userId };
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating employee with auth:', error);
    throw new Error('Failed to create employee with auth');
  } finally {
    client.release();
  }
};

const updateUserModel = async (userId: string, data: Partial<NewUserData>) => {
  const client = await pool().connect();
  let emailChanged = false;
  let newEmail = '';

  try {
    await client.query('BEGIN');

    // Get user_auth_id and current email for this user
    const userQuery = `
      SELECT u.user_auth_id, ua.email 
      FROM users u
      JOIN user_auth ua ON u.user_auth_id = ua.id
      WHERE u.id = $1
    `;
    const userResult = await client.query(userQuery, [userId]);

    if (userResult.rows.length === 0) {
      throw new Error('User not found');
    }

    const userAuthId = userResult.rows[0].user_auth_id;
    const currentEmail = userResult.rows[0].email;

    // Check if email is changing
    if (data.email && data.email !== currentEmail) {
      emailChanged = true;
      newEmail = data.email;
    }

    // Update user_auth table if email or password is changing
    if (data.email || data.password_hash) {
      const updateFields = [];
      const values = [];
      let paramCount = 1;

      if (data.email) {
        updateFields.push(`email = $${paramCount}`);
        values.push(data.email);
        paramCount++;
      }

      if (data.password_hash) {
        updateFields.push(`password = $${paramCount}`);
        values.push(data.password_hash);
        paramCount++;
      }

      updateFields.push(`updated_at = CURRENT_TIMESTAMP`);

      if (updateFields.length > 0) {
        const uaQuery = `
          UPDATE user_auth 
          SET ${updateFields.join(', ')}
          WHERE id = $${paramCount}
        `;
        values.push(userAuthId);
        await client.query(uaQuery, values);
      }
    }

    // Update users table
    if (data.username || data.email) {
      const updateFields = [];
      const values = [];
      let paramCount = 1;

      if (data.username) {
        updateFields.push(`username = $${paramCount}`);
        values.push(data.username);
        paramCount++;
      }

      if (data.email) {
        updateFields.push(`email = $${paramCount}`);
        values.push(data.email);
        paramCount++;
      }

      updateFields.push(`updated_at = CURRENT_TIMESTAMP`);

      // If email changed, reset verification status
      if (emailChanged) {
        updateFields.push(`verified_status_id = (SELECT get_or_create_status('UNVERIFIED'))`);
      }

      if (updateFields.length > 0) {
        const uQuery = `
          UPDATE users 
          SET ${updateFields.join(', ')}
          WHERE id = $${paramCount}
        `;
        values.push(userId);
        await client.query(uQuery, values);
      }
    }

    // Update role if specified
    if (data.role_name) {
      // Delete existing role
      await client.query(`DELETE FROM user_to_role WHERE user_auth_id = $1`, [userAuthId]);

      // Insert new role
      const roleQuery = `
        INSERT INTO user_to_role (user_auth_id, role_id, created_at, updated_at)
        VALUES ($1, (SELECT get_or_create_roles($2)), CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `;
      await client.query(roleQuery, [userAuthId, data.role_name]);
    }

    await client.query('COMMIT');

    return {
      success: true,
      emailChanged,
      newEmail,
    };
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error updating user:', error);
    throw new Error('Failed to update user');
  } finally {
    client.release();
  }
};

const deleteUserModel = async (userId: string) => {
  const client = await pool().connect();
  try {
    await client.query('BEGIN');

    // Get user_auth_id and role for this user
    const userQuery = `
      SELECT u.user_auth_id, r.role_name 
      FROM users u
      JOIN user_to_role utr ON u.user_auth_id = utr.user_auth_id
      JOIN roles r ON utr.role_id = r.id
      WHERE u.id = $1
    `;
    const userResult = await client.query(userQuery, [userId]);

    if (userResult.rows.length === 0) {
      throw new Error('User not found');
    }

    const userAuthId = userResult.rows[0].user_auth_id;
    const roleName = userResult.rows[0].role_name;

    // Check if this is the only user in the system
    const userCountQuery = `SELECT COUNT(*) FROM user_auth`;
    const { rows: countResult } = await client.query(userCountQuery);
    const userCount = parseInt(countResult[0].count, 10);

    if (userCount <= 1) {
      throw new Error('Cannot delete the only user in the system');
    }

    // Check if this is a super admin deletion
    if (roleName.toLowerCase() === 'super admin') {
      // Count super admins to make sure we're not deleting the last one
      const superAdminCountQuery = `
        SELECT COUNT(*) FROM user_to_role utr
        JOIN roles r ON utr.role_id = r.id
        WHERE r.role_name = 'Super Admin'
      `;
      const { rows: adminCountResult } = await client.query(superAdminCountQuery);
      const superAdminCount = parseInt(adminCountResult[0].count, 10);

      if (superAdminCount <= 1) {
        // Find the next eligible user to promote (most recently created, non-super admin)
        const nextUserQuery = `
          SELECT u.user_auth_id
          FROM users u
          JOIN user_to_role utr ON u.user_auth_id = utr.user_auth_id
          JOIN roles r ON utr.role_id = r.id
          WHERE r.role_name != 'Super Admin' AND u.id != $1
          ORDER BY u.created_at DESC
          LIMIT 1
        `;

        const { rows: nextUserResult } = await client.query(nextUserQuery, [userId]);

        if (nextUserResult.length === 0) {
          throw new Error('Cannot delete the only user in the system');
        }

        const nextUserAuthId = nextUserResult[0].user_auth_id;

        // Promote this user to super admin
        await client.query(`DELETE FROM user_to_role WHERE user_auth_id = $1`, [nextUserAuthId]);

        await client.query(
          `
          INSERT INTO user_to_role (user_auth_id, role_id, created_at, updated_at)
          VALUES ($1, (SELECT id FROM roles WHERE role_name = 'Super Admin'), CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        `,
          [nextUserAuthId]
        );

        console.log(`Promoted user with auth ID ${nextUserAuthId} to Super Admin role`);
      }
    }

    // Delete the user (cascade will handle related records)
    await client.query(`DELETE FROM user_auth WHERE id = $1`, [userAuthId]);

    await client.query('COMMIT');
    return { success: true };
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error deleting user:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to delete user');
  } finally {
    client.release();
  }
};

const getUserById = async (userId: string) => {
  try {
    const query = `
      SELECT 
        u.id,
        u.username, 
        ua.email,
        r.role_name
      FROM users u
      INNER JOIN user_auth ua ON u.user_auth_id = ua.id
      INNER JOIN user_to_role utr ON ua.id = utr.user_auth_id
      INNER JOIN roles r ON utr.role_id = r.id
      WHERE u.id = $1
    `;

    const result = await pool().query(query, [userId]);

    if (result.rows.length === 0) {
      return null;
    }

    return result.rows[0];
  } catch (error) {
    console.error('Error fetching user by ID:', error);
    throw new Error('Error fetching user by ID');
  }
};

interface UserWithRole {
  id: string;
  username: string;
  email: string;
  role_name: string;
  created_at: string;
  updated_at: string;
}

const getPaginatedUsers = async (
  limit: number,
  options: PaginatedOptions = {}
): Promise<PaginatedReturn<UserWithRole>> => {
  const { searchTerm, page } = options;

  try {
    const client = await pool().connect();
    try {
      // Build filter conditions for search
      const { filterWhereClause, filterParams, paramCounter } = buildUserFilterConditions(searchTerm);

      // Get total count of users that match the filter
      const totalCount = await getUserTotalCount(client, filterWhereClause, filterParams);

      // Prepare pagination parameters
      const { finalWhereClause, cursorParams, orderBy, effectiveLimit } = prepareUserPaginationParams(
        filterWhereClause,
        filterParams,
        paramCounter,
        limit,
        page
      );

      // Build and execute the query
      const dataQuery = buildUserDataQuery(finalWhereClause, orderBy, page, limit, effectiveLimit);
      const { rows: rawResults } = await client.query(dataQuery, cursorParams);
      const actualFetchedCount = rawResults.length;

      // Process the results for pagination
      const { users, hasNextPage, hasPreviousPage } = processUserPaginationResults(
        rawResults,
        page,
        limit,
        totalCount,
        actualFetchedCount
      );

      return {
        users,
        page: page || 1,
        totalPages: Math.ceil(totalCount / limit),
        totalCount,
        hasNextPage,
        hasPreviousPage,
      };
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error in authModel.getPaginatedUsers:', error);
    throw new Error('Could not retrieve paginated users.');
  }
};

// Helper function to build filter conditions
function buildUserFilterConditions(searchTerm?: string): {
  filterWhereClause: string;
  filterParams: any[];
  paramCounter: number;
} {
  let filterWhereClause = '';
  const filterParams: any[] = [];
  let paramCounter = 1;

  if (searchTerm && searchTerm.trim() !== '') {
    filterWhereClause = 'WHERE (u.username ILIKE $1 OR ua.email ILIKE $1)';
    filterParams.push(`%${searchTerm}%`);
    paramCounter++;
  }

  return { filterWhereClause, filterParams, paramCounter };
}

// Helper function to get the total count of users
async function getUserTotalCount(client: PoolClient, filterWhereClause: string, filterParams: any[]): Promise<number> {
  const countQuery = `
    SELECT COUNT(DISTINCT u.id) as total 
    FROM users u
    INNER JOIN user_auth ua ON u.user_auth_id = ua.id
    INNER JOIN user_to_role utr ON ua.id = utr.user_auth_id
    INNER JOIN roles r ON utr.role_id = r.id
    ${filterWhereClause}
  `;

  const { rows } = await client.query(countQuery, filterParams);
  return parseInt(rows[0].total, 10);
}

// Helper function to prepare pagination parameters
function prepareUserPaginationParams(
  filterWhereClause: string,
  filterParams: any[],
  paramCounter: number,
  limit: number,
  page?: number
): {
  finalWhereClause: string;
  cursorParams: any[];
  orderBy: string;
  effectiveLimit: number;
} {
  const finalWhereClause = filterWhereClause;
  const orderBy = 'ORDER BY u.created_at DESC, u.id ASC';
  const cursorParams = [...filterParams];
  const effectiveLimit = limit;

  return { finalWhereClause, cursorParams, orderBy, effectiveLimit };
}

// Helper function to build the data query
function buildUserDataQuery(
  finalWhereClause: string,
  orderBy: string,
  page?: number,
  limit?: number,
  effectiveLimit?: number
): string {
  return `
    SELECT 
      u.id,
      u.username,
      ua.email,
      r.role_name,
      u.created_at,
      u.updated_at
    FROM users u
    INNER JOIN user_auth ua ON u.user_auth_id = ua.id
    INNER JOIN user_to_role utr ON ua.id = utr.user_auth_id
    INNER JOIN roles r ON utr.role_id = r.id
    ${finalWhereClause}
    ${orderBy}
    ${page && page > 0 ? `OFFSET ${(page - 1) * (limit || 10)}` : ''}
    LIMIT ${effectiveLimit}
  `;
}

// Helper function to process pagination results
function processUserPaginationResults(
  rawResults: any[],
  page?: number,
  limit?: number,
  totalCount?: number,
  actualFetchedCount?: number
): {
  users: any[];
  hasNextPage: boolean;
  hasPreviousPage: boolean;
} {
  const users = rawResults;

  let hasNextPage = false;
  let hasPreviousPage = false;

  if (page && page > 0 && limit && totalCount) {
    hasNextPage = page * limit < totalCount;
    hasPreviousPage = page > 1;
  }

  return { users, hasNextPage, hasPreviousPage };
}

export default {
  createSuperUser,
  getUserCount,
  getAuthUser,
  getUserData,
  updateUserTimestamp,
  updateUserPassword,
  checkUserEmailExists,
  createUserModel,
  updateUserModel,
  deleteUserModel,
  getUserById,
  getPaginatedUsers,
};
