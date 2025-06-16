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
        e.employee_name,
        e.employee_email,
        e.employee_is_active,
        e.created_at,
        e.updated_at,
        p.id AS position_id,
        p.position_name
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
          employee_is_active: row.employee_is_active,
          created_at: row.created_at,
          updated_at: row.updated_at,
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

interface NewEmployeeInput {
  user_auth_id: number;
  employee_code: string;
  employee_name: string;
  employee_email: string;
  employee_contact: string;
  employee_is_active: boolean;
  position_ids?: number[]; // optional: to also link positions
  created_by: string;
  updated_by: string;
  created_at?: string; // optional: defaults to NOW()
  updated_at?: string; // optional: defaults to NOW()
}

const createEmployee = async (data: NewEmployeeInput) => {
  const client = await pool().connect();
  try {
    await client.query('BEGIN');

    const insertQuery = `
      INSERT INTO employees (
        user_auth_id,
        employee_code,
        employee_name,
        employee_email,
        employee_contact,
        employee_is_active,
        created_at,
        updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
      RETURNING id
    `;
    const values = [
      data.user_auth_id,
      data.employee_code,
      data.employee_name,
      data.employee_email,
      data.employee_contact,
      data.employee_is_active,
    ];

    const result = await client.query(insertQuery, values);
    const employeeId = result.rows[0].id;

    if (data.position_ids && data.position_ids.length > 0) {
      const positionInsertQuery = `
        INSERT INTO employee_to_position (employee_id, position_id)
        VALUES ${data.position_ids.map((_, i) => `($1, $${i + 2})`).join(',')}
      `;
      await client.query(positionInsertQuery, [employeeId, ...data.position_ids]);
    }

    await client.query('COMMIT');
    return { id: employeeId };
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error creating employee:', err);
    throw new Error('Failed to create employee');
  } finally {
    client.release();
  }
};

const updateEmployeePassword = async (email: string, password_hash: string) => {
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

const getAllEmployeesForDropdown = async () => {
  try {
    const query = `
      SELECT id, employee_name FROM employees
      ORDER BY employee_name ASC
    `;
    const result = await pool().query(query);
    return result.rows;
  } catch (error) {
    console.error('Error fetching employee list:', error);
    throw new Error('Error fetching employee list');
  }
};

export default {
  createEmployee,
  checkEmployeeCodeExists,
  getAuthUser,
  updateEmployeePassword,
  getAllEmployees,
  createSuperUser,
  getUserCount,
  getUserData,
  getAllEmployeesForDropdown,
};
