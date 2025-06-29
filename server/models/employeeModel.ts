import { pool, getProdPool as prodPool } from '../config/database.js';
import { Employee } from '../types/model.types.js';

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
    const query = `
      SELECT * FROM employees
      WHERE created_at BETWEEN
        COALESCE($3, '0001-01-01'::timestamp with time zone)
        AND $4
      ORDER BY id ASC
      LIMIT $1 OFFSET $2
    `;
    const values = [limit, offset, startDate_utc, endDate_utc];
    const result = await pool().query(query, values);

    const totalQuery = `
      SELECT COUNT(*) FROM employees
      WHERE created_at BETWEEN
        COALESCE($1, '0001-01-01'::timestamp with time zone)
        AND $2
    `;
    const totalValues = [startDate_utc, endDate_utc];
    const totalResult = await pool().query(totalQuery, totalValues);
    const totalPages = Math.ceil(totalResult.rows[0].count / limit);

    return {
      employees: result.rows,
      totalPages,
    };
  } catch (error) {
    console.error('Error fetching employees:', error);
    throw new Error('Error fetching employees');
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

// const createEmployee = async ({
//   employee_code,
//   department_id,
//   employee_contact,
//   employee_email,
//   employeeIsActive, // TODO: recheck with team
//   employee_name,
//   position_id,
//   commission_percentage,
//   password_hash,
//   created_at,
//   updated_at,
// }) => {
//   const client = await pool().connect();

//   try {
//     // Start a transaction
//     await client.query('BEGIN');

//     const insertAuthQuery = `
//       INSERT INTO user_auth (email ,password, created_at, updated_at)
//       VALUES ($1, $2, $3, $4)
//       RETURNING *;
//     `;
//     const authValues = [employee_email, password_hash, created_at, updated_at];
//     const authResult = await client.query(insertAuthQuery, authValues);
//     const newAuth = authResult.rows[0];

//     const insertEmployeeQuery = `
//       INSERT INTO employees (employee_code, department_id, employee_contact, employee_email, employee_is_active, employee_name, position_id, commission_percentage, created_at, updated_at, user_auth_id)
//       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
//       RETURNING *;
//     `;
//     const values = [
//       employee_code,
//       parseInt(department_id, 10),
//       employee_contact,
//       employee_email,
//       employeeIsActive || true,
//       employee_name,
//       parseInt(position_id, 10) || null,
//       parseFloat(commission_percentage) || 0.0,
//       created_at,
//       updated_at,
//       newAuth.id,
//     ];

//     const result = await client.query(insertEmployeeQuery, values);
//     const newEmployee = result.rows[0];

//     await client.query('COMMIT');
//     return {
//       employee: newEmployee,
//       auth: newAuth,
//     };
//   } catch (error) {
//     console.error('Error creating employee:', error);
//     await client.query('ROLLBACK');
//     throw new Error('Error creating employee');
//   } finally {
//     client.release(); // Release the client back to the pool
//   }
// };

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

export const getEmployeeIdByUserAuthId = async (id: string) => {
  const employee_sql = 'SELECT id FROM employees WHERE user_auth_id = $1';
  const params = [id];

  return await pool().query<{ id: string }>(employee_sql, params);
};

const getBasicEmployeeDetails = async (): Promise<Employee[]> => {
  const query = `
    SELECT 
      id, 
      employee_name 
    FROM employees e 
    WHERE employee_is_active = true 
    ORDER BY employee_name ASC`;
  try {
    const result = await pool().query(query);
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
  // createEmployee,
  checkEmployeeCodeExists,
  getAuthUser,
  updateEmployeePassword,
  getAllEmployees,
  getAllEmployeesForDropdown,
  createSuperUser,
  getUserCount,
  getUserData,
  getEmployeeIdByUserAuthId,
  getBasicEmployeeDetails,
};
