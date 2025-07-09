import { pool, getProdPool as prodPool } from '../config/database.js';

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

export default {
  createSuperUser,
  getUserCount,
  getAuthUser,
  getUserData,
  updateUserTimestamp,
  updateUserPassword,
};
