import { pool, getProdPool as prodPool } from '../config/database.js';
import { MembershipTypeData, NewMembershipType, UpdatedMembershipType } from '../types/membershipTypeTypes.js';
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
    (SELECT COUNT(*) FROM membership_types) AS total
  FROM (
    SELECT * 
    FROM membership_types 
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

  return { success: true, message: "testing" };
}

const setMembershipType = async (data: UpdatedMembershipType): Promise<{ success: boolean, message: string }> => {

  return { success: true, message: "testing" };
};

const removeMembershipType = async (data: number): Promise<{ success: boolean, message: string }> => {

  return { success: true, message: "testing" };
};
export default {
  getMembershipType,
  addMembershipType,
  setMembershipType,
  removeMembershipType,
};