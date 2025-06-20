import { pool, getProdPool as prodPool } from '../config/database.js';
import { Positions } from '../types/model.types.js';

const checkPositionNameExists = async (position_name: string) => {
  try {
    const query = `SELECT * FROM positions WHERE position_name = $1`;
    const values = [position_name];
    const result = await pool().query(query, values);
    return result.rows.length > 0;
  } catch (error) {
    throw new Error('Error checking position name existence');
  }
};

const getAllPositions = async (offset: number, limit: number, startDate_utc: string, endDate_utc: string) => {
  try {
    const query = `
      SELECT * FROM positions
      WHERE position_created_at BETWEEN
        COALESCE($3, '0001-01-01'::timestamp with time zone)
        AND $4
      ORDER BY id ASC
      LIMIT $1 OFFSET $2
    `;
    const values = [limit, offset, startDate_utc, endDate_utc];
    const result = await pool().query <Positions>(query, values);

    const totalQuery = `
      SELECT COUNT(*) FROM positions
      WHERE position_created_at BETWEEN
        COALESCE($1, '0001-01-01'::timestamp with time zone)
        AND $2
    `;
    const totalValues = [startDate_utc, endDate_utc];
    const totalResult = await pool().query(totalQuery, totalValues);
    const totalPages = Math.ceil(totalResult.rows[0].count / limit);

    return {
      positions: result.rows,
      totalPages,
    };
  } catch (error) {
    console.error('Error fetching positions:', error);
    throw new Error('Error fetching positions');
  }
};

const createPosition = async ({
  position_name,
  position_description,
  position_is_active,
  position_created_at,
  position_updated_at,
}: {
  position_name: string;
  position_description: string;
  position_is_active: boolean;
  position_created_at: string;
  position_updated_at: string;
}) => {
  const client = await pool().connect();
  try {
    await client.query('BEGIN');

    const insertPositionQuery = `
      INSERT INTO positions (position_name, position_description, position_is_active, position_created_at, position_updated_at)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *;
    `;
    const values = [
      position_name,
      position_description,
      position_is_active || true,
      position_created_at,
      position_updated_at,
    ];

    const result = await client.query<Positions>(insertPositionQuery, values);
    const newPosition = result.rows[0];

    await client.query('COMMIT');
    return newPosition;
  } catch (error) {
    console.error('Error creating position:', error);
    await client.query('ROLLBACK');
    throw new Error('Error creating position');
  } finally {
    client.release();
  }
};

const updatePosition = async (
  id: number,
  {
    position_name,
    position_description,
    position_is_active,
    position_updated_at,
  }: {
    position_name?: string;
    position_description?: string;
    position_is_active?: boolean;
    position_updated_at: string;
  }
) => {
  const client = await pool().connect();
  try {
    await client.query('BEGIN');

    const updateQuery = `
      UPDATE positions
      SET 
        position_name = COALESCE($2, position_name),
        position_description = COALESCE($3, position_description),
        position_is_active = COALESCE($4, position_is_active),
        position_updated_at = $5
      WHERE id = $1
      RETURNING *;
    `;
    const values = [id, position_name, position_description, position_is_active, position_updated_at];
    const result = await client.query(updateQuery, values);

    if (result.rows.length === 0) {
      throw new Error('Position not found');
    }

    const updatedPosition = result.rows[0];
    await client.query('COMMIT');
    return updatedPosition;
  } catch (error) {
    console.error('Error updating position:', error);
    await client.query('ROLLBACK');
    throw new Error('Error updating position');
  } finally {
    client.release();
  }
};

const deletePosition = async (id: number) => {
  const client = await pool().connect();
  try {
    await client.query('BEGIN');

    // Check if position is being used by any employees
    const checkQuery = `SELECT COUNT(*) FROM employees WHERE position_id = $1`;
    const checkResult = await client.query(checkQuery, [id]);
    const employeeCount = parseInt(checkResult.rows[0].count, 10);

    if (employeeCount > 0) {
      throw new Error('Cannot delete position: it is assigned to employees');
    }

    const deleteQuery = `DELETE FROM positions WHERE id = $1 RETURNING *`;
    const result = await client.query(deleteQuery, [id]);

    if (result.rows.length === 0) {
      throw new Error('Position not found');
    }

    await client.query('COMMIT');
    return result.rows[0];
  } catch (error) {
    console.error('Error deleting position:', error);
    await client.query('ROLLBACK');
    throw new Error('Error deleting position');
  } finally {
    client.release();
  }
};

const getPositionById = async (id: number) => {
  try {
    const query = `SELECT * FROM positions WHERE id = $1`;
    const values = [id];
    const result = await pool().query<Positions>(query, values);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    return result.rows[0];
  } catch (error) {
    console.error('Error fetching position by ID:', error);
    throw new Error('Error fetching position');
  }
};

const getAllPositionsForDropdown = async () => {
  try {
    const query = `
      SELECT id, position_name FROM positions
      WHERE position_is_active = true
      ORDER BY position_name ASC
    `;
    const result = await pool().query<Partial<Positions>>(query);
    return result.rows;
  } catch (error) {
    console.error('Error fetching position list:', error);
    throw new Error('Error fetching position list');
  }
};

const getPositionCount = async () => {
  try {
    const query = `SELECT COUNT(*) FROM positions`;
    const result = await pool().query<{count:string}>(query);
    const count = parseInt(result.rows[0].count, 10);
    return count;
  } catch (error) {
    console.error('Error getting position count:', error);
    throw new Error('Error getting position count');
  }
};

const togglePositionStatus = async (id: number, position_updated_at: string) => {
  const client = await pool().connect();
  try {
    await client.query('BEGIN');

    const toggleQuery = `
      UPDATE positions
      SET 
        position_is_active = NOT position_is_active,
        position_updated_at = $2
      WHERE id = $1
      RETURNING *;
    `;
    const values = [id, position_updated_at];
    const result = await client.query<Positions>(toggleQuery, values);

    if (result.rows.length === 0) {
      throw new Error('Position not found');
    }

    const updatedPosition = result.rows[0];
    await client.query('COMMIT');
    return updatedPosition;
  } catch (error) {
    console.error('Error toggling position status:', error);
    await client.query('ROLLBACK');
    throw new Error('Error toggling position status');
  } finally {
    client.release();
  }
};

export default {
  checkPositionNameExists,
  getAllPositions,
  createPosition,
  updatePosition,
  deletePosition,
  getPositionById,
  getAllPositionsForDropdown,
  getPositionCount,
  togglePositionStatus,
};