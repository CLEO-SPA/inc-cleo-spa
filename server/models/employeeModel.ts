import { pool, getProdPool as prodPool } from '../config/database.js';

export interface Employee {
  id: number;
  employee_code: number;
  employee_name: string;
  position_id: number | null;
}

export interface EmployeePosition {
  id: number;
  position_name: string;
}

export interface DetailedEmployee {
  id: number;
  employee_name: string;
  employee_code: number;
  employee_is_active: boolean;
  position_id: number | null;
  position_name: string | null;
  created_at: Date;
  updated_at: Date;
}

const checkEmployeeCodeExists = async (employee_code: number) => {
  try {
    const query = `SELECT * FROM employees WHERE employee_code = $1`;
    const values = [employee_code];
    const result = await pool().query(query, values);

    return result.rows.length > 0;
  } catch (error) {
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
      INNER JOIN user_to_role utr ON ua.id = utr.user_id
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
      INNER JOIN user_to_role utr ON ua.id = utr.user_id
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

/**
 * Get all active employees with basic details
 * This function is used for search functionality in the timetable management system.
 */
const getBasicEmployeeDetails = async (): Promise<Employee[]> => {
  const query = `
    SELECT 
      id, 
      employee_name, 
      position_id 
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
}

/**
 * Get all active positions
 * This function is used for position dropdown in the timetable management system.
 */
const getAllActivePositions = async (): Promise<EmployeePosition[]> => {
  const query = `
    SELECT 
      id, 
      position_name 
    FROM positions p 
    WHERE p.position_is_active = true 
    ORDER BY position_name ASC`;
  try {
    const result = await pool().query(query);
    return result.rows.map((row: any) => ({
      id: row.id,
      position_name: row.position_name,
    }));
  } catch (error) {
    console.error('Database error in getAllActivePositions: ', error);
    throw new Error('Failed to fetch active positions from database');
  }
}

/**
 * Get detailed employee information
 * This function is used to fetch detailed information about employees.
 */
const getEmployeeById = async (employeeId: number): Promise<DetailedEmployee | null> => {
  const query = `
    SELECT
      e.id,
      e.employee_name,
      e.employee_code,
      e.employee_is_active,
      e.position_id,
      p.position_name,
      e.created_at,
      e.updated_at
    FROM employees e
    LEFT JOIN positions p ON e.position_id = p.id
    WHERE e.id = $1 AND e.employee_is_active = true
  `
  try {
    const result = await pool().query(query, [employeeId]);
    return result.rows.length > 0 ? result.rows[0] : null;
  } catch (error) {
    console.error('Database error in getEmployeeById: ', error);
    throw new Error('Failed to fetch employee details from database');
  }
}

/**
 * Check if an employee exists and is active by ID
 * This function is used to verify if an employee exists in the database.
 */
const employeeExists = async (employeeId: number): Promise<boolean> => {
  const query = `
    SELECT 1 FROM employees 
    FROM employees 
    WHERE id = $1 AND employee_is_active = true
  `;
  try {
    const result = await pool().query(query, [employeeId]);
    return result.rows.length > 0;
  } catch (error) {
    console.error('Database error in employeeExists: ', error);
    throw new Error('Failed to check employee existence in database');
  }
}
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
  createSuperUser,
  getUserCount,
  getUserData,
  getAllEmployeesForDropdown
};
