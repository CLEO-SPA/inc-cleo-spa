import { pool, query as dbQuery, queryOnPool } from '../config/database.js';
import { CreateEmployeeData, UpdateEmployeeData } from '../types/employee.types.js';
import validator from 'validator';

export interface Employee {
  id: number;
  employee_code: number;
  employee_name: string;
  position_ids: number[];
  positions: string[];
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
  employee_contact?: string;
  employee_email?: string; // optional, can be undefined
  position_ids: number[];
  position_names: string[];
  created_at: Date;
  updated_at: Date;
}

const checkEmployeeCodeExists = async (employee_code: string) => {
  try {
    const query = `SELECT * FROM employees WHERE employee_code = $1`;
    const values = [employee_code];
    const result = await dbQuery(query, values);

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

    const result = await dbQuery(query, values);
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

    const result = await dbQuery(query, values);
    if (result.rowCount === null) {
      throw new Error('Unexpected result format from database');
    }
    return result.rowCount > 0; // ❯ true if at least one match
  } catch (error) {
    console.error('Error checking employee phone existence:', error);
    throw new Error('Error checking employee phone existence');
  }
};

const getAllEmployees = async (
  offset: number,
  limit: number,
  startDate_utc: string,
  endDate_utc: string,
  searchQuery?: string
) => {
  try {
    const search = searchQuery?.trim().toLowerCase() || '';

    // Step 1: Get paginated employee IDs based on date + optional search
    const idQuery = `
      SELECT id FROM employees
      WHERE created_at BETWEEN
        COALESCE($1, '0001-01-01'::timestamptz) AND $2
      ${
        search
          ? `AND (
        LOWER(employee_name) ILIKE '%' || $5 || '%' OR
        LOWER(employee_email) ILIKE '%' || $5 || '%' OR
        LOWER(employee_code) ILIKE '%' || $5 || '%'
      )`
          : ''
      }
      ORDER BY id ASC
      LIMIT $3 OFFSET $4
    `;
    const idValues = search
      ? [startDate_utc, endDate_utc, limit, offset, search]
      : [startDate_utc, endDate_utc, limit, offset];
    const idResult = await dbQuery(idQuery, idValues);
    const employeeIds: number[] = idResult.rows.map((row) => row.id);

    if (employeeIds.length === 0) {
      return {
        employees: [],
        totalPages: 0,
        totalCount: 0,
      };
    }

    // Step 2: Fetch detailed employee + position info
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
        p.position_name
      FROM employees e
      LEFT JOIN employee_to_position ep ON e.id = ep.employee_id
      LEFT JOIN positions p ON ep.position_id = p.id
      WHERE e.id = ANY($1)
      ORDER BY e.id ASC
    `;
    const dataResult = await dbQuery(dataQuery, [employeeIds]);

    // Step 3: Group employee rows
    const groupedMap: Record<number, any> = {};

    for (const row of dataResult.rows) {
      const empId = Number(row.employee_id);

      if (!groupedMap[empId]) {
        groupedMap[empId] = {
          id: empId,
          employee_code: row.employee_code,
          employee_name: row.employee_name,
          employee_email: row.employee_email,
          employee_contact: row.employee_contact,
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
    }

    const groupedEmployees = Object.values(groupedMap);

    // Step 4: Get total count (for pagination)
    const totalQuery = `
      SELECT COUNT(*) FROM employees
      WHERE created_at BETWEEN
        COALESCE($1, '0001-01-01'::timestamptz) AND $2
      ${
        search
          ? `AND (
        LOWER(employee_name) ILIKE '%' || $3 || '%' OR
        LOWER(employee_email) ILIKE '%' || $3 || '%' OR
        LOWER(employee_code) ILIKE '%' || $3 || '%'
      )`
          : ''
      }
    `;
    const totalValues = search ? [startDate_utc, endDate_utc, search] : [startDate_utc, endDate_utc];
    const totalResult = await dbQuery(totalQuery, totalValues);
    const totalCount = Number(totalResult.rows[0].count);
    const totalPages = Math.ceil(totalCount / limit);

    return {
      employees: groupedEmployees,
      totalPages,
      totalCount,
    };
  } catch (error) {
    console.error('Error fetching employees:', error);
    throw new Error('Error fetching employees');
  }
};

const createEmployeeModel = async (data: CreateEmployeeData) => {
  const client = await pool().connect();
  try {
    await client.query('BEGIN');

    const employeeQuery = `
      INSERT INTO employees (
        employee_code,
        employee_name,
        employee_email,
        employee_contact,
        employee_is_active,
        created_at,
        updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id
    `;
    const employeeResult = await client.query(employeeQuery, [
      data.employee_code,
      data.employee_name,
      data.employee_email ?? null,
      data.employee_contact ?? null,
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
    return { employeeId };
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating employee:', error);
    throw new Error('Failed to create employee');
  } finally {
    client.release();
  }
};

// !!DEPRECATED
// export const getEmployeeIdByUserAuthId = async (id: string) => {
//   const employee_sql = 'SELECT id FROM employees WHERE user_auth_id = $1';
//   const params = [id];

//   return await pool().query<{ id: string }>(employee_sql, params);
// };
/**
 * Get all active employees with basic details
 * This function is used for search functionality in the timetable management system.
 */
// const getBasicEmployeeDetails = async (): Promise<Employee[]> => {
//   const query = `
//     SELECT
//       id,
//       employee_name,
//       position_id
//     FROM employees e
//     WHERE employee_is_active = true
//     ORDER BY employee_name ASC`;
//   try {
//     const result = await dbQuery(query);
//     return result.rows.map((row: any) => ({
//       id: row.id,
//       employee_name: row.employee_name,
//       position_id: row.position_id,
//     }));
//   } catch (error) {
//     console.error('Database error in getBasicEmployeeDetails: ', error);
//     throw new Error('Failed to fetch basic employee details from database');
//   }
// }
const getBasicEmployeeDetails = async (): Promise<Employee[]> => {
  const query = `
    SELECT 
      e.id, 
      e.employee_name,
      COALESCE(ARRAY_AGG(etp.position_id) FILTER (WHERE etp.position_id IS NOT NULL), '{}') AS position_ids,
      COALESCE(ARRAY_AGG(p.position_name) FILTER (WHERE p.position_name IS NOT NULL), '{}') AS positions
    FROM employees e 
    LEFT JOIN employee_to_position etp ON e.id = etp.employee_id
    LEFT JOIN positions p ON etp.position_id = p.id
    WHERE e.employee_is_active = true 
    GROUP BY e.id, e.employee_name
    ORDER BY e.employee_name ASC`;

  try {
    const result = await dbQuery(query);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return result.rows.map((row: any) => ({
      id: row.id,
      employee_name: row.employee_name,
      employee_code: row.employee_code || 0,
      position_ids: row.position_ids || [],
      positions: row.positions || [],
    }));
  } catch (error) {
    console.error('Database error in getBasicEmployeeDetails: ', error);
    throw new Error('Failed to fetch basic employee details from database');
  }
};

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
    const result = await dbQuery(query);
    return result.rows.map((row: any) => ({
      id: row.id,
      position_name: row.position_name,
    }));
  } catch (error) {
    console.error('Database error in getAllActivePositions: ', error);
    throw new Error('Failed to fetch active positions from database');
  }
};

/**
 * Get detailed employee information
 * This function is used to fetch detailed information about employees.
 */
// const getEmployeeById = async (employeeId: number): Promise<DetailedEmployee | null> => {
//   const query = `
//     SELECT
//       e.id,
//       e.employee_name,
//       e.employee_code,
//       e.employee_is_active,
//       e.position_id,
//       p.position_name,
//       e.created_at,
//       e.updated_at
//     FROM employees e
//     LEFT JOIN positions p ON e.position_id = p.id
//     WHERE e.id = $1 AND e.employee_is_active = true
//   `
//   try {
//     const result = await dbQuery(query, [employeeId]);
//     return result.rows.length > 0 ? result.rows[0] : null;
//   } catch (error) {
//     console.error('Database error in getEmployeeById: ', error);
//     throw new Error('Failed to fetch employee details from database');
//   }
// }

const getEmployeeById = async (employeeId: number): Promise<DetailedEmployee | null> => {
  const query = `
    SELECT
      e.id,
      e.employee_name,
      e.employee_code,
      e.employee_is_active,
      e.employee_contact,
      e.employee_email,
      COALESCE(ARRAY_AGG(etp.position_id) FILTER (WHERE etp.position_id IS NOT NULL), '{}') AS position_ids,
      COALESCE(ARRAY_AGG(p.position_name) FILTER (WHERE p.position_name IS NOT NULL), '{}') AS position_names,
      e.created_at,
      e.updated_at
    FROM employees e
    LEFT JOIN employee_to_position etp ON e.id = etp.employee_id
    LEFT JOIN positions p ON etp.position_id = p.id
    WHERE e.id = $1 AND e.employee_is_active = true
    GROUP BY e.id, e.employee_name, e.employee_code, e.employee_is_active, e.created_at, e.updated_at
  `;

  try {
    const result = await dbQuery(query, [employeeId]);
    if (result.rows.length === 0) return null;

    const row = result.rows[0];
    return {
      id: row.id,
      employee_name: row.employee_name,
      employee_code: row.employee_code,
      employee_contact: row.employee_contact,
      employee_email: row.employee_email,
      employee_is_active: row.employee_is_active,
      position_ids: row.position_ids || [],
      position_names: row.position_names || [],
      created_at: row.created_at,
      updated_at: row.updated_at,
    };
  } catch (error) {
    console.error('Database error in getEmployeeById: ', error);
    throw new Error('Failed to fetch employee details from database');
  }
};

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
    const result = await dbQuery(query, [employeeId]);
    return result.rows.length > 0;
  } catch (error) {
    console.error('Database error in employeeExists: ', error);
    throw new Error('Failed to check employee existence in database');
  }
};

/**
 * Get /api/em/employeeName/:employeeId
 * This endpoint retrieves employee name by employee id
 */
const getEmployeeNameByEmployeeById = async (employeeId: number): Promise<DetailedEmployee | null> => {
  const query = `
    SELECT
      id,
      employee_name
    FROM employees
    WHERE id = $1
  `;
  try {
    const result = await dbQuery(query, [employeeId]);
    return result.rows.length > 0 ? result.rows[0] : null;
  } catch (error) {
    console.error('Database error in getEmployeeById: ', error);
    throw new Error('Failed to fetch employee details from database');
  }
};

// const getBasicEmployeeDetails = async (): Promise<Employee[]> => {
//   const query = `
//     SELECT
//       id,
//       employee_name
//     FROM employees e
//     WHERE employee_is_active = true
//     ORDER BY employee_name ASC`;
//   try {
//     const result = await dbQuery(query);
//     return result.rows.map((row: any) => ({
//       id: row.id,
//       employee_name: row.employee_name,
//       position_id: row.position_id,
//     }));
//   } catch (error) {
//     console.error('Database error in getBasicEmployeeDetails: ', error);
//     throw new Error('Failed to fetch basic employee details from database');
//   }
// };

const getAllEmployeesForDropdown = async () => {
  try {
    const query = `
      SELECT id, employee_name FROM employees
      WHERE employee_is_active = true
      ORDER BY employee_name ASC
    `;
    const { rows } = await dbQuery(query);
    return rows;
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
    const { rows } = await dbQuery(query);
    return rows;
  } catch (error) {
    console.error('Error fetching role list:', error);
    throw new Error('Error fetching role list');
  }
};

// /* --------------------------------------------------------------------------
//  * One-shot fetch of a single employee (with positions & status)
//  * ------------------------------------------------------------------------ */
// const getOnlyEmployeeById = async (employee_id: number) => {
//   const query = `
//     SELECT
//       e.id                        AS employee_id,
//       e.employee_code,
//       e.employee_name,
//       e.employee_email,
//       e.employee_contact,
//       e.employee_is_active,
//       e.created_at,
//       e.updated_at,
//       (SELECT st.status_name
//          FROM statuses st
//         WHERE st.id = e.verified_status_id)      AS verification_status,
//       p.id                        AS position_id,
//       p.position_name
//     FROM employees            e
//     LEFT JOIN employee_to_position ep ON ep.employee_id = e.id
//     LEFT JOIN positions            p ON p.id          = ep.position_id
//     WHERE e.id = $1
//   `;
//   const { rows, rowCount } = await dbQuery(query, [employee_id]);

//   if (!rowCount) return null;

//   // -- consolidate one row per employee
//   const emp = {
//     id: rows[0].employee_id,
//     employee_name: rows[0].employee_name,
//     employee_email: rows[0].employee_email,
//     employee_code: rows[0].employee_code,
//     employee_contact: rows[0].employee_contact,
//     employee_is_active: rows[0].employee_is_active,
//     verification_status: rows[0].verification_status,
//     created_at: rows[0].created_at,
//     updated_at: rows[0].updated_at,
//     positions: [] as { position_id: string; position_name: string }[],
//   };

//   rows.forEach((r) => {
//     if (r.position_id) {
//       emp.positions.push({ position_id: r.position_id, position_name: r.position_name });
//     }
//   });

//   return emp;
// };

/* --------------------------------------------------------------------------
 * Robust UPDATE of employee + auth + positions
 * ------------------------------------------------------------------------ */
/* --------------------------------------------------------------------------
 * Helper: validate timestamp (ISO-8601)
 * ------------------------------------------------------------------------ */
const validateTimestamp = (ts?: string) => ts && validator.isISO8601(ts, { strict: true, strictSeparator: true });

/* --------------------------------------------------------------------------
 * Main updater
 * ------------------------------------------------------------------------ */
const updateEmployee = async (data: UpdateEmployeeData) => {
  const client = await pool().connect();
  try {
    await client.query('BEGIN');

    const customTs = validateTimestamp(data.updated_at) ? data.updated_at : new Date().toISOString();

    /* 1. Fetch current employee */
    const {
      rows: [existing],
    } = await client.query(
      `SELECT id, employee_email, employee_contact, employee_code
         FROM employees
        WHERE id = $1
        LIMIT 1`,
      [data.employee_id]
    );

    if (!existing) throw new Error(`Employee ${data.employee_id} not found`);

    /* 2. Check for duplicates */
    if (data.employee_email && data.employee_email !== existing.employee_email) {
      const { rowCount } = await client.query(`SELECT 1 FROM employees WHERE employee_email = $1 AND id <> $2`, [
        data.employee_email,
        data.employee_id,
      ]);
      if (rowCount) throw new Error('E-mail already in use');
    }

    if (data.employee_contact && data.employee_contact !== existing.employee_contact) {
      const { rowCount } = await client.query(`SELECT 1 FROM employees WHERE employee_contact = $1 AND id <> $2`, [
        data.employee_contact,
        data.employee_id,
      ]);
      if (rowCount) throw new Error('Contact number already in use');
    }

    if (data.employee_code && data.employee_code !== existing.employee_code) {
      const { rowCount } = await client.query(`SELECT 1 FROM employees WHERE employee_code = $1 AND id <> $2`, [
        data.employee_code,
        data.employee_id,
      ]);
      if (rowCount) throw new Error('Employee code already in use');
    }

    /* 3. Update employees table */
    const fields: string[] = [];
    const values: any[] = [];
    let i = 1;

    if (data.employee_email !== undefined) {
      fields.push(`employee_email = $${i}`);
      values.push(data.employee_email);
      i++;
    }

    if (data.employee_name !== undefined) {
      fields.push(`employee_name = $${i}`);
      values.push(data.employee_name);
      i++;
    }

    if (data.employee_contact !== undefined) {
      fields.push(`employee_contact = $${i}`);
      values.push(data.employee_contact);
      i++;
    }

    if (data.employee_code !== undefined) {
      fields.push(`employee_code = $${i}`);
      values.push(data.employee_code);
      i++;
    }

    if (data.employee_is_active !== undefined) {
      fields.push(`employee_is_active = $${i}`);
      values.push(data.employee_is_active);
      i++;
    }

    fields.push(`updated_at = $${i}`);
    values.push(customTs);
    i++;

    values.push(data.employee_id);
    await client.query(`UPDATE employees SET ${fields.join(', ')} WHERE id = $${i}`, values);

    /* 4. Replace positions */
    if (Array.isArray(data.position_ids)) {
      await client.query(`DELETE FROM employee_to_position WHERE employee_id = $1`, [data.employee_id]);

      if (data.position_ids.length > 0) {
        await client.query(
          `INSERT INTO employee_to_position (employee_id, position_id, created_at, updated_at)
           SELECT $1, pid, $2, $2 FROM unnest($3::bigint[]) pid`,
          [data.employee_id, customTs, data.position_ids]
        );
      }
    }

    await client.query('COMMIT');
    return { success: true };
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
  getAllEmployees,
  getAllEmployeesForDropdown,
  // getEmployeeIdByUserAuthId,
  getBasicEmployeeDetails,
  createEmployeeModel,
  getAllRolesForDropdown,
  getEmployeeById,
  updateEmployee,
  getAllActivePositions,
  employeeExists,
  getEmployeeNameByEmployeeById,
};
