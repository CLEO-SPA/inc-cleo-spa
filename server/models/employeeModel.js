import pool from '../config/database.js';

const checkEmployeeCodeExists = async (employeeCode) => {
  try {
    const query = 'SELECT * FROM cs_employees WHERE employee_code = $1';
    const values = [employeeCode];
    const result = await pool.query(query, values);

    return result.rows.length > 0; // Returns true if employee code exists
  } catch (error) {
    throw new Error('Error checking employee code existence');
  }
};

const getAuthEmployee = async (employeeCode) => {
  try {
    const query = `
      SELECT * FROM cs_employees emp
      INNER JOIN cs_user_auth ua
      ON emp.employee_id = ua.employee_id
      WHERE emp.employee_code = $1
      `;
    const values = [employeeCode];
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
  employeeCode,
  departmentId,
  employeeContact,
  employeeEmail,
  employeeIsActive,
  employeeName,
  positionId,
  commissionPercentage,
  passwordHash,
}) => {
  const client = await pool.connect();

  try {
    // Start a transaction
    await client.query('BEGIN');

    const insertEmployeeQuery = `
      INSERT INTO cs_employees (employee_code, department_id, employee_contact, employee_email, employee_is_active, employee_name, position_id, commission_percentage)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *;
    `;
    const values = [
      employeeCode,
      parseInt(departmentId, 10),
      employeeContact,
      employeeEmail,
      employeeIsActive || true,
      employeeName,
      parseInt(positionId, 10) || null,
      parseFloat(commissionPercentage) || 0.0,
    ];

    const result = await client.query(insertEmployeeQuery, values);
    const newEmployee = result.rows[0];

    const insertAuthQuery = `
      INSERT INTO cs_user_auth (employee_id, password_hash)
      VALUES ($1, $2)
      RETURNING *;
    `;
    const authValues = [newEmployee.employee_id, passwordHash];
    const authResult = await client.query(insertAuthQuery, authValues);
    const newAuth = authResult.rows[0];

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

export default {
  createEmployee,
  checkEmployeeCodeExists,
  getAuthEmployee,
};
