import pool from '../config/database.js';

const checkEmployeeCodeExists = async (employee_code) => {
  try {
    const query = `SELECT * FROM employees WHERE employee_code = $1`;
    const values = [employee_code];
    const result = await pool.query(query, values);

    return result.rows.length > 0;
  } catch (error) {
    throw new Error('Error checking employee code existence');
  }
};

const getAllEmployees = async (offset, limit) => {
  try {
    const query = `
      SELECT * FROM employees
      ORDER BY employee_id ASC
      LIMIT $1 OFFSET $2;
    `;
    const values = [limit, offset];
    const result = await pool.query(query, values);

    const totalQuery = `SELECT COUNT(*) FROM employees`;
    const totalResult = await pool.query(totalQuery);
    const totalPages = Math.ceil(totalResult.rows[0].count / limit);

    return {
      employees: result.rows,
      totalPages,
    };
  } catch (error) {
    throw new Error('Error fetching employees');
  }
};

const createSuperUser = async (email, password_hash) => {
  try {
    const query = `CALL create_temp_su($1, $2)`;
    const values = [email, password_hash];
    await pool.query(query, values);
    return { success: true, message: 'Super user created successfully' };
  } catch (error) {
    console.error('Error creating super user:', error);
    throw new Error('Error creating super user');
  }
};

const getAuthUser = async (identity) => {
  try {
    const query = `
      SELECT * FROM user_auths ua
      INNER JOIN user_to_role utr ON ua.id = utr.user_id
      INNER JOIN roles r ON utr.role_id = r.id
      WHERE ua.phone = $1 OR ua.email = $1
      `;
    const values = [identity];
    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return null;
    }
    return result.rows[0];
  } catch (error) {
    throw new Error('Error fetching employee data');
  }
};

const createEmployee = async ({
  employee_code,
  department_id,
  employee_contact,
  employee_email,
  employeeIsActive, // TODO: recheck with team
  employee_name,
  position_id,
  commission_percentage,
  password_hash,
  created_at,
  updated_at,
}) => {
  const client = await pool.connect();

  try {
    // Start a transaction
    await client.query('BEGIN');

    const insertAuthQuery = `
      INSERT INTO user_auths (email ,password, created_at, updated_at)
      VALUES ($1, $2, $3, $4)
      RETURNING *;
    `;
    const authValues = [employee_email, password_hash, created_at, updated_at];
    const authResult = await client.query(insertAuthQuery, authValues);
    const newAuth = authResult.rows[0];

    const insertEmployeeQuery = `
      INSERT INTO employees (employee_code, department_id, employee_contact, employee_email, employee_is_active, employee_name, position_id, commission_percentage, created_at, updated_at, user_auth_id)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *;
    `;
    const values = [
      employee_code,
      parseInt(department_id, 10),
      employee_contact,
      employee_email,
      employeeIsActive || true,
      employee_name,
      parseInt(position_id, 10) || null,
      parseFloat(commission_percentage) || 0.0,
      created_at,
      updated_at,
      newAuth.id,
    ];

    const result = await client.query(insertEmployeeQuery, values);
    const newEmployee = result.rows[0];

    await client.query('COMMIT');
    return {
      employee: newEmployee,
      auth: newAuth,
    };
  } catch (error) {
    console.error('Error creating employee:', error);
    await client.query('ROLLBACK');
    throw new Error('Error creating employee');
  } finally {
    client.release(); // Release the client back to the pool
  }
};

const updateEmployeePassword = async (email, password_hash) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    const query = `
      UPDATE user_auths
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
    const query = `SELECT COUNT(*) FROM user_auths`;
    const result = await pool.query(query);
    const count = parseInt(result.rows[0].count, 10);
    return count;
  } catch (error) {
    console.error('Error getting user count:', error);
    throw new Error('Error getting user count');
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
};
