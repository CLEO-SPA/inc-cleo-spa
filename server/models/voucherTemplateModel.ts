import { pool } from '../config/database.js';
import { format } from 'date-fns';
import {
  CreateVoucherTemplateInput,
  UpdateVoucherTemplateInput
} from '../types/voucherTemplate.types.js';

const getAllVoucherTemplates = async (
  offset: number,
  limit: number,
  startDate_utc?: string,        // query-level filter
  endDate_utc?: string,
  createdBy?: string,
  search?: string,
  status?: string,
  sessionStartDate_utc?: string, // simulation constraint
  sessionEndDate_utc?: string
) => {
  try {
    const filters: string[] = [];
    const values: any[] = [];
    let idx = 1;

    // Always apply session-based simulation range
    filters.push(`vt.created_at BETWEEN $${idx++} AND $${idx++}`);
    values.push(
      sessionStartDate_utc || '0001-01-01T00:00:00Z',
      sessionEndDate_utc || '9999-12-31T23:59:59Z'
    );

    // Apply additional filter only if query range is specified
    if (startDate_utc && endDate_utc) {
      filters.push(`vt.created_at BETWEEN $${idx++} AND $${idx++}`);
      values.push(startDate_utc, endDate_utc);
    }

    if (createdBy) {
      const empResult = await pool().query(
        `SELECT id FROM employees WHERE employee_name ILIKE $1`,
        [`%${createdBy}%`]
      );
      const empIds = empResult.rows.map(row => row.id);

      if (empIds.length > 0) {
        filters.push(`vt.created_by = ANY($${idx++}::int[])`);
        values.push(empIds);
      } else {
        return { voucherTemplates: [], totalPages: 0 };
      }
    }

    if (search) {
      filters.push(`(vt.voucher_template_name ILIKE $${idx} OR vt.remarks ILIKE $${idx})`);
      values.push(`%${search}%`);
      idx++;
    }

    if (status) {
      filters.push(`vt.status = $${idx++}`);
      values.push(status);
    }

    const whereClause = filters.length > 0 ? `WHERE ${filters.join(' AND ')}` : '';

    const baseQuery = `
      SELECT 
        vt.*,
        e1.employee_name AS created_by_name,
        e2.employee_name AS last_updated_by_name
      FROM voucher_templates vt
      LEFT JOIN employees e1 ON vt.created_by = e1.id
      LEFT JOIN employees e2 ON vt.last_updated_by = e2.id
      ${whereClause}
    `;

    values.push(limit, offset);
    const query = `${baseQuery} ORDER BY vt.id ASC LIMIT $${idx++} OFFSET $${idx++};`;

    const result = await pool().query(query, values);

    // Count query uses same where clause (exclude limit/offset)
    const countValues = values.slice(0, -2);
    const totalQuery = `
      SELECT COUNT(*) 
      FROM voucher_templates vt
      LEFT JOIN employees e1 ON vt.created_by = e1.id
      LEFT JOIN employees e2 ON vt.last_updated_by = e2.id
      ${whereClause};
    `;
    const totalResult = await pool().query(totalQuery, countValues);
    const totalPages = Math.ceil(Number(totalResult.rows[0].count) / limit);

    const enrichedVoucherTemplates = result.rows.map((template: any) => ({
      ...template,
      created_at: template.created_at
        ? format(new Date(template.created_at), 'dd MMM yyyy, hh:mm a')
        : null,
      updated_at: template.updated_at
        ? format(new Date(template.updated_at), 'dd MMM yyyy, hh:mm a')
        : null,
    }));

    return {
      voucherTemplates: enrichedVoucherTemplates,
      totalPages,
    };
  } catch (error) {
    console.error('Error fetching voucher templates:', error);
    throw new Error('Error fetching voucher templates');
  }
};

const createVoucherTemplate = async ({
  voucher_template_name,
  default_starting_balance,
  default_free_of_charge,
  default_total_price,
  remarks,
  status,
  created_by,
  created_at,
  updated_at,
  details = []
}: CreateVoucherTemplateInput) => {
  const client = await pool().connect();

  try {
    await client.query('BEGIN');

    // 1. Insert voucher template
    const insertTemplateQuery = `
      INSERT INTO voucher_templates (
        voucher_template_name, default_starting_balance, default_free_of_charge,
        default_total_price, remarks, status, created_by, last_updated_by, created_at, updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *;
    `;
    const templateValues = [
      voucher_template_name,
      default_starting_balance,
      default_free_of_charge,
      default_total_price,
      remarks,
      status,
      created_by,
      created_by,
      created_at,
      updated_at,
    ];
    const templateResult = await client.query(insertTemplateQuery, templateValues);
    const newTemplate = templateResult.rows[0];

    // 2. Insert voucher template details if provided
    const insertedDetails = [];
    if (details.length > 0) {
      for (const detail of details) {
        const insertDetailQuery = `
          INSERT INTO voucher_template_details (
            voucher_template_id, service_id, service_name, original_price,
            custom_price, discount, final_price, duration, service_category_id
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
          RETURNING *;
        `;
        const detailValues = [
          newTemplate.id,
          detail.service_id,
          detail.service_name,
          detail.original_price,
          detail.custom_price,
          detail.discount,
          detail.final_price,
          detail.duration,
          detail.service_category_id,
        ];
        const detailResult = await client.query(insertDetailQuery, detailValues);
        insertedDetails.push(detailResult.rows[0]);
      }
    }

    await client.query('COMMIT');

    return {
      template: newTemplate,
      details: insertedDetails,
    };
  } catch (error) {
    console.error('Error creating voucher template:', error);
    await client.query('ROLLBACK');
    throw new Error('Error creating voucher template');
  } finally {
    client.release();
  }
};

const updateVoucherTemplate = async ({
  id,
  voucher_template_name,
  default_starting_balance,
  default_free_of_charge,
  default_total_price,
  remarks,
  status,
  last_updated_by,
  created_at,
  updated_at,
  details
}: UpdateVoucherTemplateInput) => {
  const client = await pool().connect();

  try {
    await client.query('BEGIN');

    // 1. Update voucher template
    const updateTemplateQuery = `
      UPDATE voucher_templates
      SET
        voucher_template_name = COALESCE($1, voucher_template_name),
        default_starting_balance = COALESCE($2, default_starting_balance),
        default_free_of_charge = COALESCE($3, default_free_of_charge),
        default_total_price = COALESCE($4, default_total_price),
        remarks = COALESCE($5, remarks),
        status = COALESCE($6, status),
        last_updated_by = COALESCE($7, last_updated_by),
        created_at = COALESCE($8, created_at),
        updated_at = COALESCE($9, updated_at)
      WHERE id = $10
      RETURNING *;
    `;

    const templateValues = [
      voucher_template_name,
      default_starting_balance,
      default_free_of_charge,
      default_total_price,
      remarks,
      status,
      last_updated_by,
      created_at,
      updated_at,
      id,
    ];

    const templateResult = await client.query(updateTemplateQuery, templateValues);
    const updatedTemplate = templateResult.rows[0];

    // 2. Update details if provided
    let updatedDetails = [];
    if (details && details.length > 0) {
      // Delete existing details
      await client.query('DELETE FROM voucher_template_details WHERE voucher_template_id = $1', [id]);

      // Insert new details
      for (const detail of details) {
        if (detail.id) {
          // Update existing detail
          const updateDetailQuery = `
            UPDATE voucher_template_details
            SET
              service_id = $1,
              service_name = $2,
              original_price = $3,
              custom_price = $4,
              discount = $5,
              final_price = $6,
              duration = $7,
              service_category_id = $8
            WHERE id = $9 AND voucher_template_id = $10
            RETURNING *;
          `;
          const detailValues = [
            detail.service_id,
            detail.service_name,
            detail.original_price,
            detail.custom_price,
            detail.discount,
            detail.final_price,
            detail.duration,
            detail.service_category_id,
            detail.id,
            id,
          ];
          const detailResult = await client.query(updateDetailQuery, detailValues);
          if (detailResult.rows.length > 0) {
            updatedDetails.push(detailResult.rows[0]);
          }
        } else {
          // Insert new detail
          const insertDetailQuery = `
            INSERT INTO voucher_template_details (
              voucher_template_id, service_id, service_name, original_price,
              custom_price, discount, final_price, duration, service_category_id
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            RETURNING *;
          `;
          const detailValues = [
            id,
            detail.service_id,
            detail.service_name,
            detail.original_price,
            detail.custom_price,
            detail.discount,
            detail.final_price,
            detail.duration,
            detail.service_category_id,
          ];
          const detailResult = await client.query(insertDetailQuery, detailValues);
          updatedDetails.push(detailResult.rows[0]);
        }
      }
    }

    await client.query('COMMIT');

    return {
      template: updatedTemplate,
      details: updatedDetails,
    };
  } catch (error) {
    console.error('Error updating voucher template:', error);
    await client.query('ROLLBACK');
    throw new Error('Could not update voucher template');
  } finally {
    client.release();
  }
};

const deleteVoucherTemplate = async (templateId: string) => {
  const client = await pool().connect();

  try {
    await client.query('BEGIN');

    // Step 1: Delete related voucher template details
    await client.query(`DELETE FROM voucher_template_details WHERE voucher_template_id = $1`, [templateId]);

    // Step 2: Delete voucher template
    const deleteResult = await client.query(`DELETE FROM voucher_templates WHERE id = $1 RETURNING id`, [templateId]);
    
    if (deleteResult.rows.length === 0) {
      throw new Error('Voucher template not found');
    }

    await client.query('COMMIT');
    return { success: true };
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error deleting voucher template:', error);
    throw new Error('Could not delete voucher template');
  } finally {
    client.release();
  }
};

const getVoucherTemplateById = async (id: number, sessionStartDate_utc?: string, sessionEndDate_utc?: string) => {
  try {
    const templateQuery = `
      SELECT 
        vt.*,
        e1.employee_name as created_by_name,
        e2.employee_name as last_updated_by_name
      FROM voucher_templates vt
      LEFT JOIN employees e1 ON vt.created_by = e1.id
      LEFT JOIN employees e2 ON vt.last_updated_by = e2.id
      WHERE vt.id = $1
        AND vt.created_at BETWEEN $2 AND $3;
    `;

    const sessionStart = sessionStartDate_utc || '0001-01-01T00:00:00Z';
    const sessionEnd = sessionEndDate_utc || '9999-12-31T23:59:59Z';

    const templateResult = await pool().query(templateQuery, [id, sessionStart, sessionEnd]);

    if (templateResult.rows.length === 0) {
      throw new Error('Voucher template not found or out of session range');
    }

    const template = templateResult.rows[0];

    const detailsQuery = `
      SELECT 
        vtd.*,
        s.service_name as service_name_from_service,
        sc.service_category_name as service_category_name
      FROM voucher_template_details vtd
      LEFT JOIN services s ON vtd.service_id = s.id
      LEFT JOIN service_categories sc ON vtd.service_category_id = sc.id
      WHERE vtd.voucher_template_id = $1
      ORDER BY vtd.id;
    `;

    const detailsResult = await pool().query(detailsQuery, [id]);

    return {
      ...template,
      created_at: template.created_at
        ? format(new Date(template.created_at), 'dd MMM yyyy, hh:mm a')
        : null,
      updated_at: template.updated_at
        ? format(new Date(template.updated_at), 'dd MMM yyyy, hh:mm a')
        : null,
      details: detailsResult.rows,
    };
  } catch (error) {
    console.error('Error fetching voucher template by ID:', error);
    throw new Error('Error fetching voucher template by ID');
  }
};


const getAllVoucherTemplatesForDropdown = async (
  sessionStartDate_utc?: string,
  sessionEndDate_utc?: string
) => {
  try {
    const sessionStart = sessionStartDate_utc || '0001-01-01T00:00:00Z';
    const sessionEnd = sessionEndDate_utc || '9999-12-31T23:59:59Z';

    const query = `
      SELECT 
        id,
        voucher_template_name,
        default_starting_balance
      FROM voucher_templates
      WHERE status = 'is_enabled'
        AND created_at BETWEEN $1 AND $2
      ORDER BY voucher_template_name;
    `;

    const result = await pool().query(query, [sessionStart, sessionEnd]);

    return result.rows;
  } catch (error) {
    console.error('Error fetching all voucher templates for dropdown:', error);
    throw new Error('Error fetching all voucher templates for dropdown');
  }
};


export default {
  getAllVoucherTemplates,
  getVoucherTemplateById,
  createVoucherTemplate,
  updateVoucherTemplate,
  deleteVoucherTemplate,
  getAllVoucherTemplatesForDropdown
};