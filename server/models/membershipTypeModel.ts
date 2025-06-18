import { pool, withTransaction } from '../config/database.js';
import { MembershipType, NewMembershipType, UpdatedMembershipType } from '../types/model.types.js';

const getMembershipType = async (): Promise<{ success: boolean; data: MembershipType[] | []; message: string }> => {
  const client = await pool().connect();

  try {
    const query = `
    SELECT * 
    FROM membership_types
    ORDER BY id ASC;
    `;

    const result = await client.query(query);

    if (result.rows.length > 0) {
      return { success: true, data: result.rows, message: 'The membership types have been retrieved successfully.' };
    } else {
      return { success: false, data: [], message: 'No membership types found.' };
    }
  } catch (error) {
    console.error('Error fetching membership types:', error);

    console.error('Full error details:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });

    // Return user-friendly message but also throw for critical errors
    if (error instanceof Error && error.message.includes('connection')) {
      throw new Error('Database connection failed. Please try again later.');
    }

    return { success: false, data: [], message: 'Failed to fetch membership types due to database error.' };
  } finally {
    client.release();
  }
};

const addMembershipType = async (data: NewMembershipType): Promise<{ success: boolean; message: string }> => {
  const {
    membership_type_name,
    default_percentage_discount_for_products,
    default_percentage_discount_for_services,
    created_by,
  } = data;

  const last_updated_by = created_by;
  const created_at = new Date();
  const updated_at = created_at;

  try {
    const result = await withTransaction(async (client) => {
      const query = `
        INSERT INTO membership_types (
        membership_type_name,
        default_percentage_discount_for_products,
        default_percentage_discount_for_services,
        created_at,
        updated_at,
        created_by,
        last_updated_by
        )
        VALUES (
        $1, $2, $3, $4, $5, $6, $7
        )
        `;
      const values = [
        membership_type_name,
        default_percentage_discount_for_products,
        default_percentage_discount_for_services,
        created_at,
        updated_at,
        created_by,
        last_updated_by,
      ];

      return await client.query(query, values);
    });

    if (Number(result.rowCount) > 0) {
      return { success: true, message: 'The new Membership Type has been created.' };
    } else {
      return { success: false, message: 'Failed to create membership type - no rows affected.' };
    }
  } catch (error) {
    console.error('Error creating membership types:', error);

    console.error('Full error details:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });

    // Return user-friendly message but also throw for critical errors
    if (error instanceof Error && error.message.includes('connection')) {
      throw new Error('Database connection failed. Please try again later.');
    }

    return { success: false, message: 'Failed to create membership type due to database error.' };
  }
};

const setMembershipType = async (data: UpdatedMembershipType): Promise<{ success: boolean; message: string }> => {
  const {
    id,
    membership_type_name,
    default_percentage_discount_for_products,
    default_percentage_discount_for_services,
    created_by,
    last_updated_by,
  } = data;

  const updated_at = new Date();

  try {
    const result = await withTransaction(async (client) => {
      const query = `
        UPDATE membership_types
        SET
        membership_type_name = $1,
        default_percentage_discount_for_products = $2,
        default_percentage_discount_for_services = $3,
        updated_at = $4,
        created_by = $5,
        last_updated_by = $6
        WHERE
        id = $7
        ;
        `;

      const values = [
        membership_type_name,
        default_percentage_discount_for_products,
        default_percentage_discount_for_services,
        updated_at,
        created_by,
        last_updated_by,
        id,
      ];

      return await client.query(query, values);
    });

    if (Number(result.rowCount) > 0) {
      return { success: true, message: 'The Membership Type has been updated.' };
    } else {
      return { success: false, message: 'Failed to update membership type - no rows affected.' };
    }
  } catch (error) {
    console.error('Error updating membership types:', error);

    console.error('Full error details:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });

    // Return user-friendly message but also throw for critical errors
    if (error instanceof Error && error.message.includes('connection')) {
      throw new Error('Database connection failed. Please try again later.');
    }

    return { success: false, message: 'Failed to update membership type due to database error.' };
  }
};

const deleteMembershipType = async (id: number): Promise<{ success: boolean; message: string }> => {
  try {
    const result = await withTransaction(async (client) => {
      const query = `
      DELETE FROM membership_types
      WHERE id = $1
      ;
      `;

      return await client.query(query, [id]);
    });

    if (Number(result.rowCount) > 0) {
      return { success: true, message: 'The Membership Type has been deleted.' };
    } else {
      return { success: false, message: 'Failed to delete membership type - no rows affected.' };
    }
  } catch (error) {
    console.error('Error deleting membership types:', error);

    console.error('Full error details:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });

    // Return user-friendly message but also throw for critical errors
    if (error instanceof Error && error.message.includes('connection')) {
      throw new Error('Database connection failed. Please try again later.');
    }

    return { success: false, message: 'Failed to delete membership type due to database error.' };
  }
};

export default {
  getMembershipType,
  addMembershipType,
  setMembershipType,
  deleteMembershipType,
};
