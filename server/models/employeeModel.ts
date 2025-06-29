import { pool, getProdPool as prodPool } from '../config/database.js';
import { Employees, Positions } from '../types/model.types.js';

const checkEmployeeCodeExists = async (employee_code: number) => {
  try {
    const query = `SELECT * FROM employees WHERE employee_code = $1`;
    const values = [employee_code];
    const result = await pool().query(query, values);

    return result.rows.length > 0;
  } catch (error) {
    console.error('Error checking employee code existence', error);
    throw new Error('Error checking employee code existence');
  }
};

/**
 * Check if an e-mail address is already linked to an employee.
 * Returns true when **any** row matches.
 */
const checkEmployeeEmailExists = async (employee_email: string) => {
  try {
    const query = `SELECT 1 FROM employees WHERE employee_email = $1`;
    const values = [employee_email.trim().toLowerCase()];

    const result = await pool().query(query, values);
    return (result.rowCount ?? 0) > 0; // true if at least one match
  } catch (error) {
    console.error('Error checking employee email existence:', error);
    throw new Error('Error checking employee email existence');
  }
};

/**
 * Check if a phone / contact number is already linked to an employee.
 * Returns true when **any** row matches.
 */
const checkEmployeePhoneExists = async (employee_contact: string) => {
  try {
    const query = `SELECT 1 FROM employees WHERE employee_contact = $1`;
    const values = [employee_contact.trim()];

    const result = await pool().query(query, values);
    return result.rowCount > 0; // ❯ true if at least one match
  } catch (error) {
    console.error('Error checking employee phone existence:', error);
    throw new Error('Error checking employee phone existence');
  }
};

const getAllEmployees = async (offset: number, limit: number, startDate_utc: string, endDate_utc: string) => {
  try {
    // Step 1: Fetch paginated employee IDs based on date range
    const idQuery = `
      SELECT id FROM employees
      WHERE created_at BETWEEN
        COALESCE($1, '0001-01-01'::timestamp with time zone)
        AND $2
      ORDER BY id ASC
      LIMIT $3 OFFSET $4
    `;
    const idValues = [startDate_utc, endDate_utc, limit, offset];
    const idResult = await pool().query(idQuery, idValues);
    const employeeIds = idResult.rows.map((row) => row.id);

    if (employeeIds.length === 0) {
      return {
        employees: [],
        totalPages: 0,
        totalCount: 0,
      };
    }

    // Step 2: Fetch full employee + position info for selected IDs
    const dataQuery = `
      SELECT 
        e.id AS employee_id,
        e.employee_code,
        e.employee_name,
        e.employee_email,
        e.employee_is_active,
        e.employee_contact,
        e.created_at,
        e.updated_at,
        p.id AS position_id,
        p.position_name,
        (SELECT st.status_name FROM statuses st WHERE st.id = e.verified_status_id) AS status_name
      FROM employees e
      LEFT JOIN employee_to_position ep ON e.id = ep.employee_id
      LEFT JOIN positions p ON ep.position_id = p.id
      WHERE e.id = ANY($1)
      ORDER BY e.id ASC
    `;
    const dataResult = await pool().query<Partial<Employees & Positions & { [any: string]: string }>>(dataQuery, [
      employeeIds,
    ]);

    // Step 3: Group employee rows
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const groupedMap: Record<number, any> = {};

    dataResult.rows.forEach((row) => {
      const empId: number = parseInt(row.employee_id!);
      if (!groupedMap[empId]) {
        groupedMap[empId] = {
          id: empId,
          employee_name: row.employee_name,
          employee_email: row.employee_email,
          employee_code: row.employee_code,
          employee_is_active: row.employee_is_active,
          employee_contact: row.employee_contact,
          created_at: row.created_at,
          updated_at: row.updated_at,
          verification_status: row.status_name,
          positions: [],
        };
      }

      if (row.position_id && row.position_name) {
        groupedMap[empId].positions.push({
          position_id: row.position_id,
          position_name: row.position_name,
        });
      }
    });

    const groupedEmployees = Object.values(groupedMap);

    // Step 4: Get total count for pagination
    const totalQuery = `
      SELECT COUNT(*) FROM employees
      WHERE created_at BETWEEN
        COALESCE($1, '0001-01-01'::timestamp with time zone)
        AND $2
    `;
    const totalValues = [startDate_utc, endDate_utc];
    const totalResult = await pool().query(totalQuery, totalValues);
    const totalCount = parseInt(totalResult.rows[0].count, 10);
    const totalPages = Math.ceil(totalCount / limit);

    return {
      employees: groupedEmployees,
      totalPages,
      totalCount,
    };
  } catch (error) {
    console.error('Error fetching employees with positions:', error);
    throw new Error('Error fetching employees with positions');
  }
};

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

/**
 * !! USE THIS FUNCTION ONLY FOR AUTHENTICATION !!
 * This func uses productive DB to fetch login data
 * @param {"email || phone_no"} identity
 * @returns
 */
const getAuthUser = async (identity: string | number) => {
  try {
    const query = `
      SELECT 
        ua.id, 
        ua.email,
        ua.phone,
        ua.password,
        r.role_name,
        e.employee_name,
        m.name AS member_name
      FROM user_auth ua
      INNER JOIN user_to_role utr ON ua.id = utr.user_auth_id
      INNER JOIN roles r ON utr.role_id = r.id
      LEFT JOIN employees e ON ua.id = e.user_auth_id
      LEFT JOIN members m ON ua.id = m.user_auth_id
      WHERE ua.phone = $1 OR ua.email = $1
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
    console.error('Error fetching employee data', error);
    throw new Error('Error fetching employee data');
  }
};

const getUserData = async (identity: string | number) => {
  try {
    const query = `
      SELECT 
        ua.id, 
        ua.email,
        ua.phone,
        ua.password,
        r.role_name,
        e.employee_name,
        m.name AS member_name
      FROM user_auth ua
      INNER JOIN user_to_role utr ON ua.id = utr.user_auth_id
      INNER JOIN roles r ON utr.role_id = r.id
      LEFT JOIN employees e ON ua.id = e.user_auth_id
      LEFT JOIN members m ON ua.id = m.user_auth_id
      WHERE ua.phone = $1 OR ua.email = $1
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
    console.error('Error fetching employee data', error);
    throw new Error('Error fetching employee data');
  }
};

interface NewEmployeeData {
  email: string;
  password_hash: string;
  phone: string;
  role_name: string;
  employee_code: string;
  employee_name: string;
  employee_is_active: boolean;
  position_ids: string[];
  created_at?: string;
  updated_at?: string;
}

const createAuthAndEmployee = async (data: NewEmployeeData) => {
  const client = await pool().connect();
  try {
    await client.query('BEGIN');

    const roleResult = await client.query('SELECT get_or_create_roles($1) as id;', [data.role_name]);
    if (roleResult.rows.length === 0) {
      throw new Error(`Role '${data.role_name}' not found.`);
    }
    const roleId = roleResult.rows[0].id;

    const userAuthQuery = `
      INSERT INTO user_auth (email, password, phone, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id
    `;
    const userAuthResult = await client.query(userAuthQuery, [
      data.email,
      data.password_hash,
      data.phone,
      data.created_at,
      data.updated_at,
    ]);
    const userAuthId = userAuthResult.rows[0].id;

    const userToRoleQuery = `
      INSERT INTO user_to_role (user_auth_id, role_id, created_at, updated_at)
      VALUES ($1, $2, $3, $4)
    `;
    await client.query(userToRoleQuery, [userAuthId, roleId, data.created_at, data.updated_at]);

    const employeeQuery = `
      INSERT INTO employees (
        user_auth_id, employee_code, employee_name, employee_email, 
        employee_contact, employee_is_active, created_at, updated_at, verified_status_id
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, (SELECT get_or_create_status('UnVerified')))
      RETURNING id
    `;
    const employeeResult = await client.query(employeeQuery, [
      userAuthId,
      data.employee_code,
      data.employee_name,
      data.email,
      data.phone,
      data.employee_is_active,
      data.created_at,
      data.updated_at,
    ]);
    const employeeId = employeeResult.rows[0].id;

    if (data.position_ids && data.position_ids.length > 0) {
      const positionInsertQuery = `
      INSERT INTO employee_to_position (employee_id, position_id, created_at, updated_at)
      SELECT $1, unnested_position_id, $2, $3
      FROM unnest($4::bigint[]) AS unnested_position_id
    `;
      const params = [employeeId, data.created_at, data.updated_at, data.position_ids];

      await client.query(positionInsertQuery, params);
    }

    await client.query('COMMIT');
    return { employeeId, userAuthId };
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating employee with auth:', error);
    throw new Error('Failed to create employee with auth');
  } finally {
    client.release();
  }
};

const touchEmployee = async (email: string) => {
  try {
    await pool().query(`UPDATE employees SET updated_at = NOW() WHERE employee_email = $1`, [email]);
  } catch (error) {
    console.error('Error touching employee:', error);
    throw new Error('Error touching employee');
  }
};

const updateEmployeePassword = async (email: string, password_hash: string, isInvite: boolean = false) => {
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
        UPDATE employees
        SET verified_status_id = (SELECT get_or_create_status('Verified')), employee_is_active = true
        WHERE employee_email = $1;
      `;
      const values = [email];
      await client.query(query, values);
    }

    await client.query('COMMIT');
    return updatedAuth;
  } catch (error) {
    console.error('Error updating employee password:', error);
    await client.query('ROLLBACK');
    throw new Error('Error updating employee password');
  } finally {
    client.release();
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

export const getEmployeeIdByUserAuthId = async (id: string) => {
  const employee_sql = 'SELECT id FROM employees WHERE user_auth_id = $1';
  const params = [id];

  return await pool().query<{ id: string }>(employee_sql, params);
};

const getBasicEmployeeDetails = async () => {
  const query = `
    SELECT 
      id, 
      employee_name 
    FROM employees e 
    WHERE employee_is_active = true 
    ORDER BY employee_name ASC`;
  try {
    const result = await pool().query(query);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return result.rows.map((row: any) => ({
      id: row.id,
      employee_name: row.employee_name,
      position_id: row.position_id,
    }));
  } catch (error) {
    console.error('Database error in getBasicEmployeeDetails: ', error);
    throw new Error('Failed to fetch basic employee details from database');
  }
};

const getAllEmployeesForDropdown = async () => {
  try {
    const query = `
      SELECT id, employee_name FROM employees
      WHERE employee_is_active = true
      ORDER BY employee_name ASC
    `;
    const result = await pool().query(query);
    return result.rows;
  } catch (error) {
    console.error('Error fetching employee list:', error);
    throw new Error('Error fetching employee list');
  }
};

const getAllRolesForDropdown = async () => {
  try {
    const query = `
      SELECT id, role_name FROM roles
      ORDER BY role_name ASC
    `;
    const result = await pool().query(query);
    return result.rows;
  } catch (error) {
    console.error('Error fetching role list:', error);
    throw new Error('Error fetching role list');
  }
};

/* --------------------------------------------------------------------------
 * One-shot fetch of a single employee (with positions & status)
 * ------------------------------------------------------------------------ */
const getEmployeeById = async (employee_id: number) => {
  const query = `
    SELECT
      e.id                        AS employee_id,
      e.employee_code,
      e.employee_name,
      e.employee_email,
      e.employee_contact,
      e.employee_is_active,
      e.created_at,
      e.updated_at,
      (SELECT st.status_name
         FROM statuses st
        WHERE st.id = e.verified_status_id)      AS verification_status,
      p.id                        AS position_id,
      p.position_name
    FROM employees            e
    LEFT JOIN employee_to_position ep ON ep.employee_id = e.id
    LEFT JOIN positions            p ON p.id          = ep.position_id
    WHERE e.id = $1
  `;
  const { rows, rowCount } = await pool().query(query, [employee_id]);

  if (!rowCount) return null;

  // -- consolidate one row per employee
  const emp = {
    id: rows[0].employee_id,
    employee_name: rows[0].employee_name,
    employee_email: rows[0].employee_email,
    employee_code: rows[0].employee_code,
    employee_contact: rows[0].employee_contact,
    employee_is_active: rows[0].employee_is_active,
    verification_status: rows[0].verification_status,
    created_at: rows[0].created_at,
    updated_at: rows[0].updated_at,
    positions: [] as { position_id: string; position_name: string }[],
  };

  rows.forEach((r) => {
    if (r.position_id) {
      emp.positions.push({ position_id: r.position_id, position_name: r.position_name });
    }
  });

  return emp;
};

export interface UpdateEmployeeData {
  /* PK of the employees row to update */
  employee_id: number;

  /* user_auth-level */
  email?: string; // becomes ua.email
  phone?: string; // becomes ua.phone

  /* employees-level */
  employee_name?: string;
  employee_code?: string;
  employee_contact?: string; // same as phone but stored again in employees
  employee_is_active?: boolean;

  /* many-to-many */
  position_ids?: string[]; // full replacement if supplied

  /* timestamp */
  updated_at?: string; // ISO string – supply in controller
}

/* --------------------------------------------------------------------------
 * Robust UPDATE of employee + auth + positions
 * ------------------------------------------------------------------------ */
const updateEmployee = async (data: UpdateEmployeeData) => {
  const client = await pool().connect();
  try {
    await client.query('BEGIN');

    /* -------------------------------------------------- 1. fetch current */
    const curSql = `
      SELECT e.id              AS employee_id,
             e.employee_code,
             e.employee_contact,
             ua.id             AS user_auth_id,
             ua.email,
             ua.phone
        FROM employees   e
        JOIN user_auth   ua ON ua.id = e.user_auth_id
       WHERE e.id = $1
       LIMIT 1`;
    const {
      rows: [cur],
    } = await client.query(curSql, [data.employee_id]);
    if (!cur) throw new Error(`Employee ${data.employee_id} not found`);

    /* -------------------------------------------------- 2. duplicates */
    if (data.email && data.email !== cur.email) {
      const { rowCount } = await client.query(`SELECT 1 FROM user_auth WHERE email = $1`, [data.email]);
      if (rowCount) throw new Error('E-mail already in use');
    }
    if (data.phone && data.phone !== cur.phone) {
      const { rowCount } = await client.query(`SELECT 1 FROM user_auth WHERE phone = $1`, [data.phone]);
      if (rowCount) throw new Error('Contact number already in use');
    }
    if (data.employee_code && data.employee_code !== cur.employee_code) {
      const { rowCount } = await client.query(`SELECT 1 FROM employees WHERE employee_code = $1 AND id <> $2`, [
        data.employee_code,
        data.employee_id,
      ]);
      if (rowCount) throw new Error('Employee code already in use');
    }

    /* -------------------------------------------------- 3. user_auth */
    const uaSets: string[] = [];
    const uaParams: any[] = [];
    let p = 1;
    if (data.email) {
      uaSets.push(`email = $${p}`);
      uaParams.push(data.email);
      p++;
    }
    if (data.phone) {
      uaSets.push(`phone = $${p}`);
      uaParams.push(data.phone);
      p++;
    }
    if (uaSets.length) {
      uaSets.push(`updated_at = NOW()`);
      uaParams.push(cur.user_auth_id); // last param
      await client.query(`UPDATE user_auth SET ${uaSets.join(', ')} WHERE id = $${p}`, uaParams);
    }

    /* >>> NEW: if we changed the e-mail, mark as unverified & inactive */
    const emailChanged = !!(data.email && data.email !== cur.email);
    if (emailChanged) {
      await client.query(
        `UPDATE employees
        SET verified_status_id = 18,        -- Unverified
            employee_is_active = false
      WHERE id = $1`,
        [data.employee_id]
      );
    }

    /* -------------------------------------------------- 4. employees */
    const eSets: string[] = [];
    const eParams: any[] = [];
    p = 1;

    if (data.email !== undefined) {
      // keep employees.email in sync
      eSets.push(`employee_email      = $${p}`);
      eParams.push(data.email);
      p++;
    }
    if (data.employee_name !== undefined) {
      eSets.push(`employee_name      = $${p}`);
      eParams.push(data.employee_name);
      p++;
    }
    if (data.employee_code !== undefined) {
      eSets.push(`employee_code      = $${p}`);
      eParams.push(data.employee_code);
      p++;
    }
    if (data.employee_contact !== undefined) {
      eSets.push(`employee_contact   = $${p}`);
      eParams.push(data.employee_contact);
      p++;
    }
    if (data.employee_is_active !== undefined) {
      eSets.push(`employee_is_active = $${p}`);
      eParams.push(data.employee_is_active);
      p++;
    }

    eSets.push(`updated_at = NOW()`);
    eParams.push(data.employee_id); // last param

    await client.query(`UPDATE employees SET ${eSets.join(', ')} WHERE id = $${p}`, eParams);

    /* -------------------------------------------------- 5. positions  */
    if (Array.isArray(data.position_ids)) {
      await client.query(`DELETE FROM employee_to_position WHERE employee_id = $1`, [data.employee_id]);

      if (data.position_ids.length) {
        await client.query(
          `INSERT INTO employee_to_position (employee_id, position_id, created_at, updated_at)
           SELECT $1, pid, NOW(), NOW()
             FROM unnest($2::bigint[]) pid`,
          [data.employee_id, data.position_ids]
        );
      }
    }

    await client.query('COMMIT');
    return { success: true, emailChanged };
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('updateEmployee error:', err);
    throw err;
  } finally {
    client.release();
  }
};

export default {
  checkEmployeeCodeExists,
  checkEmployeePhoneExists,
  checkEmployeeEmailExists,
  getAuthUser,
  updateEmployeePassword,
  getAllEmployees,
  createSuperUser,
  getUserCount,
  getUserData,
  getEmployeeIdByUserAuthId,
  getBasicEmployeeDetails,
  getAllEmployeesForDropdown,
  createAuthAndEmployee,
  getAllRolesForDropdown,
  touchEmployee,
  getEmployeeById,
  updateEmployee,
};
