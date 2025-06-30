import { pool, getProdPool as prodPool } from '../config/database.js';
import { CreateMemberInput, UpdateMemberInput } from '../types/member.types.js';
import { getMemberOutstandingAmounts } from '../services/paymentService.js';
import { getLastVisitedDatesForMembers } from '../services/getLastVisitedDatesForMember.js';
import { format } from 'date-fns';


const getAllMembers = async (
  offset: number,
  limit: number,
  startDate_utc?: string,
  endDate_utc?: string,
  createdBy?: string,
  search?: string,
  sessionStartDate_utc?: string, // simulation constraint
  sessionEndDate_utc?: string
) => {
  try {
    const filters: string[] = [];
    const values: any[] = [];
    let idx = 1;

    filters.push(`m.created_at BETWEEN $${idx++} AND $${idx++}`);
    values.push(
      sessionStartDate_utc || '0001-01-01T00:00:00Z',
      sessionEndDate_utc || '9999-12-31T23:59:59Z'
    );

    if (startDate_utc && endDate_utc) {
      filters.push(`m.created_at BETWEEN $${idx++} AND $${idx++}`);
      values.push(startDate_utc, endDate_utc);
    }

    if (createdBy) {
      const empResult = await pool().query(
        `SELECT id FROM employees WHERE employee_name ILIKE $1`,
        [`%${createdBy}%`]
      );
      const empIds = empResult.rows.map(row => row.id);

      if (empIds.length > 0) {
        filters.push(`m.created_by = ANY($${idx++}::int[])`);
        values.push(empIds);
      } else {
        return { members: [], totalPages: 0 };
      }
    }

    if (search) {
      filters.push(`(m.name ILIKE $${idx} OR m.contact ILIKE $${idx})`);
      values.push(`%${search}%`);
      idx++;
    }


    const whereClause = filters.length > 0 ? `WHERE ${filters.join(' AND ')}` : '';

    const baseQuery = `
      SELECT 
        m.*,
        mt.membership_type_name as membership_type_name,
        e.employee_name as created_by_name
      FROM members m
      LEFT JOIN membership_types mt ON m.membership_type_id::bigint = mt.id
      LEFT JOIN employees e ON m.created_by = e.id
      ${whereClause}
    `;

    values.push(limit, offset);
    const query = `${baseQuery} ORDER BY m.id ASC LIMIT $${idx++} OFFSET $${idx++};`;

    const result = await pool().query(query, values);

    // Count query
    const countValues = values.slice(0, -2);
    const totalQuery = `
      SELECT COUNT(*) 
      FROM members m
      LEFT JOIN membership_types mt ON m.membership_type_id::bigint = mt.id
      LEFT JOIN employees e ON m.created_by = e.id
      ${whereClause};
    `;
    const totalResult = await pool().query(totalQuery, countValues);
    const totalCount = Number(totalResult.rows[0].count);
    const totalPages = Math.ceil(totalCount / limit);

    // Get outstanding balances
    const outstandingMap = await getMemberOutstandingAmounts();
    const lastVisitedMap = await getLastVisitedDatesForMembers();

    const enrichedMembers = result.rows.map((member: any) => ({
      ...member,
      total_amount_owed: outstandingMap[member.id] || 0,
      last_visit_date: lastVisitedMap[member.id]
        ? format(new Date(lastVisitedMap[member.id]), 'dd MMM yyyy, hh:mm a')
        : null,
      created_at: member.created_at
        ? format(new Date(member.created_at), 'dd MMM yyyy, hh:mm a')
        : null,
      updated_at: member.updated_at
        ? format(new Date(member.updated_at), 'dd MMM yyyy, hh:mm a')
        : null,
      dob: member.dob
        ? format(new Date(member.dob), 'dd MMM yyyy')
        : null,
    }));

    return {
      members: enrichedMembers,
      totalPages,
      totalCount,
    };

  } catch (error) {
    console.error('Error fetching members:', error);
    throw new Error('Error fetching members');
  }
};

const createMember = async ({
  name,
  email,
  contact,
  dob,
  sex,
  remarks,
  address,
  nric,
  membership_type_id,
  created_at,
  updated_at,
  created_by,
  role_name = 'member',
}: CreateMemberInput & { role_name?: string }) => {
  const client = await pool().connect();

  try {
    await client.query('BEGIN');

    // Validation: Check if email already exists
    const emailCheckQuery = `
      SELECT id FROM user_auth WHERE email = $1;
    `;
    const emailResult = await client.query(emailCheckQuery, [email]);
    if (emailResult.rows.length > 0) {
      throw new Error('Email already exists');
    }

    // Validation: Check if contact already exists
    const contactCheckQuery = `
      SELECT id FROM user_auth WHERE phone = $1;
    `;
    const contactResult = await client.query(contactCheckQuery, [contact]);
    if (contactResult.rows.length > 0) {
      throw new Error('Contact number already exists');
    }

    // 1. Call the get_or_create_roles function
    const getRoleQuery = `
      SELECT get_or_create_roles($1) AS role_id;
    `;
    const roleResult = await client.query(getRoleQuery, [role_name]);
    const role_id = roleResult.rows[0].role_id;

    // 2. Insert into user_auth
    const insertUserAuthQuery = `
      INSERT INTO user_auth (email, password, created_at, updated_at, phone)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *;
    `;
    const userAuthValues = [email, null, created_at, updated_at, contact];
    const authResult = await client.query(insertUserAuthQuery, userAuthValues);
    const newAuth = authResult.rows[0];

    // 3. Insert into members
    const insertMemberQuery = `
      INSERT INTO members (
        name, email, contact, dob, sex, remarks, address, nric,
        membership_type_id, created_at, updated_at, created_by, user_auth_id
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *;
    `;
    const memberValues = [
      name,
      email,
      contact,
      dob,
      sex,
      remarks,
      address,
      nric,
      membership_type_id,
      created_at,
      updated_at,
      created_by,
      newAuth.id,
    ];
    const memberResult = await client.query(insertMemberQuery, memberValues);
    const newMember = memberResult.rows[0];

    // 4. Insert into user_roles
    const insertUserRoleQuery = `
      INSERT INTO user_to_role (user_auth_id, role_id, created_at, updated_at)
      VALUES ($1, $2, $3, $4)
      RETURNING *;
    `;
    const roleValues = [newAuth.id, role_id, created_at, updated_at];
    const userRoleResult = await client.query(insertUserRoleQuery, roleValues);
    const newUserRole = userRoleResult.rows[0];

    await client.query('COMMIT');

    return {
      member: newMember,
      auth: newAuth,
      role: newUserRole,
    };
  } catch (error) {
    console.error('Error creating member:', error);
    await client.query('ROLLBACK');
    throw error; // Re-throw the original error to preserve the validation message
  } finally {
    client.release();
  }
};

const updateMember = async ({
  id,
  name,
  email,
  contact,
  dob,
  sex,
  remarks,
  address,
  nric,
  membership_type_id,
  updated_at,
}: UpdateMemberInput) => {
  const client = await pool().connect();

  try {
    await client.query('BEGIN');

    const getAuthIdQuery = `SELECT user_auth_id FROM members WHERE id = $1;`;
    const authIdResult = await client.query(getAuthIdQuery, [id]);

    if (authIdResult.rows.length === 0) {
      throw new Error(`Member with ID ${id} not found`);
    }

    const userAuthId = authIdResult.rows[0].user_auth_id;

    // Validation: Check if email already exists (excluding current user)
    const emailCheckQuery = `
      SELECT id FROM user_auth WHERE email = $1 AND id != $2;
    `;
    const emailResult = await client.query(emailCheckQuery, [email, userAuthId]);
    if (emailResult.rows.length > 0) {
      throw new Error('Email already exists');
    }

    // Validation: Check if contact already exists (excluding current user)
    const contactCheckQuery = `
      SELECT id FROM user_auth WHERE phone = $1 AND id != $2;
    `;
    const contactResult = await client.query(contactCheckQuery, [contact, userAuthId]);
    if (contactResult.rows.length > 0) {
      throw new Error('Contact number already exists');
    }

    // 2. Update user_auth with new email and phone
    const updateAuthQuery = `
      UPDATE user_auth
      SET email = $1, phone = $2, updated_at = $3
      WHERE id = $4;
    `;
    await client.query(updateAuthQuery, [email, contact, updated_at, userAuthId]);

    // 3. Update the members table
    const updateMemberQuery = `
      UPDATE members
      SET
        name = $1,
        email = $2,
        contact = $3,
        dob = $4,
        sex = $5,
        remarks = $6,
        address = $7,
        nric = $8,
        membership_type_id = $9,
        updated_at = $10
      WHERE id = $11
      RETURNING *;
    `;

    const values = [
      name,
      email,
      contact,
      dob,
      sex,
      remarks,
      address,
      nric,
      membership_type_id,
      updated_at,
      id,
    ];

    const memberResult = await client.query(updateMemberQuery, values);

    await client.query('COMMIT');
    return memberResult.rows[0];
  } catch (error) {
    console.error('Error updating member:', error);
    await client.query('ROLLBACK');
    throw error; // Re-throw the original error to preserve the validation message
  } finally {
    client.release();
  }
};

const deleteMember = async (memberId: number) => {
  const client = await pool().connect();
  
  try {
    await client.query('BEGIN');
    
    // Step 1: Get associated user_auth_id
    const getAuthIdQuery = `SELECT user_auth_id FROM members WHERE id = $1`;
    const { rows } = await client.query(getAuthIdQuery, [memberId]);
    if (rows.length === 0) throw new Error('Member not found');
    const userAuthId = rows[0].user_auth_id;
    
    // Step 2: Check for existing sale transactions
    const transactionCheckQuery = `SELECT COUNT(*) as count FROM sale_transactions WHERE member_id = $1`;
    const transactionResult = await client.query(transactionCheckQuery, [memberId]);
    const transactionCount = parseInt(transactionResult.rows[0].count);
    
    if (transactionCount > 0) {
      throw new Error(`Cannot delete member: ${transactionCount} sale transaction(s) exist for this member`);
    }
    
    // Step 3: Delete from user_roles
    await client.query(`DELETE FROM user_to_role WHERE user_auth_id = $1`, [userAuthId]);
    
    // Step 4: Delete from members
    await client.query(`DELETE FROM members WHERE id = $1`, [memberId]);
    
    // Step 5: Delete from user_auth
    await client.query(`DELETE FROM user_auth WHERE id = $1`, [userAuthId]);
    
    await client.query('COMMIT');
    return { success: true };
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error deleting member:', error);
    
    // Re-throw the error with original message if it's our custom validation error
    if (error instanceof Error && error.message.includes('Cannot delete member:')) {
      throw error;
    }
    
    throw new Error('Could not delete member');
  } finally {
    client.release();
  }
};


const getMemberById = async (id: number, sessionStartDate_utc?: string, sessionEndDate_utc?: string) => {
  try {
    const query = `
      SELECT 
        m.*,
        mt.membership_type_name as membership_type_name,
        e.employee_name as created_by_name
      FROM members m
      LEFT JOIN membership_types mt ON m.membership_type_id::bigint = mt.id
      LEFT JOIN employees e ON m.created_by = e.id
      WHERE m.id = $1
      AND m.created_at BETWEEN $2 AND $3;
    `;
    const sessionStart = sessionStartDate_utc || '0001-01-01T00:00:00Z';
    const sessionEnd = sessionEndDate_utc || '9999-12-31T23:59:59Z';
    const result = await pool().query(query,  [id, sessionStart, sessionEnd]);

    if (result.rows.length === 0) {
      throw new Error('Member not found');
    }

    const member = result.rows[0];

    return {
      ...member,
      created_at: member.created_at
        ? format(new Date(member.created_at), 'dd MMM yyyy, hh:mm a')
        : null,
      updated_at: member.updated_at
        ? format(new Date(member.updated_at), 'dd MMM yyyy, hh:mm a')
        : null,
      dob: member.dob
        ? format(new Date(member.dob), 'dd MMM yyyy')
        : null,
    };
  } catch (error) {
    console.error('Error fetching member by ID:', error);
    throw new Error('Error fetching member by ID');
  }
};

const searchMemberByNameOrPhone = async (searchTerm: string, sessionStartDate_utc?: string, sessionEndDate_utc?: string) => {
  try {
    const query = `
      SELECT 
  m.*,
  mt.membership_type_name AS membership_type_name,
  e.employee_name AS created_by_name,

  (
    SELECT COUNT(*) 
    FROM member_vouchers mv
    WHERE mv.member_id = m.id
      AND mv.status = 'is_enabled'
  ) AS voucher_count,

  (
    SELECT COUNT(*) 
    FROM member_care_packages mcp
    WHERE mcp.member_id = m.id
      AND mcp.status = 'ENABLED'
  ) AS member_care_package_count

FROM members m
LEFT JOIN membership_types mt ON m.membership_type_id::bigint = mt.id
LEFT JOIN employees e ON m.created_by = e.id
WHERE 
  (m.name ILIKE $1 OR m.contact ILIKE $1)
  AND m.created_at BETWEEN $2 AND $3;

    `;
    const sessionStart = sessionStartDate_utc || '0001-01-01T00:00:00Z';
    const sessionEnd = sessionEndDate_utc || '9999-12-31T23:59:59Z';
    const result = await pool().query(query, [`%${searchTerm}%`, sessionStart, sessionEnd]);

    // Get enrichment maps
    const outstandingMap = await getMemberOutstandingAmounts();
    const lastVisitedMap = await getLastVisitedDatesForMembers();

    // Format & enrich each member
    const enrichedMembers = result.rows.map((member: any) => ({
      ...member,
      total_amount_owed: outstandingMap[member.id] || 0,
      last_visit_date: lastVisitedMap[member.id]
        ? format(new Date(lastVisitedMap[member.id]), 'dd MMM yyyy, hh:mm a')
        : null,
      created_at: member.created_at
        ? format(new Date(member.created_at), 'dd MMM yyyy, hh:mm a')
        : null,
      updated_at: member.updated_at
        ? format(new Date(member.updated_at), 'dd MMM yyyy, hh:mm a')
        : null,
      dob: member.dob
        ? format(new Date(member.dob), 'dd MMM yyyy')
        : null,
    }));

    return {
      members: enrichedMembers,
    };
  } catch (error) {
    console.error('Error searching member by name or phone:', error);
    throw new Error('Error searching member by name or phone');
  }
};

const getMemberVouchers = async (
  memberId: number,
  offset: number,
  limit: number,
  searchTerm?: string,
  sessionStartDate_utc?: string, // simulation constraint
  sessionEndDate_utc?: string
) => {
  try {
    const hasSearch = !!searchTerm;
    
    // Default session date range if not provided
    const sessionStart = sessionStartDate_utc || '0001-01-01T00:00:00Z';
    const sessionEnd = sessionEndDate_utc || '9999-12-31T23:59:59Z';
    
    // Build SQL dynamically with status = 'is_enabled' and session date filter
    const baseQuery = `
      SELECT *
      FROM member_vouchers mv
      WHERE member_id = $1
      AND mv.created_at BETWEEN $${hasSearch ? '5' : '4'} AND $${hasSearch ? '6' : '5'}
      AND status = 'is_enabled'
      ${hasSearch ? `AND member_voucher_name ILIKE $2` : ''}
      ORDER BY created_at DESC
      LIMIT ${hasSearch ? '$3' : '$2'} OFFSET ${hasSearch ? '$4' : '$3'};
    `;

    const baseValues = hasSearch
      ? [memberId, `%${searchTerm}%`, limit, offset, sessionStart, sessionEnd]
      : [memberId, limit, offset, sessionStart, sessionEnd];

    const result = await pool().query(baseQuery, baseValues);

    // Count query with session date filter
    const countQuery = `
      SELECT COUNT(*)
      FROM member_vouchers mv
      WHERE member_id = $1 
      AND mv.created_at BETWEEN $${hasSearch ? '3' : '2'} AND $${hasSearch ? '4' : '3'}
      AND status = 'is_enabled'
      ${hasSearch ? `AND member_voucher_name ILIKE $2` : ''};
    `;
    
    const countValues = hasSearch
      ? [memberId, `%${searchTerm}%`, sessionStart, sessionEnd]
      : [memberId, sessionStart, sessionEnd];

    const countResult = await pool().query(countQuery, countValues);
    const totalCount = Number(countResult.rows[0].count);
    const totalPages = Math.ceil(totalCount / limit);

    // Calculate paid balance for each voucher
    const vouchersWithBalance = await Promise.all(
      result.rows.map(async (voucher) => {
        const balanceQuery = `
          SELECT st.outstanding_total_payment_amount, mv.current_balance, mv.free_of_charge
          FROM sale_transactions st
          JOIN sale_transaction_items sti ON st.id = sti.sale_transaction_id
          JOIN member_vouchers mv ON sti.member_voucher_id = mv.id
          WHERE sti.member_voucher_id = $1
          AND st.created_at BETWEEN $2 AND $3
          ORDER BY sti.sale_transaction_id DESC
          LIMIT 1;
        `;
        
        const balanceResult = await pool().query(balanceQuery, [voucher.id, sessionStart, sessionEnd]);
        
        let currentPaidBalance = 0;
        if (balanceResult.rows && balanceResult.rows.length > 0) {
          const current_balance = parseFloat(balanceResult.rows[0].current_balance);
          const outstanding_total_payment_amount = parseFloat(balanceResult.rows[0].outstanding_total_payment_amount);
          const free_of_charge = parseFloat(balanceResult.rows[0].free_of_charge);
          
          if (outstanding_total_payment_amount === 0) {
            currentPaidBalance = current_balance;
          } else {
            currentPaidBalance = current_balance - outstanding_total_payment_amount - free_of_charge;
          }
        }
        
        return {
          ...voucher,
          current_paid_balance: currentPaidBalance
        };
      })
    );

    return {
      vouchers: vouchersWithBalance,
      totalPages,
      totalCount,
    };
  } catch (error) {
    console.error('Error fetching member vouchers:', error);
    throw new Error('Error fetching member vouchers');
  }
};
const getMemberCarePackages = async (
  memberId: number,
  offset: number,
  limit: number,
  searchTerm?: string,
  sessionStartDate_utc?: string,
  sessionEndDate_utc?: string
) => {
  try {
    const hasSearch = !!searchTerm;

    const sessionStart = sessionStartDate_utc || '0001-01-01T00:00:00Z';
    const sessionEnd = sessionEndDate_utc || '9999-12-31T23:59:59Z';

    const baseQuery = `
      SELECT mcp.*
      FROM member_care_packages mcp
      WHERE mcp.member_id = $1
      AND mcp.status = 'ENABLED'
      AND mcp.created_at BETWEEN $${hasSearch ? '5' : '4'} AND $${hasSearch ? '6' : '5'}
      ${hasSearch ? `AND mcp.package_name ILIKE $2` : ''}
      ORDER BY mcp.created_at DESC
      LIMIT ${hasSearch ? '$3' : '$2'} OFFSET ${hasSearch ? '$4' : '$3'};
    `;

    const baseValues = hasSearch
      ? [memberId, `%${searchTerm}%`, limit, offset, sessionStart, sessionEnd]
      : [memberId, limit, offset, sessionStart, sessionEnd];

    const result = await pool().query(baseQuery, baseValues);

    const countQuery = `
      SELECT COUNT(*)
      FROM member_care_packages mcp
      WHERE mcp.member_id = $1
      AND mcp.status = 'ENABLED'
      AND mcp.created_at BETWEEN $${hasSearch ? '3' : '2'} AND $${hasSearch ? '4' : '3'}
      ${hasSearch ? `AND mcp.package_name ILIKE $2` : ''};
    `;

    const countValues = hasSearch
      ? [memberId, `%${searchTerm}%`, sessionStart, sessionEnd]
      : [memberId, sessionStart, sessionEnd];

    const countResult = await pool().query(countQuery, countValues);
    const totalCount = Number(countResult.rows[0].count);
    const totalPages = Math.ceil(totalCount / limit);

    const formatted = result.rows.map((row) => ({
      ...row,
      created_at: row.created_at
        ? format(new Date(row.created_at), 'dd MMM yyyy, hh:mm a')
        : null,
    }));

    return {
      carePackages: formatted,
      totalPages,
      totalCount,
    };
  } catch (error) {
    console.error('Error fetching member care packages:', error);
    throw new Error('Error fetching member care packages');
  }
};

const getAllMembersForDropdown = async () => {
  try {
    const query = `
      SELECT id, name, contact FROM members
      ORDER BY name ASC
    `;
    const result = await pool().query(query);
    return result.rows;
  } catch (error) {
    console.error('Error fetching member list:', error);
    throw new Error('Error fetching member list');
  }
};



export default {
  getAllMembers,
  getMemberById,
  createMember,
  updateMember,
  deleteMember,
  searchMemberByNameOrPhone,
  getMemberVouchers,
  getMemberCarePackages,
  getAllMembersForDropdown,
};