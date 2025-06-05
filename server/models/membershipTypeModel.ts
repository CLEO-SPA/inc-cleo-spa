import { pool, getProdPool as prodPool } from '../config/database.js';
import { MembershipTypeData, NewMembershipType, UpdatedMembershipType, withTransaction } from '../types/membershipTypeTypes.js';
import { MembershipTypePaginationParameter } from '../types/pagination.js';

const getMembershipType = async (params: MembershipTypePaginationParameter = {}): Promise<MembershipTypeData> => {
  const {
    page = 1,
    limit = 10
  } = params

  if (page < 1) {
    throw new Error('Page must be 1 or greater');
  }
  if (limit < 1 || limit > 100) {
    throw new Error('Limit must be between 1 and 100');
  }

  const offset = (page - 1) * limit;

  try {
    const query = `
  SELECT 
    COALESCE(json_agg(mt.*), '[]'::json) AS membershiptypelist,
    (SELECT COUNT(*) FROM membership_types WHERE status = 'is_enabled') AS total
  FROM (
    SELECT * 
    FROM membership_types
    WHERE status = 'is_enabled'
    ORDER BY id ASC
    LIMIT $1 OFFSET $2
  ) mt;
`;

    const value = [limit, offset];

    const result = await pool().query(query, value);

    const totalCount = parseInt(result.rows[0].total);
    const membershipTypeList = result.rows[0].membershiptypelist;
    const currentPage = page;
    const totalPages = Math.ceil(totalCount / limit);

    const isEmpty = !membershipTypeList || membershipTypeList.length === 0;

    return {
      membershipTypeList: isEmpty ? [] : membershipTypeList,
      pagination: {
        total: totalCount,
        totalPages,
        currentPage,
        limit,
        hasNext: currentPage < totalPages,
        hasPrevious: currentPage > 1
      }
    };

  } catch (error) {
    console.error('Error fetching membership types:', error);
    throw new Error('Failed to fetch membership types'); // To be Improved
  }
};

const addMembershipType = async (data: NewMembershipType): Promise<{ success: boolean, message: string }> => {
  const {
    membership_type_name,
    default_percentage_discount_for_products,
    default_percentage_discount_for_services,
    created_by
  } = data;

  const last_updated_by = created_by;

  const created_at = new Date();

  const updated_at = created_at;

  try {
    const result = await withTransaction(async (client) => { // create the callback for the transaction
      const query = `
        INSERT INTO membership_types (
        membership_type_name,
        default_percentage_discount_for_products,
        default_percentage_discount_for_services,
        created_at,
        updated_at,
        created_by,
        last_updated_by,
        status
        )
        VALUES (
        $1, $2, $3, $4, $5, $6, $7, 'is_enabled'
        )
        `;
      const values = [
        membership_type_name,
        default_percentage_discount_for_products,
        default_percentage_discount_for_services,
        created_at,
        updated_at,
        created_by,
        last_updated_by
      ];

      return await client.query(query, values);
    });

    if (Number(result.rowCount) > 0) {
      return { success: true, message: "The new Membership Type has been created." };
    } else {
      return { success: false, message: "Failed to create membership type - no rows affected." };
    }

  } catch (error) {
    console.error('Error creating membership types:', error);
    return { success: false, message: "Failed to create membership type due to database error." };
  }
};

const setMembershipType = async (data: UpdatedMembershipType): Promise<{ success: boolean, message: string }> => {
  const {
    id,
    membership_type_name,
    default_percentage_discount_for_products,
    default_percentage_discount_for_services,
    created_by,
    last_updated_by
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
        id
      ];

      return await client.query(query, values);
    });

    if (Number(result.rowCount) > 0) {
      return { success: true, message: "The Membership Type has been updated." };
    } else {
      return { success: false, message: "Failed to update membership type - no rows affected." };
    }
  } catch (error) {
    console.error('Error updating membership types:', error);
    return { success: false, message: "Failed to updating membership type due to database error." };
  }
};

const removeMembershipType = async (id: number): Promise<{ success: boolean, message: string }> => {
  try {
    const result = await withTransaction(async (client) => {
      const query = `
      UPDATE membership_types
      SET 
      status = 'disabled'
      WHERE
      id = $1
      ;
      `;

      return await client.query(query, [id]);
    });

    if (Number(result.rowCount) > 0) {
      return { success: true, message: "The Membership Type has been deleted." };
    } else {
      return { success: false, message: "Failed to delete membership type - no rows affected." };
    }
  } catch (error) {
    console.error('Error updating membership types:', error);
    return { success: false, message: "Failed to deleting membership type due to database error." };
  }
};
export default {
  getMembershipType,
  addMembershipType,
  setMembershipType,
  removeMembershipType,
};